import { cn } from "@/presentation/lib/utils"

export function StaffNamePair({
  booked,
  served,
  className,
}: {
  booked?: string | null
  served?: string | null
  className?: string
}) {
  const bookedName = booked?.trim() || null
  const servedName = served?.trim() || null
  if (!servedName || !bookedName || servedName === bookedName) {
    return <span className={className}>{servedName ?? bookedName ?? "—"}</span>
  }
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-1.5", className)}>
      <span className="text-muted-foreground line-through">{bookedName}</span>
      <span>{servedName}</span>
    </span>
  )
}
