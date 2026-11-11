"use client"

import { useLayoutEffect, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { BookingThemeScope } from "@/presentation/components/booking/booking-appearance"

function isPublicSurface(pathname: string) {
  return (
    pathname === "/booking" ||
    pathname.startsWith("/booking/") ||
    pathname === "/staff" ||
    pathname.startsWith("/staff/") ||
    pathname === "/search" ||
    pathname.startsWith("/search/") ||
    pathname === "/~offline"
  )
}

function isBookingSurface(pathname: string) {
  return (
    pathname === "/booking" ||
    pathname.startsWith("/booking/") ||
    pathname === "/staff" ||
    pathname.startsWith("/staff/")
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const publicSurface = isPublicSurface(pathname)
  const bookingSurface = isBookingSurface(pathname)

  useLayoutEffect(() => {
    document.documentElement.classList.toggle("font-dashboard", !publicSurface)
  }, [publicSurface])

  // Vaul scales one viewport surface; scrolling stays inside it on every route.
  const frame = (
    <div className="mx-auto flex h-full w-full max-w-[834px] flex-col">
      <div data-page-scroll="" className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  )

  if (bookingSurface) {
    return (
      <BookingThemeScope
        data-vaul-drawer-wrapper=""
        className="relative h-dvh overflow-hidden pt-[env(safe-area-inset-top)]"
      >
        {frame}
      </BookingThemeScope>
    )
  }

  return (
    <div
      data-vaul-drawer-wrapper=""
      className="relative h-dvh overflow-hidden pt-[env(safe-area-inset-top)] bg-background"
    >
      {frame}
    </div>
  )
}
