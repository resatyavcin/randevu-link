"use client"

import { CareerHeading } from "@/components/profile/career-profile"
import { ProfileHero } from "@/components/profile/profile-hero"
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
          afterName={<CareerHeading title="Yazılım Mühendisi" cvUrl={cvUrl} linkedinUrl="https://www.linkedin.com/in/resatyavcin/" />}
        />
      </div>

      <SiteFooter />
    </div>
  )
}
