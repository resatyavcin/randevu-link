"use client"

import { EditPackageSheet } from "@/presentation/components/dashboard/sessions/edit-package-sheet"

import { CompleteVisitSheet } from "@/presentation/components/dashboard/sessions/complete-visit-sheet"

import { PackageStanding } from "@/presentation/components/dashboard/sessions/package-standing"
import { EventHistory } from "@/presentation/components/dashboard/sessions/event-history"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { CircleCheck, Copy, ChevronDown, Pencil, Trash2, Wallet } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/presentation/components/ui/alert-dialog"
import { Button } from "@/presentation/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/presentation/components/dashboard/panel-dropdown-menu"
import { Card, CardContent } from "@/presentation/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/presentation/components/ui/tabs"
import { WhatsAppIcon } from "@/presentation/components/ui/whatsapp-icon"
import { type SessionEventDto } from "@/domain/models/contracts"
import { formatTrPhoneDisplay } from "@/presentation/lib/phone-display"
import { useSessionDetail, useSessionActions } from "@/presentation/hooks/session-detail"
import { showCopiedToast, showUndoToast } from "@/presentation/lib/undo-toast"
import { toast } from "sonner"

export function SessionDetailView() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const actions = useSessionActions(id)
  const query = useSessionDetail(id)
  const { session, pendingVisits = [], staff = [], services = [], feeQueued = false } = query.data ?? {}
  const loading = query.isPending
  const error = query.error?.message
  const [editOpen, setEditOpen] = React.useState(false)
  const [cancelOpen, setCancelOpen] = React.useState(false)
  const cancelling = actions.cancel.isPending
  const cancelError = actions.cancel.error?.message
  const [completeOpen, setCompleteOpen] = React.useState(false)
  const [undoTarget, setUndoTarget] = React.useState<SessionEventDto | null>(null)
  const undoing = actions.undo.isPending
  const undoError = actions.undo.error?.message
  const queueing = actions.queue.isPending
  const [historyTab, setHistoryTab] = React.useState("activity")
  const [highlightEventId, setHighlightEventId] = React.useState<string | null>(null)

  function showSessionEvent(eventId: string) {
    setHistoryTab("activity")
    setHighlightEventId(eventId)
    window.setTimeout(() => {
      document.getElementById(`session-event-${eventId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    }, 40)
    window.setTimeout(() => {
      setHighlightEventId((current) => (current === eventId ? null : current))
    }, 1700)
  }

  function sendToRegister() {
    actions.queue.mutate(undefined, {
      onSuccess: () => showUndoToast("Kasaya gönderildi"),
      onError: error => toast.error(error.message),
    })
  }

  function cancelPackage() {
    actions.cancel.mutate(undefined, { onSuccess: () => {
      setCancelOpen(false)
      showUndoToast("Paket iptal edildi")
    } })
  }

  function undoEvent() {
    if (undoTarget) actions.undo.mutate(undoTarget.id, { onSuccess: () => setUndoTarget(null) })
  }

  if (loading && !session) {
    return (
      <div className="min-w-0 px-4 py-5 [overflow-wrap:anywhere] md:px-8 md:py-8">
        <p className="text-sm text-muted-foreground">Yükleniyor…</p>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-w-0 px-4 py-5 [overflow-wrap:anywhere] md:px-8 md:py-8">
        <p className="text-sm text-destructive">{error ?? "Seans bulunamadı"}</p>
        <Button className="mt-4" variant="outline" asChild>
          <Link href="/sessions">Seanslara dön</Link>
        </Button>
      </div>
    )
  }

  const pct =
    session.totalSessions <= 0
      ? 0
      : (session.completedCount / session.totalSessions) * 100
  const remainingTl = Math.max(0, session.totalPriceTl - session.paidTotalTl)

  const mutable = session.status !== "CANCELLED"
  const phoneLabel = `+90 ${formatTrPhoneDisplay(session.customerPhone)}`
  const menuItemClass = "h-9 gap-2 rounded-md px-3 font-display font-semibold"

  return (
    <div className="min-w-0 px-4 py-5 [overflow-wrap:anywhere] md:px-8 md:py-8">
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {session.name}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {session.customerFirstName} {session.customerLastName}
          </p>
        </div>
        <div className="grid gap-2 sm:flex sm:flex-wrap">
          {mutable ? (
            <Button
              className="h-12 w-full rounded-xl text-base sm:w-auto"
              variant="outline"
              disabled={queueing || remainingTl < 1 || feeQueued}
              title={feeQueued ? "Kasada bekliyor" : undefined}
              onClick={() => void sendToRegister()}
            >
              <Wallet data-icon="inline-start" />
              Kasaya gönder
            </Button>
          ) : null}
          {mutable ? (
            <Button
              className="h-12 w-full rounded-xl text-base sm:w-auto"
              disabled={
                actions.complete.isPending ||
                session.status !== "ACTIVE" ||
                session.completedCount >= session.totalSessions
              }
              onClick={() => { actions.complete.reset(); setCompleteOpen(true) }}
            >
              <CircleCheck data-icon="inline-start" />
              Seans tamamlandı
            </Button>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="h-11 w-full rounded-xl px-4 text-base sm:h-12 sm:w-auto"
                variant="outline"
                size="icon"
                aria-label="Diğer işlemler"
              >
                <span>Diğer işlemler</span><ChevronDown data-icon="inline-end" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-max min-w-0">
              <DropdownMenuItem disabled asChild className={menuItemClass}>
                <a
                  aria-disabled="true" tabIndex={-1}
                  target="_blank"
                  rel="noreferrer"
                >
                  <WhatsAppIcon className="size-4 text-[#25D366]" />
                  WhatsApp’a yönlendir
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem
                className={menuItemClass}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(phoneLabel)
                    showCopiedToast()
                  } catch {
                    /* ignore */
                  }
                }}
              >
                <Copy />
                Telefonu kopyala
              </DropdownMenuItem>
              {mutable ? (
                <>
                  <DropdownMenuItem className={menuItemClass} onClick={() => { actions.edit.reset(); setEditOpen(true) }}>
                    <Pencil />
                    Paketi düzenle
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    className={menuItemClass}
                    onClick={() => {
                      actions.cancel.reset()
                      setCancelOpen(true)
                    }}
                  >
                    <Trash2 />
                    İptal et
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Card className="mb-5">
        <CardContent>
          <PackageStanding
            session={session}
            progress={pct}
            onShowEvent={showSessionEvent}
          />
        </CardContent>
      </Card>

      <section>
        <Tabs value={historyTab} onValueChange={setHistoryTab}>
          <TabsList className="mb-2 w-full rounded-xl group-data-horizontal/tabs:h-12 sm:w-fit">
            <TabsTrigger value="activity">İşlem geçmişi</TabsTrigger>
            <TabsTrigger value="payments">Tahsilat geçmişi</TabsTrigger>
          </TabsList>
          <TabsContent value="activity">
            <EventHistory
              events={session.events.filter(
                (event) => event.kind !== "PAID" && event.kind !== "ADJUSTED"
              )}
              mode="activity"
              highlightEventId={highlightEventId}
              mutable={mutable}
              onUndo={(event) => {
                actions.undo.reset()
                setUndoTarget(event)
              }}
            />
          </TabsContent>
          <TabsContent value="payments">
            <EventHistory
              events={session.events.filter(
                (event) => event.kind === "PAID" && (event.amountTl ?? 0) > 0
              )}
              mode="payment"
              mutable={mutable}
              onUndo={(event) => {
                actions.undo.reset()
                setUndoTarget(event)
              }}
            />
          </TabsContent>
        </Tabs>
      </section>

      {completeOpen && <CompleteVisitSheet session={session} pendingVisits={pendingVisits} staff={staff} mutation={actions.complete} onClose={() => setCompleteOpen(false)} />}

      {editOpen && <EditPackageSheet session={session} services={services} mutation={actions.edit} onClose={() => setEditOpen(false)} />}

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Paketi iptal et</AlertDialogTitle>
            <AlertDialogDescription>
              {session.name} paketini iptal etmek istiyor musun?
            </AlertDialogDescription>
          </AlertDialogHeader>
          {cancelError ? (
            <p className="text-sm text-destructive">{cancelError}</p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11 rounded-xl text-base" disabled={cancelling}>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              className="h-12 rounded-xl text-base"
              disabled={cancelling}
              onClick={(event) => {
                event.preventDefault()
                void cancelPackage()
              }}
            >
              {cancelling ? "İptal ediliyor…" : "İptal et"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={undoTarget != null}
        onOpenChange={(open) => {
          if (!open && !undoing) setUndoTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Geri al</AlertDialogTitle>
            <AlertDialogDescription>
              {undoTarget?.kind === "PAID"
                ? "Bu tahsilatı geri almak istiyor musun?"
                : "Bu işlemi geri almak istiyor musun?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {undoError ? (
            <p className="text-sm text-destructive">{undoError}</p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11 rounded-xl text-base" disabled={undoing}>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              className="h-12 rounded-xl text-base"
              disabled={undoing}
              onClick={(event) => {
                event.preventDefault()
                void undoEvent()
              }}
            >
              {undoing ? "Geri alınıyor…" : "Geri al"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
