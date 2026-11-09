"use client"

import { MapPin } from "lucide-react"
import { cn } from "@/presentation/lib/utils"
import { getDirectionsUrl, MOCK_BUSINESS } from "@/composition/business"

const directionsClass =
  "inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/72 px-3 py-1.5 font-display text-[13px] font-semibold tracking-[-0.01em] text-zinc-900 shadow-[0_8px_24px_rgb(0_0_0/0.16)] backdrop-blur-xl backdrop-saturate-150 transition-[background-color,transform,box-shadow] duration-150 hover:bg-white/88 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"

export function DirectionsButton({ className }: { className?: string }) {
  const destination = MOCK_BUSINESS.mapsDestination

  if (!destination.trim()) return null

  return (
    <a
      href={getDirectionsUrl(destination)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(directionsClass, className)}
    >
      <MapPin className="size-3.5 shrink-0" strokeWidth={2.4} aria-hidden />
      Yol tarifi al
    </a>
  )
}
