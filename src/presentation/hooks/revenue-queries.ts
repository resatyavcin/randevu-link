"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { appointmentsApi, revenueApi, sessionChargesApi } from "@/composition/services"
import { mapAppointmentDto } from "@/presentation/hooks/appointments"
import type { PaymentMethodApi } from "@/domain/models/contracts"

type Options = {
  period: Parameters<typeof revenueApi.summary>[0]
  window: { from: string; to: string }
  tab: "pending" | "paid"
  method: PaymentMethodApi | "all"
  page: number
  size: number
  enabled: boolean
}

export function useRevenue({ period, window, tab, method, page, size, enabled }: Options) {
  const client = useQueryClient()
  const pendingFilter = { ...window, status: "PENDING" as const, excludeSession: true }
  const summary = useQuery({
    queryKey: ["revenue", "summary", period],
    queryFn: ({ signal }) => revenueApi.summary(period, signal),
  })
  const count = useQuery({
    queryKey: ["revenue", "pending-count", window],
    queryFn: ({ signal }) => appointmentsApi.list({ ...pendingFilter, page: 0, size: 1 }, signal),
    select: (result) => result.totalElements,
  })
  const charges = useQuery({
    queryKey: ["revenue", "fees"],
    queryFn: ({ signal }) => sessionChargesApi.listPending(signal),
    select: (rows) => rows.filter((row) => !row.extras?.length),
  })
  const pending = useQuery({
    queryKey: ["revenue", "pending", window, page, size],
    queryFn: ({ signal }) => appointmentsApi.list({ ...pendingFilter, page, size }, signal),
    select: (result) => ({ ...result, content: result.content.map(mapAppointmentDto) }),
    enabled: enabled && tab === "pending",
  })
  const payments = useQuery({
    queryKey: ["revenue", "payments", period, method, page, size],
    queryFn: ({ signal }) =>
      revenueApi.payments(
        { ...period, paymentMethod: method === "all" ? null : method, page, size },
        signal,
      ),
    enabled: enabled && tab === "paid",
  })
  const table = tab === "pending" ? pending : payments
  return {
    summary: summary.data,
    payments: payments.data,
    pending: pending.data,
    feeCharges: charges.data ?? [],
    pendingAppointmentCount: count.data ?? 0,
    error: (table.error ?? summary.error ?? count.error ?? charges.error)?.message,
    loading: table.isPending || table.isFetching || summary.isPending,
    refresh: () =>
      Promise.all(
        ["revenue", "sessions", "appointments"].map((key) =>
          client.invalidateQueries({ queryKey: [key] }),
        ),
      ),
  }
}
