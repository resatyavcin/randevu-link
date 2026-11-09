"use client"

import { formatTrPhoneDisplay } from "@/presentation/lib/phone-display";
import { useCustomerHistory } from "@/presentation/hooks/customer-history"
import { useSessionsPage } from "@/presentation/hooks/catalog-queries"

import { Copy, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { SessionTag } from "@/presentation/components/dashboard/appointments/appointments-table"
import { Button } from "@/presentation/components/ui/button"
import { Progress } from "@/presentation/components/ui/progress"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/presentation/components/dashboard/panel-sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/presentation/components/ui/tabs"
import { WhatsAppIcon } from "@/presentation/components/ui/whatsapp-icon"
import type {
  AppointmentDto,
  AppointmentStatusApi,
  SessionDto,
  SessionEventDto,
} from "@/domain/models/contracts"
import { SESSION_STATUS_LABELS } from "@/domain/models/contracts"
import { normalizeTrPhone } from "@/domain/value-objects/phone"
import { type Appointment } from "@/presentation/lib/appointment-display"
import { showCopiedToast } from "@/presentation/lib/undo-toast"
import { cn } from "@/presentation/lib/utils"
import { StaffNamePair } from "@/presentation/components/dashboard/staff-name-pair"

export function CustomerDrawer({
  customerId,
  appointments,
  onOpenChange,
}: {
  customerId: string | null
  appointments: Appointment[]
  onOpenChange: (open: boolean) => void
}) {
  const customer = customerId
    ? appointments.find(row => row.customerId === customerId)
    : undefined
  const phone = customerId ? normalizeTrPhone(customerId) : ""

  return (
    <Sheet open={Boolean(customerId)} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-lg">
        {customer && phone.length === 10 ? (
          <DrawerBody
            key={phone}
            name={customer.customer}
            phone={phone}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function DrawerBody({ name, phone }: { name: string; phone: string }) {
  const router = useRouter()
  const phoneLabel = `+90 ${formatTrPhoneDisplay(phone)}`

  async function copyPhone() {
    try {
      await navigator.clipboard.writeText(phoneLabel)
      showCopiedToast()
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <SheetHeader className="border-b border-border p-5">
        <div className="pr-8">
          <div className="min-w-0">
            <SheetTitle className="truncate text-base font-semibold">
              {name}
            </SheetTitle>
            <SheetDescription className="mt-0.5">{phoneLabel}</SheetDescription>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Button size="sm" variant="outline" disabled asChild>
                <a
                  aria-disabled="true" tabIndex={-1}
                  target="_blank"
                  rel="noreferrer"
                >
                  <WhatsAppIcon className="size-3.5 text-[#25D366]" />
                  WhatsApp
                </a>
              </Button>
              <Button size="sm" variant="outline" onClick={copyPhone}>
                <Copy data-icon="inline-start" />
                Kopyala
              </Button>
            </div>
          </div>
        </div>
      </SheetHeader>

      <Tabs defaultValue="seanslar" className="flex min-h-0 flex-1 flex-col gap-3 p-5">
        <TabsList>
          <TabsTrigger value="seanslar">Seanslar</TabsTrigger>
          <TabsTrigger value="gecmis">Geçmiş</TabsTrigger>
        </TabsList>
        <TabsContent value="seanslar" className="min-h-0 flex-1 overflow-y-auto">
          <SessionsTab
            phone={phone}
            onOpen={(id) => {
              router.push(`/sessions/${id}`)
            }}
            onCreate={() => {
              router.push(`/sessions?new=1&phone=${phone}`)
            }}
          />
        </TabsContent>
        <TabsContent value="gecmis" className="min-h-0 flex-1 overflow-y-auto">
          <HistoryTab phone={phone} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

const APPOINTMENT_STATUS: Record<AppointmentStatusApi, string> = {
  PENDING: "Bekliyor",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal",
}

const TR_WEEKDAY = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"]

function HistoryTab({ phone }: { phone: string }) {
  const { data: rows = [], isPending: loading, error: failure } = useCustomerHistory(phone)
  const error = failure?.message


  if (loading) {
    return <p className="py-6 text-sm text-muted-foreground">Yükleniyor…</p>
  }
  if (error) {
    return <p className="py-6 text-sm text-destructive">{error}</p>
  }
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
        Geçmiş yok
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 shrink-0 rounded-sm bg-indigo-muted" />
          Randevu
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 shrink-0 rounded-sm border border-border bg-background" />
          Randevusuz seans
        </span>
      </p>
      <ol className="space-y-2">
        {rows.map((row) => (
          <li
            key={row.kind === "appointment" ? row.appointment.id : row.event.id}
            className={cn(
              "flex items-start gap-3 rounded-xl px-3 py-3",
              row.kind === "appointment" && "bg-indigo-muted"
            )}
          >
            {row.kind === "appointment" ? (
              <AppointmentHistory appointment={row.appointment} />
            ) : (
              <SessionVisitHistory session={row.session} event={row.event} />
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}

function AppointmentHistory({ appointment }: { appointment: AppointmentDto }) {
  return (
    <>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
          {appointment.sessionId ? (
            <SessionTag sessionId={appointment.sessionId} />
          ) : null}
          {appointment.serviceName}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          <StaffNamePair
            booked={appointment.staffName ?? "Personel belirtilmedi"}
            served={appointment.servedStaffName}
          />
          {" · "}
          {formatAppointmentWhen(appointment.date, appointment.slot)}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 text-[11px]",
          appointment.status === "CANCELLED"
            ? "text-red-600 dark:text-red-400"
            : "text-muted-foreground"
        )}
      >
        {APPOINTMENT_STATUS[appointment.status]}
      </span>
    </>
  )
}

function SessionVisitHistory({
  session,
  event,
}: {
  session: SessionDto
  event: SessionEventDto
}) {
  return (
    <>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
          <SessionTag sessionId={session.id} />
          {session.serviceName || session.name}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {event.staffName ?? "Personel belirtilmedi"}
          {" · "}
          {formatInstantWhen(event.occurredAt)}
        </p>
      </div>
      <span className="shrink-0 text-[11px] text-muted-foreground">Tamamlandı</span>
    </>
  )
}

function formatAppointmentWhen(isoDate: string, slot: string) {
  const [y, m, d] = isoDate.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  return `${d} ${TR_WEEKDAY[date.getDay()] ?? ""} · ${slot.slice(0, 5)}`
}

function formatInstantWhen(iso: string) {
  const date = new Date(iso)
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${date.getDate()} ${TR_WEEKDAY[date.getDay()] ?? ""} · ${hours}:${minutes}`
}

function SessionsTab({
  phone,
  onOpen,
  onCreate,
}: {
  phone: string
  onOpen: (id: string) => void
  onCreate: () => void
}) {
  const query = useSessionsPage({ phone, page: 0, size: 50 }, true)
  const rows = query.data?.content ?? []
  const loading = query.isPending
  const error = query.error?.message


  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {loading ? "Yükleniyor…" : `${rows.length} paket`}
        </p>
        <Button size="sm" onClick={onCreate}>
          <Plus data-icon="inline-start" />
          Yeni seans
        </Button>
      </div>
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : !loading && rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
          Henüz seans yok
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((session) => {
            const pct =
              session.totalSessions <= 0
                ? 0
                : (session.completedCount / session.totalSessions) * 100
            return (
              <button
                key={session.id}
                type="button"
                onClick={() => onOpen(session.id)}
                className="w-full rounded-xl border border-border bg-card px-3 py-3 text-left transition-colors hover:bg-muted/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{session.name}</p>
                  <span className="text-[11px] text-muted-foreground">
                    {SESSION_STATUS_LABELS[session.status]}
                  </span>
                </div>
                <Progress value={pct} className="mt-2" />
                <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">
                  {session.completedCount}/{session.totalSessions} tamamlandı
                </p>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

