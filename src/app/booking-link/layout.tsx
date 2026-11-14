import type { Metadata } from "next"
import { PanelShell } from "@/components/layout/panel-shell"

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
      <PanelShell businessHeader>{children}</PanelShell>
    </div>
  )
}
