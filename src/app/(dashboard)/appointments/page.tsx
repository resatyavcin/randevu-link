import type { Metadata } from "next"
import { Suspense } from "react"
import { RandevularView } from "@/presentation/views/dashboard/appointments/randevular-view"

export const metadata: Metadata = {
  title: "Randevular",
}

export default function RandevularPage() {
  return (
    <Suspense fallback={null}>
      <RandevularView />
    </Suspense>
  )
}
