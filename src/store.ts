import type { Employee, NewsletterSend, Office, Team } from "./types.js"

/** Uffici e team disponibili: usali per popolare select e filtri. */
export const OFFICES: Office[] = [
  { id: "office-milano", name: "Milano", country: "Italia" },
  { id: "office-roma", name: "Roma", country: "Italia" },
  { id: "office-londra", name: "Londra", country: "Regno Unito" },
  { id: "office-new-york", name: "New York", country: "USA" },
  { id: "office-tokyo", name: "Tokyo", country: "Giappone" },
]

export const TEAMS: Team[] = [
  { id: "team-engineering", name: "Engineering" },
  { id: "team-marketing", name: "Marketing" },
  { id: "team-sales", name: "Sales" },
  { id: "team-hr", name: "HR" },
  { id: "team-finance", name: "Finance" },
]

interface EmployeeSeed {
  firstName: string
  lastName: string
  email: string
  birthDate: string
  officeId: string
  teamId: string
  active?: boolean
}

const BASE_EMPLOYEES: EmployeeSeed[] = [
  { firstName: "Giulia", lastName: "Rossi", email: "giulia.rossi@example.com", birthDate: "1989-03-14", officeId: "office-milano", teamId: "team-engineering" },
  { firstName: "Marco", lastName: "Bianchi", email: "marco.bianchi@example.com", birthDate: "1992-07-02", officeId: "office-milano", teamId: "team-engineering" },
  { firstName: "Sofia", lastName: "Conti", email: "sofia.conti@example.com", birthDate: "1995-11-28", officeId: "office-roma", teamId: "team-marketing" },
  { firstName: "Luca", lastName: "Moretti", email: "luca.moretti@example.com", birthDate: "1987-01-19", officeId: "office-roma", teamId: "team-sales" },
  { firstName: "Alice", lastName: "Ferrari", email: "alice.ferrari@example.com", birthDate: "1998-05-09", officeId: "office-milano", teamId: "team-hr" },
  { firstName: "James", lastName: "Walker", email: "james.walker@example.com", birthDate: "1985-09-30", officeId: "office-londra", teamId: "team-engineering" },
  { firstName: "Emily", lastName: "Clarke", email: "emily.clarke@example.com", birthDate: "1991-12-05", officeId: "office-londra", teamId: "team-marketing" },
  { firstName: "Oliver", lastName: "Hughes", email: "oliver.hughes@example.com", birthDate: "1993-04-22", officeId: "office-londra", teamId: "team-finance" },
  { firstName: "Michael", lastName: "Brooks", email: "michael.brooks@example.com", birthDate: "1988-08-17", officeId: "office-new-york", teamId: "team-sales" },
  { firstName: "Jessica", lastName: "Reed", email: "jessica.reed@example.com", birthDate: "1996-02-11", officeId: "office-new-york", teamId: "team-marketing", active: false },
  { firstName: "Daniel", lastName: "Foster", email: "daniel.foster@example.com", birthDate: "1990-10-03", officeId: "office-new-york", teamId: "team-engineering" },
  { firstName: "Yuki", lastName: "Tanaka", email: "yuki.tanaka@example.com", birthDate: "1994-06-25", officeId: "office-tokyo", teamId: "team-engineering" },
  { firstName: "Haruto", lastName: "Sato", email: "haruto.sato@example.com", birthDate: "1986-03-08", officeId: "office-tokyo", teamId: "team-sales" },
  { firstName: "Aoi", lastName: "Yamada", email: "aoi.yamada@example.com", birthDate: "1997-09-14", officeId: "office-tokyo", teamId: "team-hr" },
  { firstName: "Francesco", lastName: "Greco", email: "francesco.greco@example.com", birthDate: "1983-02-27", officeId: "office-roma", teamId: "team-finance" },
  { firstName: "Chiara", lastName: "Lombardi", email: "chiara.lombardi@example.com", birthDate: "1999-07-21", officeId: "office-milano", teamId: "team-marketing" },
  { firstName: "Andrea", lastName: "Romano", email: "andrea.romano@example.com", birthDate: "1991-11-02", officeId: "office-roma", teamId: "team-engineering" },
  { firstName: "Martina", lastName: "Gallo", email: "martina.gallo@example.com", birthDate: "1984-05-16", officeId: "office-milano", teamId: "team-finance" },
  { firstName: "Harry", lastName: "Mills", email: "harry.mills@example.com", birthDate: "1995-01-07", officeId: "office-londra", teamId: "team-sales" },
  { firstName: "Grace", lastName: "Novak", email: "grace.novak@example.com", birthDate: "1989-12-19", officeId: "office-new-york", teamId: "team-hr" },
  { firstName: "Ethan", lastName: "Price", email: "ethan.price@example.com", birthDate: "1993-08-04", officeId: "office-new-york", teamId: "team-engineering", active: false },
  { firstName: "Sara", lastName: "De Luca", email: "sara.deluca@example.com", birthDate: "1998-04-29", officeId: "office-roma", teamId: "team-marketing" },
  { firstName: "Pietro", lastName: "Marino", email: "pietro.marino@example.com", birthDate: "1987-10-10", officeId: "office-milano", teamId: "team-sales" },
  { firstName: "Valentina", lastName: "Costa", email: "valentina.costa@example.com", birthDate: "1990-06-03", officeId: "office-roma", teamId: "team-hr" },
  { firstName: "Leonardo", lastName: "Vitale", email: "leonardo.vitale@example.com", birthDate: "1992-02-15", officeId: "office-milano", teamId: "team-engineering" },
  { firstName: "Olivia", lastName: "Bennett", email: "olivia.bennett@example.com", birthDate: "1996-09-26", officeId: "office-londra", teamId: "team-finance" },
  { firstName: "Ren", lastName: "Kobayashi", email: "ren.kobayashi@example.com", birthDate: "1985-12-31", officeId: "office-tokyo", teamId: "team-finance" },
  { firstName: "Hana", lastName: "Watanabe", email: "hana.watanabe@example.com", birthDate: "1999-03-23", officeId: "office-tokyo", teamId: "team-marketing" },
]

/**
 * Il seed garantisce sempre 3 festeggiati oggi (con età diverse),
 * così la vista Dashboard non è mai vuota qualunque sia il giorno.
 */
function birthdayTodayEmployees(): EmployeeSeed[] {
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")
  const md = `-${month}-${day}`
  return [
    { firstName: "Elena", lastName: "Fabbri", email: "elena.fabbri@example.com", birthDate: `1988${md}`, officeId: "office-milano", teamId: "team-marketing" },
    { firstName: "Tom", lastName: "Ashford", email: "tom.ashford@example.com", birthDate: `1994${md}`, officeId: "office-londra", teamId: "team-engineering" },
    { firstName: "Kenji", lastName: "Mori", email: "kenji.mori@example.com", birthDate: `2001${md}`, officeId: "office-tokyo", teamId: "team-sales" },
  ]
}

function pad(n: number): string {
  return String(n).padStart(3, "0")
}

function buildEmployees(): Employee[] {
  const seeds = [...BASE_EMPLOYEES, ...birthdayTodayEmployees()]
  const now = new Date().toISOString()
  return seeds.map((seed, i) => ({
    id: `emp-${pad(i + 1)}`,
    firstName: seed.firstName,
    lastName: seed.lastName,
    email: seed.email,
    birthDate: seed.birthDate,
    officeId: seed.officeId,
    teamId: seed.teamId,
    active: seed.active ?? true,
    createdAt: now,
    updatedAt: now,
  }))
}

export function buildStore(): {
  employees: Employee[]
  sends: NewsletterSend[]
  nextEmployeeNumber: number
  nextSendNumber: number
} {
  const employees = buildEmployees()
  return {
    employees,
    sends: [],
    nextEmployeeNumber: employees.length + 1,
    nextSendNumber: 1,
  }
}

export type Store = ReturnType<typeof buildStore>

let store: Store = buildStore()

export function db(): Store {
  return store
}

/** Ripristina i dati iniziali. */
export function resetStore(): void {
  store = buildStore()
}
