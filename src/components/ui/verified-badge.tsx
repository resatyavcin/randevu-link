"use client"

import { BadgeCheck } from "lucide-react"
import { cn } from "@/lib/utils"

export function VerifiedBadge({
  className,
  color = "#fbbf24",
}: {
  className?: string
  color?: string
}) {
  return (
    <span
      className={cn(
        "verified-badge relative inline-flex size-6 shrink-0",
        className
      )}
      style={{ color, filter: `drop-shadow(0 0 4px ${color}73)` }}
      aria-label="Doğrulanmış işletme"
    >
      <BadgeCheck
        className="size-full"
        fill="currentColor"
        stroke="white"
        strokeWidth={1.5}
        aria-hidden
      />
      <span className="verified-shimmer" aria-hidden />
    </span>
  )
}
