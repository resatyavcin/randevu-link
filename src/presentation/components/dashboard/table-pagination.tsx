"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/presentation/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/presentation/components/dashboard/panel-select"
import { Skeleton } from "@/presentation/components/ui/skeleton"
import {
  DEFAULT_TABLE_PAGE_SIZE,
  TABLE_PAGE_SIZE_OPTIONS,
} from "@/domain/models/contracts"
import { cn } from "@/presentation/lib/utils"

export function TablePager({
  page,
  totalPages,
  onPageChange,
  disabled,
  className,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  disabled?: boolean
  className?: string
}) {
  const safeTotalPages = Math.max(1, totalPages)
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 px-2 border-border/70 bg-transparent text-muted-foreground hover:bg-background hover:text-foreground"
        disabled={disabled || page <= 0}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="size-4" />
        Önceki
      </Button>
      {disabled ? (
        <Skeleton className="mx-2 h-4 w-12" />
      ) : (
        <span className="min-w-16 px-2 text-center text-sm tabular-nums text-muted-foreground">
          {page + 1} / {safeTotalPages}
        </span>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 px-2 border-border/70 bg-transparent text-muted-foreground hover:bg-background hover:text-foreground"
        disabled={disabled || page + 1 >= safeTotalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Sonraki
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}

export function TablePagination({
  page,
  totalPages,
  totalElements,
  size,
  onPageChange,
  onPageSizeChange,
  loading,
  className,
}: {
  page: number
  totalPages: number
  totalElements: number
  size: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  loading?: boolean
  className?: string
}) {
  const from = totalElements === 0 ? 0 : page * size + 1
  const to = Math.min((page + 1) * size, totalElements)
  const selectedSize = (TABLE_PAGE_SIZE_OPTIONS as readonly number[]).includes(size)
    ? String(size)
    : String(DEFAULT_TABLE_PAGE_SIZE)

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-border/60 bg-muted/50 px-4 py-3",
        className
      )}
    >
      {loading ? (
        <Skeleton className="h-4 w-36" />
      ) : (
        <p className="text-sm text-muted-foreground">
          {totalElements === 0
            ? "Kayıt yok"
            : `${from}–${to} / ${totalElements} kayıt`}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {onPageSizeChange ? (
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Sayfa başı
            <Select
              value={selectedSize}
              onValueChange={(value) => onPageSizeChange(Number(value))}
              disabled={loading}
            >
              <SelectTrigger aria-label="Sayfa başına kayıt">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="end">
                {TABLE_PAGE_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        ) : null}
        <TablePager
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          disabled={loading}
        />
      </div>
    </div>
  )
}
