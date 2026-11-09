export type PageResponse<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type TablePreferenceName =
  | "services"
  | "staff"
  | "appointments"
  | "roles"
  | "revenue"
  | "categories"
  | "sessions"

export type TablePreferenceDto = {
  tableName: TablePreferenceName
  pageSize: number
}

export type UiThemeApi = "LIGHT" | "DARK"

export type BookingAppearanceDto = {
  theme: UiThemeApi
}

export type BookingAppearanceRequest = {
  theme: UiThemeApi
}

export const TABLE_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const
export const DEFAULT_TABLE_PAGE_SIZE = 20

export type ServiceCountsDto = {
  total: number
  categories: Record<string, number>
}

export type ServiceGenderApi = "KADIN" | "ERKEK"

export type ServiceCategoryDto = {
  id: string
  name: string
  gender: ServiceGenderApi
  sortOrder: number
  pinRank: number | null
  active: boolean
}

export type ServiceCategoryRequest = {
  name: string
  gender: ServiceGenderApi
  pinRank?: number | null
  active?: boolean
}

export type ServiceRoleRef = {
  id: string
  name: string
  active: boolean
}

export type ServiceDto = {
  id: string
  name: string
  roleIds: string[]
  roles: ServiceRoleRef[]
  category: ServiceCategoryDto
  durationMin: number
  priceTl: number
  priceMaxTl: number | null
  active: boolean
}

export type ServiceRequest = {
  name: string
  roleIds: string[]
  categoryId: string
  durationMin: number
  priceTl: number
  priceMaxTl?: number | null
  active?: boolean
}

export type StaffDto = {
  id: string
  name: string
  roleId: string
  role: string
  roleCode: string
  roleActive: boolean
  phone: string
  photoUrl: string | null
  workDays: number[]
  serviceIds: string[]
  active: boolean
  dashboardAdmin: boolean
}

export type StaffRequest = {
  name: string
  roleId: string
  phone: string
  photoUrl?: string | null
  workDays?: number[]
  active?: boolean
  dashboardAdmin?: boolean
}

export type StaffPortalMeDto = {
  id: string
  name: string
  role: string
  phone: string
  photoUrl: string | null
}

export type StaffPortalLoginResponse = {
  token: string
  staff: StaffPortalMeDto
}

export type RoleDto = {
  id: string
  code: string
  name: string
  active: boolean
}

export type RoleRequest = {
  name: string
  active?: boolean
}

export type AppointmentStatusApi = "PENDING" | "CANCELLED" | "COMPLETED"
export type PaymentMethodApi = "CASH" | "CARD"

export type AppointmentExtraDto = {
  serviceId: string
  name: string
  priceTl: number
}

export type AppointmentDto = {
  note?: string | null
  id: string
  serviceId: string
  serviceName: string
  staffId: string | null
  staffName: string | null
  servedStaffId: string | null
  servedStaffName: string | null
  customerFirstName: string
  customerLastName: string
  customerPhone: string
  /** ISO date (YYYY-MM-DD). */
  date: string
  /** HH:mm[:ss] */
  slot: string
  status: AppointmentStatusApi
  createdAt: string
  priceTl: number | null
  quotedPriceTl: number
  paidAmountTl: number | null
  paymentMethod: PaymentMethodApi | null
  paidAt: string | null
  paymentNote: string | null
  extras: AppointmentExtraDto[]
  sessionId: string | null
  sessionName: string | null
}

export type CollectPaymentRequest = {
  amountTl: number
  method: PaymentMethodApi
  extraServiceIds?: string[]
  note?: string | null
  sessionId?: string | null
  staffId?: string | null
}

export type SessionChargeStatusApi = "PENDING" | "COLLECTED" | "CANCELLED"

export type SessionChargeDto = {
  id: string
  sessionId: string
  sessionName: string
  customerFirstName: string
  customerLastName: string
  customerPhone: string
  staffId: string | null
  staffName: string | null
  amountTl: number | null
  note: string | null
  status: SessionChargeStatusApi
  createdAt: string
  extras: AppointmentExtraDto[]
}

export type CompleteCreditRequest = {
  appointmentId?: string | null
  staffId?: string | null
}

export type SessionVisitDto = {
  id: string
  date: string
  slot: string
  serviceName: string
  staffId: string | null
  staffName: string | null
}

export type QueueSessionChargeRequest = {
  staffId: string
  note?: string | null
  extraServiceIds: string[]
}

export type CollectSessionChargeRequest = {
  amountTl: number
  method: PaymentMethodApi
  note?: string | null
  completeVisit: boolean
  extraServiceIds?: string[]
  staffId?: string | null
}

export type RevenueDayDto = {
  date: string
  totalTl: number
  cashTl: number
  cardTl: number
  count: number
}

export type RevenueSummaryDto = {
  days: number
  totalPaidTl: number
  cashTl: number
  cardTl: number
  paidCount: number
  pendingCount: number
  cancelledCount: number
  averageTicketTl: number
  quotedTotalTl: number
  differenceTl: number
  daily: RevenueDayDto[]
}

export type RevenuePaymentDto = {
  appointmentId: string
  customerName: string
  serviceName: string | null
  staffName: string | null
  date: string
  paidAt: string | null
  quotedPriceTl: number
  paidAmountTl: number
  paymentMethod: PaymentMethodApi | null
  paymentNote: string | null
  extras: AppointmentExtraDto[]
  creditSessions: number
  sessionId: string | null
  sessionName: string | null
  kind: "APPOINTMENT" | "SESSION" | "EXTRA"
}

export type RegisterSaleRequest = {
  customerFirstName: string
  customerLastName: string
  customerPhone: string
  staffId: string
  serviceIds: string[]
  method: PaymentMethodApi
  note?: string | null
}

export const REVENUE_DAY_OPTIONS = [1, 30, 90] as const

export type CreateAppointmentRequest = {
  note?: string | null
  serviceId: string
  staffId: string | null
  firstName: string
  lastName: string
  phone: string
  date: string
  slot: string
}

export type AvailabilityDayDto = {
  /** ISO date (YYYY-MM-DD). */
  date: string
  /** 0=Sunday..6=Saturday. */
  weekday: number
  workingStaffIds: string[]
}

export const GENDER_LABELS: Record<ServiceGenderApi, string> = {
  KADIN: "Kadın",
  ERKEK: "Erkek",
}

export type SessionStatusApi = "ACTIVE" | "COMPLETED" | "CANCELLED"
export type SessionEventKindApi = "COMPLETED" | "PAID" | "ADJUSTED"

export type SessionEventDto = {
  id: string
  kind: SessionEventKindApi
  staffId: string | null
  staffName: string | null
  amountTl: number | null
  collectedTl: number | null
  paymentMethod: PaymentMethodApi | null
  note: string | null
  occurredAt: string
  extras: AppointmentExtraDto[]
  appointmentId: string | null
  bookedStaffName: string | null
}

export type SessionBookingOptionDto = {
  id: string
  name: string
  customerFirstName: string
  customerLastName: string
  totalSessions: number
  completedCount: number
  scheduledCount: number
  nextIndex: number
  periodNote: string | null
  serviceId: string | null
  serviceName: string | null
  durationMin: number
}

export type BookSessionRequest = {
  phone: string
  staffId: string | null
  date: string
  slot: string
}

export type SessionBookingResultDto = {
  appointment: AppointmentDto
  sessionName: string
  sessionIndex: number
  totalSessions: number
  serviceName: string
  durationMin: number
}

export type SessionDebtCursorDto = {
  id: string
  index: number
}

export type SessionDto = {
  id: string
  customerPhone: string
  customerFirstName: string
  customerLastName: string
  name: string
  serviceId: string | null
  serviceName: string | null
  totalSessions: number
  completedCount: number
  periodNote: string | null
  totalPriceTl: number
  paidTotalTl: number
  unitPriceTl: number
  creditBalanceTl: number
  status: SessionStatusApi
  createdAt: string
  updatedAt: string
  events: SessionEventDto[]
}

export type SessionRequest = {
  customerPhone: string
  customerFirstName?: string | null
  customerLastName?: string | null
  name: string
  serviceId?: string | null
  totalSessions: number
  periodNote?: string | null
  totalPriceTl: number
}

export type SessionUpdateRequest = {
  name: string
  serviceId?: string | null
  totalSessions: number
  periodNote?: string | null
  totalPriceTl: number
}

export type SessionPaymentRequest = {
  amountTl: number
  staffId: string
  method: PaymentMethodApi
  note?: string | null
}

export type CustomerHistorySourceApi = "APPOINTMENT" | "SESSION"
export type CustomerHistoryKindApi =
  | "CREATED"
  | "COMPLETED"
  | "CANCELLED"
  | "PAID"
  | "ADJUSTED"

export type CustomerHistoryItemDto = {
  source: CustomerHistorySourceApi
  kind: CustomerHistoryKindApi
  occurredAt: string
  appointmentId: string | null
  sessionId: string | null
  title: string
  staffId: string | null
  staffName: string | null
  amountTl: number | null
  note: string | null
}

export const SESSION_STATUS_LABELS: Record<SessionStatusApi, string> = {
  ACTIVE: "Aktif",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal",
}
