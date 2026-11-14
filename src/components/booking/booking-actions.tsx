"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { BookingDrawer } from "@/components/booking/booking-drawer"

const actions = ["Randevu al", "Sıradaki seansımı al", "Randevumu iptal et"] as const

export function BookingActions() {
  const [active, setActive] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-2 px-4 pt-3 pb-6">
      {actions.map((label, index) => (
        <Button key={label} type="button" variant={index === 0 ? "default" : "outline"}
          className={index === 0 ? "h-12 w-full rounded-xl text-base" : "h-11 w-full rounded-xl text-base"}
          size="lg" onClick={() => setActive(label)}>
          {label}
        </Button>
      ))}
      <BookingDrawer open={active !== null} onOpenChange={(open) => { if (!open) setActive(null) }} title={active ?? "Randevu"} />
    </div>
  )
}
