import type { PageResponse, ServiceCategoryDto, ServiceCategoryRequest, ServiceCountsDto, ServiceDto, ServiceGenderApi, ServiceRequest, RoleDto, RoleRequest } from "@/domain/models/contracts";

export interface ServicesRepository {
    list: (params?: {
        gender?: ServiceGenderApi | null;
        categoryId?: string | null;
        active?: boolean | null;
        roleId?: string | null;
        q?: string;
        page?: number;
        size?: number;
    }, signal?: AbortSignal) => Promise<PageResponse<ServiceDto>>;
    counts: (params?: {
        gender?: ServiceGenderApi | null;
        active?: boolean | null;
    }, signal?: AbortSignal) => Promise<ServiceCountsDto>;
    listAll: (params?: {
        gender?: ServiceGenderApi | null;
        active?: boolean | null;
    }, signal?: AbortSignal) => Promise<ServiceDto[]>;
    create: (body: ServiceRequest) => Promise<ServiceDto>;
    update: (id: string, body: ServiceRequest) => Promise<ServiceDto>;
    remove: (id: string) => Promise<void>;
}

export interface ServiceCategoriesRepository {
    list: (params?: {
        gender?: ServiceGenderApi | null;
        active?: boolean | null;
    }, signal?: AbortSignal) => Promise<ServiceCategoryDto[]>;
    adminList: (params?: {
        gender?: ServiceGenderApi | null;
        active?: boolean | null;
        page?: number;
        size?: number;
    }, signal?: AbortSignal) => Promise<PageResponse<ServiceCategoryDto>>;
    create: (body: ServiceCategoryRequest) => Promise<ServiceCategoryDto>;
    update: (id: string, body: ServiceCategoryRequest) => Promise<ServiceCategoryDto>;
    remove: (id: string) => Promise<void>;
}

export interface RolesRepository {
    list: (signal?: AbortSignal) => Promise<RoleDto[]>;
    adminList: (params?: {
        active?: boolean | null;
        page?: number;
        size?: number;
    }, signal?: AbortSignal) => Promise<PageResponse<RoleDto>>;
    create: (body: RoleRequest) => Promise<RoleDto>;
    update: (id: string, body: RoleRequest) => Promise<RoleDto>;
    remove: (id: string) => Promise<void>;
}
