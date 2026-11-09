export type AuthScope = "DASHBOARD" | "STAFF"

export type AuthMe = {
  id: string
  name: string
  phone: string
  photoUrl: string | null
  role: string
  roleCode: string
  dashboardAdmin: boolean
  scope: AuthScope
}

export type AuthLoginResponse = {
  accessToken: string
  refreshToken: string
  expiresIn: number
  refreshExpiresAt: string
  me: AuthMe
}

export type OtpRequestResponse = {
  expiresInSeconds: number
  resendAvailableInSeconds: number
  debugCode: string | null
}
