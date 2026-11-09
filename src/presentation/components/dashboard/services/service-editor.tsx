"use client"

import { useRoleOptions, useCategoryOptions } from "@/presentation/hooks/catalog-queries"
import * as React from "react"
import { Button } from "@/presentation/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/presentation/components/dashboard/panel-sheet"
import { Input } from "@/presentation/components/ui/input"
import { Label } from "@/presentation/components/ui/label"
import { Switch } from "@/presentation/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/presentation/components/dashboard/panel-select"
import { RoleMultiCombobox } from "@/presentation/components/dashboard/role-combobox"
import { servicesApi } from "@/composition/services"
import type { ServiceDto, ServiceRequest } from "@/domain/models/contracts"
import { GENDER_LABELS } from "@/domain/models/contracts"
import { showUndoToast } from "@/presentation/lib/undo-toast"
import { useRecordMutation } from "@/presentation/hooks/use-record-mutation"

type FormState = {
  name: string
  roleIds: string[]
  categoryId: string
  durationMin: string
  priceTl: string
  priceMaxTl: string
  active: boolean
}

const EMPTY_FORM: FormState = {
  name: "",
  roleIds: [],
  categoryId: "",
  durationMin: "30",
  priceTl: "0",
  priceMaxTl: "",
  active: true,
}

export function ServiceEditor({
  editing,
  onClose,
}: {
  editing: ServiceDto | null
  onClose: () => void
}) {
  const {
    data: categories = [],
    error: categoriesError,
    isPending: categoriesPending,
  } = useCategoryOptions()
  const { data: roles = [], error: rolesError, isPending: rolesPending } = useRoleOptions()
  const [form, setForm] = React.useState<FormState>(() =>
    editing
      ? {
          name: editing.name,
          roleIds: editing.roleIds,
          categoryId: editing.category.id,
          durationMin: String(editing.durationMin),
          priceTl: String(editing.priceTl),
          priceMaxTl: editing.priceMaxTl ? String(editing.priceMaxTl) : "",
          active: editing.active,
        }
      : EMPTY_FORM,
  )
  const formCategories = categories.filter((c) => c.active || c.id === form.categoryId)
  const femaleFormCategories = formCategories
    .filter((c) => c.gender === "KADIN")
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "tr"))
  const maleFormCategories = formCategories
    .filter((c) => c.gender === "ERKEK")
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "tr"))

  const mutation = useRecordMutation("services", async () => {
    const durationMin = Number(form.durationMin)
    const priceTl = Number(form.priceTl)
    const priceMaxTl = form.priceMaxTl ? Number(form.priceMaxTl) : null
    if (
      !form.name.trim() ||
      form.roleIds.length === 0 ||
      !form.categoryId ||
      !Number.isFinite(durationMin) ||
      durationMin < 1
    ) {
      throw new Error("Ad, en az bir rol, kategori ve süre zorunlu.")
    }
    const body: ServiceRequest = {
      name: form.name.trim(),
      roleIds: form.roleIds,
      categoryId: form.categoryId,
      durationMin,
      priceTl: Number.isFinite(priceTl) ? priceTl : 0,
      priceMaxTl,
      active: form.active,
    }
    if (editing) {
      await servicesApi.update(editing.id, body)
    } else {
      await servicesApi.create(body)
    }
  })
  function save() {
    mutation.mutate(undefined, {
      onSuccess: () => {
        showUndoToast(editing ? "Servis güncellendi" : "Servis eklendi")
        onClose()
      },
    })
  }
  const saving = mutation.isPending
  const saveError = mutation.error?.message ?? rolesError?.message ?? categoriesError?.message

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{editing ? "Servisi düzenle" : "Yeni servis"}</SheetTitle>
          <SheetDescription>Servisin adı, rolleri, kategorisi, süresi ve fiyatı.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 [&_[role=combobox]]:h-12 [&_[role=combobox]]:rounded-xl">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="svc-name">Ad</Label>
            <Input
              className="h-12 rounded-xl bg-muted/70 px-3.5 text-base md:text-base"
              id="svc-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="ör. Saç Kesimi"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="svc-role">Roller</Label>
            <RoleMultiCombobox
              id="svc-role"
              value={form.roleIds}
              options={roles}
              onChange={(roleIds) => setForm((f) => ({ ...f, roleIds }))}
              placeholder="Rol ekle"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Kategori</Label>
            <Select
              value={form.categoryId || undefined}
              onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
            >
              <SelectTrigger className="w-full rounded-xl bg-muted/70 px-3.5 text-base data-[size=default]:h-12">
                <SelectValue placeholder="Kategori seç" />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                {femaleFormCategories.length > 0 ? (
                  <SelectGroup>
                    <SelectLabel>Kadın</SelectLabel>
                    {femaleFormCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {`${GENDER_LABELS[c.gender]} · ${c.name}`}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ) : null}
                {maleFormCategories.length > 0 ? (
                  <SelectGroup>
                    <SelectLabel>Erkek</SelectLabel>
                    {maleFormCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {`${GENDER_LABELS[c.gender]} · ${c.name}`}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ) : null}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-duration">Süre (dk)</Label>
              <Input
                className="h-12 rounded-xl bg-muted/70 px-3.5 text-base md:text-base"
                id="svc-duration"
                inputMode="numeric"
                value={form.durationMin}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    durationMin: e.target.value.replace(/\D/g, ""),
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-price">Fiyat (₺)</Label>
              <Input
                className="h-12 rounded-xl bg-muted/70 px-3.5 text-base md:text-base"
                id="svc-price"
                inputMode="numeric"
                value={form.priceTl}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    priceTl: e.target.value.replace(/\D/g, ""),
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-price-max">Maks. fiyat</Label>
              <Input
                className="h-12 rounded-xl bg-muted/70 px-3.5 text-base md:text-base"
                id="svc-price-max"
                inputMode="numeric"
                value={form.priceMaxTl}
                placeholder="opsiyonel"
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    priceMaxTl: e.target.value.replace(/\D/g, ""),
                  }))
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="svc-active">Aktif</Label>
            <Switch
              id="svc-active"
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
              disabled={
                saving ||
                rolesPending ||
                Boolean(rolesError) ||
                categoriesPending ||
                Boolean(categoriesError)
              }
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
