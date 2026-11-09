"use client"

import * as React from "react"
import { Banknote, Tag, Wallet } from "lucide-react"
import { SESSION_STATUS_LABELS, type SessionDto } from "@/domain/models/contracts"
import { formatTry } from "@/presentation/lib/appointment-display"
import { cn } from "@/presentation/lib/utils"

export function PackageStanding({
  session,
  progress,
  onShowEvent,
}: {
  session: SessionDto
  progress: number
  onShowEvent: (eventId: string) => void
}) {
  const credit = session.creditBalanceTl
  const slots = packageSlots(session)
  const counts = {
    paid: slots.filter((slot) => slot.kind === "paid").length,
    credit: slots.filter((slot) => slot.kind === "credit").length,
    debt: slots.filter((slot) => slot.kind === "debt").length,
    unpaid: slots.filter((slot) => slot.kind === "unpaid").length,
  }
  const debtSlots = slots.filter((slot) => slot.kind === "debt")
  const creditSlots = slots.filter((slot) => slot.kind === "credit")
  const balanceDetail =
    credit > 0
      ? creditSlots.length === 1
        ? `${creditSlots[0].n}. seans ödendi, müşteri gelmedi`
        : creditSlots.length > 1
          ? `${creditSlots.length} seans ödendi, müşteri gelmedi`
          : "Fazla ödeme kredide duruyor"
      : credit < 0
        ? debtSlots.length === 1
          ? `${debtSlots[0].n}. seansın ödemesi eksik`
          : debtSlots.length > 1
            ? `${debtSlots.length} seans geldi, ödeme eksik`
            : "Ödeme eksik"
        : "Kalan tahsilat"
  const balanceValue =
    credit === 0
      ? formatTry(Math.max(0, session.totalPriceTl - session.paidTotalTl))
      : formatTry(Math.abs(credit))
  const summary = [
    counts.paid > 0 ? `${counts.paid} ödendi` : null,
    counts.debt > 0 ? `${counts.debt} ödeme eksik` : null,
    counts.credit > 0 ? `${counts.credit} kredi` : null,
    counts.unpaid > 0 ? `${counts.unpaid} bekliyor` : null,
  ]
    .filter(Boolean)
    .join(" · ")
  const currentN = Math.min(session.totalSessions, Math.max(1, session.completedCount))
  const title = session.serviceName || session.name
  const scrollerRef = React.useRef<HTMLDivElement>(null)
  const currentRef = React.useRef<HTMLElement>(null)

  React.useLayoutEffect(() => {
    const scroller = scrollerRef.current
    const node = currentRef.current
    if (!scroller || !node) return
    const left =
      node.getBoundingClientRect().left -
      scroller.getBoundingClientRect().left +
      scroller.scrollLeft -
      (scroller.clientWidth - node.offsetWidth) / 2
    scroller.scrollLeft = Math.max(0, left)
  }, [session.id, currentN, session.totalSessions])

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {session.totalSessions} seanslık paket
            {session.periodNote ? ` · ${session.periodNote}` : ""}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
            session.status === "ACTIVE" &&
              "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
            session.status === "COMPLETED" &&
              "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
            session.status === "CANCELLED" && "bg-red-500/15 text-red-700 dark:text-red-400",
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              session.status === "ACTIVE" && "bg-emerald-500",
              session.status === "COMPLETED" && "bg-indigo-500",
              session.status === "CANCELLED" && "bg-red-500",
            )}
          />
          {SESSION_STATUS_LABELS[session.status]}
        </span>
      </div>

      <div>
        <div className="flex items-end justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            <span className="text-4xl font-semibold tracking-tight text-foreground tabular-nums">
              {session.completedCount}
            </span>
            <span className="text-2xl font-medium tabular-nums"> / {session.totalSessions}</span>
            <span className="ml-2">seans tamamlandı</span>
          </p>
          <p className="pb-1 text-sm font-medium text-muted-foreground tabular-nums">
            %{Math.round(progress)}
          </p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
        {summary ? <p className="mt-2 text-sm text-muted-foreground">{summary}</p> : null}
      </div>

      <div ref={scrollerRef} className="-mx-1 overflow-x-auto px-1">
        <ol className="grid grid-cols-3 gap-y-2 py-1 sm:flex sm:w-max sm:min-w-full sm:items-start">
          {slots.map((slot, index) => {
            const previous = index > 0 ? slots[index - 1] : null
            const current = slot.n === currentN
            const clickable = slot.eventId != null
            return (
              <li key={slot.n} className="flex items-start justify-center">
                {previous ? (
                  <span
                    className={cn(
                      "mt-5 hidden w-8 shrink-0 sm:block",
                      previous.kind === "unpaid" || slot.kind === "unpaid"
                        ? "h-0 border-t-2 border-dashed border-muted-foreground/35"
                        : cn(
                            "h-0.5",
                            slot.kind === "debt" || previous.kind === "debt"
                              ? "bg-border"
                              : slot.kind === "credit" || previous.kind === "credit"
                                ? "bg-amber-400"
                                : "bg-emerald-400",
                          ),
                    )}
                  />
                ) : null}
                <button
                  type="button"
                  ref={current ? (currentRef as React.Ref<HTMLButtonElement>) : undefined}
                  disabled={!clickable}
                  onClick={() => {
                    if (slot.eventId) onShowEvent(slot.eventId)
                  }}
                  className={cn(
                    "flex w-16 shrink-0 flex-col items-center gap-1.5 rounded-lg disabled:opacity-100",
                    clickable && "cursor-pointer",
                    !clickable && "cursor-default",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
                      slot.kind === "paid" &&
                        "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                      slot.kind === "credit" &&
                        "bg-amber-500/15 text-amber-800 dark:text-amber-300",
                      slot.kind === "debt" && "bg-muted text-foreground",
                      slot.kind === "unpaid" && "text-muted-foreground",
                    )}
                  >
                    {slot.n}
                  </span>
                  <span
                    className={cn(
                      "text-center text-[11px] leading-tight font-medium",
                      slot.kind === "paid" && "text-emerald-700 dark:text-emerald-300",
                      slot.kind === "credit" && "text-amber-800 dark:text-amber-300",
                      slot.kind === "debt" && "text-foreground",
                      slot.kind === "unpaid" && "text-muted-foreground",
                    )}
                  >
                    {slot.label}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <MoneyCard
          icon={<Wallet className="size-4" />}
          tone="paid"
          label="Tahsil edilen"
          value={formatTry(session.paidTotalTl)}
          detail={`/ ${formatTry(session.totalPriceTl)} toplam`}
        />
        <MoneyCard
          icon={<Tag className="size-4" />}
          tone="unit"
          label="Seans ücreti"
          value={formatTry(session.unitPriceTl)}
          detail="/ seans"
        />
        <MoneyCard
          icon={<Banknote className="size-4" />}
          tone={credit > 0 ? "credit" : credit < 0 ? "debt" : "unit"}
          label={credit > 0 ? "Kredi" : credit < 0 ? "Borç" : "Kalan bakiye"}
          value={balanceValue}
          detail={balanceDetail}
        />
      </div>
    </div>
  )
}

function MoneyCard({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string
  detail: string
  tone: "paid" | "unit" | "credit" | "debt"
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl px-3 py-3",
        tone === "paid" && "bg-emerald-500/10",
        tone === "unit" && "bg-muted/70",
        tone === "credit" && "bg-amber-500/10",
        tone === "debt" && "bg-muted/70",
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          tone === "paid" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
          tone === "unit" && "bg-background text-muted-foreground",
          tone === "credit" && "bg-amber-500/15 text-amber-800 dark:text-amber-300",
          tone === "debt" && "bg-muted text-foreground",
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p
          className={cn(
            "text-lg font-semibold tracking-tight tabular-nums",
            tone === "debt" && "text-foreground",
            tone === "credit" && "text-amber-800 dark:text-amber-300",
          )}
        >
          {value}
        </p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  )
}

type SlotKind = "paid" | "credit" | "debt" | "unpaid"

function packageSlots(
  session: SessionDto,
): { n: number; kind: SlotKind; label: string; eventId: string | null }[] {
  const completedIds = session.events
    .filter((event) => event.kind === "COMPLETED")
    .slice()
    .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt))
    .map((event) => event.id)
  const unit = session.unitPriceTl
  const total = session.totalSessions
  const completed = session.completedCount
  const paid = session.paidTotalTl
  return Array.from({ length: total }, (_, index) => {
    const n = index + 1
    const done = n <= completed
    const eventId = done ? (completedIds[n - 1] ?? null) : null
    if (unit <= 0) {
      return {
        n,
        kind: done ? "paid" : "unpaid",
        label: done ? "Ödendi" : "Bekliyor",
        eventId,
      }
    }
    const fullPaid = Math.floor(paid / unit)
    const remainder = paid - fullPaid * unit
    const covered = n <= fullPaid
    const partial = n === fullPaid + 1 && remainder > 0
    if (covered && done) return { n, kind: "paid", label: "Ödendi", eventId }
    if (covered && !done) return { n, kind: "credit", label: "Kredi", eventId }
    if (partial && done) return { n, kind: "debt", label: "Ödeme eksik", eventId }
    if (partial && !done) return { n, kind: "credit", label: "Kredi", eventId }
    if (done) return { n, kind: "debt", label: "Ödeme eksik", eventId }
    return { n, kind: "unpaid", label: "Bekliyor", eventId }
  })
}
