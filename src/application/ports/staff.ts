import type { PageResponse, StaffDto, StaffRequest } from "@/domain/models/contracts";

export interface StaffRepository {
    list: (params?: {
        serviceId?: string | null;
        active?: boolean | null;
        q?: string;
        page?: number;
        size?: number;
    }, signal?: AbortSignal) => Promise<PageResponse<StaffDto>>;
    listAll: (params?: {
        serviceId?: string | null;
        active?: boolean | null;
    }, signal?: AbortSignal) => Promise<StaffDto[]>;
    get: (id: string, signal?: AbortSignal) => Promise<StaffDto>;
    create: (body: StaffRequest) => Promise<StaffDto>;
    update: (id: string, body: StaffRequest) => Promise<StaffDto>;
    setServices: (id: string, serviceIds: string[]) => Promise<StaffDto>;
    remove: (id: string) => Promise<void>;
    availability: (id: string, isoDate: string, signal?: AbortSignal, serviceId?: string | null) => Promise<string[]>;
}
