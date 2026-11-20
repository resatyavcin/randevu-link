"use client";

import { useRef, useState, type FormEvent } from "react";
import { ChevronRight, Info, Plus, ReceiptText, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/booking-link/panel-sheet";
import {
  BudgetAmountField,
} from "@/components/budget/budget-fields";
import {
  formatMoney,
  isValidMonth,
  monthBreakdown,
  parseAmount,
} from "@/lib/budget";
import type {
  BudgetCategory,
  BudgetEntry,
  BudgetPreferences,
} from "@/types/budget";

const inputClass =
  "h-12 w-full min-w-0 rounded-xl border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function BudgetCategoryManager({
  categories,
  onSave,
  disabled,
}: {
  categories: BudgetCategory[];
  onSave: (categories: BudgetCategory[]) => boolean;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  function edit(category?: BudgetCategory) {
    setEditing(category?.id ?? null);
    setName(category?.name ?? "");
    setError("");
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    const clean = name.trim();
    if (!clean) { setError("Kategori adı gir."); return; }
    if (
      categories.some(
        (category) =>
          category.id !== editing &&
          category.name.toLocaleLowerCase("tr-TR") ===
            clean.toLocaleLowerCase("tr-TR"),
      )
    ) {
      setError("Bu ad zaten kullanılıyor.");
      return;
    }
    const next: BudgetCategory = {
      id: editing ?? crypto.randomUUID(),
      name: clean,
    };
    if (
      onSave(
        editing
          ? categories.map((category) =>
              category.id === editing ? next : category,
            )
          : [...categories, next],
      )
    )
      edit();
  }
  return (
    <>
      <Button
        variant="outline"
        className="rounded-full"
        disabled={disabled}
        onClick={() => {
          edit();
          setOpen(true);
        }}
      >
        Kategoriler
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Kategoriler</SheetTitle>
            <SheetDescription>
              İstersen işlemlerini gruplamak için kategori ekleyebilirsin. Kategori seçmek zorunlu değildir.
            </SheetDescription>
          </SheetHeader>
          <div className="mb-6 space-y-2">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border p-3 text-left hover:bg-muted/40"
                onClick={() => edit(category)}
              >
                <span className="min-w-0">
                  <span className="block break-words text-sm font-medium">
                    {category.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    İşlem kategorisi
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
            {!categories.length && (
              <p className="text-sm text-muted-foreground">
                Henüz kategori yok. Kategori eklemeden de işlem oluşturabilirsin.
              </p>
            )}
          </div>
          <form onSubmit={submit} className="space-y-4 border-t pt-5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">
                {editing ? "Kategoriyi düzenle" : "Yeni kategori"}
              </h3>
              {editing && (
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => edit()}
                >
                  <Plus />
                  Yeni
                </Button>
              )}
            </div>
            <label className="grid gap-2 text-sm font-medium">
              Ad
              <input
                required
                maxLength={60}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={inputClass}
              />
            </label>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" className="h-12 w-full rounded-full">
              {editing ? "Değişiklikleri kaydet" : "Ekle"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function BudgetSummary({
  entries,
  preferences,
  month,
  onSave,
  disabled,
}: {
  entries: BudgetEntry[];
  preferences: BudgetPreferences;
  month: string;
  onSave: (preferences: BudgetPreferences) => boolean;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [savingsOpen, setSavingsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const savings = preferences.savings[month] ?? 0;
  const summaryTrigger = useRef<HTMLButtonElement>(null);
  const math = monthBreakdown(entries, savings);
  const used =
    math.spendable > 0
      ? Math.min(100, Math.round((math.other / math.spendable) * 100))
      : math.other > 0
        ? 100
        : 0;
  function returnToSummary() {
    setSavingsOpen(false);
    setOpen(true);
  }
  function save(event: FormEvent) {
    event.preventDefault();
    const cents =
      draft === "0" || /^0+(?:,0{0,2})?$/.test(draft) ? 0 : parseAmount(draft);
    if (cents === null) return;
    if (
      onSave({
        ...preferences,
        savings: { ...preferences.savings, [month]: cents },
      })
    )
      returnToSummary();
  }
  return (
    <>
      <section className="space-y-2 rounded-2xl border bg-card px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">
            {math.left < 0 ? "Bütçe açığı" : "Harcanabilir kalan"}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full"
            disabled={disabled}
            ref={summaryTrigger}
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => {
              setDraft(String(savings / 100).replace(".", ","));
              setOpen(true);
            }}
          >
            <Info aria-hidden className="size-4" />
            Ay dökümü
          </Button>
        </div>
        <p
          className={`break-all text-2xl font-semibold tabular-nums ${math.left < 0 ? "text-destructive" : ""}`}
        >
          {disabled ? "—" : formatMoney(math.left)}
        </p>
        <div
          role="progressbar"
          aria-label="Harcanabilir bütçenin kullanılan oranı"
          aria-valuenow={used}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-1.5 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${used}%` }}
          />
        </div>
        <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
          <span>Sabit gider: {disabled ? "—" : formatMoney(math.fixed)}</span>
          <span>Ayrılan birikim: {disabled ? "—" : formatMoney(savings)}</span>
        </div>
      </section>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 motion-reduce:animate-none" />
          <Dialog.Content onCloseAutoFocus={(event) => {
            if (savingsOpen) event.preventDefault();
            else { event.preventDefault(); summaryTrigger.current?.focus(); }
          }} className="fixed left-1/2 top-1/2 z-60 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-background p-6 font-dashboard text-foreground antialiased shadow-xl outline-none duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 motion-reduce:animate-none">
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute right-2 top-2 rounded-full"
                aria-label="Ay dökümünü kapat"
              >
                <X aria-hidden className="size-4" />
              </Button>
            </Dialog.Close>
            <div className="mb-5 flex flex-col items-center gap-2 px-5 pt-2 text-center">
              <ReceiptText
                aria-hidden
                className="mb-1 size-6 text-muted-foreground"
                strokeWidth={1.5}
              />
              <Dialog.Title className="font-display text-lg font-bold tracking-tight">
                Ay dökümü
              </Dialog.Title>
              <p className="text-sm capitalize text-muted-foreground">
                {isValidMonth(month) ? new Intl.DateTimeFormat("tr-TR", {
                  month: "long",
                  year: "numeric",
                }).format(new Date(`${month}-01T12:00:00`)) : "Ay seçilmedi"}
              </p>
              <Dialog.Description className="sr-only">
                Seçili ayın gelir, gider, birikim ve harcanabilir kalan dökümü.
              </Dialog.Description>
            </div>
            <dl className="space-y-4 border-y border-dashed py-5 text-sm">
              {[
                { label: "Gelir", value: math.income },
                { label: "Sabit gider", value: -math.fixed },
                { label: "Diğer giderler", value: -math.other },
                { label: "Ayrılan birikim", value: -savings },
              ].map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-baseline gap-3"
                >
                  <dt className="text-muted-foreground">{row.label}</dt>
                  <dd className="min-w-0 break-all text-right font-semibold tabular-nums">
                    {formatMoney(row.value)}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 space-y-2 rounded-xl bg-muted/50 p-4">
              <p className="text-sm font-medium text-muted-foreground">
                {math.left < 0 ? "Bütçe açığı" : "Harcanabilir kalan"}
              </p>
              <p
                className={`break-all text-2xl font-semibold tabular-nums ${math.left < 0 ? "text-destructive" : ""}`}
              >
                {formatMoney(math.left)}
              </p>
            </div>
            <p className="py-4 text-center text-xs leading-relaxed text-muted-foreground">
              {entries.length} işlem · Birikim, harcanabilir tutardan ayrılır.
            </p>
            <Button
              variant="outline"
              className="w-full rounded-full"
              onClick={() => {
                setOpen(false);
                setSavingsOpen(true);
              }}
            >
              Birikimi düzenle
            </Button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Sheet open={savingsOpen} onOpenChange={(nextOpen) => {
        if (nextOpen) setSavingsOpen(true);
        else returnToSummary();
      }}>
        <SheetContent onCloseAutoFocus={(event) => { event.preventDefault(); }}>
          <SheetHeader>
            <SheetTitle>Aylık birikim</SheetTitle>
            <SheetDescription>
              Bu ay harcanabilecek tutardan birikim ayır.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={save} className="space-y-4">
            <BudgetAmountField
              label="Bu ay biriktirmek istediğim (₺)"
              value={draft}
              onChange={setDraft}
              allowZero
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Bu tutar gider kaydı oluşturmaz; yalnızca bu ay harcanabilecek
              paradan ayrılır. Sıfır girerek kaldırabilirsin.
            </p>
            <Button type="submit" className="h-12 w-full rounded-full">
              Kaydet
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function BudgetCategoryField({
  categories,
  value,
  onChange,
}: {
  categories: BudgetCategory[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium">Kategori (isteğe bağlı)</span>
      <Button
        type="button"
        variant="outline"
        className="h-12 w-full min-w-0 justify-between rounded-xl font-normal"
        onClick={() => setOpen(true)}
      >
        <span className="truncate">
          {categories.find((category) => category.id === value)?.name ??
            "Kategori seç (isteğe bağlı)"}
        </span>
        <ChevronRight />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Kategori seç</SheetTitle>
            <SheetDescription>
              Bu işlemin hangi grupta gösterileceğini seç.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-2">
            {[
              { id: "", name: "Kategorisiz" },
              ...categories,
            ].map((category) => (
              <Button
                key={category.id}
                type="button"
                variant={value === category.id ? "default" : "outline"}
                className="h-auto min-h-12 w-full justify-start whitespace-normal break-words rounded-xl py-3 text-left"
                onClick={() => {
                  onChange(category.id);
                  setOpen(false);
                }}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
