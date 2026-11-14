export type BudgetEntry = {
  id: string
  kind: "income" | "expense"
  description: string
  amountCents: number
  date: string
  categoryId?: string
  recurrence?: { endMonth: string; excludedMonths: string[] }
  createdAt: string
}

export type BudgetCategory = {
  id: string
  name: string
  kind: "custom" | "statement"
  startMonth: string
  endMonth: string
}

export type BudgetPreferences = {
  categories: BudgetCategory[]
  savings: Record<string, number>
}
