import type { Metadata } from "next"
import { PanelShell } from "@/components/layout/panel-shell"
import { DashboardNotFoundView } from "@/components/booking-link/not-found-view"

export const metadata: Metadata = {
  title: "Link bulunamadı",
}

export default function NotFound() {
  return (
    <div className="font-dashboard min-h-dvh bg-background text-foreground antialiased">
      <PanelShell>
        <DashboardNotFoundView />
      </PanelShell>
    </div>
  )
}
