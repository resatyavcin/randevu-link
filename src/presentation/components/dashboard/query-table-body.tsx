import type { ComponentProps, ReactNode } from "react"
import { TableBody, TableCell, TableRow } from "@/presentation/components/ui/table"
import { TableSkeletonRows } from "@/presentation/components/dashboard/table-skeleton-rows"

type Props = {
  loading?: boolean
  error?: string | null
  empty: boolean
  emptyMessage: string
  columns: ComponentProps<typeof TableSkeletonRows>["columns"]
  children: ReactNode
  className?: string
  mobileLoadingLabel?: string
}

export function QueryTableBody({
  loading,
  error,
  empty,
  emptyMessage,
  columns,
  children,
  className,
  mobileLoadingLabel,
}: Props) {
  if (loading)
    return (
      <TableBody className={className}>
        {mobileLoadingLabel && (
          <TableRow className="block md:hidden">
            <TableCell className="block" colSpan={columns.length} role="status">
              {mobileLoadingLabel}
            </TableCell>
          </TableRow>
        )}
        <TableSkeletonRows columns={columns} />
      </TableBody>
    )
  if (error || empty)
    return (
      <TableBody className={className}>
        <TableRow className="hover:bg-transparent">
          <TableCell
            colSpan={columns.length}
            className="py-10 text-center text-sm text-muted-foreground"
          >
            {error ? (
              <span role="alert" className="text-destructive">
                {error}
              </span>
            ) : (
              emptyMessage
            )}
          </TableCell>
        </TableRow>
      </TableBody>
    )
  return <TableBody className={className}>{children}</TableBody>
}
