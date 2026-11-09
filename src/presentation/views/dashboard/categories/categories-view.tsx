"use client"

import { useQueryClient } from "@tanstack/react-query"

import { CategoryEditor } from "@/presentation/components/dashboard/categories/category-editor"

import { pinRankLabel } from "@/presentation/components/dashboard/categories/display"

import { useCategoriesPage } from "@/presentation/hooks/catalog-queries"

import { RecordActions } from "@/presentation/components/dashboard/record-actions"

import * as React from "react"
import { ChevronDown, Info, Plus, X } from "lucide-react"
import { TablePagination } from "@/presentation/components/dashboard/table-pagination"
import { QueryTableBody } from "@/presentation/components/dashboard/query-table-body"
import { useTablePageSize } from "@/presentation/components/dashboard/use-table-page-size"
import { Badge } from "@/presentation/components/ui/badge"
import { Button } from "@/presentation/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/presentation/components/dashboard/panel-dropdown-menu"
import { Table, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/presentation/components/ui/tooltip"
import { ApiError, serviceCategoriesApi } from "@/composition/services"
import type {
  PageResponse,
  ServiceCategoryDto,
  ServiceGenderApi,
} from "@/domain/models/contracts"
import { DEFAULT_TABLE_PAGE_SIZE, GENDER_LABELS } from "@/domain/models/contracts"
import { cn } from "@/presentation/lib/utils"
import { showUndoToast } from "@/presentation/lib/undo-toast"

const EMPTY_PAGE: PageResponse<ServiceCategoryDto> = {
  content: [],
  page: 0,
  size: DEFAULT_TABLE_PAGE_SIZE,
  totalElements: 0,
  totalPages: 1,
}

const GENDER_TABS: { id: ServiceGenderApi | "all"; label: string }[] = [
  { id: "all", label: "Tümü" },
  { id: "KADIN", label: "Kadın" },
  { id: "ERKEK", label: "Erkek" },
]

const columns = [
  { key: "name", skeletonClassName: "h-4 w-36" },
  { key: "gender", skeletonClassName: "h-4 w-16" },
  { key: "pin", skeletonClassName: "h-5 w-14 rounded-md" },
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

export function CategoriesView() {
  const { pageSize, setPageSize, loaded: pageSizeLoaded } =
    useTablePageSize("categories")
  const [page, setPage] = React.useState(0)
  const [genderFilter, setGenderFilter] = React.useState<ServiceGenderApi | "all">(
    "all"
  )
  const [activeFilter, setActiveFilter] = React.useState<"all" | boolean>("all")
  const [editing, setEditing] = React.useState<ServiceCategoryDto | null>()

  const query = useCategoriesPage({
    gender: genderFilter === "all" ? null : genderFilter,
    active: activeFilter === "all" ? null : activeFilter,
    page,
    size: pageSize,
  }, pageSizeLoaded)
  const data = query.data ?? EMPTY_PAGE
  const loading = query.isPending || query.isFetching
  const error = query.error?.message
  const client = useQueryClient()

  async function remove(category: ServiceCategoryDto) {
    if (
      !confirm(
        `"${GENDER_LABELS[category.gender]} · ${category.name}" kategorisini pasifleştirmek istiyor musun?`
      )
    )
      return
    try {
      await serviceCategoriesApi.remove(category.id)
      await client.invalidateQueries({ queryKey: ["categories"] })
      showUndoToast("Kategori pasifleştirildi")
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Silinemedi")
    }
  }

  const activeLabel =
    activeFilter === true ? "Aktif" : activeFilter === false ? "Pasif" : "Durum"
  const filtersActive = genderFilter !== "all" || activeFilter !== "all"

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Kategoriler
          </h1>
          <p className="text-sm text-muted-foreground">
            Hizmet gruplarını cinsiyete göre yönet. Servis eklerken buradan seçilir.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setEditing(null)} className="h-11 w-full rounded-xl text-base sm:w-auto">
            <Plus className="size-4" />
            Yeni kategori
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {GENDER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setGenderFilter(tab.id)
              setPage(0)
            }}
            className={cn(
              "relative pb-2 text-sm font-medium transition-colors",
              genderFilter === tab.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {genderFilter === tab.id ? (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-foreground" />
            ) : null}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <FilterMenu
          label={activeLabel}
          active={activeFilter !== "all"}
          items={[
            { id: "", label: "Tümü" },
            { id: "true", label: "Aktif" },
            { id: "false", label: "Pasif" },
          ]}
          onSelect={(id) => {
            setActiveFilter(
              id === "true" ? true : id === "false" ? false : "all"
            )
            setPage(0)
          }}
        />
        {filtersActive ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-full text-muted-foreground"
            onClick={() => {
              setGenderFilter("all")
              setActiveFilter("all")
              setPage(0)
            }}
          >
            <X data-icon="inline-start" />
            Sıfırla
          </Button>
        ) : null}
      </div>

      <div className="min-w-0 md:overflow-hidden md:rounded-2xl md:border md:border-border/60 md:bg-card">
        {error ? (
          <p className="p-8 text-center text-sm text-destructive">{error}</p>
        ) : (
          <Table aria-busy={loading || undefined} containerClassName="record-list">
            <TableHeader>
              <TableRow>
                <TableHead>Ad</TableHead>
                <TableHead>Cinsiyet</TableHead>
                <TableHead>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex cursor-help items-center gap-1">
                        Sıra
                        <Info className="size-3 opacity-70" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-pretty">
                      Randevu sayfasında bu kategori, kendi cinsiyet sekmesinin
                      en üstünde bu sırayla görünür.
                    </TooltipContent>
                  </Tooltip>
                </TableHead>
                <TableHead className="text-right">Durum</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <QueryTableBody loading={loading} error={error} empty={data.content.length === 0}
              columns={columns} emptyMessage="Henüz kategori yok. Yeni kategori ekle.">
              {data.content.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell data-label="Kategori" className="font-medium">{category.name}</TableCell>
                    <TableCell data-label="Cinsiyet" className="text-muted-foreground">
                      {GENDER_LABELS[category.gender]}
                    </TableCell>
                    <TableCell data-label="Sıra">
                      {category.pinRank ? (
                        <Badge className="rounded-md border-transparent bg-indigo-500/15 font-medium text-indigo-700 dark:text-indigo-300">
                          {pinRankLabel(category.pinRank)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell data-label="Durum" className="text-right">
                      <span
                        className={
                          category.active
                            ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                            : "rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                        }
                      >
                        {category.active ? "Aktif" : "Pasif"}
                      </span>
                    </TableCell>
                    <TableCell data-label="">
<RecordActions name={category.name} active={category.active} onEdit={() => setEditing(category)} onRemove={() => remove(category)} />
</TableCell>
</TableRow>
                ))}
            </QueryTableBody>
          </Table>
        )}
        <TablePagination
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

      {editing !== undefined && <CategoryEditor editing={editing} onClose={() => setEditing(undefined)} />}
    </div>
  )
}

function FilterMenu({
  label,
  items,
  active,
  onSelect,
}: {
  label: string
  items: { id: string; label: string }[]
  active?: boolean
  onSelect: (id: string) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "rounded-full",
            active &&
              "border-indigo/35 bg-indigo-muted text-indigo hover:border-indigo/35 hover:bg-indigo-muted hover:text-indigo aria-expanded:bg-indigo-muted aria-expanded:text-indigo dark:border-indigo/35 dark:bg-indigo-muted dark:hover:bg-indigo-muted"
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
  )
}
