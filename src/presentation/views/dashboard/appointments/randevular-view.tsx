"use client"

import { useAppointmentPage, useAppointmentStats } from "@/presentation/hooks/appointment-queries"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  CalendarDays,
  Maximize2,
  Minimize2,
  Search,
  X,
} from "lucide-react"
import { tr } from "react-day-picker/locale"
import type { DateRange } from "react-day-picker"
import { Dialog as DialogPrimitive } from "radix-ui"
import { AppointmentsTable } from "@/presentation/components/dashboard/appointments/appointments-table"
import { CustomerDrawer } from "@/presentation/components/dashboard/appointments/customer-drawer"
import { AppointmentList } from "@/presentation/components/dashboard/appointments/appointment-list"
import { Button } from "@/presentation/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/presentation/components/dashboard/panel-sheet"
import { Calendar } from "@/presentation/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/presentation/components/ui/popover"
import { TablePagination } from "@/presentation/components/dashboard/table-pagination"
import { useTablePageSize } from "@/presentation/components/dashboard/use-table-page-size"
import type { AppointmentStatusApi, PageResponse } from "@/domain/models/contracts"
import { DEFAULT_TABLE_PAGE_SIZE, REVENUE_DAY_OPTIONS } from "@/domain/models/contracts"
import { type Appointment, type AppointmentFilter } from "@/presentation/lib/appointment-display"
import { cn } from "@/presentation/lib/utils"

function parsePage(value: string | null): number {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.floor(n)
}

const FILTER_ALIASES: Record<string, AppointmentFilter> = {
  all: "all",
  pending: "pending",
  yeni: "pending",
  confirmed: "confirmed",
  onaylandi: "confirmed",
  completed: "completed",
  tamamlandi: "completed",
  cancelled: "cancelled",
  iptal: "cancelled",
  paid: "paid",
  odendi: "paid",
  unpaid: "unpaid",
  odenmemis: "unpaid",
  active: "active",
  aktif: "active",
}

const EMPTY_PAGE: PageResponse<Appointment> = {
  content: [],
  page: 0,
  size: DEFAULT_TABLE_PAGE_SIZE,
  totalElements: 0,
  totalPages: 1,
}

function parseFilter(value: string | null): AppointmentFilter {
  if (!value) return "all"
  return FILTER_ALIASES[value] ?? "all"
}

function toApiStatus(filter: AppointmentFilter): AppointmentStatusApi | undefined {
  if (filter === "cancelled") return "CANCELLED"
  if (filter === "completed" || filter === "paid") return "COMPLETED"
  if (
    filter === "pending" ||
    filter === "unpaid" ||
    filter === "active" ||
    filter === "confirmed"
  ) {
    return "PENDING"
  }
  return undefined
}

type Period =
  | { kind: "days"; days: (typeof REVENUE_DAY_OPTIONS)[number] }
  | { kind: "range"; from: string; to: string }

const DAY_LABELS: Record<(typeof REVENUE_DAY_OPTIONS)[number], string> = {
  1: "Bugün",
  30: "İleri 30 gün",
  90: "İleri 90 gün",
}

function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

function addDays(date: Date, amount: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function toIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function parseIsoDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function formatDayLabel(iso: string) {
  return parseIsoDate(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatRangeLabel(from: string, to: string) {
  if (from === to) return formatDayLabel(from)
  return `${formatDayLabel(from)} – ${formatDayLabel(to)}`
}

function periodWindow(period: Period) {
  if (period.kind === "range") {
    return period.from <= period.to
      ? { from: period.from, to: period.to }
      : { from: period.to, to: period.from }
  }
  const today = startOfToday()
  if (period.days === 1) return { from: toIsoDate(today), to: toIsoDate(today) }
  return {
    from: toIsoDate(today),
    to: toIsoDate(addDays(today, period.days - 1)),
  }
}

const EMPTY_STATS = {
  total: [0, 0],
  pending: [0, 0],
  cancelled: [0, 0],
  totalCount: 0,
  pendingCount: 0,
  cancelledCount: 0,
}

function appointmentsPath(
  filter: AppointmentFilter,
  page: number,
  method?: string | null,
  q?: string | null
) {
  const params = new URLSearchParams()
  if (filter !== "all") params.set("status", filter)
  if (method === "cash" || method === "card") params.set("method", method)
  const query = q?.trim()
  if (query) params.set("q", query)
  if (page > 0) params.set("page", String(page))
  const qs = params.toString()
  return qs ? `/appointments?${qs}` : "/appointments"
}

export function RandevularView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeFilter = parseFilter(
    searchParams.get("status") ?? searchParams.get("durum")
  )
  const page = parsePage(searchParams.get("page"))
  const methodParam = searchParams.get("method")
  const q = searchParams.get("q") ?? ""
  const { pageSize, setPageSize, loaded: pageSizeLoaded } = useTablePageSize(
    "appointments"
  )
  const [expanded, setExpanded] = React.useState(false)
  const [activeCustomerId, setActiveCustomerId] = React.useState<string | null>(
    null
  )
  const [period, setPeriod] = React.useState<Period>({ kind: "days", days: 30 })
  const [rangeOpen, setRangeOpen] = React.useState(false)
  const [mobileDateOpen, setMobileDateOpen] = React.useState(false)
  const [mobileDateStep, setMobileDateStep] = React.useState<"from" | "to">("from")
  const [mobileFrom, setMobileFrom] = React.useState("")
  const [mobileTo, setMobileTo] = React.useState("")
  const [rangeDraft, setRangeDraft] = React.useState<DateRange | undefined>()
  const pickingEnd = React.useRef(false)
  const dateWindow = periodWindow(period)

  React.useEffect(() => {
    if (!searchParams.has("durum")) return
    router.replace(appointmentsPath(activeFilter, 0, methodParam, q), { scroll: false })
  }, [activeFilter, methodParam, q, router, searchParams])

  const tableQuery = useAppointmentPage({
    status: toApiStatus(activeFilter), ...dateWindow, q: q || undefined, page, size: pageSize,
  }, pageSizeLoaded)
  const table = tableQuery.data ?? EMPTY_PAGE
  const tableLoading = tableQuery.isPending || tableQuery.isFetching
  const tableError = tableQuery.error?.message
  const statsQuery = useAppointmentStats(dateWindow.from, dateWindow.to)
  const stats = statsQuery.data ?? EMPTY_STATS
  const statsLoading = statsQuery.isPending
  const statsError = statsQuery.isError

  const rows =
    activeFilter === "all"
      ? table.content
      : table.content.filter((row) => row.filterTags.includes(activeFilter))
  const totalCount = stats.totalCount
  const pendingCount = stats.pendingCount
  const cancelledCount = stats.cancelledCount

  function selectDays(days: (typeof REVENUE_DAY_OPTIONS)[number]) {
    setPeriod({ kind: "days", days })
    setRangeDraft(undefined)
    if (page > 0) router.replace(appointmentsPath(activeFilter, 0, methodParam, q), { scroll: false })
  }

  function applyRange(next: DateRange | undefined) {
    if (!next?.from) {
      pickingEnd.current = false
      setRangeDraft(undefined)
      return
    }
    if (!pickingEnd.current) {
      pickingEnd.current = true
      setRangeDraft({ from: next.from, to: undefined })
      return
    }
    const end = next.to ?? next.from
    const from = toIsoDate(next.from)
    const to = toIsoDate(end)
    setRangeDraft({ from: next.from, to: end })
    setPeriod({
      kind: "range",
      from: from <= to ? from : to,
      to: from <= to ? to : from,
    })
    setRangeOpen(false)
    pickingEnd.current = false
    if (page > 0) router.replace(appointmentsPath(activeFilter, 0, methodParam, q), { scroll: false })
  }

  function setFilter(next: AppointmentFilter) {
    router.replace(appointmentsPath(next, 0, methodParam, q), { scroll: false })
  }

  return (
    <div className="min-w-0 px-4 py-5 md:px-8 md:py-8">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Randevular
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {tableLoading
              ? "Randevular yükleniyor…"
              : tableError
                ? tableError
                : "Randevularınızı gerçek zamanlı olarak yönetin ve takip edin"}
          </p>
        </div>
      </header>

      <section aria-label="Randevu filtreleri" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium">Randevu takvimi</p>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 max-w-full rounded-xl sm:hidden"
          onClick={() => {
            setMobileFrom("")
            setMobileTo("")
            setMobileDateStep("from")
            setMobileDateOpen(true)
          }}
        >
          <CalendarDays aria-hidden />
          <span className="truncate">{period.kind === "range" ? formatRangeLabel(period.from, period.to) : DAY_LABELS[period.days]}</span>
        </Button>
        <Popover
          open={rangeOpen}
          onOpenChange={(open) => {
            setRangeOpen(open)
            pickingEnd.current = false
            if (open) {
              setRangeDraft(
                period.kind === "range"
                  ? { from: parseIsoDate(period.from), to: parseIsoDate(period.to) }
                  : undefined
              )
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="hidden min-h-11 max-w-full rounded-xl sm:inline-flex"
            >
              <CalendarDays />
              {period.kind === "range"
                ? formatRangeLabel(period.from, period.to)
                : DAY_LABELS[period.days]}
            </Button>
          </PopoverTrigger>
          {rangeOpen ? (
            <PopoverContent align="start" className="max-h-[75dvh] w-auto max-w-[calc(100vw-2rem)] overflow-auto p-0">
              <div className="flex flex-wrap gap-1 border-b p-2" aria-label="Hızlı tarih seçimi">
                {REVENUE_DAY_OPTIONS.map((option) => (
                  <Button key={option} type="button" size="sm" variant={period.kind === "days" && period.days === option ? "secondary" : "ghost"} className="min-h-11 rounded-lg" aria-pressed={period.kind === "days" && period.days === option} onClick={() => { selectDays(option); setRangeOpen(false) }}>
                    {DAY_LABELS[option]}
                  </Button>
                ))}
              </div>
              <p className="px-4 pt-3 text-xs text-muted-foreground">Özel aralık için başlangıç ve bitiş tarihini seçin.</p>
              <Calendar
                mode="range"
                defaultMonth={rangeDraft?.from}
                numberOfMonths={2}
                locale={tr}
                weekStartsOn={1}
                selected={rangeDraft}
                onSelect={applyRange}
                disabled={{ after: addDays(startOfToday(), 365) }}
                classNames={{
                  months: "relative flex flex-col gap-4 sm:flex-row",
                  month: "flex w-fit flex-col gap-4",
                }}
              />
            </PopoverContent>
          ) : null}
        </Popover>
      </div>

      <nav aria-label="Randevu durumu" className="flex gap-1 overflow-x-auto border-b border-border">
        {([
          { id: "all", label: "Tümü" },
          { id: "pending", label: "Bekleyen" },
          { id: "completed", label: "Tamamlanan" },
          { id: "cancelled", label: "İptal" },
        ] as const).map((tab) => {
          const selected = activeFilter === tab.id || (tab.id === "pending" && ["confirmed", "active", "unpaid"].includes(activeFilter)) || (tab.id === "completed" && activeFilter === "paid")
          return (
            <button key={tab.id} type="button" aria-current={selected ? "page" : undefined} onClick={() => setFilter(tab.id)} className={cn("min-h-12 shrink-0 border-b-2 px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:px-4", selected ? "border-primary font-semibold text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
              {tab.label}
            </button>
          )
        })}
      </nav>
      <div className="flex flex-wrap items-center gap-2">
        <AppointmentSearch
          key={q}
          query={q}
          onSearch={(value) => router.replace(appointmentsPath(activeFilter, 0, methodParam, value), { scroll: false })}
        />
        {activeFilter !== "all" || q ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-11 rounded-xl text-muted-foreground"
            onClick={() => {
              router.replace(appointmentsPath("all", 0, null, ""), { scroll: false })
            }}
          >
            <X data-icon="inline-start" />
            Sıfırla
          </Button>
        ) : null}
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="ml-auto hidden size-11 md:inline-flex items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          aria-label="Tabloyu tam ekran göster"
        >
          <Maximize2 className="size-4" />
        </button>
      </div>

      </section>

      <div aria-label="Seçili tarih aralığı özeti" aria-busy={statsLoading} className="my-4 flex flex-wrap gap-x-5 gap-y-2 px-1 text-xs text-muted-foreground sm:text-sm">
        {statsLoading ? <span className="sr-only">Özet yükleniyor</span> : null}
        {[["Toplam", totalCount], ["Bekleyen", pendingCount], ["İptal", cancelledCount]].map(([label, value]) => (
          <span key={label} className="inline-flex items-center gap-1.5">
            <span className="inline-flex h-5 min-w-6 items-center justify-center font-semibold tabular-nums text-foreground">
              {statsLoading ? <span aria-hidden className="h-4 w-6 animate-pulse rounded bg-muted motion-reduce:animate-none" /> : statsError ? "—" : value}
            </span>
            {label}
          </span>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Randevu listesi</h2>
          <p className="text-xs text-muted-foreground">{formatRangeLabel(dateWindow.from, dateWindow.to)}</p>
        </div>
        {tableError ? (
          <div role="alert" className="flex flex-col items-center gap-3 p-6 text-center text-sm">
            <p>{tableError}</p>
            <Button variant="outline" onClick={() => tableQuery.refetch()}>Tekrar dene</Button>
          </div>
        ) : (
          <>
            <div className="md:hidden">
              <AppointmentList rows={rows} loading={tableLoading} onSelectCustomer={setActiveCustomerId} />
            </div>
            <div className="hidden md:block">
              <AppointmentsTable rows={rows} loading={tableLoading} showPayment={false} onSelectCustomer={setActiveCustomerId} />
            </div>
          </>
        )}
        <TablePagination
          className="[&_button]:min-h-11 [&_label]:hidden sm:[&_label]:flex"
          page={table.page}
          totalPages={table.totalPages}
          totalElements={table.totalElements}
          size={table.size}
          loading={tableLoading}
          onPageChange={(next) =>
            router.replace(appointmentsPath(activeFilter, next, methodParam, q), {
              scroll: false,
            })
          }
          onPageSizeChange={(next) => {
            setPageSize(next)
            router.replace(appointmentsPath(activeFilter, 0, methodParam, q), {
              scroll: false,
            })
          }}
        />
      </div>

      <DialogPrimitive.Root open={expanded} onOpenChange={setExpanded}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-70 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content className="fixed inset-3 z-70 flex flex-col overflow-hidden rounded-3xl border bg-background outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
            <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-3">
              <DialogPrimitive.Title className="text-lg font-semibold tracking-tight">
                Randevular
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="sr-only">
                Randevu listesi tam ekran görünümü
              </DialogPrimitive.Description>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                  aria-label="Tam ekrandan çık"
                >
                  <Minimize2 className="size-4" />
                </button>
              </div>
            </div>
            <div className="flex min-h-0 flex-1 flex-col px-6 pb-6">
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card">
                <div className="min-h-0 flex-1 overflow-auto">
                  <AppointmentsTable
                    rows={rows}
                    loading={tableLoading}
                    showPayment={false}
                    stickyHeader
                    onSelectCustomer={setActiveCustomerId}
                  />
                </div>
                <TablePagination
                  page={table.page}
                  totalPages={table.totalPages}
                  totalElements={table.totalElements}
                  size={table.size}
                  loading={tableLoading}
                  onPageChange={(next) =>
                    router.replace(
                      appointmentsPath(activeFilter, next, methodParam, q),
                      { scroll: false }
                    )
                  }
                  onPageSizeChange={(next) => {
                    setPageSize(next)
                    router.replace(
                      appointmentsPath(activeFilter, 0, methodParam, q),
                      { scroll: false }
                    )
                  }}
                />
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <Sheet open={mobileDateOpen} onOpenChange={setMobileDateOpen}>
        <SheetContent contained>
          <SheetHeader className="mb-3">
            <SheetTitle>Tarih aralığı</SheetTitle>
            <SheetDescription className="sr-only">Önce başlangıç gününü, ardından bitiş gününü seçin.</SheetDescription>
          </SheetHeader>
          <div className="mb-3 grid shrink-0 grid-cols-3 gap-2" aria-label="Hızlı tarih seçimi">
            {REVENUE_DAY_OPTIONS.map((option) => (
              <Button key={option} type="button" variant="outline" className="min-h-11 rounded-xl px-2 text-xs" onClick={() => {
                const window = periodWindow({ kind: "days", days: option })
                setMobileFrom(window.from)
                setMobileTo(window.to)
                setMobileDateStep("to")
              }}>
                {DAY_LABELS[option]}
              </Button>
            ))}
          </div>
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={(event) => {
            event.preventDefault()
            if (!mobileFrom || !mobileTo || mobileFrom > mobileTo) return
            setPeriod({ kind: "range", from: mobileFrom, to: mobileTo })
            setRangeDraft(undefined)
            setMobileDateOpen(false)
            if (page > 0) router.replace(appointmentsPath(activeFilter, 0, methodParam, q), { scroll: false })
          }}>
            <div className="grid shrink-0 grid-cols-2 gap-2" aria-label="Tarih seçim adımı">
              {(["from", "to"] as const).map((step) => (
                <button key={step} type="button" aria-pressed={mobileDateStep === step} disabled={step === "to" && !mobileFrom} onClick={() => setMobileDateStep(step)} className={cn("min-h-14 rounded-xl border px-3 py-2 text-left focus-visible:outline-2 focus-visible:outline-ring", mobileDateStep === step ? "border-primary bg-primary/5" : "border-border")}>
                  <span className="block text-xs text-muted-foreground">{step === "from" ? "1. Başlangıç" : "2. Bitiş"}</span>
                  <span className="mt-1 block text-sm font-semibold">{(step === "from" ? mobileFrom : mobileTo) ? formatDayLabel(step === "from" ? mobileFrom : mobileTo) : "Gün seçin"}</span>
                </button>
              ))}
            </div>
            <p aria-live="polite" className="my-2 shrink-0 text-xs text-muted-foreground">
              {mobileDateStep === "from" ? "Başlangıç gününü seçin" : mobileTo ? "Tarih aralığı hazır" : "Şimdi bitiş gününü seçin"}
            </p>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" data-vaul-no-drag>
            <Calendar
              key={mobileDateStep}
              mode="range"
              required
              locale={tr}
              weekStartsOn={1}
              numberOfMonths={1}
              fixedWeeks
              defaultMonth={mobileDateStep === "from" ? (mobileFrom ? parseIsoDate(mobileFrom) : startOfToday()) : parseIsoDate(mobileTo || mobileFrom)}
              selected={mobileFrom ? { from: parseIsoDate(mobileFrom), to: mobileTo ? parseIsoDate(mobileTo) : undefined } : undefined}
              disabled={mobileDateStep === "to" && mobileFrom ? [{ before: parseIsoDate(mobileFrom) }, { after: addDays(startOfToday(), 365) }] : { after: addDays(startOfToday(), 365) }}
              onSelect={(_range, date, modifiers) => {
                if (modifiers.disabled) return
                if (mobileDateStep === "from") {
                  setMobileFrom(toIsoDate(date))
                  setMobileTo("")
                  setMobileDateStep("to")
                } else {
                  setMobileTo(toIsoDate(date))
                }
              }}
              className="mx-auto w-full max-w-80 p-0 [--cell-size:clamp(2.25rem,10vw,2.75rem)]"
              classNames={{ month: "flex w-full flex-col gap-2", week: "mt-1 flex w-full" }}
            />
            </div>
            <div className="flex shrink-0 gap-3 border-t bg-background pt-3">
              <Button type="button" variant="outline" className="min-h-12 flex-1 rounded-xl" onClick={() => setMobileDateOpen(false)}>Vazgeç</Button>
              <Button type="submit" disabled={!mobileFrom || !mobileTo || mobileFrom > mobileTo} className="min-h-12 flex-1 rounded-xl">Uygula</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <CustomerDrawer
        customerId={activeCustomerId}
        appointments={table.content}
        onOpenChange={(open) => {
          if (!open) setActiveCustomerId(null)
        }}
      />
    </div>
  )
}

function AppointmentSearch({ query, onSearch }: { query: string; onSearch: (value: string) => void }) {
  const [value, setValue] = React.useState(query)
  const inputRef = React.useRef<HTMLInputElement>(null)

  return (
    <form role="search" aria-label="Randevu arama" onSubmit={(event) => {
      event.preventDefault()
      onSearch(value.trim())
    }} className="flex min-h-12 w-full min-w-0 items-center gap-1 rounded-xl border border-border bg-card pl-3 pr-1 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20 sm:flex-1">
      <Search aria-hidden className="mr-1 size-4 shrink-0 text-muted-foreground" />
      <label htmlFor="appointment-search" className="sr-only">İsim veya telefon numarası</label>
      <input
        ref={inputRef}
        id="appointment-search"
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        enterKeyHint="search"
        autoComplete="off"
        spellCheck={false}
        placeholder="İsim veya telefonla ara"
        title="Aramak için Enter tuşuna veya Ara düğmesine basın."
        className="h-12 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-sm placeholder:text-muted-foreground"
      />
      {value || query ? (
        <button type="button" aria-label="Aramayı temizle" className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring" onClick={() => {
          setValue("")
          if (query) onSearch("")
          inputRef.current?.focus()
        }}><X aria-hidden className="size-4" /></button>
      ) : null}
      <Button type="submit" variant="secondary" className="min-h-11 shrink-0 rounded-lg px-3">Ara</Button>
    </form>
  )
}
