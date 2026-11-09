import type { ServicesRepository, ServiceCategoriesRepository, RolesRepository } from "@/application/ports/catalog"
import { request } from "@/infrastructure/transport/demo-transport"
import type {
  PageResponse,
  ServiceCategoryDto,
  ServiceCategoryRequest,
  ServiceCountsDto,
  ServiceDto,
  ServiceGenderApi,
  ServiceRequest,
  RoleDto,
  RoleRequest,
} from "@/domain/models/contracts"

export const servicesApi: ServicesRepository = {
  list: (
    params?: {
      gender?: ServiceGenderApi | null
      categoryId?: string | null
      active?: boolean | null
      roleId?: string | null
      q?: string
      page?: number
      size?: number
    },
    signal?: AbortSignal,
  ) => {
    const q = new URLSearchParams()
    if (params?.gender) q.set("gender", params.gender)
    if (params?.categoryId) q.set("categoryId", params.categoryId)
    if (params?.active != null) q.set("active", String(params.active))
    if (params?.roleId) q.set("roleId", params.roleId)
    if (params?.q) q.set("q", params.q)
    if (params?.page != null) q.set("page", String(params.page))
    if (params?.size != null) q.set("size", String(params.size))
    const qs = q.toString()
    return request<PageResponse<ServiceDto>>(`/api/services${qs ? `?${qs}` : ""}`, { signal })
  },
  counts: (
    params?: {
      gender?: ServiceGenderApi | null
      active?: boolean | null
    },
    signal?: AbortSignal,
  ) => {
    const q = new URLSearchParams()
    if (params?.gender) q.set("gender", params.gender)
    if (params?.active != null) q.set("active", String(params.active))
    const qs = q.toString()
    return request<ServiceCountsDto>(`/api/services/counts${qs ? `?${qs}` : ""}`, { signal })
  },
  listAll: async (
    params?: { gender?: ServiceGenderApi | null; active?: boolean | null },
    signal?: AbortSignal,
  ) => {
    const page = await servicesApi.list({ ...params, page: 0, size: 200 }, signal)
    return page.content
  },
  create: (body: ServiceRequest) =>
    request<ServiceDto>(`/api/admin/services`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: string, body: ServiceRequest) =>
    request<ServiceDto>(`/api/admin/services/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  remove: (id: string) => request<void>(`/api/admin/services/${id}`, { method: "DELETE" }),
}
export const serviceCategoriesApi: ServiceCategoriesRepository = {
  list: (
    params?: { gender?: ServiceGenderApi | null; active?: boolean | null },
    signal?: AbortSignal,
  ) => {
    const q = new URLSearchParams()
    if (params?.gender) q.set("gender", params.gender)
    if (params?.active != null) q.set("active", String(params.active))
    const qs = q.toString()
    return request<ServiceCategoryDto[]>(`/api/service-categories${qs ? `?${qs}` : ""}`, { signal })
  },
  adminList: (
    params?: {
      gender?: ServiceGenderApi | null
      active?: boolean | null
      page?: number
      size?: number
    },
    signal?: AbortSignal,
  ) => {
    const q = new URLSearchParams()
    if (params?.gender) q.set("gender", params.gender)
    if (params?.active != null) q.set("active", String(params.active))
    if (params?.page != null) q.set("page", String(params.page))
    if (params?.size != null) q.set("size", String(params.size))
    const qs = q.toString()
    return request<PageResponse<ServiceCategoryDto>>(
      `/api/admin/service-categories${qs ? `?${qs}` : ""}`,
      { signal },
    )
  },
  create: (body: ServiceCategoryRequest) =>
    request<ServiceCategoryDto>(`/api/admin/service-categories`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: string, body: ServiceCategoryRequest) =>
    request<ServiceCategoryDto>(`/api/admin/service-categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  remove: (id: string) =>
    request<void>(`/api/admin/service-categories/${id}`, {
      method: "DELETE",
    }),
}
export const rolesApi: RolesRepository = {
  list: (signal?: AbortSignal) => request<RoleDto[]>("/api/roles", { signal }),
  adminList: (
    params?: { active?: boolean | null; page?: number; size?: number },
    signal?: AbortSignal,
  ) => {
    const q = new URLSearchParams()
    if (params?.active != null) q.set("active", String(params.active))
    if (params?.page != null) q.set("page", String(params.page))
    if (params?.size != null) q.set("size", String(params.size))
    const qs = q.toString()
    return request<PageResponse<RoleDto>>(`/api/admin/roles${qs ? `?${qs}` : ""}`, { signal })
  },
  create: (body: RoleRequest) =>
    request<RoleDto>(`/api/admin/roles`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: string, body: RoleRequest) =>
    request<RoleDto>(`/api/admin/roles/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  remove: (id: string) => request<void>(`/api/admin/roles/${id}`, { method: "DELETE" }),
}
