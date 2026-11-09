import type { AuthRepository, StaffPortalRepository } from "@/application/ports/auth"
import { request } from "@/infrastructure/transport/demo-transport"
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  setAuthSession,
  type AuthLoginResponse,
  type AuthMe,
  type AuthScope,
  type OtpRequestResponse,
} from "@/infrastructure/storage/auth-session"
import type { AppointmentDto } from "@/domain/models/contracts"

export const authApi: AuthRepository = {
  requestOtp: (phone: string, scope: AuthScope) =>
    request<OtpRequestResponse>(`/api/auth/otp/request`, {
      method: "POST",
      body: JSON.stringify({ phone, scope }),
      authScope: null,
    }),
  verifyOtp: async (phone: string, code: string, scope: AuthScope) => {
    const session = await request<AuthLoginResponse>(`/api/auth/otp/verify`, {
      method: "POST",
      body: JSON.stringify({ phone, code, scope }),
      authScope: null,
    })
    setAuthSession(scope, session)
    return session
  },
  logout: async (scope: AuthScope) => {
    const refreshToken = getRefreshToken(scope)
    try {
      await request<void>(`/api/auth/logout`, {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
        authScope: null,
      })
    } catch {
      /* ignore */
    }
    clearAuthSession(scope)
  },
  me: (scope: AuthScope, signal?: AbortSignal) =>
    request<AuthMe>(`/api/auth/me`, { signal, authScope: scope }),
}
export function getStaffPortalToken() {
  return getAccessToken("STAFF")
}
export function setStaffPortalToken(token: string | null) {
  if (!token) clearAuthSession("STAFF")
}
export const staffPortalApi: StaffPortalRepository = {
  requestOtp: (phone: string) => authApi.requestOtp(phone, "STAFF"),
  login: (phone: string, otp: string) => authApi.verifyOtp(phone, otp, "STAFF"),
  me: (signal?: AbortSignal) =>
    request<AuthMe>(`/api/staff-portal/me`, { signal, authScope: "STAFF" }),
  appointments: (date: string, signal?: AbortSignal) =>
    request<AppointmentDto[]>(`/api/staff-portal/appointments?date=${encodeURIComponent(date)}`, {
      signal,
      authScope: "STAFF",
    }),
}
