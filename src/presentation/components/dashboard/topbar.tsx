"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ArrowUpRight, ChevronDown, LogOut, Menu } from "lucide-react"
import { useBookingAppearance } from "@/presentation/components/booking/booking-appearance"
import { BusinessBadge } from "@/presentation/components/profile/business-badge"
import { CoverBanner } from "@/presentation/components/profile/cover-banner"
import { UserAvatar } from "@/presentation/components/ui/user-avatar"
import { MOCK_BUSINESS } from "@/composition/business"
import { BUSINESS_NAME } from "@/composition/config"
import { authApi } from "@/composition/services"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuSeparator } from "@/presentation/components/dashboard/panel-dropdown-menu"

import { DropdownMenuRadioItem } from "@/presentation/components/ui/dropdown-menu"

const menuButtonClass = "inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white/90 text-black shadow-sm transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"

export function DashboardTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { logoSrc, badgeColor, setBadgeColor } = useBookingAppearance()
  const router = useRouter()
  const showBusinessHeader = usePathname() === "/booking-link"
  const [loggingOut, setLoggingOut] = React.useState(false)
  const [badgeError, setBadgeError] = React.useState(false)
  const [logoutError, setLogoutError] = React.useState<string | null>(null)

  async function logout() {
    setLoggingOut(true)
    setLogoutError(null)
    try {
      await authApi.logout("DASHBOARD")
      router.replace("/login")
      router.refresh()
    } catch {
      setLogoutError("Çıkış yapılamadı. Tekrar deneyin.")
      setLoggingOut(false)
    }
  }

  return (
    <header className={showBusinessHeader ? "px-4" : "mx-4 flex items-center gap-2 border-b border-border/60 pb-3"}>
      {!showBusinessHeader ? <button type="button" onClick={onMenuClick} aria-label="Panel menüsünü aç" className={menuButtonClass}><Menu className="size-4" strokeWidth={1.6} /></button> : null}
      {showBusinessHeader ? (
        <div className="relative">
          <CoverBanner className="rounded-3xl" />
          <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
            <button type="button" onClick={onMenuClick} aria-label="Panel menüsünü aç" className={menuButtonClass}><Menu className="size-4" strokeWidth={1.6} /></button>
            <Link href="/booking" className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/90 px-3 text-xs font-medium text-black shadow-sm">Randevu sayfam <ArrowUpRight className="size-3.5" /></Link>
          </div>
          <UserAvatar src={logoSrc ?? MOCK_BUSINESS.avatar} alt={BUSINESS_NAME} className="absolute -bottom-7 left-1/2 size-20 -translate-x-1/2 border-4 border-background" />
        </div>
      ) : null}
      <div className={showBusinessHeader ? "relative pt-10 text-center" : "flex min-w-0 flex-1 items-center justify-end gap-2"}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label="Hesap menüsünü aç" className={showBusinessHeader ? "mx-auto inline-flex max-w-full items-center justify-center gap-2 rounded-xl px-3 py-1 text-xl font-bold tracking-tight outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring sm:text-2xl" : "inline-flex min-h-11 min-w-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"}>
              <span className="min-w-0 truncate">{BUSINESS_NAME}</span>
              {showBusinessHeader ? <BusinessBadge className="size-5" /> : null}
              <ChevronDown aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" side="bottom" sideOffset={8} className="w-40 min-w-40">
            {showBusinessHeader ? <>
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">Rozet rengi</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={badgeColor} onValueChange={(color) => setBadgeError(!setBadgeColor(color))} className="grid grid-cols-3 gap-1 p-1">
                {[
                  ["#fbbf24", "Altın"], ["#3b82f6", "Mavi"], ["#8b5cf6", "Mor"],
                  ["#ec4899", "Pembe"], ["#10b981", "Yeşil"], ["#f97316", "Turuncu"],
                ].map(([color, name]) => <DropdownMenuRadioItem key={color} value={color} aria-label={name} onSelect={(event) => event.preventDefault()} className="flex size-10 items-center justify-center p-0 [&>[data-slot=dropdown-menu-radio-item-indicator]]:hidden">
                  <span style={{ backgroundColor: color }} className={`block size-6 shrink-0 rounded-full border-2 border-background ${badgeColor === color ? "ring-2 ring-foreground ring-offset-1 ring-offset-popover" : ""}`} />
                </DropdownMenuRadioItem>)}
              </DropdownMenuRadioGroup>
              {badgeError ? <p role="alert" className="px-2 text-xs text-destructive">Renk kaydedilemedi.</p> : null}
              <DropdownMenuSeparator />
            </> : null}
            <DropdownMenuItem disabled={loggingOut} onSelect={(event) => { event.preventDefault(); void logout() }} variant="destructive" className="min-h-10 text-sm">
              <LogOut aria-hidden className="size-4" />
              {loggingOut ? "Çıkış yapılıyor…" : "Çıkış yap"}
            </DropdownMenuItem>
            {logoutError ? <p role="alert" className="px-3 py-2 text-sm text-destructive">{logoutError}</p> : null}
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  )
}
