import type { ReactNode } from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "@/presentation/lib/utils"

export function DetailRow({
  label,
  value,
  last = false,
  onClick,
  trailing,
  showChevron = false,
}: {
  label: ReactNode
  value?: ReactNode
  last?: boolean
  onClick?: () => void
  trailing?: ReactNode
  showChevron?: boolean
}) {
  const className = cn(
    "flex w-full items-center justify-between gap-6 px-4 py-3.5 text-left",
    onClick && "transition-colors hover:bg-muted/40",
    !last && "divider-dashed"
  )

  const content = (
    <>
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="inline-flex min-w-0 items-center gap-2 text-right text-sm font-medium text-foreground">
        {value ? <span className="min-w-0 truncate">{value}</span> : null}
        {trailing}
        {showChevron ? (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        ) : null}
      </span>
    </>
  )

  if (onClick) {
    return (
      <button data-slot="detail-row" type="button" onClick={onClick} className={className}>
        {content}
      </button>
    )
  }

  return <div data-slot="detail-row" className={className}>{content}</div>
}
