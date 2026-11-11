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
  badgeColor: string
  dark: boolean
  headerSrc: string | null
  headerImages: string[]
  headerIntervalSeconds: number
  logoImages: string[]
  logoIntervalSeconds: number
  logoSrc: string | null
}

type BookingAppearanceContextValue = BookingAppearance & {
  setBadgeColor: (color: string) => boolean
  setDark: (dark: boolean) => void
  setHeaderSrc: (src: string | null) => void
  setLogoImages: (images: string[]) => boolean
  setLogoIntervalSeconds: (seconds: number) => void
  setLogoSrc: (src: string | null) => boolean
  setHeaderImages: (images: string[]) => boolean
  setHeaderIntervalSeconds: (seconds: number) => void
}

const STORAGE_DARK = "randevu-link.booking-dark"
const STORAGE_HEADER = "randevu-link.booking-header"
const STORAGE_HEADERS = "randevu-link.booking-headers-v1"
const STORAGE_INTERVAL = "randevu-link.booking-header-interval"
const STORAGE_LOGOS = "randevu-link.booking-logos-v1"
const STORAGE_LOGO_INTERVAL = "randevu-link.booking-logo-interval"
const STORAGE_LOGO = "randevu-link.booking-logo"

const DEFAULTS: BookingAppearance = {
  badgeColor: "#fbbf24",
  dark: false,
  headerSrc: null,
  headerImages: [],
  headerIntervalSeconds: 5,
  logoImages: [],
  logoIntervalSeconds: 5,
  logoSrc: null,
}

const BookingAppearanceContext =
  React.createContext<BookingAppearanceContextValue | null>(null)

function readStored(): BookingAppearance {
  try {
    const dark = localStorage.getItem(STORAGE_DARK)
    const seconds = Number(localStorage.getItem(STORAGE_INTERVAL) ?? 5)
    const headerSrc = localStorage.getItem(STORAGE_HEADER)
    const logoSrc = localStorage.getItem(STORAGE_LOGO)
    let logoImages: string[] = []
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_LOGOS) ?? "null")
      if (Array.isArray(stored)) logoImages = stored.filter((item): item is string => typeof item === "string" && item.startsWith("data:image/")).slice(0, 5)
    } catch { /* Preserve the previous logo. */ }
    if (!logoImages.length && logoSrc?.startsWith("data:image/")) logoImages = [logoSrc]
    const logoSeconds = Number(localStorage.getItem(STORAGE_LOGO_INTERVAL) ?? 5)
    let headerImages: string[] = []
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_HEADERS) ?? "null")
      if (Array.isArray(stored)) headerImages = stored.filter((item): item is string => typeof item === "string" && item.startsWith("data:image/")).slice(0, 5)
    } catch { /* Keep the legacy cover when the saved gallery cannot be read. */ }
    if (!headerImages.length && headerSrc?.startsWith("data:image/")) headerImages = [headerSrc]
    return {
      badgeColor: /^#[0-9a-f]{6}$/i.test(localStorage.getItem("randevu-link.badge-color") ?? "") ? localStorage.getItem("randevu-link.badge-color")! : DEFAULTS.badgeColor,
      dark: dark === "1" || dark === "true",
      headerSrc: headerImages[0] ?? null,
      headerImages,
      headerIntervalSeconds: Number.isInteger(seconds) && seconds >= 2 && seconds <= 60 ? seconds : 5,
      logoImages,
      logoIntervalSeconds: Number.isInteger(logoSeconds) && logoSeconds >= 2 && logoSeconds <= 60 ? logoSeconds : 5,
      logoSrc: logoImages[0] ?? null,
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
    if ("badgeColor" in assets && !writeKey("randevu-link.badge-color", assets.badgeColor ?? null)) return false
    if ("headerImages" in assets) {
      if (!writeKey(STORAGE_HEADERS, JSON.stringify(assets.headerImages ?? []))) return false
      writeKey(STORAGE_HEADER, null)
    }
    if ("headerSrc" in assets && !("headerImages" in assets) && !writeKey(STORAGE_HEADER, assets.headerSrc ?? null)) return false
    if ("logoImages" in assets && !writeKey(STORAGE_LOGOS, JSON.stringify(assets.logoImages))) return false
    if ("logoIntervalSeconds" in assets && !writeKey(STORAGE_LOGO_INTERVAL, String(assets.logoIntervalSeconds))) return false
    if ("logoSrc" in assets && !writeKey(STORAGE_LOGO, assets.logoSrc ?? null)) return false
    if ("headerIntervalSeconds" in assets && !writeKey(STORAGE_INTERVAL, String(assets.headerIntervalSeconds))) return false
    setPatch(prev => ({ ...prev, ...assets }))
    return true
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
      setBadgeColor: (badgeColor) => /^#[0-9a-f]{6}$/i.test(badgeColor) && persistAssets({ badgeColor }),
      setHeaderSrc: (headerSrc) => persistAssets({ headerSrc, headerImages: headerSrc ? [headerSrc] : [] }),
      setHeaderImages: (headerImages) => persistAssets({ headerImages, headerSrc: headerImages[0] ?? null }),
      setLogoSrc: (logoSrc) => persistAssets({ logoSrc, logoImages: logoSrc ? [logoSrc] : [] }),
      setLogoImages: (logoImages) => persistAssets({ logoImages, logoSrc: logoImages[0] ?? null }),
      setLogoIntervalSeconds: (seconds) => {
        if (Number.isInteger(seconds) && seconds >= 2 && seconds <= 60) persistAssets({ logoIntervalSeconds: seconds })
      },
      setHeaderIntervalSeconds: (seconds) => {
        if (Number.isInteger(seconds) && seconds >= 2 && seconds <= 60) persistAssets({ headerIntervalSeconds: seconds })
      },
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
