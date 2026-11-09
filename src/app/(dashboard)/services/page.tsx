import { Suspense } from "react"
import { ServicesView } from "@/presentation/views/dashboard/services/services-view"

export const metadata = {
  title: "Servisler",
}

export default function ServicesPage() {
  return (
    <Suspense fallback={null}>
      <ServicesView />
    </Suspense>
  )
}
