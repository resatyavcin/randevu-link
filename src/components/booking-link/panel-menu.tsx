"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowUpRight } from "lucide-react"
import { dashboardNav } from "@/components/booking-link/nav"
import { cn } from "@/lib/utils"

export function PanelMenu({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname()
  return (
    <div className="flex flex-1 flex-col">
      <nav aria-label="Panel menüsü" className="flex flex-col">
        {dashboardNav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined}
              className={cn("group flex min-h-16 items-center gap-4 border-b border-border/60 px-2 py-4 transition-colors hover:text-primary focus-visible:rounded-xl focus-visible:outline-2 focus-visible:outline-ring", active ? "text-primary" : "text-foreground")}>
              <Icon aria-hidden className="size-5 shrink-0" strokeWidth={1.6} />
              <span className="flex-1 text-[22px] font-semibold tracking-tight">{item.label}</span>
              {active ? <span className="size-2 rounded-full bg-primary" aria-hidden /> : <ArrowUpRight aria-hidden className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />}
            </Link>
          )
        })}
      </nav>

    </div>
  )
}
