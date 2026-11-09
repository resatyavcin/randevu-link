"use client"

import * as React from "react"
import Link from "next/link"
import {
  Banknote,
  CreditCard,
  X,
} from "lucide-react"
import { Badge } from "@/presentation/components/ui/badge"
import { Button } from "@/presentation/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/presentation/components/ui/tooltip"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/presentation/components/ui/table"
import type { SessionChargeDto } from "@/domain/models/contracts"
import { formatTry, type Appointment, type PaymentMethod } from "@/presentation/lib/appointment-display"
import { StaffNamePair } from "@/presentation/components/dashboard/staff-name-pair"
import { TableSkeletonRows } from "@/presentation/components/dashboard/table-skeleton-rows"
import { ShortId } from "@/presentation/components/ui/short-id"

export function PaymentMethodMark({ method }: { method: PaymentMethod | null | undefined }) {
  if (!method) {
    return <span className="text-muted-foreground">—</span>
  }
  if (method === "cash") {
    return (
      <Badge className="rounded-md border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400">
        <Banknote data-icon="inline-start" />
        Nakit
      </Badge>
    )
  }
  return (
    <Badge className="rounded-md border-transparent bg-sky-500/15 text-sky-600 dark:text-sky-400">
      <CreditCard data-icon="inline-start" />
      Kart
    </Badge>
  )
}

export function SessionTag({ sessionId }: { sessionId?: string | null }) {
  const className =
    "rounded-md border-transparent bg-indigo-muted text-indigo hover:bg-indigo/25! hover:text-indigo"
  if (!sessionId) {
    return <Badge className={className}>Seans</Badge>
  }
  return (
    <Badge asChild className={className}>
      <Link
        href={`/sessions/${sessionId}`}
        onClick={(event) => event.stopPropagation()}
      >
        Seans
      </Link>
    </Badge>
  )
}

export function VisitStatusBadge({
  status,
  cancelled,
}: {
  status?: Appointment["status"]
  cancelled?: boolean
}) {
  if (cancelled || status === "CANCELLED") {
    return (
      <Badge className="rounded-md border-transparent bg-red-500/15 text-red-600 dark:text-red-400">
        İptal
      </Badge>
    )
  }
  if (status === "COMPLETED") {
    return (
      <Badge className="rounded-md border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
        Tamamlandı
      </Badge>
    )
  }
  return (
    <Badge className="rounded-md border-transparent bg-violet-500/15 text-violet-600 dark:text-violet-400">
      Bekliyor
    </Badge>
  )
}

export function PaymentStatusBadge({
  payment,
  cancelled,
}: {
  payment: Appointment["payment"]
  cancelled?: boolean
}) {
  if (cancelled) {
    return (
      <Badge className="rounded-md border-transparent bg-red-500/15 text-red-600 dark:text-red-400">
        İptal
      </Badge>
    )
  }
  if (payment === "success") {
    return (
      <Badge className="rounded-md border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
        Başarılı
      </Badge>
    )
  }
  return (
    <Badge className="rounded-md border-transparent bg-violet-500/15 text-violet-600 dark:text-violet-400">
      Beklemede
    </Badge>
  )
}

export function ServiceCount({
  sessionId,
  serviceName,
  extraNames = [],
  count,
}: {
  sessionId?: string | null
  serviceName?: string | null
  extraNames?: string[]
  count?: number
}) {
  const extras = extraNames.filter(Boolean)
  const total = count ?? (serviceName ? 1 : 0) + extras.length
  const countLabel = `${total} hizmet`
  const hasNames = Boolean(serviceName) || extras.length > 0

  return (
    <div className="flex min-w-0 items-center gap-1.5 whitespace-nowrap">
      {sessionId ? <SessionTag sessionId={sessionId} /> : null}
      {hasNames ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="rounded-sm underline decoration-dotted underline-offset-4 hover:text-foreground"
            >
              {countLabel}
            </button>
          </TooltipTrigger>
          <TooltipContent className="flex-col items-start gap-1">
            {serviceName ? (
              <span className="flex items-center gap-1.5 font-medium">
                {serviceName}
                <span className="rounded bg-background/20 px-1 py-px text-[10px] font-medium">
                  Ana
                </span>
              </span>
            ) : null}
            {extras.map((name, index) => (
              <span key={`${name}-${index}`}>{name}</span>
            ))}
          </TooltipContent>
        </Tooltip>
      ) : (
        <span>{countLabel}</span>
      )}
    </div>
  )
}

function ServiceSummary({
  row,
  compact,
}: {
  row: Appointment
  compact: boolean
}) {
  if (compact) {
    return (
      <div className="flex min-w-0 items-center gap-1.5 whitespace-nowrap">
        {row.sessionId ? <SessionTag sessionId={row.sessionId} /> : null}
        <span className="block max-w-40 truncate">{row.service}</span>
      </div>
    )
  }
  return (
    <ServiceCount
      sessionId={row.sessionId}
      serviceName={row.service}
      extraNames={(row.extras ?? []).map((item) => item.name)}
      count={row.itemCount}
    />
  )
}

function formatChargeWhen(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  const month = date.toLocaleDateString("tr-TR", { month: "short" }).replace(".", "")
  const weekday = date.toLocaleDateString("tr-TR", { weekday: "long" })
  const time = date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
  return `${date.getDate()} ${month} ${weekday} · ${time}`
}

export function AppointmentsTable({
  rows,
  charges = [],
  onSelectCustomer,
  onCollect,
  onCollectCharge,
  onCancel,
  compact = false,
  showPayment = true,
  loading = false,
  highlightChargeId = null,
  highlightNonce = 0,
  stickyHeader = false,
}: {
  rows: Appointment[]
  charges?: SessionChargeDto[]
  onSelectCustomer?: (customerId: string) => void
  onCollect?: (row: Appointment) => void
  onCollectCharge?: (charge: SessionChargeDto) => void
  onCancel?: (row: Appointment) => void
  compact?: boolean
  showPayment?: boolean
  loading?: boolean
  highlightChargeId?: string | null
  highlightNonce?: number
  stickyHeader?: boolean
}) {
  const showActions = Boolean(onCollect || onCancel) && !compact
  const [clearedNonce, setClearedNonce] = React.useState(0)
  const litChargeId =
    highlightChargeId && highlightNonce > 0 && highlightNonce !== clearedNonce
      ? highlightChargeId
      : null

  React.useEffect(() => {
    if (!litChargeId || loading) return
    const row = document.getElementById("linked-charge")
    if (!row) return
    row.scrollIntoView({ block: "center", behavior: "smooth" })
    const nonce = highlightNonce
    const timer = window.setTimeout(() => setClearedNonce(nonce), 1600)
    return () => window.clearTimeout(timer)
  }, [litChargeId, highlightNonce, loading, charges])
  const showMoney = showPayment && !compact
  const colSpan = (compact ? 5 : showMoney ? 7 : 5) + (showActions ? 1 : 0)

  return (
    <Table
      aria-busy={loading || undefined}
      containerClassName={stickyHeader ? "overflow-visible" : undefined}
    >
      <TableHeader
        className={
          stickyHeader
            ? "sticky top-0 z-10 [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-[color-mix(in_oklab,var(--muted)_50%,var(--card))]"
            : undefined
        }
      >
        <TableRow>
          <TableHead className="w-[100px]">Randevu</TableHead>
          {compact ? null : <TableHead>Müşteri</TableHead>}
          {showMoney ? <TableHead className="text-right">Tutar</TableHead> : null}
          <TableHead>Hizmet</TableHead>
          <TableHead>Tarih</TableHead>
          <TableHead>Durum</TableHead>
          {compact ? (
            <TableHead>Personel</TableHead>
          ) : showMoney ? (
            <TableHead>Yöntem</TableHead>
          ) : null}
          {showActions ? <TableHead className="text-right">İşlem</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableSkeletonRows
            rows={8}
            columns={[
              { key: "id", skeletonClassName: "h-4 w-20" },
              ...(compact
                ? []
                : [{ key: "customer", skeletonClassName: "h-4 w-28" }]),
              ...(showMoney
                ? [{ key: "amount", skeletonClassName: "h-4 w-16" }]
                : []),
              { key: "service", skeletonClassName: "h-4 w-32" },
              { key: "date", skeletonClassName: "h-4 w-24" },
              { key: "payment", skeletonClassName: "h-5 w-16 rounded-md" },
              ...(compact || showMoney
                ? [
                    {
                      key: "method",
                      className: compact ? undefined : "text-right",
                      skeletonClassName: compact
                        ? "h-4 w-20"
                        : "ml-auto h-5 w-14 rounded-md",
                    },
                  ]
                : []),
              ...(showActions
                ? [
                    {
                      key: "actions",
                      className: "text-right",
                      skeletonClassName: "ml-auto h-8 w-24",
                    },
                  ]
                : []),
            ]}
          />
        ) : rows.length === 0 && charges.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell
              colSpan={colSpan}
              className="py-10 text-center text-sm text-muted-foreground"
            >
              Kayıtlı randevu yok.
            </TableCell>
          </TableRow>
        ) : null}
        {loading
          ? null
          : charges.map((charge) => {
          const customer = `${charge.customerFirstName} ${charge.customerLastName}`.trim()
          return (
            <TableRow
              key={charge.id}
              id={litChargeId === charge.id ? "linked-charge" : undefined}
              className={
                litChargeId === charge.id
                  ? "bg-emerald-500/25 shadow-[inset_0_0_0_1px] shadow-emerald-400/50"
                  : undefined
              }
            >
              <TableCell className="font-medium">
                <ShortId value={charge.id} />
              </TableCell>
              {compact ? null : (
                <TableCell className=" font-medium">{customer}</TableCell>
              )}
              {showMoney ? (
                <TableCell className="text-right tabular-nums">
                  {charge.amountTl != null ? formatTry(charge.amountTl) : "—"}
                </TableCell>
              ) : null}
              <TableCell className=" text-muted-foreground">
                <p>
                  {(charge.extras ?? []).length > 0
                    ? (charge.extras ?? []).map((item) => item.name).join(", ")
                    : "Seans ücreti"}
                </p>
                <Link
                  href={`/sessions/${charge.sessionId}`}
                  onClick={(event) => event.stopPropagation()}
                  className="mt-0.5 block text-xs hover:text-foreground hover:underline"
                >
                  {charge.sessionName}
                </Link>
                {charge.staffName ? (
                  <span className="mt-0.5 block text-xs">{charge.staffName}</span>
                ) : null}
              </TableCell>
              <TableCell className=" text-muted-foreground">
                {formatChargeWhen(charge.createdAt)}
              </TableCell>
              <TableCell className="">
                <PaymentStatusBadge payment="pending" />
              </TableCell>
              {compact ? (
                <TableCell className=" text-muted-foreground">
                  {charge.staffName ?? "—"}
                </TableCell>
              ) : showMoney ? (
                <TableCell className=" text-right">
                  <PaymentMethodMark method={null} />
                </TableCell>
              ) : null}
              {showActions ? (
                <TableCell className=" text-right">
                  {onCollectCharge ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCollectCharge(charge)}
                    >
                      <Banknote data-icon="inline-start" />
                      {(charge.extras ?? []).length > 0 ? "Tahsil et" : "Seans ücreti al"}
                    </Button>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              ) : null}
            </TableRow>
          )
        })}
        {loading
          ? null
          : rows.map((row) => {
          return (
            <TableRow
              key={row.id}
              className={onSelectCustomer ? "cursor-pointer" : undefined}
              onClick={(event) => {
                if (!onSelectCustomer) return
                const target = event.target as HTMLElement
                if (target.closest("a, button")) return
                onSelectCustomer(row.customerId)
              }}
            >
              <TableCell className="">
                <ShortId value={row.id} />
              </TableCell>
              {compact ? null : (
                <TableCell className="font-medium">
                  {row.customer}
                </TableCell>
              )}
              {showMoney ? (
                <TableCell className="text-right tabular-nums">
                  <span>{formatTry(row.total)}</span>
                  {row.quotedTotal != null &&
                  row.quotedTotal !== row.total ? (
                    <span className="ml-1 text-xs text-muted-foreground line-through">
                      {formatTry(row.quotedTotal)}
                    </span>
                  ) : null}
                </TableCell>
              ) : null}
              <TableCell className="text-muted-foreground">
                <ServiceSummary row={row} compact={compact} />
              </TableCell>
              <TableCell className=" text-muted-foreground">
                {row.dateLabel}
              </TableCell>
              <TableCell className="">
                {showMoney ? (
                  <PaymentStatusBadge
                    payment={row.payment}
                    cancelled={row.filterTags.includes("cancelled")}
                  />
                ) : (
                  <VisitStatusBadge
                    status={row.status}
                    cancelled={row.filterTags.includes("cancelled")}
                  />
                )}
              </TableCell>
              {compact ? (
                <TableCell className=" text-muted-foreground">
                  <StaffNamePair
                    booked={row.staffName}
                    served={row.servedStaffName}
                  />
                </TableCell>
              ) : showMoney ? (
                <TableCell className=" text-right">
                  <PaymentMethodMark method={row.method} />
                </TableCell>
              ) : null}
              {showActions ? (
                <TableCell className=" text-right">
                  {row.status === "PENDING" ||
                  row.filterTags.includes("pending") ? (
                    <div className="flex justify-end gap-1">
                      {onCollect ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onCollect(row)}
                        >
                          <Banknote data-icon="inline-start" />
                          Tahsil et
                        </Button>
                      ) : null}
                      {onCancel ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onCancel(row)}
                          aria-label="İptal"
                        >
                          <X className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              ) : null}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
