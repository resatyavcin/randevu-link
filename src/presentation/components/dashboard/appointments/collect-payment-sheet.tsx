"use client"

import { useAvailableStaff } from "@/presentation/hooks/new-appointment"

import * as React from "react"
import { Button } from "@/presentation/components/ui/button"
import { Input } from "@/presentation/components/ui/input"
import { Label } from "@/presentation/components/ui/label"
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
import { Textarea } from "@/presentation/components/ui/textarea"
import { ApiError, appointmentsApi } from "@/composition/services"
import type { PaymentMethodApi } from "@/domain/models/contracts"
import { useQueryClient } from "@tanstack/react-query"
import type { Appointment } from "@/presentation/lib/appointment-display"
import { showUndoToast } from "@/presentation/lib/undo-toast"

export function CollectPaymentSheet(props: PaymentSheetProps) {
  if (!props.appointment) return null
  return <PaymentForm key={props.appointment.id} {...props} appointment={props.appointment} />
}

type PaymentSheetProps = {
  appointment: Appointment | null
  onOpenChange: (open: boolean) => void
  onSettled?: () => void
}

function PaymentForm({ appointment, onOpenChange, onSettled }: PaymentSheetProps & { appointment: Appointment }) {
  const client = useQueryClient()
  const open = appointment != null
  const [amount, setAmount] = React.useState(String(appointment.quotedTotal ?? appointment.total))
  const [method, setMethod] = React.useState<PaymentMethodApi>("CASH")
  const staffQuery = useAvailableStaff(null, open)
  const staff = staffQuery.data ?? []
  const [selectedStaffId, setStaffId] = React.useState(appointment.staffId === "any" ? "" : appointment.staffId)
  const staffId = selectedStaffId || staff[0]?.id || ""
  const [note, setNote] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [cancelling, setCancelling] = React.useState(false)
  const [formError, setError] = React.useState<string | null>(null)

  const error = formError || staffQuery.error?.message

  async function collect() {
    if (!appointment) return
    const parsed = Number(amount)
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("Tahsil tutarı 0 veya daha büyük olmalı")
      return
    }
    if (!staffId) {
      setError("Personel seç")
      return
    }
    setSaving(true)
    setError(null)
    try {
      await appointmentsApi.collect(appointment.id, {
        amountTl: Math.round(parsed),
        method,
        note: note.trim() || null,
        staffId,
      })
      await client.invalidateQueries({ queryKey: ["appointments"] })
      onSettled?.()
      onOpenChange(false)
      showUndoToast("Tahsil edildi")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Tahsil edilemedi")
    } finally {
      setSaving(false)
    }
  }

  async function cancelAppointment() {
    if (!appointment) return
    if (!confirm(`"${appointment.customer}" randevusunu iptal etmek istiyor musun?`)) {
      return
    }
    setCancelling(true)
    setError(null)
    try {
      await appointmentsApi.cancel(appointment.id)
      await client.invalidateQueries({ queryKey: ["appointments"] })
      onSettled?.()
      onOpenChange(false)
      showUndoToast("Randevu iptal edildi")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "İptal edilemedi")
    } finally {
      setCancelling(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Tahsil et</SheetTitle>
          <SheetDescription>
            {appointment
              ? `${appointment.customer} · ${appointment.service}`
              : "Randevu tutarını nakit veya kart olarak yaz."}
          </SheetDescription>
        </SheetHeader>

        {appointment ? (
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pay-amount">Tahsil tutarı</Label>
              <Input
                id="pay-amount"
                inputMode="numeric"
                value={amount}
                onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Ödeme yöntemi</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={method === "CASH" ? "default" : "outline"}
                  onClick={() => setMethod("CASH")}
                >
                  Nakit
                </Button>
                <Button
                  type="button"
                  variant={method === "CARD" ? "default" : "outline"}
                  onClick={() => setMethod("CARD")}
                >
                  Kart
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Personel</Label>
              <Select value={staffId} onValueChange={setStaffId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Personel seçin" />
                </SelectTrigger>
                <SelectContent position="popper" align="start">
                  {appointment.staffId !== "any" &&
                  appointment.staffName &&
                  !staff.some((member) => member.id === appointment.staffId) ? (
                    <SelectItem value={appointment.staffId}>
                      {appointment.staffName}
                    </SelectItem>
                  ) : null}
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} · {member.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {appointment.staffName &&
              staffId &&
              staffId !== appointment.staffId ? (
                <p className="text-xs text-muted-foreground">
                  Randevu: <span className="line-through">{appointment.staffName}</span>
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pay-note">Not</Label>
              <Textarea
                id="pay-note"
                value={note}
                maxLength={240}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>

            {error ? (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <div className="mt-auto flex flex-col gap-2 pt-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => onOpenChange(false)}
                >
                  Vazgeç
                </Button>
                <Button
                  className="flex-1"
                  onClick={collect}
                  disabled={saving || cancelling || !staffId}
                >
                  {saving ? "Alınıyor…" : "Tahsil et"}
                </Button>
              </div>
              <Button
                variant="destructive"
                onClick={cancelAppointment}
                disabled={saving || cancelling}
              >
                {cancelling ? "İptal ediliyor…" : "Randevuyu iptal et"}
              </Button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
