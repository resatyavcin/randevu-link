"use client"

import { useHydrated } from "@/presentation/lib/use-hydrated"

import { useBookingAvailability } from "@/presentation/components/booking/use-booking-availability"
import { useAvailableServices, useCreateAppointment } from "@/presentation/hooks/new-appointment"

import * as React from "react"
import { Check, ChevronRight, HelpCircle } from "lucide-react"
import { Button } from "@/presentation/components/ui/button"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/presentation/components/ui/alert-dialog"
import { BookingThemeScope } from "@/presentation/components/booking/booking-appearance"
import { BookingStepDrawer } from "@/presentation/components/booking/booking-step-drawer"
import { CancelBookingFlow } from "@/presentation/components/booking/cancel-booking-flow"
import { GoogleReviews } from "@/presentation/components/booking/google-reviews"
import { NextSessionBookingFlow } from "@/presentation/components/booking/next-session-booking-flow"
import { DayStep, DetailsStep, ServiceStep, StaffStep, TimeStep } from "@/presentation/components/booking/booking-steps"
import { fireBookingConfetti } from "@/presentation/lib/confetti"
import { normalizeTrPhone } from "@/domain/value-objects/phone"
import { ApiError, appointmentsApi } from "@/composition/services"
import type { ServiceDto } from "@/domain/models/contracts"

function formatServicePrice(s: ServiceDto) {
  const fmt = (n: number) => `₺${n.toLocaleString("tr-TR")}`
  return s.priceMaxTl && s.priceMaxTl !== s.priceTl
    ? `${fmt(s.priceTl)}–${fmt(s.priceMaxTl)}`
    : fmt(s.priceTl)
}

export type BookingStep = "service" | "staff" | "day" | "time" | "details"

type ConfirmedSummary = {
  appointmentId: string
  name: string
  service: string
  staff: string
  day: string
  slot: string
}

type RecentBooking = ConfirmedSummary & {
  expiresAt: number
}

const RECENT_BOOKING_KEY = "randevu-link:recent-booking"
const RECENT_TTL_MS = 10 * 60 * 1000

function readRecentBooking(): RecentBooking | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(RECENT_BOOKING_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as RecentBooking
    if (!parsed?.expiresAt || parsed.expiresAt <= Date.now()) {
      sessionStorage.removeItem(RECENT_BOOKING_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writeRecentBooking(summary: ConfirmedSummary): RecentBooking {
  const recent: RecentBooking = {
    ...summary,
    expiresAt: Date.now() + RECENT_TTL_MS,
  }
  sessionStorage.setItem(RECENT_BOOKING_KEY, JSON.stringify(recent))
  return recent
}

function clearRecentBookingStorage() {
  sessionStorage.removeItem(RECENT_BOOKING_KEY)
}

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

const STEP_META: Record<
  BookingStep,
  { title: string; description: string; index: number }
> = {
  service: {
    title: "Servis seç",
    description: "Almak istediğin hizmeti seç.",
    index: 1,
  },
  staff: {
    title: "Personel",
    description: "İstersen herhangi birini seçebilirsin.",
    index: 2,
  },
  day: {
    title: "Gün seç",
    description: "Müsait bir gün seç.",
    index: 3,
  },
  time: {
    title: "Saat seç",
    description: "Uygun bir saat seç.",
    index: 4,
  },
  details: {
    title: "Bilgilerin",
    description: "Randevu için bilgilerini gir ve KVKK onayını ver.",
    index: 5,
  },
}

const ADVANCE_MS = 380

function nextUnfilled(state: {
  serviceId: string | null
  staffId: string | null
  dayIdx: number | null
  slot: string | null
  detailsComplete: boolean
}): BookingStep | null {
  if (!state.serviceId) return "service"
  if (!state.staffId) return "staff"
  if (state.dayIdx === null) return "day"
  if (!state.slot) return "time"
  if (!state.detailsComplete) return "details"
  return null
}

export function BookingFlow({
  preview = false,
  nestedDrawers = false,
}: {
  preview?: boolean
  nestedDrawers?: boolean
}) {
  const [step, setStep] = React.useState<BookingStep | null>(null)
  const [cancelOpen, setCancelOpen] = React.useState(false)
  const [nextSessionOpen, setNextSessionOpen] = React.useState(false)
  const [serviceId, setServiceId] = React.useState<string | null>(null)
  const [staffId, setStaffId] = React.useState<string | null>(null)
  const [dayIdx, setDayIdx] = React.useState<number | null>(null)
  const [slot, setSlot] = React.useState<string | null>(null)
  const [firstName, setFirstName] = React.useState("")
  const [lastName, setLastName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [kvkkAccepted, setKvkkAccepted] = React.useState(false)
  const [detailsComplete, setDetailsComplete] = React.useState(false)
  const [confirmed, setConfirmed] = React.useState<ConfirmedSummary | null>(
    null
  )
  const create = useCreateAppointment()
  const submitting = create.isPending
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const hydrated = useHydrated()
  const cachedBooking = React.useMemo(() => hydrated ? readRecentBooking() : null, [hydrated])
  const [bookingOverride, setRecentBooking] = React.useState<RecentBooking | null>()
  const recentBooking = bookingOverride === undefined ? cachedBooking : bookingOverride
  const [now, setNow] = React.useState(() => Date.now())

  const servicesQuery = useAvailableServices(!preview)
  const services = servicesQuery.data ?? []
  const { staff: eligibleStaff, days, times, timesLoading, error: availabilityError } =
    useBookingAvailability(serviceId, staffId, dayIdx, !preview)

  const advanceTimerRef = React.useRef<number | null>(null)

  const clearAdvanceTimer = React.useCallback(() => {
    if (advanceTimerRef.current) {
      window.clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
  }, [])

  React.useEffect(() => clearAdvanceTimer, [clearAdvanceTimer])

  React.useEffect(() => {
    if (!recentBooking) return
    const id = window.setInterval(() => {
      const now = Date.now()
      setNow(now)
      if (recentBooking.expiresAt <= now) {
        clearRecentBookingStorage()
        setRecentBooking(null)
      }
    }, 1000)
    return () => window.clearInterval(id)
  }, [recentBooking])

  const recentRemainingMs = recentBooking
    ? Math.max(0, recentBooking.expiresAt - now)
    : 0

  const service = services.find((s) => s.id === serviceId) ?? null
  const staff =
    staffId && staffId !== "any"
      ? (eligibleStaff.find((s) => s.id === staffId) ?? null)
      : null
  const selectedDay = dayIdx !== null ? (days[dayIdx] ?? null) : null

  const started = Boolean(serviceId)
  const customerName = `${firstName.trim()} ${lastName.trim()}`.trim()
  const complete = Boolean(
    serviceId && staffId && selectedDay && slot && detailsComplete
  )
  const nextStep = nextUnfilled({
    serviceId,
    staffId,
    dayIdx,
    slot,
    detailsComplete,
  })
  const staffValue =
    staffId === "any" ? "Herhangi biri" : (staff?.name ?? null)
  const summaryRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!complete || confirmed) return
    const id = window.setTimeout(() => {
      summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 360)
    return () => window.clearTimeout(id)
  }, [complete, confirmed])

  function clearDetails() {
    setFirstName("")
    setLastName("")
    setPhone("")
    setKvkkAccepted(false)
    setDetailsComplete(false)
    setSubmitError(null)
  }

  function continueFlow(nextState: {
    serviceId: string | null
    staffId: string | null
    dayIdx: number | null
    slot: string | null
    detailsComplete: boolean
  }) {
    clearAdvanceTimer()
    const next = nextUnfilled(nextState)
    setStep(null)
    if (!next) return
    advanceTimerRef.current = window.setTimeout(() => {
      advanceTimerRef.current = null
      setStep(next)
    }, ADVANCE_MS)
  }

  function pickService(id: string) {
    setServiceId(id)
    setStaffId(null)
    setDayIdx(null)
    setSlot(null)
    clearDetails()
    continueFlow({
      serviceId: id,
      staffId: null,
      dayIdx: null,
      slot: null,
      detailsComplete: false,
    })
  }

  function pickStaff(id: string) {
    setStaffId(id)
    setDayIdx(null)
    setSlot(null)
    clearDetails()
    continueFlow({
      serviceId,
      staffId: id,
      dayIdx: null,
      slot: null,
      detailsComplete: false,
    })
  }

  function pickDay(idx: number) {
    setDayIdx(idx)
    setSlot(null)
    clearDetails()
    continueFlow({
      serviceId,
      staffId,
      dayIdx: idx,
      slot: null,
      detailsComplete: false,
    })
  }

  function pickSlot(time: string) {
    setSlot(time)
    clearDetails()
    continueFlow({
      serviceId,
      staffId,
      dayIdx,
      slot: time,
      detailsComplete: false,
    })
  }

  async function submitDetails() {
    const p = normalizeTrPhone(phone)
    if (
      !service ||
      !selectedDay ||
      !slot ||
      !firstName.trim() ||
      !lastName.trim() ||
      !kvkkAccepted ||
      p.length !== 10 ||
      !p.startsWith("5")
    )
      return
    setSubmitError(null)
    try {
      const created = await create.mutateAsync({
        serviceId: service.id,
        staffId: staffId && staffId !== "any" ? staffId : null,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: p,
        date: selectedDay.iso,
        slot: `${slot}:00`,
      })
      const summary: ConfirmedSummary = {
        appointmentId: created.id,
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        service: `${service.name} · ${service.durationMin} dk · ${formatServicePrice(service)}`,
        staff: created.staffName ?? staffValue ?? "—",
        day: `${selectedDay.dayNum} ${selectedDay.weekdayLong}`,
        slot,
      }
      setDetailsComplete(true)
      clearAdvanceTimer()
      setStep(null)
      setConfirmed(summary)
      setRecentBooking(writeRecentBooking(summary))
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          fireBookingConfetti()
        })
      })
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message)
      } else {
        setSubmitError("Randevu oluşturulamadı. Lütfen tekrar dene.")
      }
    }
  }

  function clearSelections() {
    clearAdvanceTimer()
    setConfirmed(null)
    setServiceId(null)
    setStaffId(null)
    setDayIdx(null)
    setSlot(null)
    clearDetails()
    setStep(null)
  }

  function startFresh() {
    clearSelections()
    advanceTimerRef.current = window.setTimeout(() => {
      advanceTimerRef.current = null
      setStep("service")
    }, 120)
  }

  function dismissSuccess() {
    clearSelections()
  }

  async function cancelRecentBooking() {
    if (recentBooking) {
      try {
        await appointmentsApi.cancel(recentBooking.appointmentId)
      } catch {
        /* ignore */
      }
    }
    clearRecentBookingStorage()
    setRecentBooking(null)
  }

  function restart() {
    startFresh()
  }

  const meta = step ? STEP_META[step] : null
  const timeDescription = selectedDay
    ? `${selectedDay.dayNum} ${selectedDay.weekdayLong}`
    : STEP_META.time.description

  const successOpen = confirmed !== null
  const showRecent =
    recentBooking !== null && recentRemainingMs > 0 && !confirmed && !started

  return (
    <div className="flex flex-col gap-4 px-4 pb-6">
      {started && !confirmed ? (
        <div
          ref={summaryRef}
          className="scroll-mt-3 overflow-hidden rounded-2xl bg-card ring-1 ring-border/60"
        >
          <div className="border-b border-border/60 px-4 py-3">
            <h3 className="font-display text-base font-semibold tracking-tight">
              Randevu özeti
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {nextStep === "details"
                ? "Son adım: bilgilerini gir."
                : "Seçtikçe özet burada güncellenir."}
            </p>
          </div>
          <ul className="divide-y divide-border/60">
            {service ? (
              <SummaryRow
                label="Servis"
                value={`${service.name} · ${service.durationMin} dk · ${formatServicePrice(service)}`}
              />
            ) : null}
            {staffValue ? (
              <SummaryRow label="Personel" value={staffValue} />
            ) : null}
            {selectedDay ? (
              <SummaryRow
                label="Gün"
                value={`${selectedDay.dayNum} ${selectedDay.weekdayLong}`}
              />
            ) : null}
            {slot ? <SummaryRow label="Saat" value={slot} /> : null}
            {detailsComplete && customerName ? (
              <SummaryRow label="İsim" value={customerName} />
            ) : null}
            {detailsComplete && phone ? (
              <SummaryRow label="Telefon" value="+90 5XX XXX XX XX" />
            ) : null}
          </ul>
          {(submitError || availabilityError || servicesQuery.error) ? (
            <p className="border-t border-border/60 px-4 py-2 text-sm text-destructive">
              {submitError || availabilityError || servicesQuery.error?.message}
            </p>
          ) : null}
          <div className="flex flex-col gap-2 p-4">
            {nextStep ? (
              <Button
                type="button"
                className="h-12 w-full rounded-xl text-base"
                size="lg"
                onClick={() => setStep(nextStep)}
              >
                Devam et
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-xl text-base"
              size="lg"
              onClick={restart}
            >
              Baştan başla
            </Button>
          </div>
        </div>
      ) : null}

      {!started && !confirmed ? (
        <div className="sticky bottom-0 -mx-4 flex flex-col gap-3 bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              className="h-12 w-full rounded-xl text-base"
              size="lg"
              disabled={preview}
              tabIndex={preview ? -1 : undefined}
              onClick={preview ? undefined : () => setStep("service")}
            >
              Randevu al
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-xl text-base"
              size="lg"
              disabled={preview}
              tabIndex={preview ? -1 : undefined}
              onClick={preview ? undefined : () => setNextSessionOpen(true)}
            >
              Sıradaki seansımı al
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-xl text-base"
              size="lg"
              disabled={preview}
              tabIndex={preview ? -1 : undefined}
              onClick={preview ? undefined : () => setCancelOpen(true)}
            >
              Randevumu iptal et
            </Button>
          </div>
          {preview ? (
            <div className="flex gap-2.5 rounded-2xl bg-muted/60 px-3.5 py-3 ring-1 ring-border/60">
              <HelpCircle
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                strokeWidth={2.25}
                aria-hidden
              />
              <p className="text-sm leading-snug text-muted-foreground">
                Önizlemede yalnızca linkler (Instagram, WhatsApp, yol tarifi)
                çalışır. Randevu almak, sıradaki seansı almak veya iptal etmek
                için gerçek randevu linkine gitmen gerekir.
              </p>
            </div>
          ) : null}
          {!preview ? <GoogleReviews /> : null}
          {showRecent && recentBooking ? (
            <RecentBookingCard
              booking={recentBooking}
              remainingMs={recentRemainingMs}
              onCancel={cancelRecentBooking}
            />
          ) : null}
        </div>
      ) : null}

      <BookingStepDrawer
        open={step !== null}
        onOpenChange={(open) => {
          if (!open) {
            clearAdvanceTimer()
            setStep(null)
          }
        }}
        nested={nestedDrawers}
        title={meta?.title ?? ""}
        description={
          step === "time" ? timeDescription : (meta?.description ?? undefined)
        }
        stepIndex={meta?.index}
        stepCount={5}
      >
        {step === "service" ? (
          <ServiceStep
            services={services}
            selectedId={serviceId}
            onSelect={pickService}
          />
        ) : null}
        {step === "staff" ? (
          <StaffStep
            staff={eligibleStaff}
            selectedId={staffId}
            onSelect={pickStaff}
          />
        ) : null}
        {step === "day" ? (
          <DayStep
            days={days}
            staff={eligibleStaff}
            staffId={staffId}
            selectedIdx={dayIdx}
            onSelect={pickDay}
          />
        ) : null}
        {step === "time" ? (
          <TimeStep
            times={times}
            selected={slot}
            loading={timesLoading}
            onSelect={pickSlot}
          />
        ) : null}
        {step === "details" ? (
          <DetailsStep
            firstName={firstName}
            lastName={lastName}
            phone={phone}
            kvkkAccepted={kvkkAccepted}
            submitting={submitting}
            error={submitError}
            onFirstNameChange={setFirstName}
            onLastNameChange={setLastName}
            onPhoneChange={setPhone}
            onKvkkChange={setKvkkAccepted}
            onContinue={submitDetails}
          />
        ) : null}
      </BookingStepDrawer>

      <NextSessionBookingFlow
        open={nextSessionOpen}
        onOpenChange={setNextSessionOpen}
        nested={nestedDrawers}
      />

      <CancelBookingFlow
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        nested={nestedDrawers}
      />

      <AlertDialog
        open={successOpen}
        onOpenChange={(open) => {
          if (!open) dismissSuccess()
        }}
      >
        <BookingThemeScope asChild>
          <AlertDialogContent className="flex max-h-[calc(100dvh-1.25rem)] w-[calc(100%-1.25rem)] max-w-md flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
          {confirmed ? (
            <>
              <div className="flex shrink-0 flex-col items-center gap-2.5 px-4 pt-5 pb-3 text-center sm:gap-3 sm:px-5 sm:pt-6 sm:pb-4">
                <SuccessCheck />
                <AlertDialogHeader className="items-center text-center sm:items-center sm:text-center">
                  <AlertDialogTitle className="text-balance">
                    Randevun alındı
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-pretty">
                    Özetinin bir kopyası hazır. İstersen yeni randevu da
                    alabilirsin.
                  </AlertDialogDescription>
                </AlertDialogHeader>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-border/60">
                <ul className="divide-y divide-border/60">
                  <SummaryRow label="İsim" value={confirmed.name} wrap />
                  <SummaryRow label="Servis" value={confirmed.service} wrap />
                  <SummaryRow label="Personel" value={confirmed.staff} wrap />
                  <SummaryRow label="Gün" value={confirmed.day} wrap />
                  <SummaryRow label="Saat" value={confirmed.slot} wrap />
                </ul>
              </div>
              <div className="flex shrink-0 flex-col gap-2 border-t border-border/60 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4 sm:pb-4">
                <Button
                  type="button"
                  className="h-11 w-full rounded-xl text-base sm:h-12"
                  size="lg"
                  onClick={startFresh}
                >
                  Yeni randevu al
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto min-h-11 w-full whitespace-normal rounded-xl px-3 py-2.5 text-sm leading-snug sm:px-4 sm:text-base"
                  size="lg"
                  onClick={dismissSuccess}
                >
                  Teşekkür ederim, randevu saatinde görüşürüz
                </Button>
              </div>
            </>
          ) : null}
        </AlertDialogContent>
        </BookingThemeScope>
      </AlertDialog>
    </div>
  )
}

function SuccessCheck() {
  return (
    <span
      className="booking-success-check relative flex size-16 items-center justify-center rounded-full bg-indigo-muted text-indigo ring-1 ring-indigo/25"
      aria-hidden
    >
      <Check className="size-8" strokeWidth={2.75} />
    </span>
  )
}

function RecentBookingCard({
  booking,
  remainingMs,
  onCancel,
}: {
  booking: RecentBooking
  remainingMs: number
  onCancel: () => void
}) {
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [confirming, setConfirming] = React.useState(false)

  function handleOpenChange(open: boolean) {
    setDetailOpen(open)
    if (!open) setConfirming(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setConfirming(false)
          setDetailOpen(true)
        }}
        className="flex w-full items-center gap-3 rounded-2xl bg-card px-4 py-3 text-left ring-1 ring-border/60 transition-[transform,opacity] duration-150 ease-out active:scale-[0.98] active:opacity-90"
      >
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-semibold tracking-tight">
            Son randevun
          </p>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {booking.day} · {booking.slot} · {booking.service.split(" · ")[0]}
          </p>
        </div>
        <span className="shrink-0 rounded-lg bg-indigo-muted px-2.5 py-1 font-display text-sm font-semibold tabular-nums text-indigo ring-1 ring-indigo/25">
          {formatCountdown(remainingMs)}
        </span>
        <ChevronRight
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
      </button>

      <AlertDialog open={detailOpen} onOpenChange={handleOpenChange}>
        <BookingThemeScope asChild>
          <AlertDialogContent className="flex max-h-[calc(100dvh-1.25rem)] w-[calc(100%-1.25rem)] max-w-md flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
          {confirming ? (
            <>
              <div className="flex flex-col items-center gap-3 px-5 pt-6 pb-4 text-center">
                <AlertDialogHeader className="items-center text-center sm:items-center sm:text-center">
                  <AlertDialogTitle className="text-balance">
                    Randevuyu iptal et
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-pretty">
                    {booking.service} — {booking.day} {booking.slot} randevusunu
                    iptal etmek istiyor musun?
                  </AlertDialogDescription>
                </AlertDialogHeader>
              </div>
              <div className="flex flex-col gap-2 border-t border-border/60 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <Button
                  type="button"
                  variant="destructive"
                  className="h-12 w-full rounded-xl text-base"
                  size="lg"
                  onClick={() => {
                    setDetailOpen(false)
                    setConfirming(false)
                    onCancel()
                  }}
                >
                  İptal et
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full rounded-xl text-base"
                  size="lg"
                  onClick={() => setConfirming(false)}
                >
                  Vazgeç
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex shrink-0 items-start justify-between gap-3 px-4 pt-5 pb-3 sm:px-5 sm:pt-6">
                <AlertDialogHeader className="gap-1 text-left sm:text-left">
                  <AlertDialogTitle>Son randevun</AlertDialogTitle>
                  <AlertDialogDescription>
                    Az önce aldığın randevu
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <span className="shrink-0 rounded-lg bg-indigo-muted px-2.5 py-1 font-display text-sm font-semibold tabular-nums text-indigo ring-1 ring-indigo/25">
                  {formatCountdown(remainingMs)}
                </span>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-border/60">
                <ul className="divide-y divide-border/60">
                  <SummaryRow label="İsim" value={booking.name} wrap />
                  <SummaryRow label="Servis" value={booking.service} wrap />
                  <SummaryRow label="Personel" value={booking.staff} wrap />
                  <SummaryRow label="Gün" value={booking.day} wrap />
                  <SummaryRow label="Saat" value={booking.slot} wrap />
                </ul>
              </div>
              <div className="flex shrink-0 flex-col gap-2 border-t border-border/60 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4 sm:pb-4">
                <Button
                  type="button"
                  variant="destructive"
                  className="h-11 w-full rounded-xl text-base"
                  size="lg"
                  onClick={() => setConfirming(true)}
                >
                  İptal et
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full rounded-xl text-base"
                  size="lg"
                  onClick={() => setDetailOpen(false)}
                >
                  Kapat
                </Button>
              </div>
            </>
          )}
        </AlertDialogContent>
        </BookingThemeScope>
      </AlertDialog>
    </>
  )
}

function SummaryRow({
  label,
  value,
  wrap = false,
}: {
  label: string
  value: string
  wrap?: boolean
}) {
  return (
    <li className="px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={
          wrap
            ? "mt-0.5 break-words font-display text-[15px] font-semibold tracking-tight"
            : "mt-0.5 truncate font-display text-[15px] font-semibold tracking-tight"
        }
      >
        {value}
      </p>
    </li>
  )
}
