"use client"

import { useState, type ReactNode } from "react"
import { BookingDrawer } from "@/components/booking/booking-drawer"
import { cn } from "@/lib/utils"

export function KvkkLink({ children, label = "KVKK aydınlatma metni", nested = false, className }: {
  children?: ReactNode
  label?: string
  nested?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" aria-haspopup="dialog" onClick={() => setOpen(true)} className={cn("font-semibold text-foreground underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}>{label}</button>
      <BookingDrawer open={open} onOpenChange={setOpen} title={label} nested={nested}>
        {children ? <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">{children}</div> : null}
      </BookingDrawer>
    </>
  )
}
