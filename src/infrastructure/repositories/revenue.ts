import type { RevenueRepository, RegisterSalesRepository, SessionChargesRepository } from "@/application/ports/revenue"
import { request } from "@/infrastructure/transport/demo-transport"
import type {
  PageResponse,
  PaymentMethodApi,
  RevenuePaymentDto,
  RevenueSummaryDto,
  CollectSessionChargeRequest,
  SessionChargeDto,
  RegisterSaleRequest,
} from "@/domain/models/contracts"

export const revenueApi: RevenueRepository = {
  summary: (params?: { days?: number; from?: string; to?: string }, signal?: AbortSignal) => {
    const q = new URLSearchParams()
    if (params?.from && params?.to) {
      q.set("from", params.from)
      q.set("to", params.to)
    } else if (params?.days != null) {
      q.set("days", String(params.days))
    }
    const qs = q.toString()
    return request<RevenueSummaryDto>(`/api/admin/revenue${qs ? `?${qs}` : ""}`, { signal })
  },
  payments: (
    params?: {
      days?: number
      from?: string
      to?: string
      paymentMethod?: PaymentMethodApi | null
      page?: number
      size?: number
    },
    signal?: AbortSignal,
  ) => {
    const q = new URLSearchParams()
    if (params?.from && params?.to) {
      q.set("from", params.from)
      q.set("to", params.to)
    } else if (params?.days != null) {
      q.set("days", String(params.days))
    }
    if (params?.paymentMethod) q.set("paymentMethod", params.paymentMethod)
    if (params?.page != null) q.set("page", String(params.page))
    if (params?.size != null) q.set("size", String(params.size))
    const qs = q.toString()
    return request<PageResponse<RevenuePaymentDto>>(
      `/api/admin/revenue/payments${qs ? `?${qs}` : ""}`,
      { signal },
    )
  },
}
export const registerSalesApi: RegisterSalesRepository = {
  create: (body: RegisterSaleRequest) =>
    request<RevenuePaymentDto>(`/api/admin/register-sales`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
}
export const sessionChargesApi: SessionChargesRepository = {
  listPending: (signal?: AbortSignal) =>
    request<SessionChargeDto[]>(`/api/admin/session-charges?status=PENDING`, {
      signal,
    }),
  collect: (id: string, body: CollectSessionChargeRequest) =>
    request<SessionChargeDto>(`/api/admin/session-charges/${id}/collect`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
}
