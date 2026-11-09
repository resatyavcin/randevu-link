import * as React from "react"
import { cn } from "@/presentation/lib/utils"

function Progress({
  value = 0,
  className,
  ...props
}: React.ComponentProps<"div"> & { value?: number }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={cn(
        "relative h-1.5 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className="h-full bg-primary transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export { Progress }
