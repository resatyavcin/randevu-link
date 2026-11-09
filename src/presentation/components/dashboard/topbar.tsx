"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ArrowUpRight, ChevronDown, LogOut, Menu } from "lucide-react"
import { DashboardThemeToggle } from "@/presentation/components/dashboard/theme-toggle"
import { CoverBanner } from "@/presentation/components/profile/cover-banner"
import { UserAvatar } from "@/presentation/components/ui/user-avatar"
import { MOCK_BUSINESS } from "@/composition/business"
import { BUSINESS_NAME } from "@/composition/config"
import { authApi } from "@/composition/services"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/presentation/components/dashboard/panel-dropdown-menu"

export function DashboardTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  const router = useRouter()
  const showBusinessHeader = usePathname() === "/booking-link"
  const [loggingOut, setLoggingOut] = React.useState(false)
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
      {!showBusinessHeader ? <button type="button" onClick={onMenuClick} aria-label="Panel menüsünü aç" className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-foreground hover:bg-accent"><Menu className="size-5" /></button> : null}
      {showBusinessHeader ? (
        <div className="relative">
          <CoverBanner className="h-32 rounded-3xl sm:h-40" />
          <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
            <button type="button" onClick={onMenuClick} aria-label="Panel menüsünü aç" className="inline-flex size-9 items-center justify-center rounded-full bg-white/90 text-black shadow-sm"><Menu className="size-4" /></button>
            <Link href="/booking" className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/90 px-3 text-xs font-medium text-black shadow-sm">Randevu sayfam <ArrowUpRight className="size-3.5" /></Link>
          </div>
          <UserAvatar src={MOCK_BUSINESS.avatar} alt={BUSINESS_NAME} className="absolute -bottom-7 left-1/2 size-20 -translate-x-1/2 border-4 border-background" />
        </div>
      ) : null}
      <div className={showBusinessHeader ? "relative pt-10 text-center" : "flex min-w-0 flex-1 items-center justify-end gap-2"}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label="Hesap menüsünü aç" className={showBusinessHeader ? "mx-auto inline-flex max-w-full items-center justify-center gap-2 rounded-xl px-3 py-1 text-xl font-bold tracking-tight outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring sm:text-2xl" : "inline-flex min-h-11 min-w-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"}>
              <span className="min-w-0 truncate">{BUSINESS_NAME}</span>
              <ChevronDown aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" side="bottom" sideOffset={8} className="w-40 min-w-40">
            <DropdownMenuItem disabled={loggingOut} onSelect={(event) => { event.preventDefault(); void logout() }} variant="destructive" className="min-h-10 text-sm">
              <LogOut aria-hidden className="size-4" />
              {loggingOut ? "Çıkış yapılıyor…" : "Çıkış yap"}
            </DropdownMenuItem>
            {logoutError ? <p role="alert" className="px-3 py-2 text-sm text-destructive">{logoutError}</p> : null}
          </DropdownMenuContent>
        </DropdownMenu>
        {showBusinessHeader ? <div className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground"><span className="size-1.5 rounded-full bg-primary" />İşletme yönetimi<DashboardThemeToggle compact /></div> : <DashboardThemeToggle compact />}
      </div>
    </header>
  )
}
