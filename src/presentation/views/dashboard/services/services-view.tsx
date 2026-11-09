"use client"

import { useQueryClient } from "@tanstack/react-query"

import { ServiceEditor } from "@/presentation/components/dashboard/services/service-editor"

import { useServicesPage, useRoleOptions, useCategoryOptions, useServiceCounts } from "@/presentation/hooks/catalog-queries"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronDown, Plus, Search, X } from "lucide-react"
import { Button } from "@/presentation/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/presentation/components/dashboard/panel-dropdown-menu"
import { Input } from "@/presentation/components/ui/input"
import { TablePagination } from "@/presentation/components/dashboard/table-pagination"
import { ServicesTable } from "@/presentation/components/dashboard/services/services-table"
import { ApiError, servicesApi } from "@/composition/services"
import type { PageResponse, ServiceDto, ServiceGenderApi } from "@/domain/models/contracts"
import { DEFAULT_TABLE_PAGE_SIZE, GENDER_LABELS } from "@/domain/models/contracts"
import { useTablePageSize } from "@/presentation/components/dashboard/use-table-page-size"
import { cn } from "@/presentation/lib/utils"
import { showUndoToast } from "@/presentation/lib/undo-toast"

function parsePage(value: string | null): number {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.floor(n)
}

const GENDER_TABS: { id: ServiceGenderApi | "all"; label: string }[] = [
  { id: "all", label: "Tümü" },
  { id: "KADIN", label: "Kadın" },
  { id: "ERKEK", label: "Erkek" },
]

const EMPTY_PAGE: PageResponse<ServiceDto> = {
  content: [],
  page: 0,
  size: DEFAULT_TABLE_PAGE_SIZE,
  totalElements: 0,
  totalPages: 1,
}

function parseGender(value: string | null): ServiceGenderApi | "all" {
  if (value === "KADIN" || value === "ERKEK" || value === "kadin" || value === "erkek") {
    return value.toUpperCase() as ServiceGenderApi
  }
  return "all"
}

function parseCategoryId(value: string | null): string | null {
  if (!value) return null
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  )
    ? value
    : null
}

function parseActive(value: string | null): boolean | null {
  if (value === "true") return true
  if (value === "false") return false
  return null
}

function parseRoleId(value: string | null): string | null {
  if (!value) return null
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  )
    ? value
    : null
}

export function ServicesView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const gender = parseGender(searchParams.get("gender"))
  const categoryId = parseCategoryId(searchParams.get("category"))
  const active = parseActive(searchParams.get("active"))
  const roleId = parseRoleId(searchParams.get("roleId"))
  const q = (searchParams.get("q") ?? "").trim()
  const page = parsePage(searchParams.get("page"))
  const { pageSize, setPageSize, loaded: pageSizeLoaded } = useTablePageSize("services")

  const { data: counts } = useServiceCounts({ gender: gender === "all" ? null : gender, active })
  const [editing, setEditing] = React.useState<ServiceDto | null>()
  const [draft, setDraft] = React.useState({ source: q, text: q })
  const searchInput = draft.source === q ? draft.text : q
  const setSearchInput = (text: string) => setDraft({ source: q, text })
  const { data: roles = [] } = useRoleOptions()
  const { data: categories = [] } = useCategoryOptions()

  const query = useServicesPage({
    gender: gender === "all" ? null : gender,
    categoryId,
    active,
    roleId,
    q: q || undefined,
    page,
    size: pageSize,
  }, pageSizeLoaded)
  const data = query.data ?? EMPTY_PAGE
  const loading = query.isPending || query.isFetching
  const error = query.error?.message
  const client = useQueryClient()

  const setQuery = React.useCallback(
    (next: {
      gender?: ServiceGenderApi | "all"
      category?: string | null
      active?: boolean | null
      roleId?: string | null
      q?: string
      page?: number
    }) => {
      const params = new URLSearchParams()
      const nextGender = next.gender ?? gender
      const nextCategory = next.category === undefined ? categoryId : next.category
      const nextActive = next.active === undefined ? active : next.active
      const nextRoleId = next.roleId === undefined ? roleId : next.roleId
      const nextQ = (next.q === undefined ? q : next.q).trim()
      const nextPage = next.page ?? 0
      if (nextGender !== "all") params.set("gender", nextGender)
      if (nextCategory) params.set("category", nextCategory)
      if (nextActive != null) params.set("active", String(nextActive))
      if (nextRoleId) params.set("roleId", nextRoleId)
      if (nextQ) params.set("q", nextQ)
      if (nextPage > 0) params.set("page", String(nextPage))
      const qs = params.toString()
      router.replace(qs ? `/services?${qs}` : "/services", { scroll: false })
    },
    [router, gender, categoryId, active, roleId, q]
  )


  React.useEffect(() => {
    const next = searchInput.trim()
    if (next === q) return
    const id = window.setTimeout(() => {
      setQuery({ q: next, page: 0 })
    }, 300)
    return () => window.clearTimeout(id)
  }, [searchInput, q, setQuery])

  async function remove(s: ServiceDto) {
    if (!confirm(`"${s.name}" servisini pasifleştirmek istiyor musun?`)) return
    try {
      await servicesApi.remove(s.id)
      await client.invalidateQueries({ queryKey: ["services"] })
      showUndoToast("Servis pasifleştirildi")
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Silinemedi")
    }
  }

  const selectedCategory = categories.find((c) => c.id === categoryId) ?? null
  const categoryLabel = selectedCategory
    ? gender === "all"
      ? `${GENDER_LABELS[selectedCategory.gender]} · ${selectedCategory.name}`
      : selectedCategory.name
    : "Kategori"
  const roleLabel = roles.find((role) => role.id === roleId)?.name ?? "Rol"
  const activeLabel =
    active === true ? "Aktif" : active === false ? "Pasif" : "Durum"
  const filtersActive =
    gender !== "all" || categoryId != null || active != null || roleId != null
  const filterCategories = categories
    .filter((c) => gender === "all" || c.gender === gender)
    .slice()
    .sort((a, b) => {
      if (a.gender !== b.gender) return a.gender.localeCompare(b.gender)
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
      return a.name.localeCompare(b.name, "tr")
    })
  return (
    <div className="min-w-0 px-4 py-5 md:px-8 md:py-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Servisler
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            İşletmenin sunduğu hizmetleri buradan yönet.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setEditing(null)} className="h-11 w-full rounded-xl text-base sm:w-auto">
            <Plus className="size-4" />
            Yeni servis
          </Button>
        </div>
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
        {GENDER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              const selected = categories.find((c) => c.id === categoryId)
              const nextCategory =
                tab.id !== "all" && selected && selected.gender !== tab.id
                  ? null
                  : undefined
              setQuery({ gender: tab.id, category: nextCategory })
            }}
            className={cn(
              "relative pb-2 text-sm font-medium transition-colors",
              gender === tab.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {gender === tab.id ? (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-foreground" />
            ) : null}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <FilterMenu
          label={categoryLabel}
          active={Boolean(categoryId)}
          items={[
            { id: "", label: "Tüm kategoriler", count: counts?.total },
            ...filterCategories.map((c) => ({
              id: c.id,
              label:
                gender === "all"
                  ? `${GENDER_LABELS[c.gender]} · ${c.name}`
                  : c.name,
              count: counts?.categories[c.id],
            })),
          ]}
          onSelect={(id) => setQuery({ category: id || null })}
        />
        <FilterMenu
          label={roleLabel}
          active={Boolean(roleId)}
          items={[
            { id: "", label: "Tüm roller" },
            ...roles.map((role) => ({
              id: role.id,
              label: role.active ? role.name : `${role.name} (Pasif)`,
            })),
          ]}
          onSelect={(id) => setQuery({ roleId: id || null, page: 0 })}
        />
        <FilterMenu
          label={activeLabel}
          active={active != null}
          items={[
            { id: "", label: "Tümü" },
            { id: "true", label: "Aktif" },
            { id: "false", label: "Pasif" },
          ]}
          onSelect={(id) =>
            setQuery({
              active: id === "true" ? true : id === "false" ? false : null,
            })
          }
        />
        {filtersActive ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-full text-muted-foreground"
            onClick={() => {
              setSearchInput("")
              setQuery({
                gender: "all",
                category: null,
                active: null,
                roleId: null,
                q: "",
                page: 0,
              })
            }}
          >
            <X data-icon="inline-start" />
            Sıfırla
          </Button>
        ) : null}
      </div>

      <div className="mt-5 min-w-0 md:overflow-hidden md:rounded-2xl md:border md:border-border md:bg-card">
        <div className="flex items-center justify-end gap-1 px-3 py-2">
          <ServiceNameSearch value={searchInput} onChange={setSearchInput} />
        </div>
        <ServicesTable
            rows={data.content}
            loading={loading}
            error={error}
            onEdit={setEditing}
            onRemove={remove}
          />
        <TablePagination
          page={data.page}
          totalPages={data.totalPages}
          totalElements={data.totalElements}
          size={data.size}
          loading={loading}
          onPageChange={(next) => setQuery({ page: next })}
          onPageSizeChange={(next) => {
            setPageSize(next)
            setQuery({ page: 0 })
          }}
        />
      </div>

      {editing !== undefined && <ServiceEditor editing={editing} onClose={() => setEditing(undefined)} />}
    </div>
  )
}

function ServiceNameSearch({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [expanded, setOpen] = React.useState(false)
  const open = expanded || Boolean(value)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const rootRef = React.useRef<HTMLDivElement>(null)


  React.useEffect(() => {
    if (!open) return
    const id = window.setTimeout(() => inputRef.current?.focus(), 200)
    return () => window.clearTimeout(id)
  }, [open])

  return (
    <div
      ref={rootRef}
      className={cn(
        "h-8 overflow-hidden rounded-lg border transition-[width,border-color,background-color] duration-200 ease-out",
        open ? "border-input bg-background" : "border-transparent"
      )}
      style={{ width: open ? 224 : 32 }}
      onBlur={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
        if (!value.trim()) setOpen(false)
      }}
    >
      <div className="flex h-8 w-56 items-center">
        <button
          type="button"
          aria-expanded={open}
          aria-label="Servis adına göre ara"
          onClick={() => setOpen(true)}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-muted-foreground"
        >
          <Search className="size-4" strokeWidth={1.5} />
        </button>
        <Input
          ref={inputRef}
          value={value}
          tabIndex={open ? 0 : -1}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              if (value) onChange("")
              setOpen(false)
            }
          }}
          placeholder="Servis adı ara"
          aria-label="Servis adına göre ara"
          className="h-8 w-0 min-w-0 flex-1 rounded-none border-0 bg-transparent px-0 shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent"
        />
        <button
          type="button"
          tabIndex={open ? 0 : -1}
          aria-label="Aramayı kapat"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            onChange("")
            setOpen(false)
          }}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-muted-foreground"
        >
          <X className="size-4" strokeWidth={1.5} />
        </button>
      </div>
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
  items: { id: string; label: string; count?: number }[]
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
      <DropdownMenuContent align="start" className="w-auto min-w-56">
        {items.map((item) => (
          <DropdownMenuItem
            key={item.id || "all"}
            className="justify-between gap-6"
            onSelect={() => onSelect(item.id)}
          >
            {item.label}
            {item.count != null ? (
              <DropdownMenuShortcut className="tracking-normal text-muted-foreground tabular-nums">
                {item.count}
              </DropdownMenuShortcut>
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
