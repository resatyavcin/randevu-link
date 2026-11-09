"use client"

import * as React from "react"
import { Button } from "@/presentation/components/ui/button"
import { Input } from "@/presentation/components/ui/input"
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
import { useSessionActions } from "@/presentation/hooks/session-detail"
import { showUndoToast } from "@/presentation/lib/undo-toast"
import { SessionField as Field } from "@/presentation/components/dashboard/sessions/session-field"
import type { SessionDto, ServiceDto } from "@/domain/models/contracts"

export function EditPackageSheet({
  session,
  services,
  mutation,
  onClose,
}: {
  session: SessionDto
  services: ServiceDto[]
  mutation: ReturnType<typeof useSessionActions>["edit"]
  onClose: () => void
}) {
  const [editName, setEditName] = React.useState(session.name)
  const [editServiceId, setEditServiceId] = React.useState(session.serviceId ?? "")
  const [editTotal, setEditTotal] = React.useState(String(session.totalSessions))
  const [editPeriod, setEditPeriod] = React.useState(session.periodNote ?? "")
  const [editPrice, setEditPrice] = React.useState(String(session.totalPriceTl))
  const savingEdit = mutation.isPending
  const [validationError, setEditError] = React.useState<string | null>(null)
  const editError = validationError || mutation.error?.message
  async function saveEdit() {
    if (!session) return
    const totalSessions = Number(editTotal)
    const totalPriceTl = Number(editPrice)
    if (!editName.trim()) {
      setEditError("Seans adı gerekli")
      return
    }
    if (!Number.isInteger(totalSessions) || totalSessions < 1) {
      setEditError("Hedef seans sayısı 1 veya daha büyük olmalı")
      return
    }
    if (!Number.isInteger(totalPriceTl) || totalPriceTl < 0) {
      setEditError("Toplam ücret 0 veya daha büyük olmalı")
      return
    }
    setEditError(null)
    mutation.mutate(
      {
        name: editName.trim(),
        serviceId: editServiceId || null,
        totalSessions,
        periodNote: editPeriod.trim() || null,
        totalPriceTl,
      },
      {
        onSuccess: () => {
          onClose()
          showUndoToast("Paket güncellendi")
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
          <SheetTitle>Paketi düzenle</SheetTitle>
          <SheetDescription>Periyot ve ücret anlaşmasını güncelleyin</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4">
          <Field label="Seans adı">
            <Input
              className="h-12 rounded-xl bg-muted/70 px-3.5 text-base md:text-base"
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
            />
          </Field>
          <Field label="Randevu servisi">
            <Select
              value={editServiceId || "none"}
              onValueChange={(value) => setEditServiceId(value === "none" ? "" : value)}
            >
              <SelectTrigger className="w-full min-w-0 rounded-xl bg-muted/70 px-3.5 text-base data-[size=default]:h-12">
                <SelectValue placeholder="Servis" />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                <SelectItem value="none">Son randevunun servisi</SelectItem>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Hedef seans">
              <Input
                className="h-12 rounded-xl bg-muted/70 px-3.5 text-base md:text-base"
                type="number"
                min={1}
                value={editTotal}
                onChange={(event) => setEditTotal(event.target.value)}
              />
            </Field>
            <Field label="Toplam ücret (₺)">
              <Input
                className="h-12 rounded-xl bg-muted/70 px-3.5 text-base md:text-base"
                type="number"
                min={0}
                value={editPrice}
                onChange={(event) => setEditPrice(event.target.value)}
              />
            </Field>
          </div>
          <Field label="Periyot">
            <Input
              className="h-12 rounded-xl bg-muted/70 px-3.5 text-base md:text-base"
              value={editPeriod}
              onChange={(event) => setEditPeriod(event.target.value)}
              placeholder="Her 15 gün"
            />
          </Field>
          {editError ? <p className="text-sm text-destructive">{editError}</p> : null}
          <div className="grid gap-2 pt-2">
            <Button
              className="h-12 w-full rounded-xl text-base"
              onClick={saveEdit}
              disabled={savingEdit}
            >
              {savingEdit ? "Kaydediliyor…" : "Kaydet"}
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
