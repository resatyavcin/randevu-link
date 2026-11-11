"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { BusinessSearch } from "@/presentation/components/booking/booking-not-found"

function AraContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") ?? ""

  return (
    <main className="flex flex-col gap-4 px-4 pt-4 pb-4">
      <div className="flex flex-col gap-1 pt-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          İşletme ara
        </h1>
        <p className="text-sm text-muted-foreground">
          İsim, semt veya randevu linkiyle bul.
        </p>
      </div>
      <BusinessSearch initialQuery={initialQuery} autoFocus />
    </main>
  )
}

export default function SearchPageClient() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-col gap-4 px-4 pt-4 pb-4">
          <div className="flex flex-col gap-1 pt-4">
            <h1 className="font-display text-2xl font-bold tracking-tight">
              İşletme ara
            </h1>
            <p className="text-sm text-muted-foreground">Yükleniyor…</p>
          </div>
        </main>
      }
    >
      <AraContent />
    </Suspense>
  )
}
