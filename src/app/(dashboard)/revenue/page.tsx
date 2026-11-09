import type { Metadata } from "next"
import { Suspense } from "react"
import { RevenueView } from "@/presentation/views/dashboard/revenue/revenue-view"

export const metadata: Metadata = {
  title: "Kasa",
}

export default function RevenuePage() {
  return (
    <Suspense fallback={null}>
      <RevenueView />
    </Suspense>
  )
}
