import { type AuthLoginResponse, type AuthMe, type AuthScope, type OtpRequestResponse } from "@/domain/models/auth";
import type { AppointmentDto } from "@/domain/models/contracts";

export interface AuthRepository {
    requestOtp: (phone: string, scope: AuthScope) => Promise<OtpRequestResponse>;
    verifyOtp: (phone: string, code: string, scope: AuthScope) => Promise<AuthLoginResponse>;
    logout: (scope: AuthScope) => Promise<void>;
    me: (scope: AuthScope, signal?: AbortSignal) => Promise<AuthMe>;
}

export interface StaffPortalRepository {
    requestOtp: (phone: string) => Promise<OtpRequestResponse>;
    login: (phone: string, otp: string) => Promise<AuthLoginResponse>;
    me: (signal?: AbortSignal) => Promise<AuthMe>;
    appointments: (date: string, signal?: AbortSignal) => Promise<AppointmentDto[]>;
}
