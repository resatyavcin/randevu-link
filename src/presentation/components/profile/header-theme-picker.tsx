"use client"

import * as React from "react"
import { Check } from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/presentation/components/ui/drawer"
import { cn } from "@/presentation/lib/utils"
import {
  HEADER_THEMES,
  HEADER_THEME_STORAGE_KEY,
  getHeaderTheme,
  type HeaderTheme,
  type HeaderThemeId,
} from "@/presentation/components/profile/header-themes"

type HeaderThemeContextValue = {
  themeId: HeaderThemeId
  theme: HeaderTheme
  select: (id: HeaderThemeId) => void
}

const HeaderThemeContext = React.createContext<HeaderThemeContextValue | null>(
  null
)

export function HeaderThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const themeId: HeaderThemeId = "lavender"

  React.useEffect(() => {
    localStorage.setItem(HEADER_THEME_STORAGE_KEY, "lavender")
  }, [])

  const select = React.useCallback(() => {
    localStorage.setItem(HEADER_THEME_STORAGE_KEY, "lavender")
  }, [])

  const value = React.useMemo(
    () => ({
      themeId,
      theme: getHeaderTheme(themeId),
      select,
    }),
    [themeId, select]
  )

  return (
    <HeaderThemeContext.Provider value={value}>
      {children}
    </HeaderThemeContext.Provider>
  )
}

export function useHeaderTheme() {
  const ctx = React.useContext(HeaderThemeContext)
  if (!ctx) {
    throw new Error("useHeaderTheme must be used within HeaderThemeProvider")
  }
  return ctx
}

const THEME_HINTS: Record<HeaderThemeId, string> = {
  peach: "Sıcak pembe ve şeftali tonları",
  lavender: "Yumuşak mor ve lila",
  sky: "Açık mavi gökyüzü tonları",
}

export function HeaderThemeDrawer({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { themeId, select } = useHeaderTheme()

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className={cn(
          "link-floating-drawer mx-auto max-w-[834px] overflow-hidden outline-none shadow-2xl",
          "data-[vaul-drawer-direction=bottom]:mt-0",
          "data-[vaul-drawer-direction=bottom]:rounded-3xl",
          "data-[vaul-drawer-direction=bottom]:border"
        )}
      >
        <DrawerHeader className="gap-1 px-5 text-left group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
          <DrawerTitle className="font-display text-lg font-bold tracking-tight">
            Kapak Rengi
          </DrawerTitle>
          <DrawerDescription className="text-sm text-muted-foreground">
            Randevu linkindeki banner ve avatar rengi birlikte güncellenir.
          </DrawerDescription>
        </DrawerHeader>

        {/* Vertical list */}
        <div className="mx-5 mb-6 overflow-hidden rounded-2xl bg-muted/50 ring-1 ring-border/60">
          {HEADER_THEMES.map((item, index) => {
            const selected = item.id === themeId
            return (
              <React.Fragment key={item.id}>
                {index > 0 ? (
                  <div className="mx-4 h-px bg-border/70" />
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    select(item.id)
                    onOpenChange(false)
                  }}
                  className={cn(
                    "flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors",
                    "active:bg-background/80",
                    selected && "bg-background/60"
                  )}
                >
                  <span
                    className="size-11 shrink-0 rounded-full shadow-inner ring-2 ring-white dark:ring-zinc-900"
                    style={{ backgroundImage: item.swatch }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-[15px] font-semibold tracking-tight">
                      {item.label}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {THEME_HINTS[item.id]}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
                      selected
                        ? "border-indigo bg-indigo text-white"
                        : "border-muted-foreground/30 bg-transparent"
                    )}
                  >
                    {selected ? (
                      <Check className="size-3.5" strokeWidth={3} />
                    ) : null}
                  </span>
                </button>
              </React.Fragment>
            )
          })}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
