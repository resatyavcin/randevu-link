import type { Metadata } from "next"
import { PanelShell } from "@/components/layout/panel-shell"
import { ShowcaseView } from "@/components/showcase/showcase-view"

export const metadata: Metadata = { title: "Kullanıcı Arayüzü" }

export default function UiPage() {
  return (
    <div className="font-dashboard min-h-dvh bg-background text-foreground antialiased">
      <PanelShell><ShowcaseView /></PanelShell>
    </div>
  )
}
