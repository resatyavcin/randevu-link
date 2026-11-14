"use client"

import { useState, type FormEvent } from "react"
import { ChevronRight, Info, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/booking-link/panel-sheet"
import { BudgetAmountField, BudgetDateField } from "@/components/budget/budget-fields"
import { formatMoney, isValidMonth, monthBreakdown, parseAmount } from "@/lib/budget"
import type { BudgetCategory, BudgetEntry, BudgetPreferences } from "@/types/budget"

const inputClass = "h-12 w-full min-w-0 rounded-xl border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"

export function BudgetCategoryManager({ categories, month, onSave, disabled }: { categories: BudgetCategory[]; month: string; onSave: (categories: BudgetCategory[]) => boolean; disabled: boolean }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [kind, setKind] = useState<BudgetCategory["kind"]>("custom")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [error, setError] = useState("")
  function edit(category?: BudgetCategory) {
    setEditing(category?.id ?? null); setName(category?.name ?? ""); setKind(category?.kind ?? "custom"); setStart(category?.startMonth || month); setEnd(category?.endMonth ?? ""); setError("")
  }
  function submit(event: FormEvent) {
    event.preventDefault()
    const clean = name.trim()
    if (!clean || (kind === "statement" && (!isValidMonth(start) || (end && (!isValidMonth(end) || end < start))))) { setError("Adı ve geçerli bir ay aralığı gir."); return }
    if (categories.some((category) => category.id !== editing && category.name.toLocaleLowerCase("tr-TR") === clean.toLocaleLowerCase("tr-TR"))) { setError("Bu ad zaten kullanılıyor."); return }
    const next: BudgetCategory = { id: editing ?? crypto.randomUUID(), name: clean, kind, startMonth: kind === "statement" ? start : "", endMonth: kind === "statement" ? end : "" }
    if (onSave(editing ? categories.map((category) => category.id === editing ? next : category) : [...categories, next])) edit()
  }
  return <>
    <Button variant="outline" className="rounded-full" disabled={disabled} onClick={() => { edit(); setOpen(true) }}>Kategoriler ve ekstreler</Button>
    <Sheet open={open} onOpenChange={setOpen}><SheetContent>
      <SheetHeader><SheetTitle>Kategoriler ve ekstreler</SheetTitle><SheetDescription>İşlemlerini grupla; her ay tutarı değişen ekstrelerini tanımla.</SheetDescription></SheetHeader>
      <div className="mb-6 space-y-2">{categories.map((category) => <button key={category.id} type="button" className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border p-3 text-left hover:bg-muted/40" onClick={() => edit(category)}><span className="min-w-0"><span className="block break-words text-sm font-medium">{category.name}</span><span className="text-xs text-muted-foreground">{category.kind === "statement" ? "Aylık ekstre" : "İşlem kategorisi"}</span></span><ChevronRight className="size-4 shrink-0 text-muted-foreground" /></button>)}{!categories.length && <p className="text-sm text-muted-foreground">Henüz kategori veya ekstre yok.</p>}</div>
      <form onSubmit={submit} className="space-y-4 border-t pt-5">
        <div className="flex items-center justify-between gap-2"><h3 className="font-semibold">{editing ? "Kaydı düzenle" : "Yeni kayıt"}</h3>{editing && <Button type="button" variant="ghost" className="rounded-full" onClick={() => edit()}><Plus />Yeni</Button>}</div>
        {!editing && <div className="grid grid-cols-2 gap-2">{(["custom", "statement"] as const).map((value) => <Button key={value} type="button" variant={kind === value ? "default" : "outline"} className="rounded-full" aria-pressed={kind === value} onClick={() => setKind(value)}>{value === "custom" ? "Kategori" : "Ekstre"}</Button>)}</div>}
        <label className="grid gap-2 text-sm font-medium">Ad<input required maxLength={60} value={name} onChange={(event) => setName(event.target.value)} className={inputClass} /></label>
        {kind === "statement" && <div className="grid gap-4 sm:grid-cols-2"><BudgetDateField label="İlk ay" monthOnly value={start} onChange={setStart} /><BudgetDateField label="Son ay" monthOnly optional min={start} value={end} onChange={setEnd} /></div>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="h-12 w-full rounded-full">{editing ? "Değişiklikleri kaydet" : "Ekle"}</Button>
      </form>
    </SheetContent></Sheet>
  </>
}

export function BudgetSummary({ entries, preferences, month, onSave, disabled }: { entries: BudgetEntry[]; preferences: BudgetPreferences; month: string; onSave: (preferences: BudgetPreferences) => boolean; disabled: boolean }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState("")
  const savings = preferences.savings[month] ?? 0
  const math = monthBreakdown(entries, savings)
  const used = math.spendable > 0 ? Math.min(100, Math.round(math.other / math.spendable * 100)) : math.other > 0 ? 100 : 0
  const statementIds = new Set(preferences.categories.filter((category) => category.kind === "statement").map((category) => category.id))
  const statements = entries.filter((entry) => entry.categoryId && statementIds.has(entry.categoryId)).reduce((sum, entry) => sum + entry.amountCents, 0)
  function save(event: FormEvent) {
    event.preventDefault()
    const cents = draft === "0" || /^0+(?:,0{0,2})?$/.test(draft) ? 0 : parseAmount(draft)
    if (cents === null) return
    if (onSave({ ...preferences, savings: { ...preferences.savings, [month]: cents } })) setOpen(false)
  }
  return <>
    <section className="space-y-2 rounded-2xl border bg-card px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold">{math.left < 0 ? "Bütçe açığı" : "Harcanabilir kalan"}</h2><Button variant="ghost" size="sm" className="rounded-full" disabled={disabled} onClick={() => { setDraft(String(savings / 100).replace(".", ",")); setOpen(true) }}><Info aria-hidden className="size-4" />Ay dökümü</Button></div>
      <p className={`break-all text-2xl font-semibold tabular-nums ${math.left < 0 ? "text-destructive" : ""}`}>{disabled ? "—" : formatMoney(math.left)}</p>
      <div role="progressbar" aria-label="Harcanabilir bütçenin kullanılan oranı" aria-valuenow={used} aria-valuemin={0} aria-valuemax={100} className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${used}%` }} /></div>
      <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"><span>Sabit gider: {disabled ? "—" : formatMoney(math.fixed)}</span><span>Ayrılan birikim: {disabled ? "—" : formatMoney(savings)}</span></div>
    </section>
    <Sheet open={open} onOpenChange={setOpen}><SheetContent>
      <SheetHeader><SheetTitle>Ay dökümü</SheetTitle><SheetDescription>Gelir, gider ve birikiminin bu aya etkisi.</SheetDescription></SheetHeader>
      <dl className="mb-6 divide-y rounded-2xl border px-4">{[{ label: "Gelir", value: math.income }, { label: "Sabit gider", value: -math.fixed }, { label: "Ekstreler", value: -statements }, { label: "Diğer giderler", value: -(math.other - statements) }, { label: "Ayrılan birikim", value: -savings }, { label: "Harcanabilir kalan", value: math.left }].map((row) => <div key={row.label} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><dt className="text-muted-foreground">{row.label}</dt><dd className="min-w-0 break-all font-semibold tabular-nums">{formatMoney(row.value)}</dd></div>)}</dl>
      <form onSubmit={save} className="space-y-4"><BudgetAmountField label="Bu ay biriktirmek istediğim (₺)" value={draft} onChange={setDraft} allowZero /><p className="text-xs leading-relaxed text-muted-foreground">Bu tutar gider kaydı oluşturmaz; yalnızca bu ay harcanabilecek paradan ayrılır. Sıfır girerek kaldırabilirsin.</p><Button type="submit" className="h-12 w-full rounded-full">Kaydet</Button></form>
    </SheetContent></Sheet>
  </>
}

export function BudgetCategoryField({ categories, value, onChange }: { categories: BudgetCategory[]; value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  return <div className="grid gap-2"><span className="text-sm font-medium">Kategori</span><Button type="button" variant="outline" className="h-12 w-full min-w-0 justify-between rounded-xl font-normal" onClick={() => setOpen(true)}><span className="truncate">{categories.find((category) => category.id === value)?.name ?? "Kategorisiz"}</span><ChevronRight /></Button><Sheet open={open} onOpenChange={setOpen}><SheetContent><SheetHeader><SheetTitle>Kategori seç</SheetTitle><SheetDescription>Bu işlemin hangi grupta gösterileceğini seç.</SheetDescription></SheetHeader><div className="space-y-2">{[{ id: "", name: "Kategorisiz" }, ...categories.filter((category) => category.kind === "custom")].map((category) => <Button key={category.id} type="button" variant={value === category.id ? "default" : "outline"} className="h-auto min-h-12 w-full justify-start whitespace-normal break-words rounded-xl py-3 text-left" onClick={() => { onChange(category.id); setOpen(false) }}>{category.name}</Button>)}</div></SheetContent></Sheet></div>
}
