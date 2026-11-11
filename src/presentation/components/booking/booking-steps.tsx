"use client"

import * as React from "react"
import { ChevronDown, Clock, Mars, Users, Venus } from "lucide-react"
import { cn } from "@/presentation/lib/utils"
import { Button } from "@/presentation/components/ui/button"
import { UserAvatar } from "@/presentation/components/ui/user-avatar"
import { BookingStepDrawer } from "@/presentation/components/booking/booking-step-drawer"
import { normalizeTrPhone } from "@/domain/value-objects/phone"
import type {
  ServiceDto,
  ServiceGenderApi,
  StaffDto,
} from "@/domain/models/contracts"

const optionPress =
  "touch-manipulation select-none outline-none transition-[transform,opacity,background-color,border-color] duration-150 ease-out active:scale-[0.97] active:opacity-80 focus-visible:ring-2 focus-visible:ring-indigo/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"

function formatPrice(s: ServiceDto) {
  const fmt = (n: number) => `₺${n.toLocaleString("tr-TR")}`
  return s.priceMaxTl && s.priceMaxTl !== s.priceTl
    ? `${fmt(s.priceTl)}–${fmt(s.priceMaxTl)}`
    : fmt(s.priceTl)
}

const GENDER_TABS: {
  id: ServiceGenderApi
  label: string
  icon: typeof Venus
  selected: string
  idle: string
}[] = [
  {
    id: "KADIN",
    label: "Kadın",
    icon: Venus,
    selected:
      "bg-background text-black shadow-sm ring-1 ring-black/5",
    idle: "text-black",
  },
  {
    id: "ERKEK",
    label: "Erkek",
    icon: Mars,
    selected:
      "bg-background text-black shadow-sm ring-1 ring-black/5",
    idle: "text-black",
  },
]

export function ServiceStep({
  services,
  selectedId,
  onSelect,
}: {
  services: ServiceDto[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const selectedService = React.useMemo(
    () => services.find((s) => s.id === selectedId) ?? null,
    [services, selectedId]
  )
  const [gender, setGender] = React.useState<ServiceGenderApi>(
    selectedService?.category.gender ?? "KADIN"
  )
  const [expanded, setExpanded] = React.useState<{ gender: ServiceGenderApi; id: string | null }>()
  const categoryRefs = React.useRef(new Map<string, HTMLDivElement | null>())
  const skipCategoryScroll = React.useRef(true)

  const grouped = React.useMemo(() => {
    const map = new Map<
      string,
      {
        id: string
        name: string
        sortOrder: number
        pinRank: number | null
        items: ServiceDto[]
      }
    >()
    for (const s of services) {
      if (s.category.gender !== gender) continue
      const existing = map.get(s.category.id)
      if (existing) {
        existing.items.push(s)
      } else {
        map.set(s.category.id, {
          id: s.category.id,
          name: s.category.name,
          sortOrder: s.category.sortOrder,
          pinRank: s.category.pinRank,
          items: [s],
        })
      }
    }
    for (const group of map.values()) {
      group.items.sort((a, b) => a.priceTl - b.priceTl)
    }
    return Array.from(map.values()).sort((a, b) => {
      const pinA = a.pinRank ?? 99
      const pinB = b.pinRank ?? 99
      if (pinA !== pinB) return pinA - pinB
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
      return a.name.localeCompare(b.name, "tr")
    })
  }, [services, gender])

  const firstCategory = grouped[0]?.id ?? null

  const openCategory = expanded?.gender === gender ? expanded.id
    : selectedService?.category.gender === gender ? selectedService.category.id : firstCategory

  function toggleCategory(id: string) {
    setExpanded({ gender, id: openCategory === id ? null : id })
  }

  React.useEffect(() => {
    if (skipCategoryScroll.current) {
      skipCategoryScroll.current = false
      return
    }
    if (!openCategory) return
    const el = categoryRefs.current.get(openCategory)
    const scroller = el?.closest<HTMLElement>("[data-booking-step-scroll]")
    if (!el || !scroller) return

    const headerOffset = 8
    const top =
      el.getBoundingClientRect().top -
      scroller.getBoundingClientRect().top +
      scroller.scrollTop -
      headerOffset
    const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight)
    scroller.scrollTo({
      top: Math.min(Math.max(0, top), maxScroll),
      behavior: "smooth",
    })
  }, [openCategory])

  return (
    <div className="flex flex-col gap-3">
      <div
        role="tablist"
        className="grid grid-cols-2 gap-1 rounded-full bg-muted/60 p-1"
      >
        {GENDER_TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={gender === t.id}
            type="button"
            onClick={() => setGender(t.id)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-full py-1.5 font-display text-[13px] font-semibold tracking-tight transition-colors",
              optionPress,
              gender === t.id ? t.selected : t.idle
            )}
          >
            <t.icon className="size-3.5 shrink-0" strokeWidth={2.4} aria-hidden />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {grouped.length === 0 ? (
          <p className="rounded-2xl bg-muted/40 px-3.5 py-8 text-center text-sm text-muted-foreground">
            Bu grup için servis bulunamadı.
          </p>
        ) : null}
        {grouped.map((group) => {
          const isOpen = openCategory === group.id
          return (
            <div
              key={group.id}
              ref={(el) => {
                categoryRefs.current.set(group.id, el)
              }}
              className="scroll-mt-2 overflow-hidden rounded-2xl border border-border bg-card"
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => toggleCategory(group.id)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 px-3.5 py-3 text-left",
                  optionPress
                )}
              >
                <span className="font-display text-[14px] font-semibold tracking-tight">
                  {group.name}
                </span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  {group.items.length}
                  <ChevronDown
                    className={cn(
                      "size-4 transition-transform",
                      isOpen && "rotate-180"
                    )}
                  />
                </span>
              </button>
              {isOpen ? (
                <div className="divide-y divide-border/60 border-t border-border/60">
                  {group.items.map((s) => {
                    const selected = s.id === selectedId
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => onSelect(s.id)}
                        className={cn(
                          "flex w-full items-center gap-3 px-3.5 py-3 text-left",
                          optionPress,
                          selected
                            ? "bg-indigo-muted"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block font-display text-[14px] font-semibold tracking-tight">
                            {s.name}
                          </span>
                          <span className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                            <Clock className="size-3" />
                            {s.durationMin} dk
                          </span>
                        </span>
                        <span className="shrink-0 whitespace-nowrap font-display text-[13px] font-semibold">
                          {formatPrice(s)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function StaffStep({
  staff,
  selectedId,
  onSelect,
}: {
  staff: StaffDto[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {staff.length >= 2 ? (
        <button
          type="button"
          onClick={() => onSelect("any")}
          className={cn(
            "flex flex-col items-center gap-2 rounded-2xl border px-2 py-3",
            optionPress,
            selectedId === "any"
              ? "border-indigo bg-indigo-muted"
              : "border-border/60 bg-card hover:bg-muted/50"
          )}
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Users className="size-5" />
          </span>
          <span className="text-center text-xs font-medium leading-tight">
            Herhangi biri
          </span>
        </button>
      ) : null}

      {staff.map((s) => {
        const selected = selectedId === s.id
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-2xl border px-2 py-3",
              optionPress,
              selected
                ? "border-indigo bg-indigo-muted"
                : "border-border/60 bg-card hover:bg-muted/50"
            )}
          >
            <UserAvatar
              className="size-12"
              src={s.photoUrl ?? undefined}
              alt={s.name}
            />
            <span className="max-w-full truncate text-center text-xs font-medium leading-tight">
              {s.name.split(" ")[0]}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export type DayCell = {
  date: Date
  iso: string
  weekdayShort: string
  weekdayLong: string
  dayNum: number
  isToday: boolean
  workingStaffIds: string[]
}

export function DayStep({
  days,
  staff,
  staffId,
  selectedIdx,
  onSelect,
}: {
  days: DayCell[]
  staff: StaffDto[]
  staffId: string | null
  selectedIdx: number | null
  onSelect: (idx: number) => void
}) {
  const concreteStaffId = staffId === "any" ? null : staffId
  const staffById = React.useMemo(() => {
    const map = new Map<string, StaffDto>()
    for (const s of staff) map.set(s.id, s)
    return map
  }, [staff])

  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
      {days.map((day, i) => {
        const workingStaff = day.workingStaffIds
          .filter((id) => !concreteStaffId || id === concreteStaffId)
          .map((id) => staffById.get(id))
          .filter((x): x is StaffDto => Boolean(x))
        const disabled = workingStaff.length === 0
        const selected = selectedIdx === i

        return (
          <button
            key={day.iso}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(i)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3",
              optionPress,
              selected
                ? "border-indigo bg-indigo-muted"
                : "border-border/60 bg-card",
              !selected && !disabled && "hover:bg-muted/50",
              disabled &&
                "pointer-events-none opacity-40 active:scale-100 active:opacity-40"
            )}
          >
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {day.weekdayShort}
            </span>
            <span
              className={cn(
                "font-display text-xl font-bold leading-none",
                selected && "text-indigo"
              )}
            >
              {day.dayNum}
            </span>
            <AvatarStack staff={workingStaff} />
          </button>
        )
      })}
    </div>
  )
}

export function TimeStep({
  times,
  selected,
  loading,
  onSelect,
}: {
  times: string[]
  selected: string | null
  loading?: boolean
  onSelect: (time: string) => void
}) {
  if (loading) {
    return (
      <p className="rounded-2xl bg-muted/40 px-3.5 py-8 text-center text-sm text-muted-foreground">
        Müsait saatler yükleniyor…
      </p>
    )
  }
  if (times.length === 0) {
    return (
      <p className="rounded-2xl bg-muted/40 px-3.5 py-8 text-center text-sm text-muted-foreground">
        Bu gün için müsait saat yok.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
      {times.map((t) => {
        const display = t.slice(0, 5)
        const isSelected = selected === display
        return (
          <button
            key={t}
            type="button"
            onClick={() => onSelect(display)}
            className={cn(
              "rounded-xl border py-2.5 text-sm font-medium",
              optionPress,
              isSelected
                ? "border-indigo bg-indigo text-white"
                : "border-border/60 bg-card hover:bg-muted/50"
            )}
          >
            {display}
          </button>
        )
      })}
    </div>
  )
}

const fieldClass =
  "h-12 w-full rounded-xl bg-muted/70 px-3.5 text-[15px] outline-none ring-1 ring-border/70 placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-indigo/40"

const KVKK_NOTICE = [
  "Bu aydınlatma metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) kapsamında hazırlanmıştır.",
  "Randevu oluştururken paylaştığınız ad, soyad ve iletişim bilgileriniz; randevunuzun oluşturulması, hatırlatılması ve işletme ile iletişimin sağlanması amacıyla işlenir.",
  "Verileriniz, hizmetin ifası için gerekli olduğu süre boyunca saklanır ve yasal zorunluluklar dışında üçüncü kişilerle paylaşılmaz.",
  "KVKK kapsamındaki haklarınız için işletmeyle iletişime geçebilirsiniz. Bu metin demo amaçlıdır.",
]

export function DetailsStep({
  firstName,
  lastName,
  phone,
  kvkkAccepted,
  submitting = false,
  error,
  onFirstNameChange,
  onLastNameChange,
  onPhoneChange,
  onKvkkChange,
  onContinue,
}: {
  firstName: string
  lastName: string
  phone: string
  kvkkAccepted: boolean
  submitting?: boolean
  error?: string | null
  onFirstNameChange: (value: string) => void
  onLastNameChange: (value: string) => void
  onPhoneChange: (value: string) => void
  onKvkkChange: (value: boolean) => void
  onContinue: () => void
}) {
  const [kvkkOpen, setKvkkOpen] = React.useState(false)

  const phone10 = normalizeTrPhone(phone)
  const phoneValid = phone10.length === 10 && phone10.startsWith("5")

  const canContinue =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    phoneValid &&
    kvkkAccepted

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">
            Ad
          </span>
          <input
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            placeholder="Adın"
            autoComplete="given-name"
            autoCapitalize="words"
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">
            Soyad
          </span>
          <input
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            placeholder="Soyadın"
            autoComplete="family-name"
            autoCapitalize="words"
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">
            Telefon
          </span>
          <span className="relative flex items-center rounded-xl bg-muted/70 ring-1 ring-border/70 focus-within:ring-2 focus-within:ring-indigo/40">
            <span className="flex h-12 shrink-0 items-center whitespace-nowrap pl-3.5 font-display text-sm font-semibold text-muted-foreground">
              +90
            </span>
            <input
              value={phone}
              onChange={(e) =>
                onPhoneChange(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="5XX XXX XX XX"
              inputMode="tel"
              autoComplete="tel-national"
              className="h-12 min-w-0 flex-1 bg-transparent px-3.5 text-[15px] outline-none placeholder:text-muted-foreground/70"
            />
          </span>
          {phone.length > 0 && !phoneValid ? (
            <span className="text-xs text-destructive">
              10 haneli, 5 ile başlayan bir GSM numarası gir.
            </span>
          ) : null}
        </label>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border/60 bg-card px-3.5 py-3">
        <input
          type="checkbox"
          checked={kvkkAccepted}
          onChange={(e) => onKvkkChange(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 rounded border-border accent-indigo"
        />
        <span className="text-sm leading-snug text-muted-foreground">
          Kişisel verilerimin{" "}
          <button
            type="button"
            className="font-semibold text-foreground underline underline-offset-2"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setKvkkOpen(true)
            }}
          >
            KVKK aydınlatma metni
          </button>{" "}
          kapsamında işlenmesini onaylıyorum.
        </span>
      </label>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}

      <Button
        type="button"
        className="h-12 w-full rounded-xl text-base"
        size="lg"
        disabled={!canContinue || submitting}
        onClick={onContinue}
      >
        {submitting ? "Gönderiliyor…" : "Devam et"}
      </Button>

      <BookingStepDrawer
        open={kvkkOpen}
        onOpenChange={setKvkkOpen}
        nested
        title="KVKK aydınlatma metni"
        description="Kişisel verilerinizin işlenmesine ilişkin bilgilendirme."
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
            {KVKK_NOTICE.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-xl text-base"
            size="lg"
            onClick={() => setKvkkOpen(false)}
          >
            Kapat
          </Button>
        </div>
      </BookingStepDrawer>
    </div>
  )
}

function AvatarStack({ staff }: { staff: StaffDto[] }) {
  if (staff.length === 0) {
    return <span className="h-4 w-full" aria-hidden />
  }
  const visible = staff.slice(0, 3)
  const extra = staff.length - visible.length
  return (
    <span className="flex items-center">
      {visible.map((s, i) => {
        return (
          <span
            key={s.id}
            className={cn("rounded-full ring-2 ring-card", i > 0 && "-ml-1.5")}
          >
            <UserAvatar
              className="size-4"
              src={s.photoUrl ?? undefined}
              alt={s.name}
            />
          </span>
        )
      })}
      {extra > 0 ? (
        <span className="-ml-1.5 flex size-4 items-center justify-center rounded-full bg-muted text-[8px] font-bold text-muted-foreground ring-2 ring-card">
          +{extra}
        </span>
      ) : null}
    </span>
  )
}
