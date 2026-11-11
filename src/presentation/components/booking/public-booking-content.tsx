"use client"

import { DirectionsButton } from "@/presentation/components/ui/directions-button"
import { BookingFlow } from "@/presentation/components/booking/booking-flow"
import { ProfileHero } from "@/presentation/components/profile/profile-hero"
import { SocialActions } from "@/presentation/components/profile/social-links"
import { cn } from "@/presentation/lib/utils"
import { SiteFooter } from "@/presentation/components/layout/site-footer"

export function PublicBookingContent({
  className,
  compact = false,
}: {
  className?: string
  /** Slightly tighter spacing for drawer embedding */
  compact?: boolean
}) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col bg-background", className)}>
      <div className="shrink-0">
        <ProfileHero
          compact={compact}
          heading="h1"
          actions={
            <DirectionsButton
              className={
                compact
                  ? "absolute top-3 right-7 z-20"
                  : "absolute top-6 right-7 z-20"
              }
            />
          }
          afterName={<SocialActions />}
        />
      </div>

      <BookingFlow preview={compact} nestedDrawers={compact} />

      <SiteFooter />
    </div>
  )
}
