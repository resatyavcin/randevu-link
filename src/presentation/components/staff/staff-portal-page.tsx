"use client"

import { StaffPortalContent } from "@/presentation/components/staff/staff-portal-content"

export function StaffPortalPage() {
  return (
    <div className="flex min-h-full flex-col bg-background pt-[max(0.75rem,env(safe-area-inset-top))]">
      <StaffPortalContent className="flex-1" />
    </div>
  )
}
