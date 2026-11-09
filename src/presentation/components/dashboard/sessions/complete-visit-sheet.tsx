"use client"

import * as React from "react"
import { Button } from "@/presentation/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/presentation/components/dashboard/panel-select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/presentation/components/dashboard/panel-sheet"
import { formatTry } from "@/presentation/lib/appointment-display"
import { useSessionActions } from "@/presentation/hooks/session-detail"
import { showUndoToast } from "@/presentation/lib/undo-toast"
import { StaffNamePair } from "@/presentation/components/dashboard/staff-name-pair"
import { SessionField as Field } from "@/presentation/components/dashboard/sessions/session-field"
import type { SessionDto, SessionVisitDto, StaffDto } from "@/domain/models/contracts"

export function CompleteVisitSheet({
  session,
  pendingVisits,
  staff,
  mutation,
  onClose,
}: {
  session: SessionDto
  pendingVisits: SessionVisitDto[]
  staff: StaffDto[]
  mutation: ReturnType<typeof useSessionActions>["complete"]
  onClose: () => void
}) {
  const [completeVisitId, setCompleteVisitId] = React.useState(pendingVisits[0]?.id ?? "")
  const [completeStaffId, setCompleteStaffId] = React.useState(
    pendingVisits[0]?.staffId || staff[0]?.id || "",
  )
  const completing = mutation.isPending
  const completeError = mutation.error?.message
  const nextBalanceTl = session.creditBalanceTl - session.unitPriceTl
  const willGoNegative = nextBalanceTl < 0
  const selectedVisit = pendingVisits.find((visit) => visit.id === completeVisitId)
  function completeFromCredit() {
    if (!completeStaffId) return
    mutation.mutate(
      { appointmentId: completeVisitId || null, staffId: completeStaffId },
      {
        onSuccess: () => {
          onClose()
          showUndoToast("Seans krediden tamamlandı")
        },
      },
    )
  }

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Seans tamamlandı</SheetTitle>
          <SheetDescription>
            Randevu varsa işaretle. Personeli o an bakan kişiyle değiştir.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {pendingVisits.map((visit) => {
              const selected = completeVisitId === visit.id
              return (
                <button
                  key={visit.id}
                  type="button"
                  onClick={() => {
                    setCompleteVisitId(visit.id)
                    if (visit.staffId) setCompleteStaffId(visit.staffId)
                  }}
                  className={
                    selected
                      ? "rounded-xl border border-indigo/40 bg-indigo-muted px-3 py-3 text-left"
                      : "rounded-xl border border-border/60 px-3 py-3 text-left hover:bg-muted/40"
                  }
                >
                  <p className="text-sm font-medium">{formatVisitLabel(visit.date, visit.slot)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {visit.serviceName}
                    {visit.staffName || (selected && completeStaffId) ? (
                      <>
                        {" · "}
                        {selected &&
                        completeStaffId &&
                        visit.staffId &&
                        completeStaffId !== visit.staffId ? (
                          <StaffNamePair
                            booked={visit.staffName}
                            served={staff.find((member) => member.id === completeStaffId)?.name}
                          />
                        ) : (
                          visit.staffName
                        )}
                      </>
                    ) : null}
                  </p>
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => setCompleteVisitId("")}
              className={
                completeVisitId === ""
                  ? "rounded-xl border border-indigo/40 bg-indigo-muted px-3 py-3 text-left"
                  : "rounded-xl border border-border/60 px-3 py-3 text-left hover:bg-muted/40"
              }
            >
              <p className="text-sm font-medium">Randevusuz geldi</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {willGoNegative
                  ? "Ödeme alınmadan tamamla, bakiye eksiye düşer"
                  : "Krediden düş, randevu açma"}
              </p>
            </button>
          </div>
          <Field label="Personel">
            <Select value={completeStaffId} onValueChange={setCompleteStaffId}>
              <SelectTrigger className="w-full min-w-0 rounded-xl bg-muted/70 px-3.5 text-base data-[size=default]:h-12">
                <SelectValue placeholder="Personel seçin" />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                {staff.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name} · {member.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedVisit?.staffName &&
            completeStaffId &&
            completeStaffId !== selectedVisit.staffId ? (
              <p className="text-xs text-muted-foreground">
                Randevu: <span className="line-through">{selectedVisit.staffName}</span>
              </p>
            ) : null}
          </Field>
          {willGoNegative ? (
            <p className="rounded-xl bg-muted px-3 py-2.5 text-sm text-foreground">
              Ödeme alınmadan tamamlanırsa bakiye {formatTry(nextBalanceTl)} olur.
            </p>
          ) : null}
          {completeError ? <p className="text-sm text-destructive">{completeError}</p> : null}
          <div className="grid gap-2 pt-2">
            <Button
              className="h-12 w-full rounded-xl text-base"
              onClick={() => void completeFromCredit()}
              disabled={completing || !completeStaffId}
            >
              {completing ? "Tamamlanıyor…" : "Seans tamamlandı"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-xl text-base"
              onClick={onClose}
            >
              Vazgeç
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
function formatVisitLabel(isoDate: string, slot: string) {
  const [year, month, day] = isoDate.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  return `${date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    weekday: "short",
  })} · ${slot.slice(0, 5)}`
}
