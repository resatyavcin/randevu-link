"use client"

import { Badge } from "@/presentation/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/presentation/components/ui/tooltip"
import { cn } from "@/presentation/lib/utils"

export function RoleBadge({
  name,
  active = true,
}: {
  name: string
  active?: boolean
}) {
  const badge = (
    <Badge
      className={cn(
        "rounded-md border-transparent font-medium",
        active
          ? "bg-sky-500/15 text-sky-600 dark:text-sky-400"
          : "bg-muted text-muted-foreground"
      )}
    >
      {name}
    </Badge>
  )

  if (active) return badge

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{badge}</span>
      </TooltipTrigger>
      <TooltipContent>Pasif</TooltipContent>
    </Tooltip>
  )
}
