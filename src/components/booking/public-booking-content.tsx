"use client"

import { CareerHeading } from "@/components/profile/career-profile"
import { ProfileHero } from "@/components/profile/profile-hero"
import { ProfileWritings } from "@/components/profile/profile-writings"
import { DashboardThemeToggle } from "@/components/booking-link/theme-toggle"
import { cn } from "@/lib/utils"
import { SiteFooter } from "@/components/layout/site-footer"

export function PublicBookingContent({
  className,
  compact = false,
  cvUrl = "/cv.txt",
}: {
  className?: string
  cvUrl?: string
  /** Slightly tighter spacing for drawer embedding */
  compact?: boolean
}) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col bg-background", className)}>
      <div className="shrink-0">
        <ProfileHero
          compact={compact}
          heading="h1"
          actions={<div className="absolute right-7 top-6 z-20"><DashboardThemeToggle compact scope="booking" className="size-9 rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur-sm hover:bg-background" /></div>}
          afterName={<CareerHeading title="Yazılım Mühendisi" cvUrl={cvUrl} linkedinUrl="https://www.linkedin.com/in/resatyavcin/" email="resatyavcin@icloud.com" />}
        />
      </div>

      <ProfileWritings />
      <SiteFooter />
    </div>
  )
}
