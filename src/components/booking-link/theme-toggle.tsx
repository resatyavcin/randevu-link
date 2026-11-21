"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/providers/theme-provider"
import { useBookingAppearance } from "@/components/booking/booking-appearance"
import { cn } from "@/lib/utils"

export function DashboardThemeToggle({ compact = false, className, scope = "panel" }: { compact?: boolean; className?: string; scope?: "panel" | "booking" }) {
  const panel = useTheme()
  const booking = useBookingAppearance()
  const theme = scope === "booking" ? (booking.dark ? "dark" : "light") : panel.theme
  const setTheme = (value: "light" | "dark") => {
    if (scope === "booking") booking.setDark(value === "dark")
    else panel.setTheme(value)
  }
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  if (!mounted) {
    return compact ? (
      <div className={cn("size-8", className)} aria-hidden />
    ) : (
      <div
        className="grid h-11 grid-cols-2 rounded-xl bg-muted/60 p-1"
        aria-hidden
      />
    )
  }

  const isDark = theme === "dark"

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={cn("inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring", className)}
        aria-label={isDark ? "Açık temaya geç" : "Koyu temaya geç"}
        title={isDark ? "Açık temaya geç" : "Koyu temaya geç"}
      >
        {isDark ? <Sun aria-hidden className="size-4" /> : <Moon aria-hidden className="size-4" />}
      </button>
    )
  }

  return (
    <div
      className="grid grid-cols-2 rounded-xl bg-muted/70 p-1"
      role="group"
      aria-label="Tema"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={cn(
          "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition-colors",
          !isDark
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-pressed={!isDark}
      >
        <Sun className="size-3.5" />
        Açık
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={cn(
          "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition-colors",
          isDark
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-pressed={isDark}
      >
        <Moon className="size-3.5" />
        Koyu
      </button>
    </div>
  )
}
