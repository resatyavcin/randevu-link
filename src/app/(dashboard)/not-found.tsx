import type { Metadata } from "next"
import { DashboardNotFoundView } from "@/presentation/components/dashboard/not-found-view"

export const metadata: Metadata = {
  title: "Link bulunamadı",
}

export default function DashboardNotFound() {
  return <DashboardNotFoundView />
}
