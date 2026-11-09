import { Suspense } from "react"
import { SessionsView } from "@/presentation/views/dashboard/sessions/sessions-view"

export const metadata = {
  title: "Seanslar",
}

export default function SessionsPage() {
  return (
    <Suspense fallback={null}>
      <SessionsView />
    </Suspense>
  )
}
