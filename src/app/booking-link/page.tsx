import type { Metadata } from "next"
import { BookingLinkView } from "@/components/booking-link/booking-link-view"

export const metadata: Metadata = {
  title: "Randevu Linki",
}

export default function RandevuLinkiPage() {
  return <BookingLinkView />
}
