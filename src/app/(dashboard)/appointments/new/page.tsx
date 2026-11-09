import type { Metadata } from "next"
import { Suspense } from "react"
import { NewSessionView } from "@/presentation/views/dashboard/appointments/new/new-session-view"

export const metadata: Metadata = {
  title: "Yeni seans",
}

export default function NewSessionPage() {
  return (
    <Suspense fallback={null}>
      <NewSessionView />
    </Suspense>
  )
}
