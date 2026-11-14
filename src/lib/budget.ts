import type { BudgetCategory, BudgetEntry } from "@/types/budget"

export function parseAmount(value: string): number | null {
  const normalized = value.trim().replace(",", ".")
  if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(normalized)) return null
  const [whole, fraction = ""] = normalized.split(".")
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"))
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null
}

export function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
}

export function budgetTotals(entries: BudgetEntry[]) {
  const income = entries.filter((entry) => entry.kind === "income").reduce((total, entry) => total + entry.amountCents, 0)
  const expense = entries.filter((entry) => entry.kind === "expense").reduce((total, entry) => total + entry.amountCents, 0)
  return { income, expense, balance: income - expense }
}

export const formatMoney = (cents: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(cents / 100)

export function todayLocal() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

export function isValidMonth(value: string): boolean {
  return /^\d{4}-\d{2}$/.test(value) && isValidDate(`${value}-01`)
}

export function entriesForMonth(entries: BudgetEntry[], month: string, currentMonth: string): BudgetEntry[] {
  if (!isValidMonth(month)) return []
  return entries.flatMap((entry) => {
    if (!entry.recurrence) return entry.date.startsWith(`${month}-`) ? [entry] : []
    if (month > currentMonth || month < entry.date.slice(0, 7) || (entry.recurrence.endMonth && month > entry.recurrence.endMonth) || entry.recurrence.excludedMonths.includes(month)) return []
    return [{ ...entry, date: `${month}-01` }]
  }).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
}

export function removeMonthEntries(entries: BudgetEntry[], ids: string[], month: string): BudgetEntry[] {
  return entries.flatMap((entry) => {
    if (!ids.includes(entry.id)) return [entry]
    if (entry.recurrence || !entry.date.startsWith(`${month}-`)) return [entry]
    return []
  })
}

export function categoryActive(category: BudgetCategory, month: string) {
  return category.kind === "custom" || (category.startMonth <= month && (!category.endMonth || month <= category.endMonth))
}

export function selectBudgetEntries(entries: BudgetEntry[], categories: BudgetCategory[], query: string, categoryId: string, sort: "date" | "amount") {
  const term = query.trim().toLocaleLowerCase("tr-TR")
  const names = new Map(categories.map((category) => [category.id, category.name]))
  return entries.filter((entry) => (!categoryId || entry.categoryId === categoryId) && (!term || `${entry.description} ${names.get(entry.categoryId ?? "") ?? ""}`.toLocaleLowerCase("tr-TR").includes(term)))
    .sort((a, b) => (sort === "amount" ? b.amountCents - a.amountCents : b.date.localeCompare(a.date)) || b.createdAt.localeCompare(a.createdAt))
}

export function monthBreakdown(entries: BudgetEntry[], savings: number) {
  const totals = budgetTotals(entries)
  const fixed = entries.filter((entry) => entry.kind === "expense" && entry.recurrence).reduce((sum, entry) => sum + entry.amountCents, 0)
  return { ...totals, fixed, other: totals.expense - fixed, savings, spendable: totals.income - fixed - savings, left: totals.balance - savings }
}

export function upsertBudgetEntry(entries: BudgetEntry[], entry: BudgetEntry, statement = false): BudgetEntry[] {
  return [entry, ...entries.filter((item) => item.id !== entry.id && !(statement && item.categoryId === entry.categoryId && item.date.slice(0, 7) === entry.date.slice(0, 7))) ]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
}
