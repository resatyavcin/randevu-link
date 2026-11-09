"use client"

import { useQuery } from "@tanstack/react-query"
import { appointmentsApi } from "@/composition/services"
import type { AppointmentDto } from "@/domain/models/contracts"
import type { Appointment, AppointmentFilter } from "@/presentation/lib/appointment-display"

const TR_WEEKDAY = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"]

const TR_MONTH = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
]

function formatDateLabel(isoDate: string, slot: string) {
  const [y, m, d] = isoDate.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  const weekday = TR_WEEKDAY[date.getDay()] ?? ""
  const month = TR_MONTH[m - 1] ?? ""
  const time = slot.slice(0, 5)
  return `${d} ${month} ${weekday} · ${time}`
}

function tagsFor(dto: AppointmentDto): AppointmentFilter[] {
  const tags: AppointmentFilter[] = ["all"]
  if (dto.status === "PENDING") {
    tags.push("pending", "unpaid", "active", "confirmed")
  }
  if (dto.status === "COMPLETED") {
    tags.push("completed")
    if (dto.paidAmountTl != null) tags.push("paid")
  }
  if (dto.status === "CANCELLED") tags.push("cancelled")
  return tags
}

function mapMethod(method: AppointmentDto["paymentMethod"]): Appointment["method"] {
  if (method === "CARD") return "card"
  if (method === "CASH") return "cash"
  return null
}

export function mapAppointmentDto(dto: AppointmentDto): Appointment {
  const extras = dto.extras ?? []
  const quoted = dto.quotedPriceTl ?? dto.priceTl ?? 0
  const paid = dto.paidAmountTl
  return {
    id: dto.id,
    customer: `${dto.customerFirstName} ${dto.customerLastName}`.trim(),
    customerId: dto.customerPhone,
    staffId: dto.staffId ?? "any",
    staffName: dto.staffName ?? undefined,
    servedStaffId: dto.servedStaffId,
    servedStaffName: dto.servedStaffName ?? undefined,
    total: paid ?? quoted,
    service: dto.serviceName,
    itemCount: 1 + extras.length,
    dateLabel: formatDateLabel(dto.date, dto.slot),
    payment: dto.status === "COMPLETED" ? "success" : "pending",
    method: mapMethod(dto.paymentMethod),
    filterTags: tagsFor(dto),
    quotedTotal: quoted,
    paidAmount: paid,
    extras,
    status: dto.status,
    serviceId: dto.serviceId,
    date: dto.date,
    slot: dto.slot,
    phone: dto.customerPhone,
    note: dto.note ?? dto.paymentNote,
    sessionId: dto.sessionId,
    sessionName: dto.sessionName,
  }
}

const historyQuery = {
  queryKey: ["appointments", "history"],
  queryFn: async ({ signal }: { signal: AbortSignal }) => {
    const first = await appointmentsApi.list({ page: 0, size: 200 }, signal)
    const rows = [...first.content]
    for (let page = 1; page < first.totalPages; page++) {
      rows.push(...(await appointmentsApi.list({ page, size: 200 }, signal)).content)
    }
    return rows
  },
} as const

export function useCustomerOptions() {
  return useQuery({
    ...historyQuery,
    select: (rows) =>
      Array.from(
        new Map(
          rows.map((row) => [
            row.customerPhone,
            {
              id: row.customerPhone,
              firstName: row.customerFirstName,
              lastName: row.customerLastName,
              name: [row.customerFirstName, row.customerLastName].join(" "),
            },
          ]),
        ).values(),
      ),
  })
}
