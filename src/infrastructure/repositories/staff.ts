import type { StaffRepository } from "@/application/ports/staff"
import { request } from "@/infrastructure/transport/demo-transport"
import type { PageResponse, StaffDto, StaffRequest } from "@/domain/models/contracts"

export const staffApi: StaffRepository = {
  list: (
    params?: {
      serviceId?: string | null
      active?: boolean | null
      q?: string
      page?: number
      size?: number
    },
    signal?: AbortSignal,
  ) => {
    const q = new URLSearchParams()
    if (params?.serviceId) q.set("serviceId", params.serviceId)
    if (params?.active != null) q.set("active", String(params.active))
    if (params?.q) q.set("q", params.q)
    if (params?.page != null) q.set("page", String(params.page))
    if (params?.size != null) q.set("size", String(params.size))
    const qs = q.toString()
    return request<PageResponse<StaffDto>>(`/api/staff${qs ? `?${qs}` : ""}`, { signal })
  },
  listAll: async (
    params?: { serviceId?: string | null; active?: boolean | null },
    signal?: AbortSignal,
  ) => {
    const page = await staffApi.list({ ...params, page: 0, size: 200 }, signal)
    return page.content
  },
  get: (id: string, signal?: AbortSignal) => request<StaffDto>(`/api/staff/${id}`, { signal }),
  create: (body: StaffRequest) =>
    request<StaffDto>(`/api/admin/staff`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: string, body: StaffRequest) =>
    request<StaffDto>(`/api/admin/staff/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  setServices: (id: string, serviceIds: string[]) =>
    request<StaffDto>(`/api/admin/staff/${id}/services`, {
      method: "PUT",
      body: JSON.stringify({ serviceIds }),
    }),
  remove: (id: string) => request<void>(`/api/admin/staff/${id}`, { method: "DELETE" }),
  availability: (id: string, isoDate: string, signal?: AbortSignal, serviceId?: string | null) =>
    request<string[]>(
      `/api/staff/${id}/availability?date=${isoDate}${serviceId ? `&serviceId=${encodeURIComponent(serviceId)}` : ""}`,
      { signal },
    ),
}
