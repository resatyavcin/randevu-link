"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { PublicBookingContent } from "@/components/booking/public-booking-content"

export function BookingView({
  preview = false,
}: {
  preview?: boolean
}) {
  const router = useRouter()

  return (
    <div className="flex h-full min-h-0 flex-col bg-background pt-3">
      {preview ? (
        <div className="flex items-center gap-2 px-4 pt-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground transition-colors active:bg-muted/80"
            aria-label="Geri"
          >
            <ArrowLeft className="size-4" strokeWidth={2} />
          </button>
          <p className="min-w-0 flex-1 truncate rounded-full bg-indigo-muted px-3 py-1.5 text-center text-xs font-medium text-indigo">
            Önizleme — müşterilerin gördüğü sayfa
          </p>
        </div>
      ) : null}
      <PublicBookingContent className="flex-1" />
    </div>
  )
}
