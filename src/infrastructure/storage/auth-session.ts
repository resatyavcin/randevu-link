import type { AuthScope, AuthMe, AuthLoginResponse } from "@/domain/models/auth"
export type { AuthScope, AuthMe, AuthLoginResponse, OtpRequestResponse } from "@/domain/models/auth"

const STORAGE: Record<AuthScope, { access: string; refresh: string; me: string }> = {
  DASHBOARD: {
    access: "randevu-link.dashboard.access",
    refresh: "randevu-link.dashboard.refresh",
    me: "randevu-link.dashboard.me",
  },
  STAFF: {
    access: "randevu-link.staff.access",
    refresh: "randevu-link.staff.refresh",
    me: "randevu-link.staff.me",
  },
}

function canUseDom() {
  return typeof window !== "undefined" && typeof document !== "undefined"
}

function readStorage(key: string) {
  if (!canUseDom()) return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string | null) {
  if (!canUseDom()) return
  try {
    if (value) window.localStorage.setItem(key, value)
    else window.localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

export function getAccessToken(scope: AuthScope) {
  return readStorage(STORAGE[scope].access)
}

export function getRefreshToken(scope: AuthScope) {
  return readStorage(STORAGE[scope].refresh)
}

export function getStoredMe(scope: AuthScope): AuthMe | null {
  const raw = readStorage(STORAGE[scope].me)
  if (!raw) return null
  try {
    const me = JSON.parse(raw) as AuthMe
    if (["Ali Yıldız", "Reşat Berber"].includes(me.name)) me.name = "Reşat Yavçin"
    me.photoUrl = null
    return me
  } catch {
    return null
  }
}

export function setAuthSession(scope: AuthScope, session: AuthLoginResponse) {
  writeStorage(STORAGE[scope].access, session.accessToken)
  writeStorage(STORAGE[scope].refresh, session.refreshToken)
  writeStorage(STORAGE[scope].me, JSON.stringify(session.me))
}

export function clearAuthSession(scope: AuthScope) {
  writeStorage(STORAGE[scope].access, null)
  writeStorage(STORAGE[scope].refresh, null)
  writeStorage(STORAGE[scope].me, null)
}
