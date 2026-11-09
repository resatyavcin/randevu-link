import type { PageResponse, PaymentMethodApi, RevenuePaymentDto, RevenueSummaryDto, CollectSessionChargeRequest, SessionChargeDto, RegisterSaleRequest } from "@/domain/models/contracts";

export interface RevenueRepository {
    summary: (params?: {
        days?: number;
        from?: string;
        to?: string;
    }, signal?: AbortSignal) => Promise<RevenueSummaryDto>;
    payments: (params?: {
        days?: number;
        from?: string;
        to?: string;
        paymentMethod?: PaymentMethodApi | null;
        page?: number;
        size?: number;
    }, signal?: AbortSignal) => Promise<PageResponse<RevenuePaymentDto>>;
}

export interface RegisterSalesRepository {
    create: (body: RegisterSaleRequest) => Promise<RevenuePaymentDto>;
}

export interface SessionChargesRepository {
    listPending: (signal?: AbortSignal) => Promise<SessionChargeDto[]>;
    collect: (id: string, body: CollectSessionChargeRequest) => Promise<SessionChargeDto>;
}
