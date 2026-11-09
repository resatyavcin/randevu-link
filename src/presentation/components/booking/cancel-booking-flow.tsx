"use client"

import { formatTrPhoneDisplay } from "@/presentation/lib/phone-display";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"

import * as React from "react"
import { CalendarX } from "lucide-react"
import { Button } from "@/presentation/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/presentation/components/ui/alert-dialog"
import { BookingThemeScope } from "@/presentation/components/booking/booking-appearance"
import { BookingStepDrawer } from "@/presentation/components/booking/booking-step-drawer"
import { appointmentsApi } from "@/composition/services"
import { normalizeTrPhone } from "@/domain/value-objects/phone"
import { cn } from "@/presentation/lib/utils"

type CancelStep = "phone" | "list"

const STEP_META: Record<
  CancelStep,
  { title: string; description: string; index: number }
> = {
  phone: {
    title: "Telefonunu gir",
    description: "Randevunu bulmak için numaranı gir.",
    index: 1,
  },
  list: {
    title: "Bekleyen randevular",
    description: "İptal etmek istediğin randevuyu seç.",
    index: 2,
  },
}

const fieldClass =
  "h-12 min-w-0 flex-1 bg-transparent px-3.5 text-[15px] outline-none placeholder:text-muted-foreground/70"

const optionPress =
  "touch-manipulation select-none outline-none transition-[transform,opacity,background-color,border-color] duration-150 ease-out active:scale-[0.97] active:opacity-80 focus-visible:ring-2 focus-visible:ring-indigo/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"

const DEMO_CANCEL_PHONE = "0000000000"

const TR_WEEKDAY_LONG = [
  "Pazar",
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
]

function formatDayLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  return `${d} ${TR_WEEKDAY_LONG[date.getDay()]}`
}

function formatSlot(slot: string): string {
  return slot.slice(0, 5)
}

export function CancelBookingFlow({
  open,
  onOpenChange,
  nested = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  nested?: boolean
}) {
  const [step, setStep] = React.useState<CancelStep>("phone")
  const [phone, setPhone] = React.useState(DEMO_CANCEL_PHONE)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  const phone10 = normalizeTrPhone(phone)
  const phoneReady = phone10.length === 10 && phone10.startsWith("5")
  const client = useQueryClient()
  const list = useQuery({
    queryKey: ["appointments", "pending-by-phone", phone10],
    queryFn: ({ signal }) => appointmentsApi.listByPhone(phone10, "PENDING", signal),
    enabled: open && step === "list" && phoneReady,
  })
  const cancel = useMutation({
    mutationFn: appointmentsApi.cancel,
    onSuccess: async () => {
      await Promise.all(["appointments", "availability", "revenue"].map(key => client.invalidateQueries({ queryKey: [key] })))
    },
  })
  const appointments = list.data ?? []
  const loading = list.isFetching
  const cancelling = cancel.isPending
  const loadError = (cancel.error ?? list.error)?.message
  const meta = STEP_META[step]

  function reset() {
    setStep("phone")
    setPhone(DEMO_CANCEL_PHONE)
    setSelectedId(null)
    setConfirmOpen(false)
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset()
    onOpenChange(next)
  }

  function submitPhone() {
    if (!phoneReady) return
    cancel.reset()
    setStep("list")
  }

  function confirmCancel() {
    if (!selectedId || cancelling) return
    cancel.mutate(selectedId, { onSuccess: () => {
      setSelectedId(null)
      setConfirmOpen(false)
    } })
  }

  const selected = appointments.find((a) => a.id === selectedId) ?? null

  return (
    <>
      <BookingStepDrawer
        open={open}
        onOpenChange={handleOpenChange}
        nested={nested}
        title={meta.title}
        description={
          step === "list"
            ? `+90 ${formatTrPhoneDisplay(phone10)} — bekleyen randevular`
            : meta.description
        }
        stepIndex={meta.index}
        stepCount={2}
      >
        {step === "phone" ? (
          <div className="flex flex-col gap-4">
            <label className="relative flex items-center rounded-xl bg-muted/70 ring-1 ring-border/70 focus-within:ring-2 focus-within:ring-indigo/40">
              <span className="flex h-12 shrink-0 items-center whitespace-nowrap pl-3.5 font-display text-sm font-semibold text-muted-foreground">
                +90
              </span>
              <input
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                placeholder="5XX XXX XX XX"
                inputMode="tel"
                autoComplete="tel-national"
                className={fieldClass}
              />
            </label>
            <Button
              type="button"
              className="h-12 w-full rounded-xl text-base"
              size="lg"
              disabled={!phoneReady || loading}
              onClick={submitPhone}
            >
              {loading ? "Aranıyor…" : "Randevuları getir"}
            </Button>
          </div>
        ) : null}

        {step === "list" ? (
          <div className="flex flex-col gap-3">
            {loading ? (
              <p className="rounded-2xl bg-muted/40 px-3.5 py-8 text-center text-sm text-muted-foreground">
                Yükleniyor…
              </p>
            ) : loadError ? (
              <p className="rounded-2xl bg-destructive/10 px-3.5 py-4 text-center text-sm text-destructive">
                {loadError}
              </p>
            ) : appointments.length === 0 ? (
              <p className="rounded-2xl bg-muted/40 px-3.5 py-8 text-center text-sm text-muted-foreground">
                Bekleyen randevu yok.
              </p>
            ) : (
              appointments.map((apt) => {
                const selectedRow = apt.id === selectedId
                return (
                  <button
                    key={apt.id}
                    type="button"
                    onClick={() => setSelectedId(apt.id)}
                    className={cn(
                      "rounded-2xl border px-3.5 py-3 text-left",
                      optionPress,
                      selectedRow
                        ? "border-indigo bg-indigo-muted"
                        : "border-border/60 bg-card hover:bg-muted/50"
                    )}
                  >
                    <p className="font-display text-[15px] font-semibold tracking-tight">
                      {apt.serviceName}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {formatDayLabel(apt.date)} · {formatSlot(apt.slot)} ·{" "}
                      {apt.staffName ?? "Herhangi biri"}
                    </p>
                  </button>
                )
              })
            )}
            {appointments.length > 0 ? (
              <Button
                type="button"
                variant="destructive"
                className="mt-1 h-12 w-full rounded-xl text-base"
                size="lg"
                disabled={!selectedId}
                onClick={() => setConfirmOpen(true)}
              >
                Randevuyu iptal et
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              className="h-10 w-full rounded-xl"
              onClick={() => setStep("phone")}
            >
              Numarayı değiştir
            </Button>
          </div>
        ) : null}

        <Button
          type="button"
          variant="outline"
          className="mt-4 h-11 w-full rounded-xl text-base"
          size="lg"
          onClick={() => handleOpenChange(false)}
        >
          Kapat
        </Button>
      </BookingStepDrawer>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <BookingThemeScope asChild>
          <AlertDialogContent className="max-w-md gap-0 overflow-hidden p-0 sm:max-w-md">
          <div className="flex flex-col items-center gap-3 px-5 pt-6 pb-4 text-center">
            <span
              className="flex size-14 items-center justify-center rounded-full bg-destructive/15 text-destructive ring-1 ring-destructive/25"
              aria-hidden
            >
              <CalendarX className="size-6" strokeWidth={2.25} />
            </span>
            <AlertDialogHeader className="items-center text-center sm:items-center sm:text-center">
              <AlertDialogTitle className="text-balance">
                Randevuyu iptal et
              </AlertDialogTitle>
              <AlertDialogDescription className="text-pretty">
                {selected
                  ? `${selected.serviceName} — ${formatDayLabel(selected.date)} ${formatSlot(selected.slot)} randevusunu iptal etmek istiyor musun?`
                  : "Bu randevuyu iptal etmek istiyor musun?"}
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <div className="flex flex-col gap-2 border-t border-border/60 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <AlertDialogAction
              className="h-12 w-full rounded-xl text-base"
              disabled={cancelling}
              onClick={confirmCancel}
            >
              {cancelling ? "İptal ediliyor…" : "İptal et"}
            </AlertDialogAction>
            <AlertDialogCancel className="h-11 w-full rounded-xl text-base">
              Vazgeç
            </AlertDialogCancel>
          </div>
        </AlertDialogContent>
        </BookingThemeScope>
      </AlertDialog>
    </>
  )
}
