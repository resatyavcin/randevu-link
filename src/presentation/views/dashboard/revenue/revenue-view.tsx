"use client";

import { useRevenue } from "@/presentation/hooks/revenue-queries";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowDownLeft, Banknote, CalendarDays, CreditCard, Plus, Wallet } from "lucide-react";
import { tr } from "react-day-picker/locale";
import type { DateRange } from "react-day-picker";
import {
  AppointmentsTable,
  PaymentMethodMark,
  ServiceCount,
} from "@/presentation/components/dashboard/appointments/appointments-table";
import { CollectPaymentSheet } from "@/presentation/components/dashboard/appointments/collect-payment-sheet";
import {
  QueuedSessionFeeSheet,
  SessionFeeSheet,
  WalkInExtraSheet,
} from "@/presentation/components/dashboard/revenue/register-sheets";
import { Sparkline } from "@/presentation/components/dashboard/sparkline";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import { TablePagination } from "@/presentation/components/dashboard/table-pagination";
import { QueryTableBody } from "@/presentation/components/dashboard/query-table-body";
import { useTablePageSize } from "@/presentation/components/dashboard/use-table-page-size";
import { Button } from "@/presentation/components/ui/button";
import { Calendar } from "@/presentation/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/presentation/components/ui/popover";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import type { PageResponse, PaymentMethodApi, RevenuePaymentDto, RevenueSummaryDto, SessionChargeDto } from "@/domain/models/contracts";
import { DEFAULT_TABLE_PAGE_SIZE, REVENUE_DAY_OPTIONS } from "@/domain/models/contracts";
import { formatTry, type Appointment } from "@/presentation/lib/appointment-display";
import { cn } from "@/presentation/lib/utils";
import { ShortId } from "@/presentation/components/ui/short-id";

type Period =
  | { kind: "days"; days: (typeof REVENUE_DAY_OPTIONS)[number] }
  | { kind: "range"; from: string; to: string };

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseIsoDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDayLabel(iso: string) {
  return parseIsoDate(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRangeLabel(from: string, to: string) {
  if (from === to) return formatDayLabel(from);
  return `${formatDayLabel(from)} – ${formatDayLabel(to)}`;
}

function pendingWindow(period: Period) {
  if (period.kind === "range") return { from: period.from, to: period.to };
  const today = startOfToday();
  if (period.days === 1)
    return { from: toIsoDate(today), to: toIsoDate(today) };
  return {
    from: toIsoDate(addDays(today, -(period.days - 1))),
    to: toIsoDate(addDays(today, period.days - 1)),
  };
}

function revenueQuery(period: Period) {
  if (period.kind === "range") return { from: period.from, to: period.to };
  return { days: period.days };
}

const EMPTY_SUMMARY: RevenueSummaryDto = {
  days: 30,
  totalPaidTl: 0,
  cashTl: 0,
  cardTl: 0,
  paidCount: 0,
  pendingCount: 0,
  cancelledCount: 0,
  averageTicketTl: 0,
  quotedTotalTl: 0,
  differenceTl: 0,
  daily: [],
};

const EMPTY_PAYMENTS: PageResponse<RevenuePaymentDto> = {
  content: [],
  page: 0,
  size: DEFAULT_TABLE_PAGE_SIZE,
  totalElements: 0,
  totalPages: 1,
};

const EMPTY_PENDING: PageResponse<Appointment> = {
  content: [],
  page: 0,
  size: DEFAULT_TABLE_PAGE_SIZE,
  totalElements: 0,
  totalPages: 1,
};

const DAY_LABELS: Record<(typeof REVENUE_DAY_OPTIONS)[number], string> = {
  1: "Bugün",
  30: "Son 30 gün",
  90: "Son 90 gün",
};

function seriesPoints(values: number[]) {
  if (values.length >= 2) return values;
  return [0, values[0] ?? 0];
}

function methodOf(value: PaymentMethodApi | null): "cash" | "card" | null {
  if (value === "CASH") return "cash";
  if (value === "CARD") return "card";
  return null;
}

const columns = [
                    { key: "id", skeletonClassName: "h-4 w-20" },
                    { key: "customer", skeletonClassName: "h-4 w-28" },
                    { key: "service", skeletonClassName: "h-4 w-32" },
                    { key: "quoted", skeletonClassName: "h-4 w-16" },
                    { key: "paid", skeletonClassName: "h-4 w-16" },
                    { key: "diff", skeletonClassName: "h-4 w-14" },
                    { key: "method", skeletonClassName: "h-5 w-14 rounded-md" },
                    {
                      key: "date",
                      className: "text-right",
                      skeletonClassName: "ml-auto h-4 w-24",
                    },
                  ]

export function RevenueView() {
  const searchParams = useSearchParams();
  const {
    pageSize,
    setPageSize,
    loaded: pageSizeLoaded,
  } = useTablePageSize("revenue");
  const [period, setPeriod] = React.useState<Period>({
    kind: "days",
    days: 30,
  });
  const [rangeOpen, setRangeOpen] = React.useState(false);
  const [rangeDraft, setRangeDraft] = React.useState<DateRange | undefined>();
  const pickingEnd = React.useRef(false);
  const [tab, setTab] = React.useState<"pending" | "paid">(
    searchParams.get("tab") === "pending" ? "pending" : "paid",
  );
  const [method, setMethod] = React.useState<PaymentMethodApi | "all">("all");
  const [page, setPage] = React.useState(0);
  const [collecting, setCollecting] = React.useState<Appointment | null>(null);
  const [collectingCharge, setCollectingCharge] =
    React.useState<SessionChargeDto | null>(null);
  const [sessionFeeOpen, setSessionFeeOpen] = React.useState(false);
  const [extraOpen, setExtraOpen] = React.useState(false);

  const {
    summary = EMPTY_SUMMARY, pending = EMPTY_PENDING, payments = EMPTY_PAYMENTS,
    feeCharges, pendingAppointmentCount, loading, error, refresh,
  } = useRevenue({
    period: revenueQuery(period), window: pendingWindow(period),
    tab, method, page, size: pageSize, enabled: pageSizeLoaded,
  })

  const applyRange = React.useCallback((next: DateRange | undefined) => {
    if (!next?.from) {
      pickingEnd.current = false;
      setRangeDraft(undefined);
      return;
    }
    if (!pickingEnd.current) {
      pickingEnd.current = true;
      setRangeDraft({ from: next.from, to: undefined });
      return;
    }
    const end = next.to ?? next.from;
    setRangeDraft({ from: next.from, to: end });
    setPage(0);
    setPeriod({
      kind: "range",
      from: toIsoDate(next.from),
      to: toIsoDate(end),
    });
    setRangeOpen(false);
    pickingEnd.current = false;
  }, []);

  const table = tab === "pending" ? pending : payments;

  return (
    <div className="px-5 py-6 md:px-8 md:py-8">
      <header className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">İŞLETMENİN FİNANSAL ÖZETİ</p>
          <h1 className="text-2xl font-bold tracking-tight">Kasa</h1>
        </div>
        <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Wallet className="size-5" /></span>
      </header>

      <div className="mb-4 grid grid-cols-3 gap-1 rounded-2xl bg-muted/60 p-1">
        {REVENUE_DAY_OPTIONS.map((option) => (
          <Button
            key={option}
            type="button"
            size="sm"
            variant={
              period.kind === "days" && period.days === option
                ? "default"
                : "outline"
            }
            className="min-h-11 rounded-xl px-2 text-xs shadow-none sm:text-sm"
            onClick={() => {
              setPage(0);
    setPeriod({ kind: "days", days: option });
              setRangeDraft(undefined);
            }}
          >
            {DAY_LABELS[option]}
          </Button>
        ))}
        <Popover
          open={rangeOpen}
          onOpenChange={(open) => {
            setRangeOpen(open);
            pickingEnd.current = false;
            if (open) {
              setRangeDraft(
                period.kind === "range"
                  ? {
                      from: parseIsoDate(period.from),
                      to: parseIsoDate(period.to),
                    }
                  : undefined,
              );
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant={period.kind === "range" ? "default" : "outline"}
              className="col-span-3 min-h-11 w-full justify-center rounded-xl text-xs sm:text-sm"
            >
              <CalendarDays />
              {period.kind === "range"
                ? formatRangeLabel(period.from, period.to)
                : "Tarih"}
            </Button>
          </PopoverTrigger>
          {rangeOpen ? (
            <PopoverContent align="start" className="w-auto max-w-[calc(100vw-2rem)] p-0">
              <Calendar
                mode="range"
                defaultMonth={rangeDraft?.from}
                numberOfMonths={1}
                locale={tr}
                weekStartsOn={1}
                selected={rangeDraft}
                onSelect={applyRange}
                disabled={{ after: addDays(startOfToday(), 365) }}
                classNames={{
                  months: "relative flex flex-col gap-4",
                  month: "flex w-fit flex-col gap-4",
                }}
              />
            </PopoverContent>
          ) : null}
        </Popover>
      </div>

      <section aria-label="Kasa özeti" className="overflow-hidden rounded-3xl border border-primary/15 bg-primary/[0.04]">
        <div className="relative p-5 sm:p-6">
          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground"><ArrowDownLeft className="size-4 text-primary" />Toplam tahsilat</div>
          {loading ? <Skeleton className="h-12 w-48" /> : <p className="break-all text-4xl font-bold tracking-tighter tabular-nums sm:text-5xl">{formatTry(summary.totalPaidTl)}</p>}
          <div className="mt-4 flex items-end justify-between gap-3">
            <p className="text-xs text-muted-foreground">{loading ? "Hesaplanıyor…" : `${summary.paidCount} ödeme · seçili dönem`}</p>
            <span aria-hidden className="text-primary"><Sparkline points={seriesPoints(summary.daily.map(day => day.totalTl))} color="currentColor" /></span>
          </div>
        </div>
        <div className="grid grid-cols-2 border-t border-primary/10 bg-background/60">
          {[{label: "Nakit", value: summary.cashTl, icon: Banknote}, {label: "Kart", value: summary.cardTl, icon: CreditCard}].map(({label, value, icon: Icon}, index) => (
            <div key={label} className={cn("min-w-0 p-5", index === 0 && "border-r border-primary/10")}>
              <p className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><Icon className="size-4" />{label}</p>
              {loading ? <Skeleton className="h-7 w-24" /> : <p className="break-all text-xl font-semibold tracking-tight tabular-nums">{formatTry(value)}</p>}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-primary/10 px-5 py-3 text-xs text-muted-foreground">
          <span>Ortalama ödeme</span><span className="font-medium tabular-nums text-foreground">{loading ? "—" : formatTry(summary.averageTicketTl)}</span>
        </div>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button type="button" onClick={() => setSessionFeeOpen(true)} className="h-auto min-h-24 flex-col gap-2 rounded-2xl px-2 py-4 text-sm"><Wallet className="size-5" />Seans ücreti al</Button>
        <Button type="button" variant="outline" onClick={() => setExtraOpen(true)} className="h-auto min-h-24 flex-col gap-2 rounded-2xl px-2 py-4 text-sm"><Plus className="size-5" />Ek hizmet al</Button>
      </div>

      <h2 className="mt-8 mb-4 text-lg font-bold tracking-tight">Kasa hareketleri</h2>
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted/60 p-1">
        {[
          { id: "paid" as const, label: "Tahsil edilen" },
          {
            id: "pending" as const,
            label: `Bekleyen (${pendingAppointmentCount + feeCharges.length})`,
          },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => { setTab(item.id); setPage(0) }}
            className={cn(
              "relative min-h-12 rounded-xl px-2 text-sm font-semibold transition-colors",
              tab === item.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}

          </button>
        ))}
      </div>

      {tab === "paid" ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Ödeme yöntemi" className="flex w-full gap-2">
            {[{id: "all" as const, label: "Tümü"}, {id: "CASH" as const, label: "Nakit"}, {id: "CARD" as const, label: "Kart"}].map(item => <button key={item.id} type="button" aria-pressed={method === item.id} onClick={() => { setMethod(item.id); setPage(0) }} className={cn("min-h-11 flex-1 rounded-full border px-4 text-xs font-medium transition-colors", method === item.id ? "border-primary/20 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted")}>{item.label}</button>)}
          </div>
        </div>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="sm:hidden">
          {error ? <p role="alert" className="p-6 text-sm text-destructive">{error}</p> : loading ? <div className="space-y-5 p-4">{[0,1,2].map(i => <div key={i} className="flex justify-between gap-4"><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-40" /></div><Skeleton className="h-6 w-20" /></div>)}</div> : tab === "paid" ? (
            payments.content.length === 0 ? <RevenueEmpty pending={false} /> : <ul className="divide-y divide-border/60">{payments.content.map(row => <li key={row.appointmentId} className="p-4">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1"><p className="break-words text-sm font-semibold">{row.customerName}</p><p className="mt-1 break-words text-xs leading-relaxed text-muted-foreground">{[row.kind === "SESSION" ? row.sessionName || "Seans ücreti" : row.serviceName, ...row.extras.map(item => item.name)].filter(Boolean).join(" · ") || "Ek hizmet"}</p></div><p className="shrink-0 text-base font-bold tracking-tight tabular-nums">{formatTry(row.paidAmountTl)}</p></div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span>{row.paidAt ? new Date(row.paidAt).toLocaleString("tr-TR", {day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"}) : row.date}</span><PaymentMethodMark method={methodOf(row.paymentMethod)} /></div>
              {row.creditSessions > 0 ? <p className="mt-2 text-xs text-amber-600">{row.sessionId ? <Link href={`/sessions/${row.sessionId}`}>{row.creditSessions} seans krediden · Seansı gör</Link> : `${row.creditSessions} seans krediden`}</p> : row.paidAmountTl !== row.quotedPriceTl ? <p className="mt-2 text-xs text-muted-foreground">Liste: {formatTry(row.quotedPriceTl)} · Fark: {formatTry(row.paidAmountTl - row.quotedPriceTl)}</p> : null}
            </li>)}</ul>
          ) : <ul className="divide-y divide-border/60">
            {pending.content.length === 0 && feeCharges.length === 0 ? <li><RevenueEmpty pending /></li> : null}
            {feeCharges.map(row => <li key={row.id} className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="break-words text-sm font-semibold">{row.customerFirstName} {row.customerLastName}</p><p className="mt-1 text-xs text-muted-foreground">{row.sessionName} · Seans ücreti</p></div><span className="shrink-0 text-sm font-semibold tabular-nums">{row.amountTl == null ? "Tutar girilecek" : formatTry(row.amountTl)}</span></div><Button className="mt-4 min-h-11 w-full rounded-xl" onClick={() => setCollectingCharge(row)}>Tahsil et</Button></li>)}
            {pending.content.map(row => <li key={row.id} className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="break-words text-sm font-semibold">{row.customer}</p><p className="mt-1 text-xs text-muted-foreground">{row.service}</p></div><span className="shrink-0 text-sm font-semibold tabular-nums">{formatTry(row.total)}</span></div><p className="mt-3 text-xs text-muted-foreground">{row.dateLabel}</p><Button className="mt-3 min-h-11 w-full rounded-xl" onClick={() => setCollecting(row)}>Tahsil et</Button></li>)}
          </ul>}
        </div>
        <div className="hidden sm:block">
        {error ? (
          <p className="p-8 text-center text-sm text-destructive">{error}</p>
        ) : tab === "pending" ? (
          <AppointmentsTable
            rows={pending.content}
            charges={feeCharges}
            loading={loading}
            onCollect={setCollecting}
            onCollectCharge={setCollectingCharge}
          />
        ) : (
          <Table aria-busy={loading || undefined}>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Randevu</TableHead>
                <TableHead>Müşteri</TableHead>
                <TableHead>Hizmet</TableHead>
                <TableHead className="text-right">Liste</TableHead>
                <TableHead className="text-right">Tahsil</TableHead>
                <TableHead className="text-right">Fark</TableHead>
                <TableHead>Yöntem</TableHead>
                <TableHead className="text-right">Tarih</TableHead>
              </TableRow>
            </TableHeader>
            <QueryTableBody columns={columns} loading={loading} error={error} empty={payments.content.length === 0} emptyMessage="Bu aralıkta tahsilat yok.">
              {payments.content.map((row) => {
                  const fromCredit = row.creditSessions > 0;
                  const diff = row.paidAmountTl - row.quotedPriceTl;
                  return (
                    <TableRow key={row.appointmentId}>
                      <TableCell className="">
                        <ShortId value={row.appointmentId} />
                      </TableCell>
                      <TableCell className=" font-medium">
                        {row.customerName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <PaymentService row={row} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fromCredit ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          formatTry(row.quotedPriceTl)
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        <span className="block">
                          {formatTry(row.paidAmountTl)}
                        </span>
                        {fromCredit ? (
                          row.sessionId ? (
                            <Link
                              href={`/sessions/${row.sessionId}`}
                              className="mt-1 inline-flex rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 hover:opacity-80 dark:text-amber-400"
                            >
                              {row.creditSessions} seans krediden
                            </Link>
                          ) : (
                            <span className="mt-1 inline-flex rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                              {row.creditSessions} seans krediden
                            </span>
                          )
                        ) : null}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right tabular-nums",
                          diff > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : diff < 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-muted-foreground",
                        )}
                      >
                        {fromCredit || diff === 0
                          ? "—"
                          : `${diff > 0 ? "+" : ""}${formatTry(diff)}`}
                      </TableCell>
                      <TableCell className="">
                        <PaymentMethodMark
                          method={methodOf(row.paymentMethod)}
                        />
                      </TableCell>
                      <TableCell className=" text-right text-muted-foreground">
                        {row.paidAt
                          ? new Date(row.paidAt).toLocaleString("tr-TR", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : row.date}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </QueryTableBody>
          </Table>
        )}
        </div>
        <TablePagination
          className="max-sm:flex-col max-sm:items-stretch max-sm:[&>div]:justify-center"
          page={table.page}
          totalPages={table.totalPages}
          totalElements={table.totalElements}
          size={table.size}
          loading={loading}
          onPageChange={setPage}
          onPageSizeChange={(next) => {
            setPageSize(next);
            setPage(0);
          }}
        />
      </div>

      <CollectPaymentSheet
        appointment={collecting}
        onSettled={refresh}
        onOpenChange={(open) => {
          if (!open) setCollecting(null);
        }}
      />
      <SessionFeeSheet
        open={sessionFeeOpen}
        onSettled={refresh}
        onOpenChange={setSessionFeeOpen}
      />
      <QueuedSessionFeeSheet
        charge={collectingCharge}
        onSettled={refresh}
        onOpenChange={(open) => {
          if (!open) setCollectingCharge(null);
        }}
      />
      <WalkInExtraSheet
        open={extraOpen}
        onSettled={refresh}
        onOpenChange={setExtraOpen}
      />
    </div>
  );
}

function PaymentService({ row }: { row: RevenuePaymentDto }) {
  if (row.kind === "SESSION") {
    return (
      <div className="min-w-0">
        {row.sessionId ? (
          <Link href={`/sessions/${row.sessionId}`} className="hover:underline">
            Seans ücreti
          </Link>
        ) : (
          <span>Seans ücreti</span>
        )}
        {row.sessionName ? (
          <span className="mt-0.5 block text-xs">{row.sessionName}</span>
        ) : null}
      </div>
    );
  }
  if (row.kind === "EXTRA") {
    return <ServiceCount extraNames={row.extras.map((item) => item.name)} />;
  }
  return (
    <ServiceCount
      sessionId={row.sessionId}
      serviceName={row.serviceName}
      extraNames={row.extras.map((item) => item.name)}
    />
  );
}

function RevenueEmpty({ pending }: { pending: boolean }) {
  return <div className="flex flex-col items-center px-6 py-12 text-center"><span className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary"><Wallet className="size-6" strokeWidth={1.5} /></span><p className="text-sm font-semibold">{pending ? "Bekleyen tahsilat yok" : "Henüz tahsilat yok"}</p><p className="mt-2 max-w-60 text-xs leading-relaxed text-muted-foreground">{pending ? "Bu dönemdeki randevu ödemeleri ve bekleyen seans ücretleri burada görünür." : "Seçtiğiniz dönemde alınan ödemeler burada listelenir."}</p></div>;
}
