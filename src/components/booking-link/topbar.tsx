"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowUpRight, ChevronDown, Menu } from "lucide-react"
import { useBookingAppearance } from "@/components/booking/booking-appearance"
import { BusinessBadge } from "@/components/profile/business-badge"
import { CoverBanner } from "@/components/profile/cover-banner"
import { UserAvatar } from "@/components/ui/user-avatar"
import { BUSINESS } from "@/lib/business"
import { BUSINESS_NAME } from "@/lib/config"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuRadioGroup } from "@/components/booking-link/panel-dropdown-menu"

import { DropdownMenuRadioItem } from "@/components/ui/dropdown-menu"

export function DashboardTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { logoSrc, badgeColor, setBadgeColor } = useBookingAppearance()
  const [badgeError, setBadgeError] = React.useState(false)

  return (
    <header className="px-4">
        <div className="relative">
          <CoverBanner className="rounded-3xl" />
          <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
            <button type="button" onClick={onMenuClick} aria-label="Panel menüsünü aç" className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white/90 text-black shadow-sm transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><Menu className="size-4" strokeWidth={1.6} /></button>
            <Link href="/booking" className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/90 px-3 text-xs font-medium text-black shadow-sm">Randevu sayfam <ArrowUpRight className="size-3.5" /></Link>
          </div>
          <UserAvatar src={logoSrc ?? BUSINESS.avatar} alt={BUSINESS_NAME} className="absolute -bottom-7 left-1/2 size-20 -translate-x-1/2 border-4 border-background" />
        </div>
      <div className="relative pt-10 text-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label="Rozet rengini değiştir" className="mx-auto inline-flex max-w-full items-center justify-center gap-2 rounded-xl px-3 py-1 text-xl font-bold tracking-tight outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring sm:text-2xl">
              <span className="min-w-0 truncate">{BUSINESS_NAME}</span>
              <BusinessBadge className="size-5" />
              <ChevronDown aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" side="bottom" sideOffset={8} className="w-40 min-w-40">
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
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  )
}
