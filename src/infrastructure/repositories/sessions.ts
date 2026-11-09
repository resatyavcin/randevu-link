import type { SessionsRepository, SessionBookingsRepository } from "@/application/ports/sessions"
import { request } from "@/infrastructure/transport/demo-transport"
import type {
  PageResponse,
  BookSessionRequest,
  SessionBookingOptionDto,
  SessionBookingResultDto,
  CompleteCreditRequest,
  SessionVisitDto,
  QueueSessionChargeRequest,
  SessionChargeDto,
  SessionDebtCursorDto,
  SessionDto,
  SessionPaymentRequest,
  SessionRequest,
  SessionStatusApi,
  SessionUpdateRequest,
} from "@/domain/models/contracts"

export const sessionsApi: SessionsRepository = {
  list: (
    params?: {
      phone?: string | null
      status?: SessionStatusApi | null
      page?: number
      size?: number
    },
    signal?: AbortSignal,
  ) => {
    const q = new URLSearchParams()
    if (params?.phone) q.set("phone", params.phone)
    if (params?.status) q.set("status", params.status)
    if (params?.page != null) q.set("page", String(params.page))
    if (params?.size != null) q.set("size", String(params.size))
    const qs = q.toString()
    return request<PageResponse<SessionDto>>(`/api/admin/sessions${qs ? `?${qs}` : ""}`, { signal })
  },
  debts: (
    params?: { phone?: string | null; status?: SessionStatusApi | null },
    signal?: AbortSignal,
  ) => {
    const q = new URLSearchParams()
    if (params?.phone) q.set("phone", params.phone)
    if (params?.status) q.set("status", params.status)
    const qs = q.toString()
    return request<SessionDebtCursorDto[]>(`/api/admin/sessions/debts${qs ? `?${qs}` : ""}`, {
      signal,
    })
  },
  get: (id: string, signal?: AbortSignal) =>
    request<SessionDto>(`/api/admin/sessions/${id}`, { signal }),
  create: (body: SessionRequest) =>
    request<SessionDto>(`/api/admin/sessions`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: string, body: SessionUpdateRequest) =>
    request<SessionDto>(`/api/admin/sessions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  pay: (id: string, body: SessionPaymentRequest) =>
    request<SessionDto>(`/api/admin/sessions/${id}/pay`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  completeFromCredit: (id: string, body: CompleteCreditRequest) =>
    request<SessionDto>(`/api/admin/sessions/${id}/complete-credit`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  queueFee: (id: string) =>
    request<SessionChargeDto>(`/api/admin/sessions/${id}/queue`, {
      method: "POST",
    }),
  queueCharge: (id: string, body: QueueSessionChargeRequest) =>
    request<SessionChargeDto>(`/api/admin/sessions/${id}/charges`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  charges: (id: string, signal?: AbortSignal) =>
    request<SessionChargeDto[]>(`/api/admin/sessions/${id}/charges`, { signal }),
  visits: (id: string, signal?: AbortSignal) =>
    request<SessionVisitDto[]>(`/api/admin/sessions/${id}/visits`, { signal }),
  deleteEvent: (id: string, eventId: string) =>
    request<SessionDto>(`/api/admin/sessions/${id}/events/${eventId}`, {
      method: "DELETE",
    }),
  cancel: (id: string) => request<void>(`/api/admin/sessions/${id}`, { method: "DELETE" }),
}
export const sessionBookingsApi: SessionBookingsRepository = {
  listByPhone: (phone: string, signal?: AbortSignal) =>
    request<SessionBookingOptionDto[]>(`/api/session-bookings?phone=${encodeURIComponent(phone)}`, {
      signal,
    }),
  book: (id: string, body: BookSessionRequest) =>
    request<SessionBookingResultDto>(`/api/session-bookings/${id}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
}
