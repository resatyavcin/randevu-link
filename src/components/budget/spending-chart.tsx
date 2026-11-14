import { formatMoney } from "@/lib/budget"
import type { BudgetCategory, BudgetEntry } from "@/types/budget"

export function SpendingChart({ entries, categories, total, status }: {
  entries: BudgetEntry[]
  categories: BudgetCategory[]
  total: number
  status: string
}) {
  const names = new Map(categories.map(category => [category.id, category.name]))
  const amounts = new Map<string, number>()
  for (const entry of entries) {
    if (entry.kind !== "expense") continue
    const id = entry.categoryId && names.has(entry.categoryId) ? entry.categoryId : ""
    amounts.set(id, (amounts.get(id) ?? 0) + entry.amountCents)
  }
  const ranked = [...amounts].sort((a, b) => b[1] - a[1])
  const percent = new Intl.NumberFormat("tr-TR", { style: "percent", maximumFractionDigits: 1 })

  return (
    <section className="min-w-0 rounded-2xl border bg-card p-4 sm:p-5">
      <h2 className="text-sm font-semibold">Kategoriye göre harcamalar</h2>
      {status || !total ? <p className="mt-4 text-sm text-muted-foreground">{status || "Bu ay için gider kaydı yok."}</p> : (
        <ol className="mt-5 space-y-4">
          {ranked.map(([id, amount]) => (
            <li key={id}>
              <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-2 text-sm">
                <span className="min-w-0 break-words">{names.get(id) ?? "Kategorisiz"}</span>
                <span className="font-medium tabular-nums">{formatMoney(amount)} <span className="ml-1 text-xs text-muted-foreground">{percent.format(amount / total)}</span></span>
              </div>
              <div aria-hidden className="h-2 rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${amount / total * 100}%` }} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
