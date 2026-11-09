"use client"

import * as React from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/presentation/components/ui/tooltip"
import { cn } from "@/presentation/lib/utils"
import { rememberCopied } from "@/presentation/lib/copied-text"
import { showCopiedToast } from "@/presentation/lib/undo-toast"

export function formatShortId(value: string) {
  const compact = value.replace(/-/g, "").slice(0, 8).toUpperCase()
  return compact || value
}

export function ShortId({
  value,
  className,
}: {
  value: string
  className?: string
}) {
  const short = formatShortId(value)

  async function copy() {
    rememberCopied(value)
    showCopiedToast()
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      /* the in-app copy is enough for Yapıştır */
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        onClick={copy}
        aria-label={`#${short} kopyala`}
        className={cn(
          "cursor-pointer font-medium font-mono text-muted-foreground tabular-nums underline-offset-2 hover:text-foreground hover:underline",
          className
        )}
      >
        #{short}
      </TooltipTrigger>
      <TooltipContent>{value}</TooltipContent>
    </Tooltip>
  )
}
