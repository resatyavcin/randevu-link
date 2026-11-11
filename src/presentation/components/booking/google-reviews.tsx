"use client"

import * as React from "react"
import { BUSINESS_NAME } from "@/composition/config"
import { Star } from "lucide-react"
import { cn } from "@/presentation/lib/utils"

type Review = {
  author: string
  initials: string
  relativeTime: string
  text: string
  rating: 5
}

/** Fictional demo reviews; no external review data is used. */
const REVIEWS: Review[] = [
  { author: "Deniz A.", initials: "DA", relativeTime: "2 hafta önce", text: "Saç kesiminden çok memnun kaldım. Özenli ve güler yüzlü bir hizmetti.", rating: 5 },
  { author: "Ece K.", initials: "EK", relativeTime: "1 ay önce", text: "Randevumu kolayca aldım, tam saatinde başladık. Salon temiz ve rahattı.", rating: 5 },
  { author: "Mert T.", initials: "MT", relativeTime: "3 hafta önce", text: "İstediğim modeli birlikte değerlendirdik. Sonuç tam istediğim gibi oldu.", rating: 5 },
  { author: "Selin Y.", initials: "SY", relativeTime: "2 ay önce", text: "İlgili bir ekip, rahat bir ortam. Kesim ve şekillendirmeden memnun kaldım.", rating: 5 },
  { author: "Can B.", initials: "CB", relativeTime: "1 ay önce", text: "Saç ve sakal için geldim. Detaylara gösterilen özen çok iyiydi.", rating: 5 },
  { author: "Derya S.", initials: "DS", relativeTime: "3 hafta önce", text: "Randevu süreci pratikti. Zamanında ve özenli hizmet için teşekkürler.", rating: 5 },
]

const AVATAR_TONES = [
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-fuchsia-100 text-fuchsia-700",
  "bg-orange-100 text-orange-700",
]

const ROTATE_MS = 5000

/** Illustrative demo rating and review count. */
const GOOGLE_RATING = 4.9
const GOOGLE_REVIEW_COUNT = 6

export function GoogleReviews({ className }: { className?: string }) {
  const [index, setIndex] = React.useState(0)
  const pauseRef = React.useRef(false)

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const id = window.setInterval(() => {
      if (pauseRef.current) return
      setIndex((i) => (i + 1) % REVIEWS.length)
    }, ROTATE_MS)
    return () => window.clearInterval(id)
  }, [])

  const review = REVIEWS[index]
  const avatarTone = AVATAR_TONES[index % AVATAR_TONES.length]

  return (
    <section
      aria-label="Google yorumları — kurgusal demo içerik"
      className={cn(
        "flex flex-col gap-3 overflow-hidden rounded-2xl bg-card px-4 py-4 ring-1 ring-border/60",
        className
      )}
      onMouseEnter={() => {
        pauseRef.current = true
      }}
      onMouseLeave={() => {
        pauseRef.current = false
      }}
    >
      <div key={index} className="review-slide flex flex-col gap-2.5">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full font-display text-[11px] font-bold",
              avatarTone
            )}
            aria-hidden
          >
            {review.initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[13px] font-semibold tracking-tight">
              {review.author}
            </p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <StarRow rating={review.rating} className="text-amber-500" />
              <span className="truncate text-[11px] text-muted-foreground">
                {review.relativeTime}
              </span>
            </div>
          </div>
        </div>
        <p className="text-[13px] leading-relaxed text-foreground/85">
          {review.text}
        </p>
      </div>

      <div className="-mx-4 -mb-4 mt-1 flex items-center justify-between gap-3 border-t border-border/60 bg-muted/30 px-4 py-2.5 opacity-70">
        <div className="flex items-center gap-2 text-muted-foreground">
          <GoogleLogo className="size-3.5" aria-hidden />
          <p className="font-display text-[12px] font-semibold tracking-tight">
            Google yorumları · {BUSINESS_NAME}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="font-display text-[13px] font-bold tabular-nums">
            {GOOGLE_RATING.toLocaleString("tr-TR", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
          </span>
          <StarRow
            rating={GOOGLE_RATING}
            className="text-amber-500"
            allowPartial
          />
          <span className="tabular-nums text-[11px] text-muted-foreground">
            ({GOOGLE_REVIEW_COUNT})
          </span>
        </div>
      </div>
    </section>
  )
}

function StarRow({
  rating,
  className,
  allowPartial = false,
}: {
  rating: number
  className?: string
  allowPartial?: boolean
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      aria-label={`${rating} yıldız`}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const fillAmount = allowPartial
          ? Math.max(0, Math.min(1, rating - i))
          : i < rating
            ? 1
            : 0
        if (fillAmount === 1 || fillAmount === 0) {
          return (
            <Star
              key={i}
              className="size-3"
              strokeWidth={0}
              fill={fillAmount === 1 ? "currentColor" : "transparent"}
              aria-hidden
            />
          )
        }
        return (
          <span
            key={i}
            className="relative inline-flex size-3"
            aria-hidden
          >
            <Star
              className="absolute inset-0 size-3"
              strokeWidth={0}
              fill="transparent"
            />
            <span
              className="absolute inset-y-0 left-0 overflow-hidden"
              style={{ width: `${fillAmount * 100}%` }}
            >
              <Star
                className="size-3"
                strokeWidth={0}
                fill="currentColor"
              />
            </span>
          </span>
        )
      })}
    </span>
  )
}

function GoogleLogo({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.44c-.28 1.4-1.1 2.58-2.32 3.4v2.83h3.74c2.19-2.02 3.63-5 3.63-8.47Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.14 0 5.77-1.03 7.69-2.79l-3.74-2.83c-1.04.69-2.36 1.11-3.95 1.11-3.03 0-5.6-2.04-6.52-4.79H1.63v3c1.92 3.81 5.86 6.4 10.37 6.4Z"
      />
      <path
        fill="#FBBC05"
        d="M5.48 14.7A7.19 7.19 0 0 1 5.1 12c0-.94.16-1.85.38-2.7v-3H1.63A11.98 11.98 0 0 0 0 12c0 1.93.46 3.75 1.63 5.7l3.85-3Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.71 0 3.24.59 4.44 1.74l3.31-3.31C17.76 1.19 15.13 0 12 0 7.49 0 3.55 2.59 1.63 6.3l3.85 3C6.4 6.79 8.97 4.75 12 4.75Z"
      />
    </svg>
  )
}
