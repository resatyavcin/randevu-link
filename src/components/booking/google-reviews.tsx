"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

export type GoogleReview = {
  author: string
  relativeTime?: string
  text: string
  rating: number
}

export function GoogleReviews({ businessName, review, rating, reviewCount, href, className }: {
  businessName: string
  review?: GoogleReview
  rating?: number
  reviewCount?: number
  href?: string
  className?: string
}) {
  const label = <><GoogleLogo className="size-3.5 shrink-0" aria-hidden /><span>Google yorumları · {businessName}</span></>
  return (
    <section aria-label="Google yorumları" className={cn("flex flex-col gap-3 overflow-hidden rounded-2xl bg-card px-4 py-4 ring-1 ring-border/60", className)}>
      {review ? <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted font-display text-[11px] font-bold">{review.author.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join("")}</span>
          <div className="min-w-0 flex-1"><p className="truncate font-display text-[13px] font-semibold tracking-tight">{review.author}</p><div className="mt-0.5 flex items-center gap-1.5"><StarRow rating={review.rating} className="text-amber-500" allowPartial /><span className="text-[11px] text-muted-foreground">{review.relativeTime}</span></div></div>
        </div>
        <p className="text-[13px] leading-relaxed text-foreground/85">{review.text}</p>
      </div> : <p className="py-3 text-sm text-muted-foreground">Henüz yorum eklenmedi.</p>}
      <div className="-mx-4 -mb-4 mt-1 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 bg-muted/30 px-4 py-2.5">
        {href ? <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-semibold text-muted-foreground underline-offset-2 hover:underline">{label}</a> : <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">{label}</div>}
        {rating !== undefined ? <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="font-semibold tabular-nums">{rating.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span><StarRow rating={rating} className="text-amber-500" allowPartial />{reviewCount !== undefined ? <span>({reviewCount})</span> : null}</div> : null}
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
