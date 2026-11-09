"use client"

import { ChevronRight, CalendarDays } from "lucide-react"
import type { Appointment } from "@/presentation/lib/appointment-display"
import { Skeleton } from "@/presentation/components/ui/skeleton"
import { VisitStatusBadge } from "@/presentation/components/dashboard/appointments/appointments-table"

export function AppointmentList({ rows, loading, onSelectCustomer }: {
  rows: Appointment[]
  loading: boolean
  onSelectCustomer: (customerId: string) => void
}) {
  if (loading) return (
    <div role="status" aria-label="Randevular yükleniyor" className="divide-y">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="space-y-3 p-4"><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-56 max-w-full" /><Skeleton className="h-4 w-32" /></div>
      ))}
    </div>
  )
  if (!rows.length) return (
    <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
      <CalendarDays aria-hidden className="mb-1 size-6 text-muted-foreground" />
      <p className="text-sm font-medium">Randevu bulunamadı</p>
      <p className="max-w-64 text-sm text-muted-foreground">Başka bir tarih aralığı seçin veya arama ve durum filtrelerini değiştirin.</p>
    </div>
  )
  return (
    <ul className="divide-y divide-border">
      {rows.map((row) => (
        <li key={row.id}>
          <button type="button" onClick={() => onSelectCustomer(row.customerId)} className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring" aria-label={`${row.customer}, ${row.dateLabel}, detayları aç`}>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="min-w-0 break-words text-sm font-semibold">{row.customer}</span>
                <VisitStatusBadge status={row.status} cancelled={row.filterTags.includes("cancelled")} />
              </div>
              <p className="text-sm font-medium">{row.dateLabel}</p>
              <p className="break-words text-sm text-muted-foreground">{row.service}{row.itemCount > 1 ? ` +${row.itemCount - 1} hizmet` : ""}</p>
              {row.staffName ? <p className="break-words text-xs text-muted-foreground">{row.staffName}</p> : null}
            </div>
            <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </li>
      ))}
    </ul>
  )
}
