import type { Metadata } from "next"
import { BudgetView } from "@/components/budget/budget-view"

export const metadata: Metadata = { title: "Bütçe" }

export default function BudgetPage() {
  return (
    <div className="font-dashboard min-h-dvh bg-background text-foreground antialiased">
      <BudgetView />
    </div>
  )
}
