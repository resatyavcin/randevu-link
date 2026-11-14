"use client"

import * as React from "react"
import { useBookingAppearance } from "@/components/booking/booking-appearance"
import Image from "next/image"
import { BUSINESS } from "@/lib/business"
import { cn } from "@/lib/utils"

export function CoverBanner({ className }: { className?: string }) {
  const { headerImages, headerIntervalSeconds } = useBookingAppearance()
  const photos = headerImages.length ? headerImages : BUSINESS.coverPhotos ?? []
  const [current, setCurrent] = React.useState(0)
  const index = Math.min(current, Math.max(0, photos.length - 1))
  const [paused, setPaused] = React.useState(false)
  React.useEffect(() => {
    if (photos.length < 2 || paused) return
    const timer = window.setInterval(() => {
      if (!document.hidden) setCurrent((previous) => (previous + 1) % photos.length)
    }, headerIntervalSeconds * 1000)
    return () => window.clearInterval(timer)
  }, [photos.length, headerIntervalSeconds, paused])
  if (!photos.length) return null


  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false) }} data-cover-banner="" className={cn("relative h-32 w-full overflow-hidden bg-muted sm:h-40", className)} role={photos.length > 1 ? "region" : undefined} aria-label={photos.length > 1 ? "İşletme kapak görselleri" : undefined}>
      <Image src={photos[index]} alt={`${BUSINESS.companyName} kapak görseli ${index + 1}`} fill unoptimized sizes="(max-width: 834px) 100vw, 834px" className={headerImages.length ? "object-cover object-center" : "object-cover object-[center_45%]"} />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
    </div>
  )
}
