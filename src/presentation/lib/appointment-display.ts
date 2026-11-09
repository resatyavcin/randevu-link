export type AppointmentFilter =
  | "all"
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "paid"
  | "unpaid"
  | "active"

export type PaymentStatus = "success" | "pending"
export type PaymentMethod = "card" | "cash"

export type Appointment = {
  id: string
  customer: string
  customerId: string
  staffId: string
  staffName?: string
  servedStaffId?: string | null
  servedStaffName?: string | null
  total: number
  service: string
  itemCount: number
  dateLabel: string
  payment: PaymentStatus
  method: PaymentMethod | null
  filterTags: AppointmentFilter[]
  quotedTotal?: number
  paidAmount?: number | null
  extras?: { serviceId: string; name: string; priceTl: number }[]
  status?: "PENDING" | "CANCELLED" | "COMPLETED"
  serviceId?: string
  date?: string
  slot?: string
  phone?: string
  note?: string | null
  sessionId?: string | null
  sessionName?: string | null
}

export function formatTry(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(value)
}

export function formatDateTime(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}
