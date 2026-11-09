"use client"

import { SessionField as Field } from "@/presentation/components/dashboard/sessions/session-field"

import * as React from "react"
import { useRouter } from "next/navigation"
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
import { sessionsApi } from "@/composition/services"
import { normalizeTrPhone } from "@/domain/value-objects/phone"
import { showUndoToast } from "@/presentation/lib/undo-toast"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAvailableServices } from "@/presentation/hooks/new-appointment"

export type SessionDraft = {
  customerPhone: string
  customerFirstName: string
  customerLastName: string
  name: string
  serviceId: string
  totalSessions: string
  periodNote: string
  totalPriceTl: string
}

const sessionInputClass =
  "h-12 rounded-xl bg-muted/70 px-3.5 text-base md:text-base focus-visible:ring-indigo/40"

export const EMPTY_SESSION_DRAFT: SessionDraft = {
  customerPhone: "",
  customerFirstName: "",
  customerLastName: "",
  name: "",
  serviceId: "",
  totalSessions: "8",
  periodNote: "",
  totalPriceTl: "0",
}

export function SessionEditor({
  initial,
  onClose,
}: {
  initial: SessionDraft
  onClose: () => void
}) {
  const [form, setForm] = React.useState(initial)
  const router = useRouter()
  const client = useQueryClient()
  const {
    data: services = [],
    error: servicesError,
    isPending: servicesPending,
  } = useAvailableServices()
  const mutation = useMutation({
    mutationFn: async () => {
      const phone = normalizeTrPhone(form.customerPhone)
      if (phone.length !== 10 || !phone.startsWith("5")) {
        throw new Error("Telefon 5 ile başlayan 10 haneli GSM olmalı")
      }
      if (!form.name.trim()) {
        throw new Error("Seans adı gerekli")
      }
      const totalSessions = Number(form.totalSessions)
      const totalPriceTl = Number(form.totalPriceTl)
      if (!Number.isInteger(totalSessions) || totalSessions < 1) {
        throw new Error("Hedef seans sayısı 1 veya daha büyük olmalı")
      }
      if (!Number.isInteger(totalPriceTl) || totalPriceTl < 0) {
        throw new Error("Toplam ücret 0 veya daha büyük olmalı")
      }
      if (!form.customerFirstName.trim() || !form.customerLastName.trim()) {
        throw new Error("Müşteri adı ve soyadı gerekli")
      }
      return sessionsApi.create({
        customerPhone: phone,
        customerFirstName: form.customerFirstName.trim(),
        customerLastName: form.customerLastName.trim(),
        name: form.name.trim(),
        serviceId: form.serviceId || null,
        totalSessions,
        periodNote: form.periodNote.trim() || null,
        totalPriceTl,
      })
    },
    onSuccess: async (result) => {
      await client.invalidateQueries({ queryKey: ["sessions"] })
      showUndoToast("Seans paketi eklendi")
      onClose()
      router.push(`/sessions/${result.id}`)
    },
  })
  const saving = mutation.isPending
  const saveError = mutation.error?.message ?? servicesError?.message
  const save = () => mutation.mutate()
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Yeni seans</SheetTitle>
          <SheetDescription>Paket adı, hedef seans sayısı ve anlaşmayı kaydedin</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4">
          <Field label="Telefon">
            <Input
              className={sessionInputClass}
              value={form.customerPhone}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  customerPhone: event.target.value.replace(/\D/g, "").slice(0, 10),
                }))
              }
              placeholder="5xxxxxxxxx"
              inputMode="numeric"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ad">
              <Input
                className={sessionInputClass}
                value={form.customerFirstName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    customerFirstName: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Soyad">
              <Input
                className={sessionInputClass}
                value={form.customerLastName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    customerLastName: event.target.value,
                  }))
                }
              />
            </Field>
          </div>
          <Field label="Seans adı">
            <Input
              className={sessionInputClass}
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Lazer 8 seans"
            />
          </Field>
          <Field label="Randevu servisi">
            <Select
              value={form.serviceId || "none"}
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  serviceId: value === "none" ? "" : value,
                }))
              }
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
            <p className="text-xs text-muted-foreground">
              Müşteri sıradaki seansı bu servisle alır.
            </p>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Hedef seans">
              <Input
                className={sessionInputClass}
                type="number"
                min={1}
                value={form.totalSessions}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    totalSessions: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Toplam ücret (₺)">
              <Input
                className={sessionInputClass}
                type="number"
                min={0}
                value={form.totalPriceTl}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    totalPriceTl: event.target.value,
                  }))
                }
              />
            </Field>
          </div>
          <Field label="Periyot">
            <Input
              className={sessionInputClass}
              value={form.periodNote}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  periodNote: event.target.value,
                }))
              }
              placeholder="Her 15 gün"
            />
          </Field>
          {saveError ? <p className="text-sm text-destructive">{saveError}</p> : null}
          <div className="grid gap-2 pt-2">
            <Button
              size="lg"
              className="h-12 w-full rounded-xl text-base"
              onClick={save}
              disabled={saving || servicesPending || Boolean(servicesError)}
            >
              {saving ? "Kaydediliyor…" : "Oluştur"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
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
