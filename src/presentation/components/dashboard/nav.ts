import type { LucideIcon } from "lucide-react"
import {
  CalendarDays,
  Link2,
  Layers,
  Scissors,
  Shield,
  Tags,
  Users,
  Wallet,
} from "lucide-react"
export type DashboardNavChild = {
  href: string
  label: string
  count?: number
  icon?: LucideIcon
}

export type DashboardNavItem = {
  href: string
  label: string
  icon: LucideIcon
  count?: number
  children?: DashboardNavChild[]
  section?: string
}

export const dashboardNav: DashboardNavItem[] = [
  { href: "/appointments", label: "Randevular", icon: CalendarDays },
  { href: "/sessions", label: "Seanslar", icon: Layers },
  { href: "/revenue", label: "Kasa", icon: Wallet },
  {
    href: "/services",
    label: "Servisler",
    icon: Scissors,
    section: "İşletme",
  },
  {
    href: "/categories",
    label: "Kategoriler",
    icon: Tags,
  },
  {
    href: "/personel",
    label: "Personel",
    icon: Users,
  },
  {
    href: "/roles",
    label: "Roller",
    icon: Shield,
  },
  { href: "/booking-link", label: "Randevu Linki", icon: Link2, section: "Hesabım" },
]
