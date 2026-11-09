"use client"

import { DirectionsButton } from "@/presentation/components/ui/directions-button"
import { BookingFlow } from "@/presentation/components/booking/booking-flow"
import { ProfileHero } from "@/presentation/components/profile/profile-hero"
import { SocialActions } from "@/presentation/components/profile/social-links"
import { cn } from "@/presentation/lib/utils"
import { BUSINESS_NAME } from "@/composition/config"

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

function SiteFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-2 border-t border-border/60 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between gap-3">
        <div className="font-display text-[13px] font-bold tracking-tight">
          {BUSINESS_NAME}
        </div>
        <p className="text-right text-[11px] leading-relaxed text-muted-foreground">
          © {year} {BUSINESS_NAME}. Tüm hakları saklıdır.
        </p>
      </div>
    </footer>
  )
}
