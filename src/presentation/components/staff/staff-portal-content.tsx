"use client"

import { useStaffPortal, toIsoDate } from "@/presentation/components/staff/use-staff-portal"


import * as React from "react"
import Link from "next/link"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import { ChevronLeft, ChevronRight, LogOut, Phone } from "lucide-react"
import { tr } from "react-day-picker/locale"
import { ProfileHero } from "@/presentation/components/profile/profile-hero"
import { Button } from "@/presentation/components/ui/button"
import { Calendar } from "@/presentation/components/ui/calendar"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/presentation/components/ui/input-group"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/presentation/components/ui/input-otp"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/presentation/components/ui/popover"
import { UserAvatar } from "@/presentation/components/ui/user-avatar"
import type { AuthMe } from "@/domain/models/auth"
import type {
  AppointmentDto,
  AppointmentStatusApi,
} from "@/domain/models/contracts"
import { formatTrPhoneDisplay } from "@/presentation/lib/phone-display"
import { BUSINESS_NAME } from "@/composition/config"
import { cn } from "@/presentation/lib/utils"

const MONTHS_TR = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
]

const WEEKDAYS_TR = [
  "Pazar",
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
]

const STATUS: Record<
  AppointmentStatusApi,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Bekliyor",
    className: "bg-indigo-muted text-indigo",
  },
  COMPLETED: {
    label: "Tamamlandı",
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  },
  CANCELLED: {
    label: "İptal",
    className: "bg-muted text-muted-foreground",
  },
}


function parseIsoDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

function shiftIso(iso: string, days: number) {
  const date = parseIsoDate(iso)
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

function formatDayTitle(iso: string) {
  const date = parseIsoDate(iso)
  return `${date.getDate()} ${MONTHS_TR[date.getMonth()]} ${WEEKDAYS_TR[date.getDay()]}`
}

function formatSlot(slot: string) {
  return slot.slice(0, 5)
}

export function StaffPortalContent({ className }: { className?: string }) {
  const { gate, setGate, phone, setPhone, otp, setOtp, staff, date, setDate, appointments, loading, error, clearErrors, debugCode, setDebugCode, phoneReady, otpReady, today, logout, expireSeconds, resendSeconds, submitPhone, submitOtp } = useStaffPortal()
  const signedIn = gate === "day" && Boolean(staff)

  return (
    <div className={cn("flex min-h-full flex-1 flex-col bg-background", className)}>
      <div className="shrink-0">
        <ProfileHero
          compact
          heading="h1"
          titleOnly={signedIn}
          actions={
            signedIn ? (
              <Button type="button" variant="outline" size="sm" onClick={logout}>
                <LogOut />
                Çıkış
              </Button>
            ) : undefined
          }
        />
      </div>

      <div className="flex flex-1 flex-col px-4 pb-6">
        {gate === "boot" ? (
          <p className="rounded-2xl bg-muted/40 px-3.5 py-8 text-center text-sm text-muted-foreground">
            Yükleniyor…
          </p>
        ) : null}

        {gate === "phone" ? (
          <AuthCard
            title="Personel girişi"
            description="Günlük randevularını görmek için kayıtlı telefonunu gir."
            error={error}
          >
            <InputGroup className="h-12 rounded-xl">
              <InputGroupAddon>
                <InputGroupText className="font-display text-sm font-semibold">
                  +90
                </InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") void submitPhone()
                }}
                placeholder="5XX XXX XX XX"
                inputMode="tel"
                autoComplete="tel-national"
                aria-invalid={phone.length > 0 && !phoneReady}
              />
            </InputGroup>
            {phone.length > 0 && !phoneReady ? (
              <p className="text-xs text-destructive">
                10 haneli, 5 ile başlayan bir GSM numarası gir.
              </p>
            ) : null}
            <Button
              type="button"
              className="h-12 w-full rounded-xl text-base"
              size="lg"
              disabled={!phoneReady || loading}
              onClick={() => void submitPhone()}
            >
              {loading ? "Kod gönderiliyor…" : "Devam et"}
            </Button>
          </AuthCard>
        ) : null}

        {gate === "otp" ? (
          <AuthCard
            title="Doğrulama kodu"
            description={`+90 ${formatTrPhoneDisplay(phone)} numarasına gönderilen 6 haneli kodu gir.`}
            error={error}
          >
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
              onComplete={(code) => void submitOtp(code)}
              pattern={REGEXP_ONLY_DIGITS}
              inputMode="numeric"
              autoComplete="one-time-code"
              disabled={loading}
              containerClassName="w-full"
            >
              <InputOTPGroup>
                {Array.from({ length: 6 }, (_, i) => (
                  <InputOTPSlot
                    key={i}
                    index={i}
                    aria-invalid={Boolean(error)}
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <p className="text-center text-xs text-muted-foreground">
              {expireSeconds > 0
                ? `Kod ${expireSeconds} sn içinde geçerliliğini yitirir.`
                : "Kodun süresi doldu, yeni kod iste."}
            </p>
            {debugCode ? (
              <p className="text-center text-xs text-muted-foreground">
                Geliştirme kodu: {debugCode}
              </p>
            ) : null}
            <Button
              type="button"
              className="h-12 w-full rounded-xl text-base"
              size="lg"
              disabled={!otpReady || loading || expireSeconds <= 0}
              onClick={() => void submitOtp()}
            >
              {loading ? "Giriş yapılıyor…" : "Giriş yap"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={loading || resendSeconds > 0}
              onClick={() => void submitPhone()}
            >
              {resendSeconds > 0 ? `Yeniden gönder (${resendSeconds})` : "Kodu yeniden gönder"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOtp("")
                setPhone("")
                clearErrors()
                setDebugCode(null)
                setGate("phone")
              }}
            >
              Numarayı değiştir
            </Button>
          </AuthCard>
        ) : null}

        {gate === "day" && staff ? (
          <DayBoard
            staff={staff}
            date={date}
            today={today}
            appointments={appointments}
            loading={loading}
            error={error}
            onPrev={() => {
              setDate((d) => shiftIso(d, -1))
            }}
            onNext={() => {
              setDate((d) => shiftIso(d, 1))
            }}
            onDateChange={(iso) => {
              setDate(iso)
            }}
          />
        ) : null}
      </div>

      <SiteFooter />
    </div>
  )
}

function AuthCard({
  title,
  description,
  error,
  children,
}: {
  title: string
  description: string
  error: string | null
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 pt-2">
      <div>
        <h2 className="font-display text-xl font-bold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {error ? (
        <p className="rounded-2xl bg-destructive/10 px-3.5 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}

function DayBoard({
  staff,
  date,
  today,
  appointments,
  loading,
  error,
  onPrev,
  onNext,
  onDateChange,
}: {
  staff: AuthMe
  date: string
  today: string
  appointments: AppointmentDto[]
  loading: boolean
  error: string | null
  onPrev: () => void
  onNext: () => void
  onDateChange: (iso: string) => void
}) {
  const [calendarOpen, setCalendarOpen] = React.useState(false)
  const selected = parseIsoDate(date)

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 pt-1">
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar
          src={staff.photoUrl}
          alt={staff.name}
          className="size-11"
        />
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold leading-tight">
            Merhaba, {staff.name.split(" ")[0]}
          </p>
          <p className="truncate text-sm text-muted-foreground">{staff.role}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-2xl bg-muted/50 p-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-10 rounded-xl hover:bg-background"
          onClick={onPrev}
          aria-label="Önceki gün"
        >
          <ChevronLeft className="size-5" />
        </Button>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-auto min-w-0 flex-1 flex-col gap-0 rounded-xl py-1 hover:bg-background"
              aria-label="Gün seç"
            >
              <span className="w-full truncate font-display text-sm font-semibold">
                {formatDayTitle(date)}
              </span>
              <span className="text-[11px] font-normal text-muted-foreground">
                {date === today ? "Bugün" : "Gün seç"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="center" className="w-auto p-2">
            <Calendar
              mode="single"
              locale={tr}
              weekStartsOn={1}
              selected={selected}
              onSelect={(next) => {
                if (!next) return
                onDateChange(toIsoDate(next))
                setCalendarOpen(false)
              }}
            />
            {date !== today ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  onDateChange(today)
                  setCalendarOpen(false)
                }}
              >
                Bugüne dön
              </Button>
            ) : null}
          </PopoverContent>
        </Popover>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-10 rounded-xl hover:bg-background"
          onClick={onNext}
          aria-label="Sonraki gün"
        >
          <ChevronRight className="size-5" />
        </Button>
      </div>

      {error ? (
        <p className="rounded-2xl bg-destructive/10 px-3.5 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="rounded-2xl bg-muted/40 px-3.5 py-8 text-center text-sm text-muted-foreground">
          Yükleniyor…
        </p>
      ) : appointments.length === 0 ? (
        <p className="rounded-2xl bg-muted/40 px-3.5 py-8 text-center text-sm text-muted-foreground">
          Bu gün randevun yok.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {appointments.map((apt) => (
            <AppointmentCard key={apt.id} apt={apt} />
          ))}
        </div>
      )}
    </div>
  )
}

function AppointmentCard({ apt }: { apt: AppointmentDto }) {
  const status = STATUS[apt.status]
  const extras = apt.extras?.map((x) => x.name).filter(Boolean) ?? []
  const customer = `${apt.customerFirstName} ${apt.customerLastName}`.trim()

  return (
    <article className="rounded-2xl border border-border/60 bg-card px-3.5 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-lg font-bold tabular-nums leading-none">
            {formatSlot(apt.slot)}
          </p>
          <p className="mt-1.5 truncate text-[15px] font-semibold">{customer}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-1.5"
            disabled
            asChild
          >
            <a
              aria-disabled="true" tabIndex={-1}
              aria-label={`Ara +90 ${formatTrPhoneDisplay(apt.customerPhone)}`}
            >
              <Phone />
              Ara
            </a>
          </Button>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
            status.className
          )}
        >
          {status.label}
        </span>
      </div>
      <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        {apt.sessionId ? (
          <Link
            href={`/sessions/${apt.sessionId}`}
            className="rounded-md bg-indigo-muted px-1.5 py-0.5 text-[11px] font-medium text-indigo hover:opacity-80"
          >
            Seans
          </Link>
        ) : null}
        <span>
          {apt.serviceName}
          {extras.length > 0 ? ` · ${extras.join(", ")}` : ""}
        </span>
      </p>
    </article>
  )
}

function SiteFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-auto shrink-0 border-t border-border/60 bg-background px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between gap-3">
        <div className="font-display text-[13px] font-bold tracking-tight">
          {BUSINESS_NAME}
        </div>
        <p className="text-right text-[11px] leading-relaxed text-muted-foreground">
          © {year} {BUSINESS_NAME}. Tüm hakları saklıdır.
        </p>
      </div>
    </footer>
  )
}
