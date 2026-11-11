"use client"

import { useBookingAppearance } from "@/presentation/components/booking/booking-appearance"
import { VerifiedBadge } from "@/presentation/components/ui/verified-badge"

export function BusinessBadge({ className }: { className?: string }) {
  const { badgeColor } = useBookingAppearance()
  return <VerifiedBadge color={badgeColor} className={className} />
}
