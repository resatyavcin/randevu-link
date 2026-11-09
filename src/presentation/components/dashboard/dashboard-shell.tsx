"use client"

import * as React from "react"
import { PanelMenu } from "@/presentation/components/dashboard/panel-menu"
import { DashboardTopbar } from "@/presentation/components/dashboard/topbar"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/presentation/components/dashboard/panel-sheet"
import { TooltipProvider } from "@/presentation/components/ui/tooltip"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-dvh flex-col bg-background">
        <div className="mx-auto flex w-full max-w-[834px] flex-1 flex-col pt-[max(0.75rem,env(safe-area-inset-top))]">
          <DashboardTopbar onMenuClick={() => setOpen(true)} />
          <main id="dashboard-content" className="dashboard-content min-w-0 flex-1">{children}</main>
          <footer className="px-4 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center text-xs text-muted-foreground">Demo panel · Değişiklikler bu tarayıcıda saklanır</footer>
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
