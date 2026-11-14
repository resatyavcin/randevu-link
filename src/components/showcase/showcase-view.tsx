"use client"

import { useState, type ReactNode } from "react"
import { ArrowUpRight, Check, LoaderCircle, Menu, Plus, Trash2 } from "lucide-react"
import { ServicePicker, type ServiceCategoryOption } from "@/components/booking/service-picker"
import { GoogleReviews } from "@/components/booking/google-reviews"
import { KvkkLink } from "@/components/booking/kvkk-link"
import { BookingDrawer } from "@/components/booking/booking-drawer"
import { Button } from "@/components/ui/button"

import { BudgetAmountField, BudgetDateField } from "@/components/budget/budget-fields"
import { BudgetTransactions } from "@/components/budget/budget-transactions"
import type { BudgetCategory, BudgetEntry } from "@/types/budget"

// Preview content stays on this page; it is never used by booking or budget.
const categories: ServiceCategoryOption[] = [
  { id: "hair", name: "Saç tasarım", gender: "KADIN", services: [
    { id: "cut", name: "Saç kesimi", durationMin: 45, priceTl: 500 },
    { id: "style", name: "Fön", durationMin: 30, priceTl: 300 },
  ] },
  { id: "color", name: "Boya & bakım", gender: "KADIN", services: [
    { id: "coloring", name: "Saç boyama", durationMin: 90, priceTl: 1500 },
    { id: "roots", name: "Dip boya", durationMin: 60, priceTl: 900 },
    { id: "care", name: "Saç bakımı", durationMin: 45, priceTl: 600 },
  ] },
  { id: "beauty", name: "Cilt & güzellik", gender: "KADIN", services: [
    { id: "skin", name: "Cilt bakımı", durationMin: 60, priceTl: 800 },
    { id: "brows", name: "Kaş şekillendirme", durationMin: 15, priceTl: 200 },
    { id: "makeup", name: "Makyaj", durationMin: 45, priceTl: 700 },
  ] },
  { id: "men", name: "Saç & sakal", gender: "ERKEK", services: [
    { id: "men-cut", name: "Saç kesimi", durationMin: 30, priceTl: 400 },
    { id: "beard", name: "Sakal şekillendirme", durationMin: 20, priceTl: 250 },
  ] },
]

function PreviewSection({ number, title, description, children }: {
  number: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="space-y-5 border-t border-border/60 pt-6">
      <header className="flex items-start gap-3">
        <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-muted-foreground">{number}</span>
        <div><h2 className="text-sm font-semibold">{title}</h2><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p></div>
      </header>
      <div className="rounded-2xl border bg-card p-4 sm:p-6">{children}</div>
    </section>
  )
}

const previewCategories: BudgetCategory[] = [
  { id: "services", name: "Hizmet geliri", kind: "custom", startMonth: "", endMonth: "" },
  { id: "supplies", name: "Malzeme", kind: "custom", startMonth: "", endMonth: "" },
]
const previewEntries: BudgetEntry[] = [
  { id: "preview-income", kind: "income", description: "Örnek hizmet geliri", amountCents: 150000, date: "2026-11-14", categoryId: "services", createdAt: "2026-11-14T12:00:00Z" },
  { id: "preview-expense", kind: "expense", description: "Örnek malzeme alımı", amountCents: 45000, date: "2026-11-13", categoryId: "supplies", createdAt: "2026-11-13T12:00:00Z" },
  { id: "preview-fixed", kind: "expense", description: "Örnek sabit gider", amountCents: 80000, date: "2026-11-01", recurrence: { endMonth: "", excludedMonths: [] }, createdAt: "2026-11-01T12:00:00Z" },
]

function BudgetPreview() {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("")
  const [selecting, setSelecting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [notice, setNotice] = useState("")
  return <>
    <BudgetTransactions entries={previewEntries} categories={previewCategories} query={query} filter={filter}
      onQuery={setQuery} onFilter={setFilter} selecting={selecting} selectedIds={selectedIds}
      onToggleSelection={() => { setSelecting(!selecting); setSelectedIds([]) }}
      onSelect={(id, checked) => setSelectedIds((ids) => checked ? [...ids, id] : ids.filter((value) => value !== id))}
      onEdit={(entry) => setNotice(`${entry.description} düzenleme için seçildi. Bu yalnızca bir önizleme.`)}
      loading={false} error="" onAdd={() => setNotice("Bu yalnızca bir önizleme; yeni kayıt oluşturulmaz.")} />
    <p role="status" className="mt-3 text-xs text-muted-foreground">{selecting ? `${selectedIds.length} işlem seçildi. Kartın herhangi bir yerine dokunabilirsin.` : notice || "Kategori filtresini, aramayı ve kart seçimini deneyebilirsin."}</p>
  </>
}

function ButtonPreview() {
  const [notice, setNotice] = useState("Bir butona dokunarak etkileşimini deneyebilirsin.")
  const variants = [
    ["default", "Ana işlem"], ["secondary", "İkincil"], ["outline", "Çerçeveli"],
    ["ghost", "Sade"], ["link", "Bağlantı"], ["destructive", "Sil"],
    ["success", "Onayla"], ["indigo", "Vurgulu"],
  ] as const
  return <div className="space-y-6">
    <div className="grid gap-3 sm:grid-cols-2">
      {variants.map(([variant, label]) => (
        <div key={variant} className="space-y-3 rounded-xl border p-3">
          <h3 className="text-xs text-muted-foreground">{label}</h3>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant={variant} className="rounded-full" onClick={() => setNotice(`${label} butonuna basıldı.`)}>{label}</Button>
            <Button variant={variant} className="rounded-full" disabled>{label}</Button>
          </div>
        </div>
      ))}
    </div>
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Boyutlar</h3>
      <div className="flex flex-wrap items-center gap-2">
        {([["xs", "Çok küçük"], ["sm", "Küçük"], ["default", "Standart"], ["lg", "Büyük"]] as const).map(([size, label]) => (
          <Button key={size} size={size} variant="outline" className="rounded-full" onClick={() => setNotice(`${label} butona basıldı.`)}>{label}</Button>
        ))}
      </div>
    </div>
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">İkonlu butonlar</h3>
      <div className="flex flex-wrap items-center gap-2">
        <Button className="rounded-full" onClick={() => setNotice("Ekle butonuna basıldı.")}><Plus aria-hidden />Ekle</Button>
        <Button variant="success" className="rounded-full" onClick={() => setNotice("Onayla butonuna basıldı.")}><Check aria-hidden />Onayla</Button>
        <Button variant="destructive" size="icon" className="rounded-full" aria-label="Örnek silme butonu" onClick={() => setNotice("Sil butonuna basıldı. Önizlemede hiçbir kayıt silinmez.")}><Trash2 aria-hidden /></Button>
        {(["icon-xs", "icon-sm", "icon", "icon-lg"] as const).map((size, index) => (
          <Button key={size} variant="outline" size={size} className="rounded-full" aria-label={`Menü butonu, boyut ${index + 1}`} onClick={() => setNotice(`${index + 1}. boyuttaki ikon butonuna basıldı.`)}><Menu aria-hidden /></Button>
        ))}
      </div>
    </div>
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Yükleniyor</h3>
      <Button disabled aria-busy="true" className="rounded-full"><LoaderCircle aria-hidden className="animate-spin motion-reduce:animate-none" />Kaydediliyor</Button>
    </div>
    <p role="status" className="text-xs text-muted-foreground">{notice}</p>
  </div>
}

function NoticePreview() {
  return <><p>Bu alan, metnin drawer içindeki görünümünü denemek içindir.</p><p>Burada yalnızca örnek içerik gösterilir.</p></>
}

export function ShowcaseView() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState("2026-11-14")
  const [month, setMonth] = useState("2026-11")
  const selected = categories.flatMap((category) => category.services).find((service) => service.id === selectedId)

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-6 md:px-6">
      <header className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Bileşen kütüphanesi</p>
        <h1 className="text-2xl font-semibold tracking-tight">Kullanıcı Arayüzü</h1>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">Uygulamadaki butonları, menüleri, seçim alanlarını ve açılır panelleri burada deneyebilirsin.</p>
        <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">Örnek içerik · kayıt oluşturmaz</span>
      </header>

      <PreviewSection number="01" title="Hizmet seçimi" description="Kadın / erkek seçimi, açılır kategoriler ve hizmet satırları.">
        <ServicePicker categories={categories} selectedId={selectedId} onSelect={setSelectedId} />
        <p aria-live="polite" className="mt-4 min-h-5 text-xs text-muted-foreground">{selected ? `Seçilen: ${selected.name}` : "Bir kategori açıp hizmet seçebilirsin."}</p>
      </PreviewSection>

      <PreviewSection number="02" title="Google yorum kartı" description="Yorum, yıldızlar ve puan alanının görünümü. Bilgiler temsilidir.">
        <GoogleReviews businessName="Örnek işletme" review={{ author: "Örnek kullanıcı", relativeTime: "1 hafta önce", rating: 5, text: "Yorum metni burada görünür. Bu kart, bir yorumun sayfada nasıl duracağını gösterir." }} rating={4.8} reviewCount={24} />
      </PreviewSection>

      <PreviewSection number="03" title="Metin bağlantısı" description="Altı çizili bağlantıya dokunarak KVKK drawer’ını aç.">
        <p className="text-sm leading-7 text-muted-foreground"><KvkkLink><NoticePreview /></KvkkLink> üzerinden metni görüntüleyebilirsin.</p>
      </PreviewSection>

      <PreviewSection number="04" title="Drawer" description="Panelin açılmasını ve içinden ikinci bir panel açmayı dene.">
        <Button variant="outline" className="h-11 w-full rounded-xl" onClick={() => setDrawerOpen(true)}>Drawer’ı aç<ArrowUpRight className="size-4" /></Button>
        <BookingDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title="Drawer örneği">
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">İçerik bu alanda görüntülenir. Aşağıdaki bağlantı ikinci bir panel açar.</p>
          <div className="mt-6"><KvkkLink nested><NoticePreview /></KvkkLink></div>
        </BookingDrawer>
      </PreviewSection>
      <PreviewSection number="05" title="Butonlar" description="Tüm buton stilleri, boyutlar, ikonlar ve devre dışı durumlar. Her çiftte sağdaki buton devre dışıdır.">
        <ButtonPreview />
      </PreviewSection>

      <PreviewSection number="06" title="Tutar ve tarih alanları" description="Tutar klavyesini, takvimi ve ay seçimini açarak dene.">
        <div className="grid gap-4 sm:grid-cols-2">
          <BudgetAmountField value={amount} onChange={setAmount} />
          <BudgetDateField label="Tarih" value={date} onChange={setDate} />
          <BudgetDateField label="Ay" value={month} onChange={setMonth} monthOnly />
        </div>
      </PreviewSection>

      <PreviewSection number="07" title="İşlem kartları ve kategori menüsü" description="Örnek işlemlerle filtreleme ve seçim. Sabit gider seçim dışında kalır.">
        <BudgetPreview />
      </PreviewSection>
    </div>
  )
}
