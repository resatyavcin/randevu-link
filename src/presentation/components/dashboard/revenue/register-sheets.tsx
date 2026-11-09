"use client"

import { useQuery } from "@tanstack/react-query"
import { useAvailableServices, useAvailableStaff } from "@/presentation/hooks/new-appointment"
import { useSessionsPage } from "@/presentation/hooks/catalog-queries"

import * as React from "react"
import { RoleMultiCombobox } from "@/presentation/components/dashboard/role-combobox"
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
import { ApiError, appointmentsApi, registerSalesApi, sessionChargesApi, sessionsApi } from "@/composition/services"
import type {
  PaymentMethodApi,
  ServiceDto,
  SessionChargeDto,
  SessionDto,
  StaffDto,
} from "@/domain/models/contracts"
import { lastCopied } from "@/presentation/lib/copied-text"
import { formatTry } from "@/presentation/lib/appointment-display"
import { formatShortId } from "@/presentation/components/ui/short-id"
import { showUndoToast } from "@/presentation/lib/undo-toast"

function remainingOf(session: SessionDto) {
  return Math.max(0, session.totalPriceTl - session.paidTotalTl)
}

type SessionFeeSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSettled?: () => void
}

export function SessionFeeSheet(props: SessionFeeSheetProps) {
  if (!props.open) return null
  return <SessionFeeSheetForm {...props} />
}

function SessionFeeSheetForm({
  open,
  onOpenChange,
  onSettled,
}: SessionFeeSheetProps) {
  const sessionQuery = useSessionsPage({ status: "ACTIVE", page: 0, size: 200 }, open)
  const sessions = sessionQuery.data?.content.filter(row => remainingOf(row) > 0) ?? []
  const staffQuery = useAvailableStaff(null, open)
  const staff = staffQuery.data ?? []
  const [query, setQuery] = React.useState("")
  const [sessionId, setSessionId] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [method, setMethod] = React.useState<PaymentMethodApi>("CASH")
  const [selectedStaffId, setStaffId] = React.useState("")
  const staffId = selectedStaffId || staff[0]?.id || ""
  const [note, setNote] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [formError, setError] = React.useState<string | null>(null)

  const error = formError || (staffQuery.error ?? sessionQuery.error)?.message



  const selected = sessions.find((session) => session.id === sessionId) ?? null
  const remaining = selected ? remainingOf(selected) : 0
  const needle = query.trim().toLocaleLowerCase("tr")
  const visible = sessions.filter((session) => {
    if (!needle) return true
    const haystack = `${session.customerFirstName} ${session.customerLastName} ${session.name} ${session.customerPhone}`
      .toLocaleLowerCase("tr")
    return haystack.includes(needle)
  })

  function choose(session: SessionDto) {
    setSessionId(session.id)
    setAmount(String(remainingOf(session)))
    setError(null)
  }

  async function collect() {
    if (!selected || !staffId) return
    const parsed = Number(amount)
    if (!Number.isFinite(parsed) || parsed < 1) {
      setError("Seans tutarı 1 veya daha büyük olmalı")
      return
    }
    if (parsed > remaining) {
      setError("Seans tutarı paketin kalanını aşamaz")
      return
    }
    setSaving(true)
    setError(null)
    try {
      await sessionsApi.pay(selected.id, {
        amountTl: Math.round(parsed),
        staffId,
        method,
        note: note.trim() || null,
      })
      onSettled?.()
      onOpenChange(false)
      showUndoToast("Seans ücreti alındı")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Seans ücreti alınamadı")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Seans ücreti al</SheetTitle>
          <SheetDescription>
            Paket ücretini kasadan tahsil et. Tutar seans kredisine yazılır.
          </SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="session-fee-search">Paket</Label>
            <Input
              id="session-fee-search"
              value={query}
              placeholder="Müşteri veya paket ara"
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className="max-h-48 overflow-y-auto rounded-xl border border-border/60">
              {visible.length === 0 ? (
                <p className="px-3 py-4 text-sm text-muted-foreground">
                  Ödenmemiş paket yok.
                </p>
              ) : (
                visible.map((session) => {
                  const active = session.id === sessionId
                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => choose(session)}
                      className={
                        active
                          ? "block w-full border-b border-border/40 bg-muted/60 px-3 py-2.5 text-left last:border-b-0"
                          : "block w-full border-b border-border/40 px-3 py-2.5 text-left last:border-b-0 hover:bg-muted/40"
                      }
                    >
                      <p className="text-sm font-medium">
                        {session.customerFirstName} {session.customerLastName}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {session.name} · kalan {formatTry(remainingOf(session))}
                      </p>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="session-fee-amount">Seans tutarı</Label>
            <Input
              id="session-fee-amount"
              inputMode="numeric"
              value={amount}
              disabled={!selected}
              onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))}
            />
            {selected ? (
              <p className="text-xs text-muted-foreground">
                Kalan paket ücreti {formatTry(remaining)}. Birim seans{" "}
                {formatTry(selected.unitPriceTl)}.
              </p>
            ) : null}
          </div>

          <MethodField method={method} onChange={setMethod} disabled={!selected} />
          <StaffField staff={staff} staffId={staffId} onChange={setStaffId} />
          <NoteField id="session-fee-note" value={note} onChange={setNote} />
          {error ? <ErrorText>{error}</ErrorText> : null}
          <Actions
            saving={saving}
            disabled={saving || !selected || !staffId}
            label={saving ? "Alınıyor…" : "Seans ücreti al"}
            onCancel={() => onOpenChange(false)}
            onConfirm={collect}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

type QueuedSessionFeeSheetProps = {
  charge: SessionChargeDto | null
  onOpenChange: (open: boolean) => void
  onSettled?: () => void
}

export function QueuedSessionFeeSheet(props: QueuedSessionFeeSheetProps) {
  if (!props.charge) return null
  return <QueuedSessionFeeSheetForm key={props.charge.id} {...props} />
}

function QueuedSessionFeeSheetForm({
  charge,
  onOpenChange,
  onSettled,
}: QueuedSessionFeeSheetProps) {
  const sessionQuery = useQuery({
    queryKey: ["sessions", "summary", charge?.sessionId],
    queryFn: ({ signal }) => sessionsApi.get(charge!.sessionId, signal),
    enabled: Boolean(charge),
  })
  const remaining = sessionQuery.data ? remainingOf(sessionQuery.data) : null
  const unitPrice = sessionQuery.data?.unitPriceTl ?? null
  const staffQuery = useAvailableStaff(null, Boolean(charge))
  const staff = staffQuery.data ?? []
  const [amount, setAmount] = React.useState("")
  const [method, setMethod] = React.useState<PaymentMethodApi>("CASH")
  const [selectedStaffId, setStaffId] = React.useState("")
  const staffId = selectedStaffId || staff[0]?.id || ""
  const [note, setNote] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [formError, setError] = React.useState<string | null>(null)

  const error = formError || (staffQuery.error ?? sessionQuery.error)?.message



  async function collect() {
    if (!charge || !staffId) return
    const parsed = Number(amount)
    if (!Number.isFinite(parsed) || parsed < 1) {
      setError("Seans tutarı 1 veya daha büyük olmalı")
      return
    }
    if (remaining != null && parsed > remaining) {
      setError("Seans tutarı paketin kalanını aşamaz")
      return
    }
    setSaving(true)
    setError(null)
    try {
      await sessionChargesApi.collect(charge.id, {
        amountTl: Math.round(parsed),
        method,
        note: note.trim() || null,
        completeVisit: false,
        staffId,
      })
      onSettled?.()
      onOpenChange(false)
      showUndoToast("Seans ücreti alındı")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Seans ücreti alınamadı")
    } finally {
      setSaving(false)
    }
  }

  const customer = charge
    ? `${charge.customerFirstName} ${charge.customerLastName}`.trim()
    : ""

  return (
    <Sheet open={charge != null} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Seans ücreti al</SheetTitle>
          <SheetDescription>
            {customer}
            {charge?.sessionName ? ` · ${charge.sessionName}` : ""}
          </SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="queued-fee-amount">Seans tutarı</Label>
            <Input
              id="queued-fee-amount"
              inputMode="numeric"
              value={amount}
              placeholder="Tutar"
              onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))}
            />
            {remaining != null ? (
              <p className="text-xs text-muted-foreground">
                Kalan paket ücreti {formatTry(remaining)}
                {unitPrice != null ? ` · birim seans ${formatTry(unitPrice)}` : ""}.
              </p>
            ) : null}
          </div>
          <MethodField method={method} onChange={setMethod} />
          <StaffField staff={staff} staffId={staffId} onChange={setStaffId} />
          <NoteField id="queued-fee-note" value={note} onChange={setNote} />
          {error ? <ErrorText>{error}</ErrorText> : null}
          <Actions
            saving={saving}
            disabled={saving || !staffId || !amount}
            label={saving ? "Alınıyor…" : "Seans ücreti al"}
            onCancel={() => onOpenChange(false)}
            onConfirm={collect}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

type WalkInExtraSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSettled?: () => void
}

export function WalkInExtraSheet(props: WalkInExtraSheetProps) {
  if (!props.open) return null
  return <WalkInExtraSheetForm {...props} />
}

function WalkInExtraSheetForm({
  open,
  onOpenChange,
  onSettled,
}: WalkInExtraSheetProps) {
  const servicesQuery = useAvailableServices(open)
  const services = servicesQuery.data ?? []
  const staffQuery = useAvailableStaff(null, open)
  const staff = staffQuery.data ?? []
  const [code, setCode] = React.useState("")
  const [lookingUp, setLookingUp] = React.useState(false)
  const [filledLabel, setFilledLabel] = React.useState<string | null>(null)
  const [firstName, setFirstName] = React.useState("")
  const [lastName, setLastName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [serviceIds, setServiceIds] = React.useState<string[]>([])
  const [method, setMethod] = React.useState<PaymentMethodApi>("CASH")
  const [selectedStaffId, setStaffId] = React.useState("")
  const staffId = selectedStaffId || staff[0]?.id || ""
  const [note, setNote] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [formError, setError] = React.useState<string | null>(null)

  const error = formError || (staffQuery.error ?? servicesQuery.error)?.message



  async function pasteAppointmentCode() {
    let text = ""
    try {
      text = (await navigator.clipboard.readText()).trim()
    } catch {
      text = ""
    }
    if (!text) text = lastCopied()
    if (!text) {
      setError("Önce bir randevu kimliğine tıkla")
      return
    }
    setCode(`#${formatShortId(text)}`)
    setLookingUp(true)
    setError(null)
    setFilledLabel(null)
    try {
      const found = await appointmentsApi.lookup(text)
      setFirstName(found.customerFirstName)
      setLastName(found.customerLastName)
      setPhone(found.customerPhone)
      if (found.staffId && staff.some((member) => member.id === found.staffId)) {
        setStaffId(found.staffId)
      }
      setFilledLabel(
        `${found.customerFirstName} ${found.customerLastName} · ${found.serviceName}`
      )
    } catch (err) {
      setFilledLabel(null)
      setError(err instanceof ApiError ? err.message : "Randevu bulunamadı")
    } finally {
      setLookingUp(false)
    }
  }

  const chosen = serviceIds
    .map((id) => services.find((service) => service.id === id))
    .filter((service): service is ServiceDto => Boolean(service))
  const total = chosen.reduce((sum, service) => sum + service.priceTl, 0)

  async function collect() {
    if (!firstName.trim() || !lastName.trim()) {
      setError("Ad ve soyad gerekli")
      return
    }
    if (phone.length !== 10) {
      setError("Telefon 10 haneli olmalı")
      return
    }
    if (serviceIds.length === 0 || total < 1) {
      setError("Ek hizmet seç")
      return
    }
    if (!staffId) return
    setSaving(true)
    setError(null)
    try {
      await registerSalesApi.create({
        customerFirstName: firstName.trim(),
        customerLastName: lastName.trim(),
        customerPhone: phone,
        staffId,
        serviceIds,
        method,
        note: note.trim() || null,
      })
      onSettled?.()
      onOpenChange(false)
      showUndoToast("Ek hizmet alındı")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ek hizmet alınamadı")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Ek hizmet al</SheetTitle>
          <SheetDescription>
            Müşteriyi elle yaz veya herhangi bir randevunun kimliğini yapıştır. Seansa eklenmez.
          </SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="extra-code">Randevu kimliği</Label>
            <div className="flex gap-2">
              <Input
                id="extra-code"
                value={code}
                placeholder="Yapıştırılınca dolar"
                disabled
              />
              <Button
                type="button"
                variant="outline"
                disabled={lookingUp}
                onClick={() => void pasteAppointmentCode()}
              >
                {lookingUp ? "Aranıyor…" : "Yapıştır"}
              </Button>
            </div>
            {filledLabel ? (
              <p className="text-xs text-muted-foreground">{filledLabel}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Randevu kimliğine tıkla, Yapıştır müşteriyi doldurur. Bekleyen olmak zorunda değil.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="extra-first">Ad</Label>
              <Input
                id="extra-first"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="extra-last">Soyad</Label>
              <Input
                id="extra-last"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="extra-phone">Telefon</Label>
            <Input
              id="extra-phone"
              inputMode="numeric"
              placeholder="5xxxxxxxxx"
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="extra-services">Ek hizmet</Label>
            <RoleMultiCombobox
              id="extra-services"
              value={serviceIds}
              options={services.map((service) => ({
                id: service.id,
                name: `${service.name} · ${formatTry(service.priceTl)}`,
                active: service.active,
              }))}
              onChange={setServiceIds}
              placeholder="Hizmet ekle"
              emptyText="Hizmet bulunamadı"
              showRemove
            />
            <p className="text-xs tabular-nums text-muted-foreground">
              Hizmet tutarı {formatTry(total)}
            </p>
          </div>
          <MethodField method={method} onChange={setMethod} disabled={total < 1} />
          <StaffField staff={staff} staffId={staffId} onChange={setStaffId} />
          <NoteField id="extra-note" value={note} onChange={setNote} />
          {error ? <ErrorText>{error}</ErrorText> : null}
          <Actions
            saving={saving}
            disabled={saving || !staffId || total < 1}
            label={saving ? "Alınıyor…" : "Ek hizmet al"}
            onCancel={() => onOpenChange(false)}
            onConfirm={collect}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

function MethodField({
  method,
  onChange,
  disabled,
}: {
  method: PaymentMethodApi
  onChange: (method: PaymentMethodApi) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>Ödeme yöntemi</Label>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={method === "CASH" ? "default" : "outline"}
          disabled={disabled}
          onClick={() => onChange("CASH")}
        >
          Nakit
        </Button>
        <Button
          type="button"
          variant={method === "CARD" ? "default" : "outline"}
          disabled={disabled}
          onClick={() => onChange("CARD")}
        >
          Kart
        </Button>
      </div>
    </div>
  )
}

function StaffField({
  staff,
  staffId,
  onChange,
}: {
  staff: StaffDto[]
  staffId: string
  onChange: (id: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>Personel</Label>
      <Select value={staffId} onValueChange={onChange}>
        <SelectTrigger className="w-full">
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
    </div>
  )
}

function NoteField({
  id,
  value,
  onChange,
}: {
  id: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>Not</Label>
      <Textarea
        id={id}
        value={value}
        maxLength={240}
        rows={3}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {children}
    </p>
  )
}

function Actions({
  saving,
  disabled,
  label,
  onCancel,
  onConfirm,
}: {
  saving: boolean
  disabled: boolean
  label: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="mt-auto flex gap-2 pt-2">
      <Button variant="outline" className="flex-1" onClick={onCancel} disabled={saving}>
        Vazgeç
      </Button>
      <Button className="flex-1" onClick={onConfirm} disabled={disabled}>
        {label}
      </Button>
    </div>
  )
}
