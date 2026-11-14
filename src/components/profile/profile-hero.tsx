"use client"

import * as React from "react"
import { useBookingAppearance } from "@/components/booking/booking-appearance"
import { CoverBanner } from "@/components/profile/cover-banner"
import { UserAvatar } from "@/components/ui/user-avatar"
import { BusinessBadge } from "@/components/profile/business-badge"
import { BUSINESS } from "@/lib/business"
import { cn } from "@/lib/utils"

type ProfileHeroProps = {
  /** Drawer preview: tighter spacing */
  compact?: boolean
  heading?: "h1" | "h2"
  actions?: React.ReactNode
  afterName?: React.ReactNode
  /** Company name only — no banner, avatar, or verified badge. */
  titleOnly?: boolean
}

export function ProfileHero({
  compact = false,
  heading = "h2",
  actions,
  afterName,
  titleOnly = false,
}: ProfileHeroProps) {
  const { logoSrc, logoImages, logoIntervalSeconds } = useBookingAppearance()
  const [logoIndex, setLogoIndex] = React.useState(0)
  React.useEffect(() => {
    if (logoImages.length < 2) return
    const timer = window.setInterval(() => {
      if (!document.hidden) setLogoIndex((previous) => (previous + 1) % logoImages.length)
    }, logoIntervalSeconds * 1000)
    return () => window.clearInterval(timer)
  }, [logoImages.length, logoIntervalSeconds])
  const titleClass = cn(
    "max-w-full font-display font-extrabold leading-none tracking-[-0.02em]",
    titleOnly ? "text-left" : "text-center",
    compact ? "text-xl" : "text-[1.65rem]"
  )
  const titleContent = (
    <>
      {BUSINESS.companyName}
      {!titleOnly && BUSINESS.verified ? (
        <BusinessBadge className="ml-[0.28em] inline-flex size-[0.85em] align-middle" />
      ) : null}
    </>
  )
  const title =
    heading === "h1" ? (
      <h1 className={titleClass}>{titleContent}</h1>
    ) : (
      <h2 className={titleClass}>{titleContent}</h2>
    )

  if (titleOnly) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 px-4",
          compact ? "py-3" : "py-4"
        )}
      >
        <div className="min-w-0 flex-1">{title}</div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    )
  }

  return (
    <div className={cn("relative px-4 pb-4", compact ? "pt-2" : "pt-3")}>
      <CoverBanner className="rounded-3xl" />
      {actions}
      <div
        className={cn(
          "relative z-10 flex flex-col items-center gap-1",
          compact ? "-mt-7" : "-mt-10"
        )}
      >
        <UserAvatar
          src={logoImages[logoIndex % Math.max(1, logoImages.length)] ?? logoSrc ?? BUSINESS.avatar}
          alt={BUSINESS.companyName}
          className={cn("ring-[3px] ring-background", compact ? "size-14" : "size-20")}
        />
        <div className="mt-3 flex justify-center px-2">
          {title}
        </div>
        {afterName}
      </div>
    </div>
  )
}
