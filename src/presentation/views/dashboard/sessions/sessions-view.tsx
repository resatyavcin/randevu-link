"use client";

import { formatTrPhoneDisplay } from "@/presentation/lib/phone-display";
import { useQuery } from "@tanstack/react-query";

import {
  SessionEditor,
  EMPTY_SESSION_DRAFT,
  type SessionDraft,
} from "@/presentation/components/dashboard/sessions/session-editor";
import { useSessionDebts } from "@/presentation/hooks/catalog-queries";

import { useSessionsPage } from "@/presentation/hooks/catalog-queries";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { TablePagination } from "@/presentation/components/dashboard/table-pagination";
import { QueryTableBody } from "@/presentation/components/dashboard/query-table-body";
import { useTablePageSize } from "@/presentation/components/dashboard/use-table-page-size";
import { Button } from "@/presentation/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/presentation/components/dashboard/panel-dropdown-menu";
import { Input } from "@/presentation/components/ui/input";
import { Progress } from "@/presentation/components/ui/progress";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/presentation/components/ui/table";
import { appointmentsApi } from "@/composition/services";
import type {
  PageResponse,
  SessionDto,
  SessionStatusApi,
} from "@/domain/models/contracts";
import {
  DEFAULT_TABLE_PAGE_SIZE,
  SESSION_STATUS_LABELS,
} from "@/domain/models/contracts";
import {
  normalizeTrPhone,
} from "@/domain/value-objects/phone";
import { formatTry } from "@/presentation/lib/appointment-display";
import { cn } from "@/presentation/lib/utils";

const EMPTY_PAGE: PageResponse<SessionDto> = {
  content: [],
  page: 0,
  size: DEFAULT_TABLE_PAGE_SIZE,
  totalElements: 0,
  totalPages: 1,
};

const columns = [
  { key: "customer", skeletonClassName: "h-4 w-36" },
  { key: "name", skeletonClassName: "h-4 w-28" },
  { key: "progress", skeletonClassName: "h-4 w-24" },
  { key: "paid", skeletonClassName: "h-4 w-28" },
  { key: "status", skeletonClassName: "h-5 w-16 rounded-full" },
];

export function SessionsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    pageSize,
    setPageSize,
    loaded: pageSizeLoaded,
  } = useTablePageSize("sessions");
  const [page, setPage] = React.useState(0);
  const [statusFilter, setStatusFilter] = React.useState<
    SessionStatusApi | "all"
  >("all");
  const [phoneInput, setPhoneInput] = React.useState("");
  const [phoneFilter, setPhoneFilter] = React.useState("");
  const [draft, setDraft] = React.useState<SessionDraft | null>(null);
  const [focusId, setFocusId] = React.useState<string | null>(null);

  const query = useSessionsPage(
    {
      phone: phoneFilter || null,
      status: statusFilter === "all" ? null : statusFilter,
      page,
      size: pageSize,
    },
    pageSizeLoaded,
  );
  const data = query.data ?? EMPTY_PAGE;
  const loading = query.isPending || query.isFetching;
  const error = query.error?.message;
  const { data: debts = [] } = useSessionDebts({
    phone: phoneFilter || null,
    status: statusFilter === "all" ? null : statusFilter,
  });

  const focusIndex = debts.findIndex((row) => row.id === focusId);
  const pageStart = page * pageSize;
  const canStepDebt = (direction: 1 | -1) => {
    if (debts.length === 0) return false;
    if (focusIndex === -1) {
      if (direction === 1) return debts.some((row) => row.index >= pageStart);
      return debts.some((row) => row.index < pageStart);
    }
    const next = focusIndex + direction;
    return next >= 0 && next < debts.length;
  };

  function stepDebt(direction: 1 | -1) {
    if (!canStepDebt(direction)) return;
    let nextIndex: number;
    if (focusIndex === -1) {
      if (direction === 1) {
        nextIndex = debts.findIndex((row) => row.index >= pageStart);
      } else {
        nextIndex = -1;
        debts.forEach((row, index) => {
          if (row.index < pageStart) nextIndex = index;
        });
      }
    } else {
      nextIndex = focusIndex + direction;
    }
    const target = debts[nextIndex];
    if (!target) return;
    setFocusId(target.id);
    const targetPage = Math.floor(target.index / pageSize);
    if (targetPage !== page) setPage(targetPage);
  }

  React.useEffect(() => {
    if (!focusId || loading) return;
    document.getElementById(`session-row-${focusId}`)?.scrollIntoView({
      block: "nearest",
    });
  }, [focusId, loading, data.page, data.content]);

  const createFromLink = searchParams.get("new") === "1";
  const presetPhone = normalizeTrPhone(searchParams.get("phone") ?? "");
  const preset = useQuery({
    queryKey: ["appointments", "customer", presetPhone],
    queryFn: ({ signal }) =>
      appointmentsApi.list({ phone: presetPhone, page: 0, size: 1 }, signal),
    enabled: createFromLink && presetPhone.length === 10,
  });
  const customer = preset.data?.content[0];
  const initial =
    draft ??
    (createFromLink && !preset.isFetching
      ? {
          ...EMPTY_SESSION_DRAFT,
          customerPhone: presetPhone,
          customerFirstName: customer?.customerFirstName ?? "",
          customerLastName: customer?.customerLastName ?? "",
        }
      : null);
  function closeEditor() {
    setDraft(null);
    if (createFromLink) router.replace("/sessions", { scroll: false });
  }

  const statusLabel =
    statusFilter === "all" ? "Durum" : SESSION_STATUS_LABELS[statusFilter];
  const filtersActive = statusFilter !== "all" || Boolean(phoneFilter);

  return (
    <div className="min-w-0 px-4 py-5 md:px-8 md:py-8">
      <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Seanslar
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Paket seansları, ilerleme ve tahsilatı buradan yönetin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setDraft(EMPTY_SESSION_DRAFT)}
            className="h-11 w-full gap-1.5 sm:h-9 sm:w-auto"
          >
            <Plus className="size-4" />
            Yeni seans
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={phoneInput}
          onChange={(event) =>
            setPhoneInput(event.target.value.replace(/\D/g, "").slice(0, 10))
          }
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            setPhoneFilter(normalizeTrPhone(phoneInput));
            setFocusId(null);
            setPage(0);
          }}
          placeholder="Telefon ara"
          className="h-11 min-w-0 flex-1 sm:h-9 sm:w-40 sm:flex-none"
          aria-label="Telefon numarasıyla ara"
          inputMode="numeric"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-11 rounded-full sm:h-8"
          onClick={() => {
            setPhoneFilter(normalizeTrPhone(phoneInput));
            setFocusId(null);
            setPage(0);
          }}
        >
          Ara
        </Button>
        <FilterMenu
          label={statusLabel}
          active={statusFilter !== "all"}
          items={[
            { id: "", label: "Tümü" },
            { id: "ACTIVE", label: "Aktif" },
            { id: "COMPLETED", label: "Tamamlandı" },
            { id: "CANCELLED", label: "İptal" },
          ]}
          onSelect={(id) => {
            setStatusFilter(id ? (id as SessionStatusApi) : "all");
            setFocusId(null);
            setPage(0);
          }}
        />
        {filtersActive ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-11 rounded-full text-muted-foreground sm:h-8"
            onClick={() => {
              setStatusFilter("all");
              setPhoneInput("");
              setPhoneFilter("");
              setFocusId(null);
              setPage(0);
            }}
          >
            <X data-icon="inline-start" />
            Sıfırla
          </Button>
        ) : null}
        {debts.length > 0 ? (
          <div className="flex w-full items-center justify-between gap-1 rounded-full border border-border bg-card p-1 sm:ml-auto sm:w-auto">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 rounded-full px-2 text-muted-foreground hover:text-foreground sm:h-7"
              disabled={!canStepDebt(-1)}
              onClick={() => stepDebt(-1)}
            >
              <ChevronLeft data-icon="inline-start" />
              Önceki
            </Button>
            <span className="min-w-14 px-1 text-center text-xs font-medium tabular-nums text-foreground">
              {focusIndex >= 0
                ? `Borçlu ${focusIndex + 1} / ${debts.length}`
                : `${debts.length} borçlu`}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 rounded-full px-2 text-muted-foreground hover:text-foreground sm:h-7"
              disabled={!canStepDebt(1)}
              onClick={() => stepDebt(1)}
            >
              Sonraki
              <ChevronRight data-icon="inline-end" />
            </Button>
          </div>
        ) : null}
      </div>

      <div className="mt-5 min-w-0 md:overflow-hidden md:rounded-2xl md:border md:border-border md:bg-card">
        {error ? (
          <p className="p-8 text-center text-sm text-destructive">{error}</p>
        ) : (
          <Table
            aria-label="Seans paketleri"
            aria-busy={loading || undefined}
            containerClassName="max-md:overflow-visible"
            className="max-md:block max-md:[&_td]:whitespace-normal max-md:[&_td]:p-0"
          >
            <TableHeader className="max-md:sr-only">
              <TableRow>
                <TableHead>Müşteri</TableHead>
                <TableHead>Paket</TableHead>
                <TableHead>İlerleme</TableHead>
                <TableHead className="text-right">Tahsilat</TableHead>
                <TableHead>Durum</TableHead>
              </TableRow>
            </TableHeader>
            <QueryTableBody
              columns={columns}
              loading={loading}
              error={error}
              empty={data.content.length === 0}
              emptyMessage="Henüz seans paketi yok."
              className="max-md:grid max-md:gap-3 max-md:[&>tr[aria-hidden]]:hidden max-md:[&>tr]:rounded-2xl max-md:[&>tr]:border  max-md:[&>tr]:p-4"
              mobileLoadingLabel="Seanslar yükleniyor…"
            >
              {data.content.map((session) => {
                const pct =
                  session.totalSessions <= 0
                    ? 0
                    : (session.completedCount / session.totalSessions) * 100;
                const inDebt = session.creditBalanceTl < 0;
                const focused = focusId === session.id;
                return (
                  <TableRow
                    key={session.id}
                    id={`session-row-${session.id}`}
                    className={cn(
                      "cursor-pointer scroll-mt-4 max-md:grid max-md:grid-cols-[minmax(0,1fr)_auto] max-md:gap-y-3 max-md:gap-x-2 max-md:[overflow-wrap:anywhere]",
                      "max-md:bg-card",
                      focused && "ring-1 ring-inset ring-indigo/50",
                    )}
                    onClick={() => router.push(`/sessions/${session.id}`)}
                  >
                    <TableCell className="max-md:col-start-1 max-md:row-start-1">
                      <Link
                        href={`/sessions/${session.id}`}
                        className="block"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <p className="font-medium">
                          {session.customerFirstName} {session.customerLastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          +90 {formatTrPhoneDisplay(session.customerPhone)}
                        </p>
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium max-md:col-span-2 max-md:row-start-2">
                      {session.name}
                    </TableCell>
                    <TableCell className="md:min-w-40 max-md:col-span-2 max-md:row-start-3">
                      <div className="flex flex-col gap-1.5">
                        <Progress value={pct} />
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {session.completedCount}/{session.totalSessions}
                          <span className="md:hidden"> seans tamamlandı</span>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground md:text-right max-md:col-span-2 max-md:row-start-4 max-md:border-t max-md:border-border">
                      <p className="max-md:pt-2">
                        <span className="mr-2 md:hidden">Tahsilat</span>
                        {formatTry(session.paidTotalTl)} /{" "}
                        {formatTry(session.totalPriceTl)}
                      </p>
                      {inDebt ? (
                        <p className="mt-1 inline-flex flex-wrap items-baseline gap-x-1.5 rounded-md bg-muted px-2 py-1 text-xs">
                          <span>Borç</span>
                          <span className="font-medium text-foreground">
                            {formatTry(-session.creditBalanceTl)}
                          </span>
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="max-md:col-start-2 max-md:row-start-1 max-md:text-right">
                      <StatusBadge status={session.status} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </QueryTableBody>
          </Table>
        )}
        <TablePagination
          className="max-md:mt-3 max-md:rounded-2xl max-md:border"
          page={data.page}
          totalPages={data.totalPages}
          totalElements={data.totalElements}
          size={data.size}
          loading={loading}
          onPageChange={setPage}
          onPageSizeChange={(next) => {
            setPageSize(next);
            setPage(0);
          }}
        />
      </div>

      {initial && <SessionEditor initial={initial} onClose={closeEditor} />}
    </div>
  );
}

function StatusBadge({ status }: { status: SessionStatusApi }) {
  const className =
    status === "ACTIVE"
      ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
      : status === "COMPLETED"
        ? "rounded-full bg-indigo-500/15 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-300"
        : "rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-400";
  return <span className={className}>{SESSION_STATUS_LABELS[status]}</span>;
}

function FilterMenu({
  label,
  items,
  active,
  onSelect,
}: {
  label: string;
  items: { id: string; label: string }[];
  active?: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-11 rounded-full sm:h-8",
            active &&
              "border-indigo/35 bg-indigo-muted text-indigo hover:border-indigo/35 hover:bg-indigo-muted hover:text-indigo aria-expanded:bg-indigo-muted aria-expanded:text-indigo dark:border-indigo/35 dark:bg-indigo-muted dark:hover:bg-indigo-muted",
          )}
        >
          {label}
          <ChevronDown data-icon="inline-end" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-auto min-w-40">
        {items.map((item) => (
          <DropdownMenuItem
            key={item.id || "all"}
            onSelect={() => onSelect(item.id)}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
