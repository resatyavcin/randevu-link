import type { Metadata } from "next"
import { PublicBookingPage } from "@/presentation/components/booking/public-booking-page"
import { MOCK_BUSINESS } from "@/composition/business"

type PageProps = {
  searchParams: Promise<{ preview?: string }>
}

export const metadata: Metadata = {
  title: MOCK_BUSINESS.companyName,
  description: `${MOCK_BUSINESS.companyName} — online randevu`,
}

export default async function BookingPage({ searchParams }: PageProps) {
  const query = await searchParams
  const preview = query.preview === "1"
  return <PublicBookingPage preview={preview} />
}
