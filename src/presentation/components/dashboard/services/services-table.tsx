"use client"

import { RecordActions } from "@/presentation/components/dashboard/record-actions"

import { RoleBadge } from "@/presentation/components/dashboard/role-badge"
import { Badge } from "@/presentation/components/ui/badge"
import { Table, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table"
import type { ServiceDto } from "@/domain/models/contracts"
import { GENDER_LABELS } from "@/domain/models/contracts"
import { QueryTableBody } from "@/presentation/components/dashboard/query-table-body"

function fmtPrice(s: ServiceDto) {
  const fmt = (n: number) => `₺${n.toLocaleString("tr-TR")}`
  return s.priceMaxTl && s.priceMaxTl !== s.priceTl
    ? `${fmt(s.priceTl)}–${fmt(s.priceMaxTl)}`
    : fmt(s.priceTl)
}

const columns = [
              { key: "name", skeletonClassName: "h-4 w-36" },
              { key: "role", skeletonClassName: "h-4 w-20" },
              { key: "category", skeletonClassName: "h-4 w-28" },
              { key: "gender", skeletonClassName: "h-4 w-14" },
              { key: "duration", skeletonClassName: "h-4 w-12" },
              { key: "price", skeletonClassName: "h-4 w-16" },
              { key: "status", skeletonClassName: "h-5 w-12 rounded-md" },
              {
                key: "actions",
                className: "text-right",
                skeletonClassName: "ml-auto h-8 w-16",
              },
            ]

export function ServicesTable({
  rows,
  loading,
  error,
  onEdit,
  onRemove,
}: {
  rows: ServiceDto[]
  loading?: boolean
  error?: string | null
  onEdit: (service: ServiceDto) => void
  onRemove: (service: ServiceDto) => void
}) {
  return (
    <Table aria-busy={loading || undefined} containerClassName="record-list">
      <TableHeader>
        <TableRow>
          <TableHead>Servis</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Kategori</TableHead>
          <TableHead>Cinsiyet</TableHead>
          <TableHead>Süre</TableHead>
          <TableHead className="text-right">Fiyat</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead className="w-24 text-right">İşlem</TableHead>
        </TableRow>
      </TableHeader>
      <QueryTableBody columns={columns} loading={loading} error={error} empty={rows.length === 0} emptyMessage="Bu filtrelere uyan servis yok.">
              {rows.map((s) => (
            <TableRow key={s.id}>
              <TableCell data-label="Servis" className=" font-medium">{s.name}</TableCell>
              <TableCell data-label="Rol" className="">
                <div className="flex flex-wrap gap-1">
                  {s.roles.map((role) => (
                    <RoleBadge
                      key={role.id}
                      name={role.name}
                      active={role.active}
                    />
                  ))}
                </div>
              </TableCell>
              <TableCell data-label="Kategori" className=" text-muted-foreground">
                {s.category.name}
              </TableCell>
              <TableCell data-label="Cinsiyet" className=" text-muted-foreground">
                {GENDER_LABELS[s.category.gender]}
              </TableCell>
              <TableCell data-label="Süre" className=" tabular-nums text-muted-foreground">
                {s.durationMin} dk
              </TableCell>
              <TableCell data-label="Fiyat" className="text-right tabular-nums">
                {fmtPrice(s)}
              </TableCell>
              <TableCell data-label="Durum" className="">
                {s.active ? (
                  <Badge className="rounded-md border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    Aktif
                  </Badge>
                ) : (
                  <Badge className="rounded-md border-transparent bg-muted text-muted-foreground">
                    Pasif
                  </Badge>
                )}
              </TableCell>
              <TableCell data-label="">
<RecordActions name={s.name} active={s.active} onEdit={() => onEdit(s)} onRemove={() => onRemove(s)} />
</TableCell>
</TableRow>
          ))}
            </QueryTableBody>
    </Table>
  )
}
