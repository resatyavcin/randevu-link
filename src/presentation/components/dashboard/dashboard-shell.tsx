"use client"

import * as React from "react"
import { PanelMenu } from "@/presentation/components/dashboard/panel-menu"
import { DashboardTopbar } from "@/presentation/components/dashboard/topbar"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/presentation/components/dashboard/panel-sheet"
import { SiteFooter } from "@/presentation/components/layout/site-footer"
import { TooltipProvider } from "@/presentation/components/ui/tooltip"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-dvh flex-col bg-background">
        <div className="mx-auto flex w-full max-w-[834px] flex-1 flex-col pt-3">
          <DashboardTopbar onMenuClick={() => setOpen(true)} />
          <main id="dashboard-content" className="dashboard-content min-w-0 flex-1">{children}</main>
          <SiteFooter />
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent className="gap-0 p-0">
            <SheetHeader>
              <SheetTitle className="text-2xl">Menü</SheetTitle>
              <SheetDescription>İşletmenizi tek yerden yönetin.</SheetDescription>
            </SheetHeader>
            <PanelMenu onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  )
}
