"use client"

import { MapPin } from "lucide-react"
import { cn } from "@/presentation/lib/utils"
import { getDirectionsUrl } from "@/composition/business"
import { useSocialLinks } from "@/presentation/components/profile/social-links"

const directionsClass =
  "inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/90 px-3 font-display text-xs font-medium text-black shadow-sm transition-colors hover:bg-white active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"

export function DirectionsButton({ className }: { className?: string }) {
  const { location, locationPoint } = useSocialLinks()
  const destination = locationPoint ? `${locationPoint.lat},${locationPoint.lng}` : location

  if (!destination.trim()) return null

  return (
    <a
      href={getDirectionsUrl(destination)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(directionsClass, className)}
    >
      <MapPin className="size-3.5 shrink-0" strokeWidth={1.6} aria-hidden />
      Yol tarifi al
    </a>
  )
}
