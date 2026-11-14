"use client"

import { Drawer as DrawerPrimitive } from "vaul"
import { BookingThemeScope } from "@/components/booking/booking-appearance"
import {
  Drawer,
  DrawerDescription,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
} from "@/components/ui/drawer"

export function BookingDrawer({
  open,
  onOpenChange,
  title,
  children,
  nested = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  nested?: boolean
  children?: React.ReactNode
}) {

  const Root = nested ? DrawerPrimitive.NestedRoot : Drawer

  return (
    <Root
      open={open}
      onOpenChange={onOpenChange}
      shouldScaleBackground={!nested}
      setBackgroundColorOnScale={!nested}
    >
      <DrawerPortal>
        <DrawerOverlay
          className={`bg-black/40 supports-backdrop-filter:backdrop-blur-none ${nested ? "z-60" : "z-50"}`}
        />
        <BookingThemeScope asChild>
          <DrawerPrimitive.Content
            data-slot="drawer-content"
            className={`fixed inset-x-0 bottom-0 mt-0 flex h-auto max-h-none flex-col overflow-hidden rounded-t-[10px] bg-muted outline-none top-[calc(env(safe-area-inset-top)+2.5rem)] ${nested ? "z-60" : "z-50"}`}
          >
            <div
              data-booking-step-scroll=""
              className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-t-[10px] bg-background px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 text-foreground"
            >
              <div
                className="mx-auto mb-5 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/30"
                aria-hidden
              />
              <div className="mx-auto w-full min-w-0 max-w-md [overflow-wrap:anywhere]">
                <DrawerTitle className="font-display text-lg font-bold tracking-tight text-foreground">
                  {title}
                </DrawerTitle>
                <DrawerDescription className="sr-only">{title}</DrawerDescription>
                {children}
                <DrawerPrimitive.Close aria-label="Kapat" className="mt-4 rounded-full border px-4 py-2 text-sm">Kapat</DrawerPrimitive.Close>
              </div>
            </div>
          </DrawerPrimitive.Content>
        </BookingThemeScope>
      </DrawerPortal>
    </Root>
  )
}
