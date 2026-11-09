import type { AppointmentDto, AppointmentStatusApi, AvailabilityDayDto, CollectPaymentRequest, CreateAppointmentRequest, PageResponse, PaymentMethodApi, CustomerHistoryItemDto } from "@/domain/models/contracts";

export interface AvailabilityRepository {
    days: (params: {
        serviceId?: string | null;
        staffId?: string | null;
        count?: number;
    }, signal?: AbortSignal) => Promise<AvailabilityDayDto[]>;
}

export interface AppointmentsRepository {
    list: (params?: {
        phone?: string;
        status?: AppointmentStatusApi;
        paymentMethod?: PaymentMethodApi;
        from?: string;
        to?: string;
        excludeSession?: boolean;
        q?: string;
        page?: number;
        size?: number;
    }, signal?: AbortSignal) => Promise<PageResponse<AppointmentDto>>;
    create: (body: CreateAppointmentRequest) => Promise<AppointmentDto>;
    listByPhone: (phone: string, status?: AppointmentStatusApi, signal?: AbortSignal) => Promise<AppointmentDto[]>;
    lookup: (code: string, signal?: AbortSignal) => Promise<AppointmentDto>;
    collect: (id: string, body: CollectPaymentRequest) => Promise<AppointmentDto>;
    cancel: (id: string) => Promise<void>;
}

export interface CustomersRepository {
    history: (phone: string, signal?: AbortSignal) => Promise<CustomerHistoryItemDto[]>;
}
