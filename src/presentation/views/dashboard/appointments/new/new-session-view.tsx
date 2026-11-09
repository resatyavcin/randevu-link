"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { tr } from "react-day-picker/locale"
import { CalendarPlus } from "lucide-react"
import { Button } from "@/presentation/components/ui/button"
import { Calendar } from "@/presentation/components/ui/calendar"
import { Label } from "@/presentation/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/presentation/components/dashboard/panel-select"
import { Textarea } from "@/presentation/components/ui/textarea"
import { useCustomerOptions } from "@/presentation/hooks/appointments"
import { useAvailableServices, useAvailableStaff, useAvailableSlots, useCreateAppointment } from "@/presentation/hooks/new-appointment"

function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

export function NewSessionView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const presetCustomerId = searchParams.get("customerId")
  const customersQuery = useCustomerOptions()
  const servicesQuery = useAvailableServices()
  const customers = customersQuery.data ?? []
  const services = servicesQuery.data ?? []
  const [chosenCustomer, setCustomerId] = React.useState(presetCustomerId)
  const customer = customers.find(item => item.id === chosenCustomer) ?? customers[0]
  const customerId = customer?.id ?? ""
  const customerLabel = customer?.name ?? "Müşteri seçin"
  const [chosenService, setService] = React.useState("")
  const service = services.find(item => item.id === chosenService)?.id ?? services[0]?.id ?? ""
  const staffQuery = useAvailableStaff(service)
  const staffList = staffQuery.data ?? []
  const [chosenStaff, setStaffId] = React.useState("")
  const staff = staffList.find(item => item.id === chosenStaff) ?? staffList[0]
  const staffId = staff?.id ?? ""
  const staffLabel = staff ? `${staff.name} · ${staff.role}` : "Personel seçin"
  const [date, setDate] = React.useState<Date>(startOfToday)
  const isoDate = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-")
  const slots = useAvailableSlots(service, staffId, isoDate)
  const availableSlots = slots.data ?? []
  const [chosenTime, setTime] = React.useState("")
  const time = availableSlots.includes(chosenTime) ? chosenTime : availableSlots[0] ?? ""
  const [note, setNote] = React.useState("")
  const create = useCreateAppointment()
  const error = create.error ?? slots.error ?? staffQuery.error ?? servicesQuery.error ?? customersQuery.error

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!customer || !time || create.isPending) return
    create.mutate({
      phone: customer.id, firstName: customer.firstName, lastName: customer.lastName,
      serviceId: service, staffId, date: isoDate, slot: time, note: note.trim() || null,
    }, { onSuccess: () => router.push("/appointments") })
  }

  return (
    <div className="px-5 py-6 md:px-8 md:py-8">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Yeni seans
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Müşteri, hizmet ve zamanı seçerek seans oluşturun
          </p>
        </div>
      </header>

      <form onSubmit={submit} className="max-w-3xl">
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid gap-5 p-5 md:grid-cols-2">
            <Field label="Müşteri">
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={customerLabel} />
                </SelectTrigger>
                <SelectContent position="popper" align="start">
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Hizmet">
              <Select value={service} onValueChange={setService}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Hizmet seçin" />
                </SelectTrigger>
                <SelectContent position="popper" align="start">
                  {services.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Personel" className="md:col-span-2">
              <Select value={staffId} onValueChange={setStaffId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={staffLabel} />
                </SelectTrigger>
                <SelectContent position="popper" align="start">
                  {staffList.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name} · {staff.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="space-y-2">
              <Label>Tarih</Label>
              <div className="w-fit rounded-xl border border-border bg-background p-1">
                <Calendar
                  mode="single"
                  locale={tr}
                  weekStartsOn={1}
                  selected={date}
                  onSelect={(next) => {
                    if (next) setDate(next)
                  }}
                  disabled={{ before: startOfToday() }}
                />
              </div>
            </div>

            <Field label="Saat">
              <Select
                value={time}
                onValueChange={setTime}
                disabled={availableSlots.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={time || "Saat seçin"} />
                </SelectTrigger>
                <SelectContent position="popper" align="start">
                  {availableSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Not" className="md:col-span-2">
              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="İsteğe bağlı"
                rows={3}
              />
            </Field>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/appointments">Vazgeç</Link>
            </Button>
            {error && <p role="alert" className="text-sm text-destructive">{error.message}</p>}
            <Button type="submit" disabled={!customer || !time || create.isPending}>
              <CalendarPlus data-icon="inline-start" />
              {create.isPending ? "Kaydediliyor…" : "Oluştur"}
            </Button>
          </div>
        </section>
      </form>
    </div>
  )
}

function Field({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      <Label className="mb-2">{label}</Label>
      {children}
    </div>
  )
}
