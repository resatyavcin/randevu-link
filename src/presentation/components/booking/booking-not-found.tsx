"use client"

import * as React from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { UserAvatar } from "@/presentation/components/ui/user-avatar"
import { VerifiedBadge } from "@/presentation/components/ui/verified-badge"
import {
  getBookingPath,
  searchBusinesses,
  type Business,
} from "@/composition/business"
import { BUSINESS_NAME } from "@/composition/config"
import { cn } from "@/presentation/lib/utils"

const fieldClass =
  "h-12 w-full bg-transparent px-3.5 text-[15px] outline-none placeholder:text-muted-foreground/70"

export function BusinessSearch({
  initialQuery = "",
  autoFocus = false,
  className,
}: {
  initialQuery?: string
  autoFocus?: boolean
  className?: string
}) {
  const [query, setQuery] = React.useState(initialQuery)
  const results = React.useMemo(() => searchBusinesses(query), [query])
  const trimmed = query.trim()

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <label className="relative flex items-center rounded-xl bg-muted/70 ring-1 ring-border/70 focus-within:ring-2 focus-within:ring-indigo/40">
        <Search
          className="ml-3.5 size-4 shrink-0 text-muted-foreground"
          strokeWidth={2}
          aria-hidden
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="İşletme, semt veya link ara"
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          className={fieldClass}
        />
      </label>

      {results.length > 0 ? (
        <ul className="overflow-hidden rounded-2xl bg-card ring-1 ring-border/60">
          {results.map((business, i) => (
            <li
              key={business.slug}
              className={cn(i > 0 && "border-t border-border/60")}
            >
              <BusinessResultRow business={business} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl bg-muted/40 px-3.5 py-8 text-center text-sm text-muted-foreground">
          {trimmed
            ? `"${trimmed}" için sonuç yok.`
            : "Aramaya başlamak için yaz."}
        </p>
      )}
    </div>
  )
}

function BusinessResultRow({ business }: { business: Business }) {
  return (
    <Link
      href={getBookingPath()}
      className="flex items-center gap-3 px-3.5 py-3 transition-colors active:bg-muted/50"
    >
      <UserAvatar
        className="size-11"
        size="sm"
        src={business.avatar}
        alt={business.companyName}
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate font-display text-[15px] font-semibold tracking-tight">
            {business.companyName}
          </span>
          {business.verified ? <VerifiedBadge className="size-4" /> : null}
        </span>
        <span className="mt-0.5 block truncate text-sm text-muted-foreground">
          {business.location}
        </span>
      </span>
    </Link>
  )
}

export function BookingNotFoundScreen() {
  return (
    <main className="flex min-h-dvh flex-col bg-background px-4 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 pt-6">
        <p className="font-display text-sm font-semibold tracking-wide text-muted-foreground">
          {BUSINESS_NAME}
        </p>

        <div className="flex flex-col gap-2">
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Link bulunamadı
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Bu randevu linki yok veya kaldırılmış olabilir. İşletmeyi arayıp
            doğru sayfaya gidebilirsin.
          </p>
        </div>

        <BusinessSearch autoFocus />
      </div>
    </main>
  )
}
