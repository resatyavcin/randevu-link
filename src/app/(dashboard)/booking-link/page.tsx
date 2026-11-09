import type { Metadata } from "next"
import { RandevuLinkiView } from "@/presentation/views/dashboard/booking-link/randevu-linki-view"

export const metadata: Metadata = {
  title: "Randevu Linki",
}

export default function RandevuLinkiPage() {
  return <RandevuLinkiView />
}
