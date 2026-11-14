"use client"

import { useId, useState, type ReactNode } from "react"
import { ChevronDown, Clock, Mars, Venus } from "lucide-react"
import { cn } from "@/lib/utils"

export type ServiceGender = "KADIN" | "ERKEK"
export type ServiceOption = {
  id: string
  name: string
  durationMin: number
  priceTl: number
  priceMaxTl?: number | null
}
export type ServiceCategoryOption = {
  id: string
  name: string
  gender: ServiceGender
  services: ServiceOption[]
}

export function GenderSelector({ value, onChange }: {
  value: ServiceGender
  onChange: (value: ServiceGender) => void
}) {
  return (
    <div role="group" aria-label="Hizmet grubu" className="grid grid-cols-2 gap-1 rounded-full bg-muted/60 p-1">
      {([{ value: "KADIN", label: "Kadın", icon: Venus }, { value: "ERKEK", label: "Erkek", icon: Mars }] as const).map((item) => (
        <button key={item.value} type="button" aria-pressed={value === item.value} onClick={() => onChange(item.value)}
          className={cn("inline-flex items-center justify-center gap-1.5 rounded-full py-1.5 font-display text-[13px] font-semibold tracking-tight text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-ring", value === item.value && "bg-background shadow-sm ring-1 ring-border")}>
          <item.icon className="size-3.5 shrink-0" strokeWidth={2.4} aria-hidden />{item.label}
        </button>
      ))}
    </div>
  )
}

export function ServiceCategory({ name, count, children }: { name: string; count: number; children?: ReactNode }) {
  const [open, setOpen] = useState(false)
  const contentId = useId()
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <button type="button" aria-expanded={open} aria-controls={contentId} onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 px-3.5 py-3 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
        <span className="font-display text-[14px] font-semibold tracking-tight">{name}</span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">{count}<ChevronDown aria-hidden className={cn("size-4 transition-transform", open && "rotate-180")} /></span>
      </button>
      <div id={contentId} hidden={!open} className="divide-y divide-border/60 border-t border-border/60">{children}</div>
    </div>
  )
}

export function ServicePicker({ categories, selectedId = null, onSelect }: {
  categories: ServiceCategoryOption[]
  selectedId?: string | null
  onSelect: (id: string) => void
}) {
  const [gender, setGender] = useState<ServiceGender>("KADIN")
  return (
    <div className="flex flex-col gap-3">
      <GenderSelector value={gender} onChange={setGender} />
      <div className="flex flex-col gap-2">
        {categories.filter((category) => category.gender === gender).map((category) => (
          <ServiceCategory key={category.id} name={category.name} count={category.services.length}>
            {category.services.map((service) => (
              <button key={service.id} type="button" aria-pressed={selectedId === service.id} onClick={() => onSelect(service.id)}
                className={cn("flex w-full items-center gap-3 px-3.5 py-3 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring", selectedId === service.id ? "bg-indigo-muted" : "hover:bg-muted/50")}>
                <span className="min-w-0 flex-1"><span className="block font-display text-[14px] font-semibold tracking-tight">{service.name}</span><span className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground"><Clock aria-hidden className="size-3" />{service.durationMin} dk</span></span>
                <span className="shrink-0 whitespace-nowrap font-display text-[13px] font-semibold">₺{service.priceTl.toLocaleString("tr-TR")}{service.priceMaxTl && service.priceMaxTl !== service.priceTl ? `–₺${service.priceMaxTl.toLocaleString("tr-TR")}` : ""}</span>
              </button>
            ))}
          </ServiceCategory>
        ))}
      </div>
    </div>
  )
}
