"use client"

import { useHydrated } from "@/presentation/lib/use-hydrated"
import { useQuery } from "@tanstack/react-query"

import * as React from "react"
import { Slot } from "radix-ui"
import { settingsApi } from "@/composition/services"
import type { UiThemeApi } from "@/domain/models/contracts"
import { showUndoToast } from "@/presentation/lib/undo-toast"
import { cn } from "@/presentation/lib/utils"

export type BookingAppearance = {
  dark: boolean
  headerSrc: string | null
  logoSrc: string | null
}

type BookingAppearanceContextValue = BookingAppearance & {
  setDark: (dark: boolean) => void
  setHeaderSrc: (src: string | null) => void
  setLogoSrc: (src: string | null) => void
}

const STORAGE_DARK = "randevu-link.booking-dark"
const STORAGE_HEADER = "randevu-link.booking-header"
const STORAGE_LOGO = "randevu-link.booking-logo"

const DEFAULTS: BookingAppearance = {
  dark: false,
  headerSrc: null,
  logoSrc: null,
}

const BookingAppearanceContext =
  React.createContext<BookingAppearanceContextValue | null>(null)

function readStored(): BookingAppearance {
  try {
    const dark = localStorage.getItem(STORAGE_DARK)
    const headerSrc = localStorage.getItem(STORAGE_HEADER)
    const logoSrc = localStorage.getItem(STORAGE_LOGO)
    return {
      dark: dark === "1" || dark === "true",
      headerSrc: headerSrc && headerSrc.startsWith("data:") ? headerSrc : null,
      logoSrc: logoSrc && logoSrc.startsWith("data:") ? logoSrc : null,
    }
  } catch {
    return DEFAULTS
  }
}

function writeKey(key: string, value: string | null) {
  try {
    if (value) localStorage.setItem(key, value)
    else localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

export async function fileToDataUrl(
  file: File,
  maxWidth: number,
  maxHeight: number
): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height)
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    bitmap.close()
    throw new Error("Canvas desteklenmiyor")
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  const png = file.type === "image/png"
  return canvas.toDataURL(png ? "image/png" : "image/jpeg", png ? undefined : 0.84)
}

function toApiTheme(dark: boolean): UiThemeApi {
  return dark ? "DARK" : "LIGHT"
}

function applyDark(dark: boolean) {
  writeKey(STORAGE_DARK, dark ? "1" : "0")
}

export function BookingAppearanceProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const hydrated = useHydrated()
  const cached = React.useMemo(() => hydrated ? readStored() : DEFAULTS, [hydrated])
  const [patch, setPatch] = React.useState<Partial<BookingAppearance>>({})
  const theme = useQuery({
    queryKey: ["settings", "booking-appearance"],
    queryFn: ({ signal }) => settingsApi.bookingAppearance(signal),
  })
  const appearance = React.useMemo(() => ({
    ...cached,
    dark: theme.data ? theme.data.theme === "DARK" : cached.dark,
    ...patch,
  }), [cached, theme.data, patch])
  React.useEffect(() => {
    if (hydrated && theme.data) applyDark(appearance.dark)
  }, [hydrated, theme.data, appearance.dark])

  const persistAssets = React.useCallback((assets: Partial<BookingAppearance>) => {
    if ("headerSrc" in assets) writeKey(STORAGE_HEADER, assets.headerSrc ?? null)
    if ("logoSrc" in assets) writeKey(STORAGE_LOGO, assets.logoSrc ?? null)
    setPatch(prev => ({ ...prev, ...assets }))
  }, [])

  const setDark = React.useCallback((dark: boolean) => {
    applyDark(dark)
    setPatch(prev => ({ ...prev, dark }))
    settingsApi.saveBookingAppearance({ theme: toApiTheme(dark) }).then(() => {
      showUndoToast(dark ? "Koyu randevu teması uygulandı" : "Açık randevu teması uygulandı")
    }).catch(() => showUndoToast("Tema bu tarayıcıya kaydedildi"))
  }, [])

  const value = React.useMemo<BookingAppearanceContextValue>(
    () => ({
      ...appearance,
      setDark,
      setHeaderSrc: (headerSrc) => persistAssets({ headerSrc }),
      setLogoSrc: (logoSrc) => persistAssets({ logoSrc }),
    }),
    [appearance, persistAssets, setDark]
  )

  return (
    <BookingAppearanceContext.Provider value={value}>
      {children}
    </BookingAppearanceContext.Provider>
  )
}

export function useBookingAppearance() {
  const ctx = React.useContext(BookingAppearanceContext)
  if (!ctx) {
    throw new Error(
      "useBookingAppearance must be used within BookingAppearanceProvider"
    )
  }
  return ctx
}

export function useBookingThemeSurface() {
  const { dark } = useBookingAppearance()
  return {
    className: dark ? "dark" : "light",
    style: { colorScheme: dark ? "dark" : "light" } as React.CSSProperties,
  }
}

export function BookingThemeScope({
  className,
  children,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const theme = useBookingThemeSurface()
  const Comp = asChild ? Slot.Root : "div"
  return (
    <Comp
      {...props}
      className={cn(
        theme.className,
        "text-foreground",
        !asChild && "bg-background",
        className
      )}
      style={{ ...props.style, ...theme.style }}
    >
      {children}
    </Comp>
  )
}
