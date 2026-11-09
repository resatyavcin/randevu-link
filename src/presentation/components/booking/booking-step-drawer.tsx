"use client"

import { Drawer as DrawerPrimitive } from "vaul"
import { BookingThemeScope } from "@/presentation/components/booking/booking-appearance"
import {
  Drawer,
  DrawerDescription,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
} from "@/presentation/components/ui/drawer"

/**
 * Full-bleed Vaul page sheet — same chrome as link preview / vaul.emilkowal.ski.
 * Stays open while the wizard pages through steps inside.
 * Pass nested when opening from inside another BookingStepDrawer.
 */
export function BookingStepDrawer({
  open,
  onOpenChange,
  title,
  description,
  stepIndex,
  stepCount,
  nested = false,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  stepIndex?: number
  stepCount?: number
  nested?: boolean
  children: React.ReactNode
}) {
  const Root = nested ? DrawerPrimitive.NestedRoot : Drawer
  const zOverlay = nested ? "z-[60]" : "z-50"
  const zContent = nested ? "z-[60]" : "z-50"

  return (
    <Root
      open={open}
      onOpenChange={onOpenChange}
      shouldScaleBackground={!nested}
      setBackgroundColorOnScale={!nested}
    >
      <DrawerPortal>
        <DrawerOverlay
          className={`bg-black/40 supports-backdrop-filter:backdrop-blur-none ${zOverlay}`}
        />
        <BookingThemeScope asChild>
          <DrawerPrimitive.Content
            data-slot="drawer-content"
            className={`fixed inset-x-0 bottom-0 mt-0 flex h-auto max-h-none flex-col overflow-hidden rounded-t-[10px] bg-muted outline-none top-[calc(env(safe-area-inset-top)+2.5rem)] ${zContent}`}
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
                {stepIndex != null && stepCount != null ? (
                  <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground">
                    {stepIndex} / {stepCount}
                  </p>
                ) : null}
                <DrawerTitle className="font-display text-lg font-bold tracking-tight text-foreground">
                  {title}
                </DrawerTitle>
                {description ? (
                  <DrawerDescription className="mb-5 mt-1 text-sm text-muted-foreground">
                    {description}
                  </DrawerDescription>
                ) : (
                  <div className="mb-5" />
                )}
                {children}
              </div>
            </div>
          </DrawerPrimitive.Content>
        </BookingThemeScope>
      </DrawerPortal>
    </Root>
  )
}
