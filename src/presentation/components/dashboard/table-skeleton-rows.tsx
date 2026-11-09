import { TableCell, TableRow } from "@/presentation/components/ui/table"
import { Skeleton } from "@/presentation/components/ui/skeleton"

export function TableSkeletonRows({
  rows = 8,
  columns,
}: {
  rows?: number
  columns: { key: string; className?: string; skeletonClassName: string }[]
}) {
  return Array.from({ length: rows }, (_, row) => (
    <TableRow
      key={row}
      className="hover:bg-transparent"
      aria-hidden
    >
      {columns.map((column) => (
        <TableCell key={column.key} className={column.className}>
          <Skeleton className={column.skeletonClassName} />
        </TableCell>
      ))}
    </TableRow>
  ))
}
