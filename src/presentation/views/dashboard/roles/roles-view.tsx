"use client"

import { useQueryClient } from "@tanstack/react-query"

import { RoleEditor } from "@/presentation/components/dashboard/roles/role-editor"

import { useRolesPage } from "@/presentation/hooks/catalog-queries"

import { RecordActions } from "@/presentation/components/dashboard/record-actions"

import * as React from "react"
import { Plus } from "lucide-react"
import { TablePagination } from "@/presentation/components/dashboard/table-pagination"
import { QueryTableBody } from "@/presentation/components/dashboard/query-table-body"
import { useTablePageSize } from "@/presentation/components/dashboard/use-table-page-size"
import { Button } from "@/presentation/components/ui/button"
import { Table, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table"
import { ApiError, rolesApi } from "@/composition/services"
import type { PageResponse, RoleDto } from "@/domain/models/contracts"
import { DEFAULT_TABLE_PAGE_SIZE } from "@/domain/models/contracts"
import { cn } from "@/presentation/lib/utils"
import { showUndoToast } from "@/presentation/lib/undo-toast"

const EMPTY_PAGE: PageResponse<RoleDto> = {
  content: [],
  page: 0,
  size: DEFAULT_TABLE_PAGE_SIZE,
  totalElements: 0,
  totalPages: 1,
}

const columns = [
  { key: "name", skeletonClassName: "h-4 w-32" },
  { key: "code", skeletonClassName: "h-4 w-20" },
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

export function RolesView() {
  const { pageSize, setPageSize, loaded: pageSizeLoaded } = useTablePageSize("roles")
  const [page, setPage] = React.useState(0)
  const [activeFilter, setActiveFilter] = React.useState<"all" | boolean>("all")
  const [editing, setEditing] = React.useState<RoleDto | null>()

  const query = useRolesPage({
    active: activeFilter === "all" ? null : activeFilter,
    page,
    size: pageSize,
  }, pageSizeLoaded)
  const data = query.data ?? EMPTY_PAGE
  const loading = query.isPending || query.isFetching
  const error = query.error?.message
  const client = useQueryClient()

  async function remove(role: RoleDto) {
    if (!confirm(`"${role.name}" rolünü pasifleştirmek istiyor musun?`)) return
    try {
      await rolesApi.remove(role.id)
      await client.invalidateQueries({ queryKey: ["roles"] })
      showUndoToast("Rol pasifleştirildi")
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Silinemedi")
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 px-4 py-5 md:px-8 md:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Roller
          </h1>
          <p className="text-sm text-muted-foreground">
            Personel yetkilerini ve servis atamasını roller üzerinden yönet.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setEditing(null)} className="h-11 w-full gap-1.5 rounded-xl text-base sm:w-auto">
            <Plus className="size-4" />
            Yeni rol
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
                <TableHead>Kod</TableHead>
                <TableHead className="md:text-right">Durum</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <QueryTableBody loading={loading} error={error} empty={data.content.length === 0}
              columns={columns} emptyMessage="Henüz rol yok. Yeni rol ekle.">
              {data.content.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell data-label="Rol" className="font-medium">{role.name}</TableCell>
                    <TableCell data-label="Kod" className="font-mono text-xs text-muted-foreground">
                      {role.code}
                    </TableCell>
                    <TableCell data-label="Durum" className="md:text-right">
                      <span
                        className={
                          role.active
                            ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                            : "rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                        }
                      >
                        {role.active ? "Aktif" : "Pasif"}
                      </span>
                    </TableCell>
                    <TableCell data-label="">
<RecordActions name={role.name} active={role.active} onEdit={() => setEditing(role)} onRemove={() => remove(role)} />
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

      {editing !== undefined && <RoleEditor editing={editing} onClose={() => setEditing(undefined)} />}
    </div>
  )
}
