import type { PageResponse, BookSessionRequest, SessionBookingOptionDto, SessionBookingResultDto, CompleteCreditRequest, SessionVisitDto, QueueSessionChargeRequest, SessionChargeDto, SessionDebtCursorDto, SessionDto, SessionPaymentRequest, SessionRequest, SessionStatusApi, SessionUpdateRequest } from "@/domain/models/contracts";

export interface SessionsRepository {
    list: (params?: {
        phone?: string | null;
        status?: SessionStatusApi | null;
        page?: number;
        size?: number;
    }, signal?: AbortSignal) => Promise<PageResponse<SessionDto>>;
    debts: (params?: {
        phone?: string | null;
        status?: SessionStatusApi | null;
    }, signal?: AbortSignal) => Promise<SessionDebtCursorDto[]>;
    get: (id: string, signal?: AbortSignal) => Promise<SessionDto>;
    create: (body: SessionRequest) => Promise<SessionDto>;
    update: (id: string, body: SessionUpdateRequest) => Promise<SessionDto>;
    pay: (id: string, body: SessionPaymentRequest) => Promise<SessionDto>;
    completeFromCredit: (id: string, body: CompleteCreditRequest) => Promise<SessionDto>;
    queueFee: (id: string) => Promise<SessionChargeDto>;
    queueCharge: (id: string, body: QueueSessionChargeRequest) => Promise<SessionChargeDto>;
    charges: (id: string, signal?: AbortSignal) => Promise<SessionChargeDto[]>;
    visits: (id: string, signal?: AbortSignal) => Promise<SessionVisitDto[]>;
    deleteEvent: (id: string, eventId: string) => Promise<SessionDto>;
    cancel: (id: string) => Promise<void>;
}

export interface SessionBookingsRepository {
    listByPhone: (phone: string, signal?: AbortSignal) => Promise<SessionBookingOptionDto[]>;
    book: (id: string, body: BookSessionRequest) => Promise<SessionBookingResultDto>;
}
