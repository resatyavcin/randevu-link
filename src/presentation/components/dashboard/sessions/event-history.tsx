"use client"

import { Banknote, CreditCard, Undo2 } from "lucide-react"
import { Button } from "@/presentation/components/ui/button"
import { Badge } from "@/presentation/components/ui/badge"
import { type SessionEventDto } from "@/domain/models/contracts"
import { formatDateTime, formatTry } from "@/presentation/lib/appointment-display"
import { cn } from "@/presentation/lib/utils"

export function EventHistory({
  events,
  mode,
  mutable,
  highlightEventId,
  onUndo,
}: {
  events: SessionEventDto[]
  mode: "activity" | "payment"
  mutable: boolean
  highlightEventId?: string | null
  onUndo: (event: SessionEventDto) => void
}) {
  if (events.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {mode === "payment" ? "Henüz seans tahsilatı yok" : "Henüz işlem yok"}
      </p>
    )
  }

  return (
    <ul className="grid gap-2">
      {events.map((event) => (
        <li
          key={event.id}
          id={mode === "activity" ? `session-event-${event.id}` : undefined}
          className={cn(
            "grid scroll-mt-4 gap-3 rounded-2xl border bg-card p-4 sm:flex sm:items-center sm:justify-between",
            highlightEventId === event.id && "ring-1 ring-indigo/50",
          )}
        >
          <div className="min-w-0">
            {mode === "payment" ? (
              <div className="flex flex-wrap items-center gap-2">
                <MethodMark method={event.paymentMethod} />
                <span className="font-semibold tabular-nums">{formatTry(event.amountTl ?? 0)}</span>
              </div>
            ) : (
              <>
                <p className="font-medium">{event.staffName ?? "Sistem"}</p>
                <p className="text-sm text-muted-foreground">
                  {event.note ||
                    (event.kind === "COMPLETED" && (
                      <>
                        Seans tamamlandı
                        {event.appointmentId &&
                          (event.bookedStaffName
                            ? ` · randevu ${event.bookedStaffName}`
                            : " · randevudan")}
                      </>
                    ))}
                </p>
              </>
            )}
            <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(event.occurredAt)}</p>
          </div>
          {mutable && (
            <Button
              variant="outline"
              className="h-11 w-full rounded-xl sm:w-auto"
              onClick={() => onUndo(event)}
            >
              <Undo2 data-icon="inline-start" /> Geri al
            </Button>
          )}
        </li>
      ))}
    </ul>
  )
}

function MethodMark({ method }: { method: "CASH" | "CARD" | null }) {
  if (method === "CASH") {
    return (
      <Badge className="rounded-md border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400">
        <Banknote data-icon="inline-start" />
        Nakit
      </Badge>
    )
  }
  if (method === "CARD") {
    return (
      <Badge className="rounded-md border-transparent bg-sky-500/15 text-sky-600 dark:text-sky-400">
        <CreditCard data-icon="inline-start" />
        Kart
      </Badge>
    )
  }
  return <span className="text-muted-foreground">—</span>
}
