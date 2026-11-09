"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { ApiError, authApi, staffPortalApi } from "@/composition/services"
import { getAccessToken } from "@/composition/auth"
import type { AuthMe } from "@/domain/models/auth"
import { normalizeTrPhone } from "@/domain/value-objects/phone"
import { useMutation } from "@tanstack/react-query"
import { clearAuthSession } from "@/composition/auth"
import { useHydrated } from "@/presentation/lib/use-hydrated"

type Gate = "boot" | "phone" | "otp" | "day"
export function toIsoDate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function useStaffPortal() {
  const [stage, setGate] = React.useState<Gate>("boot")
  const [phone, setPhone] = React.useState("")
  const [otp, setOtp] = React.useState("")
  const [signedInStaff, setStaff] = React.useState<AuthMe | null>(null)
  const [date, setDate] = React.useState(() => toIsoDate(new Date()))
  const client = useQueryClient()
  const [debugCode, setDebugCode] = React.useState<string | null>(null)
  const [expiresAt, setExpiresAt] = React.useState<number | null>(null)
  const [resendAt, setResendAt] = React.useState<number | null>(null)
  const [now, setNow] = React.useState(() => Date.now())

  const phone10 = normalizeTrPhone(phone)
  const phoneReady = phone10.length === 10 && phone10.startsWith("5")
  const otpReady = otp.length === 6
  const today = toIsoDate(new Date())

  const hydrated = useHydrated()
  const token = hydrated ? getAccessToken("STAFF") : null
  const profile = useQuery({
    queryKey: ["staff-portal", "profile"],
    queryFn: async ({ signal }) => {
      try {
        return await staffPortalApi.me(signal)
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) clearAuthSession("STAFF")
        throw error
      }
    },
    enabled: stage === "boot" && Boolean(token),
  })
  const staff = signedInStaff ?? profile.data
  const gate =
    stage === "boot" && hydrated
      ? !token || profile.error
        ? "phone"
        : staff
          ? "day"
          : "boot"
      : stage
  const requestCode = useMutation({ mutationFn: staffPortalApi.requestOtp })
  const verify = useMutation({
    mutationFn: (code: string) => staffPortalApi.login(phone10, code),
  })
  function clearErrors() {
    requestCode.reset()
    verify.reset()
  }
  function logout() {
    void authApi.logout("STAFF")
    setStaff(null)
    client.removeQueries({ queryKey: ["staff-portal"] })
    clearErrors()
    setOtp("")
    setDebugCode(null)
    setDate(toIsoDate(new Date()))
    setGate("phone")
  }
  const day = useQuery({
    queryKey: ["staff-portal", staff?.id, date],
    queryFn: async ({ signal }) => {
      try {
        return await staffPortalApi.appointments(date, signal)
      } catch (error) {
        if (!signal.aborted && error instanceof ApiError && error.status === 401) logout()
        throw error
      }
    },
    enabled: gate === "day" && Boolean(staff),
  })
  const appointments = day.data ?? []
  const loading = gate === "day" ? day.isFetching : requestCode.isPending || verify.isPending
  const error = (gate === "day" ? day.error : (verify.error ?? requestCode.error))?.message ?? null

  React.useEffect(() => {
    if (gate !== "otp") return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [gate])

  const expireSeconds = expiresAt ? Math.max(0, Math.ceil((expiresAt - now) / 1000)) : 0
  const resendSeconds = resendAt ? Math.max(0, Math.ceil((resendAt - now) / 1000)) : 0

  function submitPhone() {
    if (!phoneReady || loading) return
    verify.reset()
    requestCode.mutate(phone10, {
      onSuccess: (result) => {
        setOtp("")
        setDebugCode(result.debugCode)
        setExpiresAt(Date.now() + result.expiresInSeconds * 1000)
        setResendAt(Date.now() + result.resendAvailableInSeconds * 1000)
        setGate("otp")
      },
    })
  }

  function submitOtp(code = otp) {
    if (code.length !== 6 || loading) return
    verify.mutate(code, {
      onSuccess: (result) => {
        setStaff(result.me)
        setDate(toIsoDate(new Date()))
        setGate("day")
      },
    })
  }
  return {
    gate,
    setGate,
    phone,
    setPhone,
    otp,
    setOtp,
    staff,
    date,
    setDate,
    appointments,
    loading,
    error,
    clearErrors,
    debugCode,
    setDebugCode,
    phoneReady,
    otpReady,
    today,
    logout,
    expireSeconds,
    resendSeconds,
    submitPhone,
    submitOtp,
  }
}
