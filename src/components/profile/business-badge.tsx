"use client"

import { useBookingAppearance } from "@/components/booking/booking-appearance"
import { VerifiedBadge } from "@/components/ui/verified-badge"

export function BusinessBadge({ className }: { className?: string }) {
  const { badgeColor } = useBookingAppearance()
  return <VerifiedBadge color={badgeColor} className={className} />
}
