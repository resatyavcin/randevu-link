"use client"

import { useQuery } from "@tanstack/react-query"
import { appointmentsApi } from "@/composition/services"
import type { AppointmentDto } from "@/domain/models/contracts"
import { mapAppointmentDto } from "@/presentation/hooks/appointments"

export function useAppointmentPage(
  params: NonNullable<Parameters<typeof appointmentsApi.list>[0]>,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["appointments", "page", params],
    queryFn: ({ signal }) => appointmentsApi.list(params, signal),
    select: (result) => ({ ...result, content: result.content.map(mapAppointmentDto) }),
    enabled,
  })
}

export function useAppointmentStats(from: string, to: string) {
  return useQuery({
    queryKey: ["appointments", "stats", from, to],
    queryFn: async ({ signal }) => {
      const size = 200
      const first = await appointmentsApi.list({ from, to, page: 0, size }, signal)
      const rows = [...first.content]
      for (let page = 1; page < first.totalPages; page++) {
        rows.push(...(await appointmentsApi.list({ from, to, page, size }, signal)).content)
      }
      return countsByDay(rows, from, to)
    },
  })
}

function addDays(date: Date, amount: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function toIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function parseIsoDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function eachIsoDay(from: string, to: string) {
  const days: string[] = []
  let cursor = parseIsoDate(from)
  const end = parseIsoDate(to)
  while (cursor.getTime() <= end.getTime()) {
    days.push(toIsoDate(cursor))
    cursor = addDays(cursor, 1)
  }
  return days
}

function seriesPoints(values: number[]) {
  if (values.length >= 2) return values
  return [0, values[0] ?? 0]
}

function countsByDay(rows: AppointmentDto[], from: string, to: string) {
  const days = eachIsoDay(from, to)
  const total = new Map(days.map((day) => [day, 0]))
  const pending = new Map(days.map((day) => [day, 0]))
  const cancelled = new Map(days.map((day) => [day, 0]))
  for (const row of rows) {
    if (!total.has(row.date)) continue
    total.set(row.date, (total.get(row.date) ?? 0) + 1)
    if (row.status === "PENDING") pending.set(row.date, (pending.get(row.date) ?? 0) + 1)
    if (row.status === "CANCELLED") cancelled.set(row.date, (cancelled.get(row.date) ?? 0) + 1)
  }
  const sum = (map: Map<string, number>) =>
    days.reduce((count, day) => count + (map.get(day) ?? 0), 0)
  return {
    total: seriesPoints(days.map((day) => total.get(day) ?? 0)),
    pending: seriesPoints(days.map((day) => pending.get(day) ?? 0)),
    cancelled: seriesPoints(days.map((day) => cancelled.get(day) ?? 0)),
    totalCount: sum(total),
    pendingCount: sum(pending),
    cancelledCount: sum(cancelled),
  }
}
