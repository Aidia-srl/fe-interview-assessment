export interface Office {
  id: string
  name: string
  country: string
}

export interface Team {
  id: string
  name: string
}

export interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  /** ISO "YYYY-MM-DD" */
  birthDate: string
  officeId: string
  teamId: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface PageMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface Paginated<T> {
  data: T[]
  meta: PageMeta
}

export interface BirthdayPerson {
  employeeId: string
  firstName: string
  lastName: string
  age: number
  officeId: string
  teamId: string
}

export type NewsletterStatus = "sent" | "skipped"

export interface NewsletterRecipient {
  employeeId: string
  firstName: string
  lastName: string
  email: string
}

export interface NewsletterSendSummary {
  id: string
  sentAt: string
  status: NewsletterStatus
  /** presente solo quando status = "skipped" */
  reason?: "no_birthdays"
  recipientCount: number
  birthdayCount: number
}

export interface NewsletterSend extends NewsletterSendSummary {
  birthdays: BirthdayPerson[]
  recipients: NewsletterRecipient[]
}

export interface ValidationError {
  field: string
  message: string
}

export interface ApiError {
  message: string
  errors?: ValidationError[]
}
