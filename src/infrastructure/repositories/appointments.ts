import type { AvailabilityRepository, AppointmentsRepository, CustomersRepository } from "@/application/ports/appointments"
import { request } from "@/infrastructure/transport/demo-transport"
import type {
  AppointmentDto,
  AppointmentStatusApi,
  AvailabilityDayDto,
  CollectPaymentRequest,
  CreateAppointmentRequest,
  PageResponse,
  PaymentMethodApi,
  CustomerHistoryItemDto,
} from "@/domain/models/contracts"

export const availabilityApi: AvailabilityRepository = {
  days: (
    params: { serviceId?: string | null; staffId?: string | null; count?: number },
    signal?: AbortSignal,
  ) => {
    const q = new URLSearchParams()
    if (params.serviceId) q.set("serviceId", params.serviceId)
    if (params.staffId) q.set("staffId", params.staffId)
    if (params.count) q.set("count", String(params.count))
    const qs = q.toString()
    return request<AvailabilityDayDto[]>(`/api/availability/days${qs ? `?${qs}` : ""}`, { signal })
  },
}
export const appointmentsApi: AppointmentsRepository = {
  list: (
    params?: {
      phone?: string
      status?: AppointmentStatusApi
      paymentMethod?: PaymentMethodApi
      from?: string
      to?: string
      excludeSession?: boolean
      q?: string
      page?: number
      size?: number
    },
    signal?: AbortSignal,
  ) => {
    const q = new URLSearchParams()
    if (params?.phone) q.set("phone", params.phone)
    if (params?.status) q.set("status", params.status)
    if (params?.paymentMethod) q.set("paymentMethod", params.paymentMethod)
    if (params?.from) q.set("from", params.from)
    if (params?.to) q.set("to", params.to)
    if (params?.excludeSession) q.set("excludeSession", "true")
    if (params?.q) q.set("q", params.q)
    if (params?.page != null) q.set("page", String(params.page))
    if (params?.size != null) q.set("size", String(params.size))
    const qs = q.toString()
    return request<PageResponse<AppointmentDto>>(`/api/appointments${qs ? `?${qs}` : ""}`, {
      signal,
    })
  },
  create: (body: CreateAppointmentRequest) =>
    request<AppointmentDto>(`/api/appointments`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  listByPhone: async (phone: string, status?: AppointmentStatusApi, signal?: AbortSignal) => {
    const page = await appointmentsApi.list({ phone, status, page: 0, size: 100 }, signal)
    return page.content
  },
  lookup: (code: string, signal?: AbortSignal) =>
    request<AppointmentDto>(`/api/appointments/lookup?code=${encodeURIComponent(code)}`, {
      signal,
    }),
  collect: (id: string, body: CollectPaymentRequest) =>
    request<AppointmentDto>(`/api/appointments/${id}/collect`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  cancel: (id: string) => request<void>(`/api/appointments/${id}/cancel`, { method: "POST" }),
}
export const customersApi: CustomersRepository = {
  history: (phone: string, signal?: AbortSignal) =>
    request<CustomerHistoryItemDto[]>(`/api/admin/customers/${encodeURIComponent(phone)}/history`, {
      signal,
    }),
}
