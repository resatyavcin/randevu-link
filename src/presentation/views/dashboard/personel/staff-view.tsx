"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"

import { StaffEditor } from "@/presentation/components/dashboard/personel/staff-editor"

import { WORK_DAYS } from "@/presentation/components/dashboard/personel/display"

import { useStaffPage } from "@/presentation/hooks/catalog-queries"

import { RecordActions } from "@/presentation/components/dashboard/record-actions"

import * as React from "react"
import { Plus } from "lucide-react"
import { Button } from "@/presentation/components/ui/button"
import { Table, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table"
import { ApiError, authApi, staffApi } from "@/composition/services"
import { getStoredMe, type AuthMe } from "@/composition/auth"
import type { PageResponse, StaffDto } from "@/domain/models/contracts"
import { RoleBadge } from "@/presentation/components/dashboard/role-badge"
import { TablePagination } from "@/presentation/components/dashboard/table-pagination"
import { QueryTableBody } from "@/presentation/components/dashboard/query-table-body"
import { useTablePageSize } from "@/presentation/components/dashboard/use-table-page-size"
import { DEFAULT_TABLE_PAGE_SIZE } from "@/domain/models/contracts"
import { cn } from "@/presentation/lib/utils"
import { formatTrPhoneDisplay } from "@/presentation/lib/phone-display"
import { showUndoToast } from "@/presentation/lib/undo-toast"

const EMPTY_PAGE: PageResponse<StaffDto> = {
  content: [],
  page: 0,
  size: DEFAULT_TABLE_PAGE_SIZE,
  totalElements: 0,
  totalPages: 1,
}

const columns = [
  { key: "name", skeletonClassName: "h-4 w-32" },
  { key: "role", skeletonClassName: "h-4 w-24" },
  { key: "phone", skeletonClassName: "h-4 w-28" },
  { key: "admin", skeletonClassName: "h-4 w-16" },
  { key: "days", skeletonClassName: "h-4 w-40" },
  {
    key: "status",
    className: "text-right",
    skeletonClassName: "ml-auto h-5 w-12 rounded-full",
  },
  {
    key: "actions",
    className: "text-right",
    skeletonClassName: "ml-auto h-8 w-16",
  },
]

export function StaffView() {
  const { pageSize, setPageSize, loaded: pageSizeLoaded } = useTablePageSize("staff")
  const [page, setPage] = React.useState(0)
  const [activeFilter, setActiveFilter] = React.useState<"all" | boolean>("all")
  const [editing, setEditing] = React.useState<StaffDto | null>()
  const { data: me } = useQuery<AuthMe>({
    queryKey: ["dashboard", "me"],
    queryFn: ({ signal }) => authApi.me("DASHBOARD", signal),
    placeholderData: () => getStoredMe("DASHBOARD") ?? undefined,
  })
  const isFounder = me?.roleCode === "KURUCU"

  const query = useStaffPage({
    active: activeFilter === "all" ? null : activeFilter,
    page,
    size: pageSize,
  }, pageSizeLoaded)
  const data = query.data ?? EMPTY_PAGE
  const loading = query.isPending || query.isFetching
  const error = query.error?.message
  const client = useQueryClient()

  async function remove(s: StaffDto) {
    if (!confirm(`"${s.name}" personelini pasifleştir?`)) return
    try {
      await staffApi.remove(s.id)
      await client.invalidateQueries({ queryKey: ["personel"] })
      showUndoToast("Personel pasifleştirildi")
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Silinemedi")
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 px-4 py-5 md:px-8 md:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Personel
          </h1>
          <p className="text-sm text-muted-foreground">
            Çalışanları, rollerini ve çalışma günlerini yönet.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setEditing(null)} className="h-11 w-full gap-1.5 rounded-xl text-base sm:w-auto">
            <Plus className="size-4" />
            Yeni personel
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {(
          [
            { id: "all" as const, label: "Tümü" },
            { id: true as const, label: "Aktif" },
            { id: false as const, label: "Pasif" },
          ]
        ).map((tab) => (
          <button
            key={String(tab.id)}
            type="button"
            onClick={() => {
              setActiveFilter(tab.id)
              setPage(0)
            }}
            className={cn(
              "relative min-h-11 px-2 pb-2 text-sm font-medium transition-colors",
              activeFilter === tab.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {activeFilter === tab.id ? (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-foreground" />
            ) : null}
          </button>
        ))}
      </div>

      <div className="min-w-0 md:overflow-hidden md:rounded-2xl md:border md:border-border/60 md:bg-card">
        {error ? (
          <p className="p-8 text-center text-sm text-destructive">{error}</p>
        ) : (
          <Table aria-busy={loading || undefined} containerClassName="record-list">
            <TableHeader>
              <TableRow>
                <TableHead>Ad</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Panel</TableHead>
                <TableHead>Çalışma günleri</TableHead>
                <TableHead className="md:text-right">Durum</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <QueryTableBody loading={loading} error={error} empty={data.content.length === 0}
              columns={columns} emptyMessage="Henüz personel yok. Yeni personel ekle.">
              {data.content.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell data-label="Personel" className="font-medium">{s.name}</TableCell>
                    <TableCell data-label="Rol">
                      <RoleBadge name={s.role} active={s.roleActive} />
                    </TableCell>
                    <TableCell data-label="Telefon" className="tabular-nums text-muted-foreground">
                      {s.phone ? `+90 ${formatTrPhoneDisplay(s.phone)}` : "—"}
                    </TableCell>
                    <TableCell data-label="Panel erişimi">
                      {s.dashboardAdmin ? (
                        <span className="rounded-full bg-indigo-muted px-2 py-0.5 text-xs font-medium text-indigo">
                          Yetkili
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell data-label="Çalışma günleri" className="text-xs text-muted-foreground">
                      {WORK_DAYS.filter((d) => s.workDays.includes(d.id))
                        .map((d) => d.label)
                        .join(", ")}
                    </TableCell>
                    <TableCell data-label="Durum" className="md:text-right">
                      <span
                        className={
                          s.active
                            ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                            : "rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                        }
                      >
                        {s.active ? "Aktif" : "Pasif"}
                      </span>
                    </TableCell>
                    <TableCell data-label="">
<RecordActions name={s.name} active={s.active} onEdit={() => setEditing(s)} onRemove={() => remove(s)} />
</TableCell>
</TableRow>
                ))}
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
            setPageSize(next)
            setPage(0)
          }}
        />
      </div>

      {editing !== undefined && <StaffEditor editing={editing} onClose={() => setEditing(undefined)} isFounder={isFounder} />}
    </div>
  )
}
