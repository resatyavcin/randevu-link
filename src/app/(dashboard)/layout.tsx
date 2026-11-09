import type { Metadata } from "next"
import { DashboardShell } from "@/presentation/components/dashboard/dashboard-shell"

export const metadata: Metadata = {
  title: "Panel",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="font-dashboard min-h-dvh bg-background text-foreground antialiased">
      <DashboardShell>{children}</DashboardShell>
    </div>
  )
}
