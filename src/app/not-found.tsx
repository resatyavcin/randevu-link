import type { Metadata } from "next"
import { DashboardShell } from "@/presentation/components/dashboard/dashboard-shell"
import { DashboardNotFoundView } from "@/presentation/components/dashboard/not-found-view"

export const metadata: Metadata = {
  title: "Link bulunamadı",
}

export default function NotFound() {
  return (
    <div className="font-dashboard min-h-dvh bg-background text-foreground antialiased">
      <DashboardShell>
        <DashboardNotFoundView />
      </DashboardShell>
    </div>
  )
}
