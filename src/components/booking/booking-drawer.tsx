"use client"

import { useState } from "react"
import { ArrowLeft } from "lucide-react"
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
  expandOnScroll = false,
  reading = false,
  beforeTitle,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  nested?: boolean
  expandOnScroll?: boolean
  reading?: boolean
  beforeTitle?: React.ReactNode
  children?: React.ReactNode
}) {
  const [expanded, setExpanded] = useState(false)
  const fullScreen = expandOnScroll && expanded && open
  const changeOpen = (next: boolean) => {
    if (!next) setExpanded(false)
    onOpenChange(next)
  }

  const Root = nested ? DrawerPrimitive.NestedRoot : Drawer

  return (
    <Root
      open={open}
      onOpenChange={changeOpen}
      shouldScaleBackground={!nested && !fullScreen}
      setBackgroundColorOnScale={!nested && !fullScreen}
    >
      <DrawerPortal>
        <DrawerOverlay
          className={`bg-black/40 supports-backdrop-filter:backdrop-blur-none ${nested ? "z-60" : "z-50"}`}
        />
        <BookingThemeScope asChild>
          <DrawerPrimitive.Content
            data-slot="drawer-content"
            data-expand-on-scroll={expandOnScroll || undefined}
            className={`fixed inset-x-0 bottom-0 mt-0 flex h-auto max-h-none flex-col overflow-hidden bg-muted outline-none transition-[top,border-radius] duration-300 motion-reduce:transition-none ${fullScreen ? "top-0 rounded-none" : "top-[calc(env(safe-area-inset-top)+2.5rem)] rounded-t-[10px]"} ${nested ? "z-60" : "z-50"}`}
          >
            {expandOnScroll && <div inert={!fullScreen} aria-hidden={!fullScreen} className={`grid shrink-0 bg-background transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none ${fullScreen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="min-h-0 overflow-hidden">
              <div className={`mx-auto w-full px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 ${reading ? "max-w-2xl" : "max-w-md"}`}>
                <button type="button" onClick={() => changeOpen(false)} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">
                  <ArrowLeft aria-hidden className="size-4" />Geri
                </button>
              </div>
              </div>
            </div>}
            <div
              data-booking-step-scroll=""
              onScroll={(event) => {
                if (expandOnScroll) setExpanded(event.currentTarget.scrollTop > 0)
              }}
              className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 text-foreground [overflow-anchor:none]"
            >
              <div
                className={`mx-auto mb-5 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/30 transition-opacity duration-500 motion-reduce:transition-none ${fullScreen ? "opacity-0" : "opacity-100"}`}
                aria-hidden
              />
              <div className={`mx-auto w-full min-w-0 [overflow-wrap:anywhere] ${reading ? "max-w-2xl sm:px-6" : "max-w-md"}`}>
                {beforeTitle}
                <DrawerTitle className={`font-display font-bold tracking-tight text-foreground ${reading ? "text-[2rem] leading-[1.15] sm:text-5xl" : "text-lg"}`}>
                  {title}
                </DrawerTitle>
                <DrawerDescription className="sr-only">{title}</DrawerDescription>
                {children}
              </div>
            </div>
          </DrawerPrimitive.Content>
        </BookingThemeScope>
      </DrawerPortal>
    </Root>
  )
}
