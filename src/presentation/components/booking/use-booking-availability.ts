"use client"

import { useQuery } from "@tanstack/react-query"
import { availabilityApi } from "@/composition/services"
import type { AvailabilityDayDto } from "@/domain/models/contracts"
import { useAvailableStaff, useAvailableSlots } from "@/presentation/hooks/new-appointment"
import type { DayCell } from "@/presentation/components/booking/booking-steps"

const TR_WEEKDAY_SHORT = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"]
const TR_WEEKDAY_LONG = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"]

function toDayCells(days: AvailabilityDayDto[]): DayCell[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return days.map((d) => {
    const [y, m, day] = d.date.split("-").map(Number)
    const dateObj = new Date(y, m - 1, day)
    return {
      date: dateObj,
      iso: d.date,
      weekdayShort: TR_WEEKDAY_SHORT[d.weekday] ?? "",
      weekdayLong: TR_WEEKDAY_LONG[d.weekday] ?? "",
      dayNum: day,
      isToday: dateObj.getTime() === today.getTime(),
      workingStaffIds: d.workingStaffIds,
    }
  })
}

export function useBookingAvailability(
  serviceId: string | null,
  staffId: string | null,
  dayIndex: number | null,
  enabled: boolean,
) {
  const staff = useAvailableStaff(serviceId, enabled)
  const member = staffId && staffId !== "any" ? staffId : undefined
  const dayQuery = useQuery({
    queryKey: ["availability", "days", serviceId, member],
    queryFn: ({ signal }) =>
      availabilityApi.days(
        { serviceId: serviceId ?? undefined, staffId: member, count: 14 },
        signal,
      ),
    select: toDayCells,
    enabled,
  })
  const days = dayQuery.data ?? []
  const day = dayIndex === null ? undefined : days[dayIndex]
  const resolvedStaff = member ?? day?.workingStaffIds[0] ?? ""
  const slots = useAvailableSlots(serviceId ?? "", resolvedStaff, enabled ? (day?.iso ?? "") : "")
  return {
    staff: staff.data ?? [],
    days,
    times: slots.data ?? [],
    timesLoading: slots.isFetching,
    error: (staff.error ?? dayQuery.error ?? slots.error)?.message,
  }
}
