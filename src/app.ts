import { Hono } from "hono"
import { cors } from "hono/cors"
import { z } from "zod"
import type { ApiError, BirthdayPerson, Employee, NewsletterSend, NewsletterSendSummary, Paginated, ValidationError } from "./types.js"
import { OFFICES, TEAMS, db, resetStore } from "./store.js"

/* ---------------------------------- helpers ---------------------------------- */

function ageAtToday(birthDate: string): number {
  const [y, m, d] = birthDate.split("-").map(Number) as [number, number, number]
  const today = new Date()
  let age = today.getFullYear() - y
  const beforeBirthday =
    today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)
  if (beforeBirthday) age -= 1
  return age
}

function isBirthdayToday(birthDate: string): boolean {
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")
  return birthDate.endsWith(`-${month}-${day}`)
}

function birthdaysToday(): BirthdayPerson[] {
  return db()
    .employees.filter((e) => e.active && isBirthdayToday(e.birthDate))
    .map((e) => ({
      employeeId: e.id,
      firstName: e.firstName,
      lastName: e.lastName,
      age: ageAtToday(e.birthDate),
      officeId: e.officeId,
      teamId: e.teamId,
    }))
}

function toSummary(send: NewsletterSend): NewsletterSendSummary {
  const { birthdays, recipients, ...summary } = send
  void birthdays
  void recipients
  return summary
}

function paginate<T>(items: T[], page: number, pageSize: number): Paginated<T> {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize
  return {
    data: items.slice(start, start + pageSize),
    meta: { page: safePage, pageSize, total, totalPages },
  }
}

function validationError(message: string, errors: ValidationError[]): { json: ApiError; status: 400 } {
  return { json: { message, errors }, status: 400 }
}

function zodErrors(error: z.ZodError): ValidationError[] {
  return error.issues.map((issue) => ({
    field: issue.path.join(".") || "_root",
    message: issue.message,
  }))
}

/* --------------------------------- validation -------------------------------- */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function isRealDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return false
  const [, m, d] = value.split("-").map(Number) as [number, number, number]
  return date.getUTCMonth() + 1 === m && date.getUTCDate() === d
}

const employeeSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    email: z.string().trim().email("Email is not valid"),
    birthDate: z
      .string()
      .regex(ISO_DATE, "Birth date must be an ISO date (YYYY-MM-DD)")
      .refine(isRealDate, "Birth date does not exist")
      .refine((v) => new Date(`${v}T00:00:00Z`).getTime() <= Date.now(), "Birth date cannot be in the future"),
    officeId: z.string().refine((v) => OFFICES.some((o) => o.id === v), "Unknown officeId"),
    teamId: z.string().refine((v) => TEAMS.some((t) => t.id === v), "Unknown teamId"),
    active: z.boolean().optional(),
  })

const patchEmployeeSchema = employeeSchema.partial()

const listQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  officeId: z.string().optional(),
  teamId: z.string().optional(),
  active: z.enum(["true", "false"]).optional(),
  sortBy: z.enum(["firstName", "lastName", "email", "birthDate", "createdAt"]).optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
})

/* ------------------------------------ app ------------------------------------ */

export function createApp(): Hono {
  const app = new Hono()

  /* CORS aperto: la dashboard gira su un'altra porta in dev. */
  app.use("*", cors())

  /* Latenza simulata (150-450 ms): le UI devono gestire stati di caricamento reali. */
  app.use("*", async (_c, next) => {
    await new Promise((resolve) => setTimeout(resolve, 150 + Math.random() * 300))
    await next()
  })

  /* Dati di riferimento (per filtri e form) */

  app.get("/api/offices", (c) => c.json({ data: OFFICES }))
  app.get("/api/teams", (c) => c.json({ data: TEAMS }))

  /* Anagrafica dipendenti */

  app.get("/api/employees", (c) => {
    const parsed = listQuerySchema.safeParse(c.req.query())
    if (!parsed.success) {
      const err = validationError("Invalid query parameters", zodErrors(parsed.error))
      return c.json(err.json, err.status)
    }
    const q = parsed.data
    const search = q.search?.toLowerCase()

    let employees = db().employees
    if (search) {
      employees = employees.filter(
        (e) =>
          e.firstName.toLowerCase().includes(search) ||
          e.lastName.toLowerCase().includes(search) ||
          e.email.toLowerCase().includes(search),
      )
    }
    if (q.officeId) employees = employees.filter((e) => e.officeId === q.officeId)
    if (q.teamId) employees = employees.filter((e) => e.teamId === q.teamId)
    if (q.active) employees = employees.filter((e) => e.active === (q.active === "true"))

    const sortBy = q.sortBy ?? "firstName"
    const dir = q.sortDir === "desc" ? -1 : 1
    employees = [...employees].sort((a, b) => a[sortBy].localeCompare(b[sortBy]) * dir)

    return c.json(paginate(employees, q.page ?? 1, q.pageSize ?? 10))
  })

  app.post("/api/employees", async (c) => {
    const body: unknown = await c.req.json().catch(() => null)
    const parsed = employeeSchema.safeParse(body)
    if (!parsed.success) {
      const err = validationError("Validation failed", zodErrors(parsed.error))
      return c.json(err.json, err.status)
    }
    const input = parsed.data
    if (db().employees.some((e) => e.email.toLowerCase() === input.email.toLowerCase())) {
      return c.json<ApiError, 409>({ message: "Validation failed", errors: [{ field: "email", message: "Email already in use" }] }, 409)
    }

    const store = db()
    const now = new Date().toISOString()
    const employee: Employee = {
      id: `emp-${pad3(store.nextEmployeeNumber)}`,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      birthDate: input.birthDate,
      officeId: input.officeId,
      teamId: input.teamId,
      active: input.active ?? true,
      createdAt: now,
      updatedAt: now,
    }
    store.employees.push(employee)
    store.nextEmployeeNumber += 1
    return c.json(employee, 201)
  })

  app.patch("/api/employees/:id", async (c) => {
    const employee = db().employees.find((e) => e.id === c.req.param("id"))
    if (!employee) {
      return c.json<ApiError, 404>({ message: "Employee not found" }, 404)
    }
    const body: unknown = await c.req.json().catch(() => null)
    const parsed = patchEmployeeSchema.safeParse(body)
    if (!parsed.success) {
      const err = validationError("Validation failed", zodErrors(parsed.error))
      return c.json(err.json, err.status)
    }
    const input = parsed.data
    const email = input.email
    if (email) {
      const clash = db().employees.some((e) => e.id !== employee.id && e.email.toLowerCase() === email.toLowerCase())
      if (clash) {
        return c.json<ApiError, 409>({ message: "Validation failed", errors: [{ field: "email", message: "Email already in use" }] }, 409)
      }
    }

    Object.assign(employee, input, { updatedAt: new Date().toISOString() })
    return c.json(employee)
  })

  app.delete("/api/employees/:id", (c) => {
    const store = db()
    const index = store.employees.findIndex((e) => e.id === c.req.param("id"))
    if (index === -1) {
      return c.json<ApiError, 404>({ message: "Employee not found" }, 404)
    }
    store.employees.splice(index, 1)
    return c.body(null, 204)
  })

  /* Festeggiati del giorno */

  app.get("/api/birthdays/today", (c) => {
    const today = new Date().toISOString().slice(0, 10)
    return c.json({ date: today, birthdays: birthdaysToday() })
  })

  /* Invio newsletter + storico */

  app.post("/api/newsletter/send", (c) => {
    const store = db()
    const birthdays = birthdaysToday()
    const recipients = birthdays.length
      ? store.employees
          .filter((e) => e.active && !birthdays.some((b) => b.employeeId === e.id))
          .map((e) => ({ employeeId: e.id, firstName: e.firstName, lastName: e.lastName, email: e.email }))
      : []

    const send: NewsletterSend = {
      id: `send-${pad3(store.nextSendNumber)}`,
      sentAt: new Date().toISOString(),
      status: birthdays.length ? "sent" : "skipped",
      ...(birthdays.length ? {} : { reason: "no_birthdays" as const }),
      recipientCount: recipients.length,
      birthdayCount: birthdays.length,
      birthdays,
      recipients,
    }
    store.sends.push(send)
    store.nextSendNumber += 1
    return c.json(send, 201)
  })

  app.get("/api/newsletter/sends", (c) => {
    const sends = [...db().sends].sort((a, b) => b.sentAt.localeCompare(a.sentAt))
    const page = Number(c.req.query("page") ?? "1")
    const pageSize = Number(c.req.query("pageSize") ?? "10")
    const safePage = Number.isInteger(page) && page >= 1 ? page : 1
    const safeSize = Number.isInteger(pageSize) && pageSize >= 1 && pageSize <= 100 ? pageSize : 10
    return c.json(paginate(sends.map(toSummary), safePage, safeSize))
  })

  app.get("/api/newsletter/sends/:id", (c) => {
    const send = db().sends.find((s) => s.id === c.req.param("id"))
    if (!send) {
      return c.json<ApiError, 404>({ message: "Send not found" }, 404)
    }
    return c.json(send)
  })

  /* Utility solo per il mock */

  app.post("/api/__reset", (c) => {
    resetStore()
    return c.body(null, 204)
  })

  return app
}

function pad3(n: number): string {
  return String(n).padStart(3, "0")
}
