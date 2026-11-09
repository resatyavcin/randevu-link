"use client"

import { useCategoryOptions } from "@/presentation/hooks/catalog-queries"
import * as React from "react"
import { Button } from "@/presentation/components/ui/button"
import { Input } from "@/presentation/components/ui/input"
import { Label } from "@/presentation/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/presentation/components/dashboard/panel-select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/presentation/components/dashboard/panel-sheet"
import { Switch } from "@/presentation/components/ui/switch"
import { serviceCategoriesApi } from "@/composition/services"
import type { ServiceCategoryDto, ServiceGenderApi } from "@/domain/models/contracts"
import { GENDER_LABELS } from "@/domain/models/contracts"
import { showUndoToast } from "@/presentation/lib/undo-toast"
import { pinRankLabel } from "@/presentation/components/dashboard/categories/display"
import { useRecordMutation } from "@/presentation/hooks/use-record-mutation"

type FormState = {
  name: string
  gender: ServiceGenderApi
  pinRank: string
  active: boolean
}

const EMPTY_FORM: FormState = {
  name: "",
  gender: "KADIN",
  pinRank: "",
  active: true,
}
const PIN_RANKS = [1, 2, 3] as const

export function CategoryEditor({
  editing,
  onClose,
}: {
  editing: ServiceCategoryDto | null
  onClose: () => void
}) {
  const {
    data: allCategories = [],
    error: allCategoriesError,
    isPending: allCategoriesPending,
  } = useCategoryOptions()
  const [form, setForm] = React.useState<FormState>(() =>
    editing
      ? {
          name: editing.name,
          gender: editing.gender,
          pinRank: editing.pinRank ? String(editing.pinRank) : "",
          active: editing.active,
        }
      : EMPTY_FORM,
  )
  const occupiedRanks = new Set(
    allCategories
      .filter(
        (c) => c.active && c.gender === form.gender && c.pinRank != null && c.id !== editing?.id,
      )
      .map((c) => c.pinRank as number),
  )
  const availableRanks = PIN_RANKS.filter(
    (rank) => String(rank) === form.pinRank || !occupiedRanks.has(rank),
  )
  const pinSelectValue =
    form.pinRank && availableRanks.includes(Number(form.pinRank) as 1 | 2 | 3)
      ? form.pinRank
      : "none"
  const mutation = useRecordMutation("categories", async () => {
    if (!form.name.trim()) {
      throw new Error("Kategori adı gerekli")
    }
    const body = {
      name: form.name.trim(),
      gender: form.gender,
      pinRank: pinSelectValue === "none" ? null : Number(pinSelectValue),
      active: form.active,
    }
    if (editing) {
      await serviceCategoriesApi.update(editing.id, body)
    } else {
      await serviceCategoriesApi.create(body)
    }
  })
  function save() {
    mutation.mutate(undefined, {
      onSuccess: () => {
        showUndoToast(editing ? "Kategori güncellendi" : "Kategori eklendi")
        onClose()
      },
    })
  }
  const saving = mutation.isPending
  const saveError = mutation.error?.message ?? allCategoriesError?.message

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{editing ? "Kategoriyi düzenle" : "Yeni kategori"}</SheetTitle>
          <SheetDescription>
            Her kategori bir cinsiyete aittir. Aynı ad Kadın ve Erkek için ayrı açılabilir.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cat-name">Ad</Label>
            <Input
              className="h-12 rounded-xl bg-muted/70 px-3.5 text-base md:text-base"
              id="cat-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="ör. Saç Hizmetleri"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Cinsiyet</Label>
            <Select
              value={form.gender}
              onValueChange={(v) =>
                setForm((f) => ({
                  ...f,
                  gender: v as ServiceGenderApi,
                  pinRank: "",
                }))
              }
            >
              <SelectTrigger className="w-full rounded-xl bg-muted/70 px-3.5 text-base data-[size=default]:h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                <SelectItem value="KADIN">Kadın</SelectItem>
                <SelectItem value="ERKEK">Erkek</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Sıra</Label>
            <Select
              value={pinSelectValue}
              onValueChange={(v) => setForm((f) => ({ ...f, pinRank: v === "none" ? "" : v }))}
            >
              <SelectTrigger className="w-full rounded-xl bg-muted/70 px-3.5 text-base data-[size=default]:h-12">
                <SelectValue placeholder="Sıra yok" />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                <SelectItem value="none">Sıra yok</SelectItem>
                {availableRanks.map((rank) => (
                  <SelectItem key={rank} value={String(rank)}>
                    {pinRankLabel(rank)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Randevu sayfasında {GENDER_LABELS[form.gender]} sekmesinin en üstünde bu sırayla
              görünür. Dolu sıralar listede yok.
            </p>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="cat-active">Aktif</Label>
            <Switch
              id="cat-active"
              checked={form.active}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, active: checked }))}
            />
          </div>

          {saveError ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {saveError}
            </p>
          ) : null}

          <div className="grid gap-2 pt-2">
            <Button
              className="h-12 w-full rounded-xl text-base"
              onClick={save}
              disabled={saving || allCategoriesPending || Boolean(allCategoriesError)}
            >
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </Button>
            <Button
              variant="outline"
              className="h-11 w-full rounded-xl text-base"
              onClick={onClose}
            >
              Vazgeç
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
