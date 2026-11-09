import type { Metadata } from "next"
import { StaffPortalPage } from "@/presentation/components/staff/staff-portal-page"
import { MOCK_BUSINESS } from "@/composition/business"

export const metadata: Metadata = {
  title: "Personel girişi",
  description: `${MOCK_BUSINESS.companyName} — personel randevuları`,
}

export default function StaffPortalRoute() {
  return <StaffPortalPage />
}
