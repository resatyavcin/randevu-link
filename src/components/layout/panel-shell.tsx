"use client"

import * as React from "react"
import { PanelMenu } from "@/components/booking-link/panel-menu"
import { DashboardTopbar } from "@/components/booking-link/topbar"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/booking-link/panel-sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { SiteFooter } from "@/components/layout/site-footer"

export function PanelShell({ children, businessHeader = false, headerAction }: { children: React.ReactNode; businessHeader?: boolean; headerAction?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)

  return (
      <div className="flex min-h-dvh flex-col bg-background">
        <div className="mx-auto flex w-full max-w-[834px] flex-1 flex-col pt-3">
          {businessHeader ? <DashboardTopbar onMenuClick={() => setOpen(true)} /> : (
            <header className="mx-4 flex items-center justify-between gap-2 border-b border-border/60 pb-3">
              <Button type="button" variant="outline" size="icon-lg" onClick={() => setOpen(true)} aria-label="Panel menüsünü aç" className="rounded-full">
                <Menu aria-hidden className="size-4" />
              </Button>
              {headerAction}
            </header>
          )}
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
  )
}
