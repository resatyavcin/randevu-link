"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/presentation/components/providers/theme-provider"
import { cn } from "@/presentation/lib/utils"

export function DashboardThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme()
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  if (!mounted) {
    return compact ? (
      <div className="size-8" aria-hidden />
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
        className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        aria-label={isDark ? "Açık temaya geç" : "Koyu temaya geç"}
      >
        {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
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
