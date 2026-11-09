"use client"

import { formatTrPhoneDisplay } from "@/presentation/lib/phone-display";
import { useQueryClient, useMutation } from "@tanstack/react-query"

import { useBookingAvailability } from "@/presentation/components/booking/use-booking-availability"

import * as React from "react"
import { Check, ChevronRight, Smartphone } from "lucide-react"
import { Button } from "@/presentation/components/ui/button"
import { BookingStepDrawer } from "@/presentation/components/booking/booking-step-drawer"
import { DayStep, StaffStep, TimeStep } from "@/presentation/components/booking/booking-steps"
import { sessionBookingsApi } from "@/composition/services"
import type { SessionBookingOptionDto, SessionBookingResultDto } from "@/domain/models/contracts"
import { normalizeTrPhone } from "@/domain/value-objects/phone"
import { fireBookingConfetti } from "@/presentation/lib/confetti"
import { cn } from "@/presentation/lib/utils"

type NextStep = "phone" | "package" | "staff" | "day" | "time"

const STEP_META: Record<
  NextStep,
  { title: string; description: string; index: number }
> = {
  phone: {
    title: "Sıradaki seansını al",
    description: "Paketine kayıtlı telefon numarasıyla devam et.",
    index: 1,
  },
  package: {
    title: "Seans paketin",
    description: "Sıradaki seansı alacağın paketi seç.",
    index: 2,
  },
  staff: {
    title: "Personel",
    description: "İstersen herhangi birini seçebilirsin.",
    index: 3,
  },
  day: {
    title: "Gün seç",
    description: "Müsait bir gün seç.",
    index: 4,
  },
  time: {
    title: "Saat seç",
    description: "Uygun bir saat seç.",
    index: 5,
  },
}

const fieldClass =
  "h-12 min-w-0 flex-1 bg-transparent px-3.5 text-base outline-none placeholder:text-muted-foreground/70"

const optionPress =
  "touch-manipulation select-none outline-none transition-[transform,opacity,background-color,border-color] duration-150 ease-out active:scale-[0.97] active:opacity-80 focus-visible:ring-2 focus-visible:ring-indigo/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"

function formatSlot(slot: string): string {
  return slot.slice(0, 5)
}

export function NextSessionBookingFlow({
  open,
  onOpenChange,
  nested = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  nested?: boolean
}) {
  const [step, setStep] = React.useState<NextStep>("phone")
  const [phone, setPhone] = React.useState("")
  const client = useQueryClient()
  const lookup = useMutation({ mutationFn: (phone: string) => sessionBookingsApi.listByPhone(phone) })
  const loading = lookup.isPending
  const booking = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof sessionBookingsApi.book>[1] }) =>
      sessionBookingsApi.book(id, body),
    onSuccess: () => Promise.all(["sessions", "appointments", "availability"].map(key =>
      client.invalidateQueries({ queryKey: [key] }))),
  })
  const submitting = booking.isPending
  const [error, setError] = React.useState<string | null>(null)
  const [packages, setPackages] = React.useState<SessionBookingOptionDto[]>([])
  const [packageId, setPackageId] = React.useState<string | null>(null)
  const [staffId, setStaffId] = React.useState<string | null>(null)
  const [dayIdx, setDayIdx] = React.useState<number | null>(null)
  const [slot, setSlot] = React.useState<string | null>(null)
  const [confirmed, setConfirmed] = React.useState<SessionBookingResultDto | null>(
    null
  )

  const contentRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    contentRef.current?.closest("[data-booking-step-scroll]")?.scrollTo({ top: 0 })
  }, [step, confirmed])

  const phone10 = normalizeTrPhone(phone)
  const phoneReady = phone10.length === 10 && phone10.startsWith("5")
  const selected =
    packages.find((pack) => pack.id === packageId) ?? null
  const { staff, days, times, timesLoading, error: availabilityError } =
    useBookingAvailability(selected?.serviceId ?? null, staffId, dayIdx, open && Boolean(selected))
  const meta = STEP_META[step]
  const selectedDay = dayIdx !== null ? (days[dayIdx] ?? null) : null
  const staffName =
    staffId === "any"
      ? "Herhangi biri"
      : (staff.find((member) => member.id === staffId)?.name ?? null)

  function reset() {
    setStep("phone")
    setPhone("")
    lookup.reset()
    setError(null)
    setPackages([])
    setPackageId(null)
    setStaffId(null)
    setDayIdx(null)
    setSlot(null)
    booking.reset()
    setConfirmed(null)
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset()
    onOpenChange(next)
  }



  async function submitPhone() {
    if (!phoneReady || loading) return
    setError(null)
    lookup.mutate(phone10, { onSuccess: list => {
      setPackages(list)
      setPackageId(list.length === 1 ? list[0].id : null)
      setStaffId(null)
      setDayIdx(null)
      setSlot(null)
      setStep("package")
    }, onError: error => setError(error.message) })
  }

  function pickPackage(id: string) {
    setPackageId(id)
    setStaffId(null)
    setDayIdx(null)
    setSlot(null)
    setError(null)
    setStep("staff")
  }

  function pickStaff(id: string) {
    setStaffId(id)
    setDayIdx(null)
    setSlot(null)
    setError(null)
    setStep("day")
  }

  function pickDay(idx: number) {
    setDayIdx(idx)
    setSlot(null)
    setError(null)
    setStep("time")
  }

  async function confirmBooking() {
    if (!selected || !selectedDay || !slot || submitting) return
    setError(null)
    booking.mutate({ id: selected.id, body: {
      phone: phone10, staffId: staffId && staffId !== "any" ? staffId : null,
      date: selectedDay.iso, slot: slot.length === 5 ? `${slot}:00` : slot,
    } }, {
      onSuccess: result => {
        setConfirmed(result)
        requestAnimationFrame(() => requestAnimationFrame(() => fireBookingConfetti()))
      },
      onError: error => setError(error.message),
    })
  }

  function goBack() {
    setError(null)
    if (step === "package") setStep("phone")
    else if (step === "staff") setStep("package")
    else if (step === "day") setStep("staff")
    else if (step === "time") setStep("day")
  }

  const timeDescription = selectedDay
    ? `${selectedDay.dayNum} ${selectedDay.weekdayLong}`
    : meta.description

  const confirmedStaff =
    confirmed?.appointment.staffName ?? staffName ?? "Herhangi biri"
  const confirmedSlot = confirmed
    ? formatSlot(confirmed.appointment.slot)
    : null

  return (
    <>
      <BookingStepDrawer
        open={open}
        onOpenChange={handleOpenChange}
        nested={nested}
        title={confirmed ? "Sıradaki seansın alındı" : meta.title}
        description={
          confirmed
            ? `${confirmed.sessionName} paketinin ${confirmed.sessionIndex}. seansı kaydedildi.`
            : step === "package"
              ? `+90 ${formatTrPhoneDisplay(phone10)} — sıradaki seans`
              : step === "time"
                ? timeDescription
                : meta.description
        }
        stepIndex={confirmed ? undefined : meta.index}
        stepCount={confirmed ? undefined : 5}
      >
        <div ref={contentRef} className="min-w-0 [overflow-wrap:anywhere]">
          {confirmed ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <span
                  className="flex size-14 items-center justify-center rounded-full bg-indigo-muted text-indigo ring-1 ring-indigo/25"
                  aria-hidden
                >
                  <Check className="size-6" strokeWidth={2.75} />
                </span>
              </div>
              <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl bg-card ring-1 ring-border/60 text-sm">
                <li className="grid gap-1 px-3.5 py-3 sm:grid-cols-[6rem_1fr] sm:gap-3">
                  <span className="text-muted-foreground">Servis</span>
                  <span className="font-medium">
                    {confirmed.serviceName} · {confirmed.durationMin} dk
                  </span>
                </li>
                <li className="grid gap-1 px-3.5 py-3 sm:grid-cols-[6rem_1fr] sm:gap-3">
                  <span className="text-muted-foreground">Personel</span>
                  <span className="font-medium">{confirmedStaff}</span>
                </li>
                {selectedDay ? (
                  <li className="grid gap-1 px-3.5 py-3 sm:grid-cols-[6rem_1fr] sm:gap-3">
                    <span className="text-muted-foreground">Gün</span>
                    <span className="font-medium">
                      {selectedDay.dayNum} {selectedDay.weekdayLong}
                    </span>
                  </li>
                ) : null}
                {confirmedSlot ? (
                  <li className="grid gap-1 px-3.5 py-3 sm:grid-cols-[6rem_1fr] sm:gap-3">
                    <span className="text-muted-foreground">Saat</span>
                    <span className="font-medium">{confirmedSlot}</span>
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}

          {!confirmed && step === "phone" ? (
            <form
              className="grid gap-3"
              onSubmit={(event) => {
                event.preventDefault()
                void submitPhone()
              }}
            >
              <label className="grid gap-2 rounded-2xl border border-border/60 bg-card p-4">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Smartphone aria-hidden className="size-4 text-indigo" />
                  Cep telefonu
                </span>
                <span className="flex items-center rounded-xl bg-muted/70 ring-1 ring-border/70 focus-within:ring-2 focus-within:ring-indigo/40">
                  <span className="flex h-12 shrink-0 items-center whitespace-nowrap border-r border-border px-3 text-sm font-semibold">+90</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="5XX XXX XX XX"
                    inputMode="tel"
                    enterKeyHint="go"
                    autoComplete="tel-national"
                    className={fieldClass}
                  />
                </span>
              </label>
              {(error || availabilityError) ? (
                <p className="rounded-2xl bg-destructive/10 px-3.5 py-3 text-center text-sm text-destructive">
                  {error || availabilityError}
                </p>
              ) : null}
              <Button
                type="submit"
                className="h-12 w-full rounded-xl text-base"
                size="lg"
                disabled={!phoneReady || loading}
              >
                {loading ? "Aranıyor…" : "Paketleri getir"}
              </Button>
            </form>
          ) : null}

          {!confirmed && step === "package" ? (
            <div className="flex flex-col gap-3">
              {packages.length === 0 ? (
                <p className="rounded-2xl bg-muted/40 px-3.5 py-8 text-center text-sm text-muted-foreground">
                  Bu numarada sıradaki seansı alınabilecek aktif paket yok.
                </p>
              ) : (
                packages.map((pack) => {
                  const selectedRow = pack.id === packageId
                  const blocked = !pack.serviceId
                  return (
                    <button
                      key={pack.id}
                      type="button"
                      disabled={blocked}
                      onClick={() => pickPackage(pack.id)}
                      className={cn(
                        "grid w-full min-w-0 gap-2 rounded-2xl border p-4 text-left",
                        optionPress,
                        blocked && "cursor-not-allowed opacity-70",
                        selectedRow
                          ? "border-indigo bg-indigo-muted"
                          : "border-border/60 bg-card hover:bg-muted/50",
                        blocked && "hover:bg-card"
                      )}
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span className="min-w-0 font-display text-base font-semibold">{pack.name}</span>
                        {!blocked && <ChevronRight aria-hidden className="mt-0.5 size-5 shrink-0 text-indigo" />}
                      </span>
                      <span className="text-sm font-medium text-indigo">Sıradaki {pack.nextIndex}. seans</span>
                      <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                        <span>{pack.completedCount}/{pack.totalSessions} tamamlandı</span>
                        {pack.scheduledCount > 0 && <span>{pack.scheduledCount} randevu bekliyor</span>}
                      </span>
                      <span className="border-t border-border/60 pt-2 text-sm text-muted-foreground">
                        {blocked
                          ? "Bu paket bir servise bağlı değil. Salondan bağlanmasını iste."
                          : `${pack.serviceName} · ${pack.durationMin} dk${
                              pack.periodNote ? ` · ${pack.periodNote}` : ""
                            }`}
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          ) : null}

          {!confirmed && step === "staff" ? (
            staff.length === 0 ? (
              <p className="rounded-2xl bg-muted/40 px-3.5 py-8 text-center text-sm text-muted-foreground">
                Bu servis için personel yok.
              </p>
            ) : (
              <StaffStep
                staff={staff}
                selectedId={staffId}
                onSelect={pickStaff}
              />
            )
          ) : null}

          {!confirmed && step === "day" ? (
            <DayStep
              days={days}
              staff={staff}
              staffId={staffId}
              selectedIdx={dayIdx}
              onSelect={pickDay}
            />
          ) : null}

          {!confirmed && step === "time" ? (
            <div className="flex flex-col gap-3">
              <TimeStep
                times={times}
                selected={slot}
                loading={timesLoading}
                onSelect={setSlot}
              />
              {(error || availabilityError) ? (
                <p className="rounded-2xl bg-destructive/10 px-3.5 py-3 text-center text-sm text-destructive">
                  {error || availabilityError}
                </p>
              ) : null}
              {selected && selectedDay && slot ? (
                <p className="rounded-2xl bg-muted/40 px-3.5 py-3 text-sm text-muted-foreground">
                  {selected.name} · {selected.nextIndex}/{selected.totalSessions}{" "}
                  · {selectedDay.dayNum} {selectedDay.weekdayLong} {slot}
                </p>
              ) : null}
              <Button
                type="button"
                className="h-12 w-full rounded-xl text-base"
                size="lg"
                disabled={!slot || submitting}
                onClick={confirmBooking}
              >
                {submitting ? "Alınıyor…" : "Sıradaki seansı al"}
              </Button>
            </div>
          ) : null}

          {!confirmed && step !== "phone" ? (
            <Button
              type="button"
              variant="ghost"
              className="mt-3 h-11 w-full rounded-xl"
              onClick={goBack}
            >
              Geri
            </Button>
          ) : null}

          <Button
            type="button"
            variant="outline"
            className="mt-2 h-11 w-full rounded-xl text-base"
            size="lg"
            onClick={() => handleOpenChange(false)}
          >
            {confirmed ? "Tamam" : "Kapat"}
          </Button>
        </div>
      </BookingStepDrawer>
    </>
  )
}
