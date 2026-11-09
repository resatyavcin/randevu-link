"use client"

import { BadgeCheck } from "lucide-react"
import { cn } from "@/presentation/lib/utils"

export function VerifiedBadge({
  className,
}: {
  className?: string
}) {
  return (
    <span
      className={cn(
        "verified-badge relative inline-flex size-6 shrink-0",
        className
      )}
      aria-label="Doğrulanmış işletme"
    >
      <BadgeCheck
        className="size-full text-amber-400"
        fill="currentColor"
        stroke="white"
        strokeWidth={1.5}
        aria-hidden
      />
      <span className="verified-shimmer" aria-hidden />
    </span>
  )
}
