import type { Metadata } from "next"
import { BookingView } from "@/components/booking/booking-view"
import { BUSINESS } from "@/lib/business"

type PageProps = {
  searchParams: Promise<{ preview?: string }>
}

export const metadata: Metadata = {
  title: BUSINESS.companyName,
  description: `${BUSINESS.companyName} — Yazılım Mühendisi · Deneyim ve çalışmalar`,
}

export default async function ProfilePage({ searchParams }: PageProps) {
  const query = await searchParams
  const preview = query.preview === "1"
  return <BookingView preview={preview} />
}
