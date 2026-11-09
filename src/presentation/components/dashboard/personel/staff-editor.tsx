"use client"

import { useRoleOptions } from "@/presentation/hooks/catalog-queries"
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
import { staffApi } from "@/composition/services"
import type { StaffDto, StaffRequest } from "@/domain/models/contracts"
import { RoleCombobox } from "@/presentation/components/dashboard/role-combobox"
import { normalizeTrPhone } from "@/domain/value-objects/phone"
import { showUndoToast } from "@/presentation/lib/undo-toast"
import { WORK_DAYS } from "@/presentation/components/dashboard/personel/display"
import { useRecordMutation } from "@/presentation/hooks/use-record-mutation"

type FormState = {
  name: string
  roleId: string
  phone: string
  workDays: Set<number>
  active: boolean
  dashboardAdmin: boolean
}

const EMPTY_FORM: FormState = {
  name: "",
  roleId: "",
  phone: "",
  workDays: new Set([1, 2, 3, 4, 5]),
  active: true,
  dashboardAdmin: false,
}

export function StaffEditor({
  editing,
  onClose,
  isFounder,
}: {
  editing: StaffDto | null
  onClose: () => void
  isFounder: boolean
}) {
  const { data: roles = [], error: rolesError, isPending: rolesPending } = useRoleOptions()
  const [form, setForm] = React.useState<FormState>(() =>
    editing
      ? {
          name: editing.name,
          roleId: editing.roleId,
          phone: editing.phone ?? "",
          workDays: new Set(editing.workDays),
          active: editing.active,
          dashboardAdmin: editing.dashboardAdmin,
        }
      : EMPTY_FORM,
  )
  function toggleWorkDay(day: number) {
    setForm((f) => {
      const next = new Set(f.workDays)
      if (next.has(day)) next.delete(day)
      else next.add(day)
      return { ...f, workDays: next }
    })
  }
  const mutation = useRecordMutation("personel", async () => {
    const phone = normalizeTrPhone(form.phone)
    if (!form.name.trim() || !form.roleId) {
      throw new Error("Ad ve rol zorunlu.")
    }
    if (phone.length !== 10 || !phone.startsWith("5")) {
      throw new Error("Telefon 5 ile başlayan 10 haneli GSM olmalı.")
    }
    const body: StaffRequest = {
      name: form.name.trim(),
      roleId: form.roleId,
      phone,
      photoUrl: editing?.photoUrl ?? null,
      workDays: Array.from(form.workDays),
      active: form.active,
      ...(isFounder ? { dashboardAdmin: form.dashboardAdmin } : {}),
    }
    if (editing) {
      await staffApi.update(editing.id, body)
    } else {
      await staffApi.create(body)
    }
  })
  function save() {
    mutation.mutate(undefined, {
      onSuccess: () => {
        showUndoToast(editing ? "Personel güncellendi" : "Personel eklendi")
        onClose()
      },
    })
  }
  const saving = mutation.isPending
  const saveError = mutation.error?.message ?? rolesError?.message

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{editing ? "Personeli düzenle" : "Yeni personel"}</SheetTitle>
          <SheetDescription>Servisler seçilen role göre otomatik atanır.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 [&_[role=combobox]]:h-12 [&_[role=combobox]]:w-full [&_[role=combobox]]:rounded-xl [&_[role=combobox]]:text-base">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="st-name">Ad</Label>
              <Input
                className="h-12 rounded-xl bg-muted/70 px-3.5 text-base md:text-base"
                id="st-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="ör. Reşat Berber"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="st-role">Rol</Label>
              <RoleCombobox
                id="st-role"
                value={form.roleId}
                options={roles}
                onChange={(roleId) => setForm((f) => ({ ...f, roleId }))}
                placeholder="ör. Kuaför"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="st-phone">Telefon</Label>
            <div className="relative flex items-center rounded-xl border border-input bg-muted/70 focus-within:ring-2 focus-within:ring-ring/40">
              <span className="shrink-0 pl-3 text-sm font-medium text-muted-foreground">+90</span>
              <Input
                className="h-12 rounded-xl bg-muted/70 px-3.5 text-base md:text-base"
                id="st-phone"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                  }))
                }
                placeholder="5XX XXX XX XX"
                inputMode="tel"
                autoComplete="tel-national"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Çalışma günleri</Label>
            <div className="flex flex-wrap gap-1.5">
              {WORK_DAYS.map((d) => {
                const on = form.workDays.has(d.id)
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleWorkDay(d.id)}
                    className={
                      on
                        ? "min-h-11 rounded-xl bg-indigo px-3 py-2 text-sm font-medium text-white"
                        : "min-h-11 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50"
                    }
                  >
                    {d.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 p-3">
            <Label htmlFor="st-active">Aktif</Label>
            <Switch
              id="st-active"
              checked={form.active}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, active: checked }))}
            />
          </div>

          {isFounder ? (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 p-3">
              <div>
                <Label htmlFor="st-dashboard">Dashboard yetkisi</Label>
                <p className="text-xs text-muted-foreground">
                  Bu telefon ile panele giriş yapılabilir. Şimdilik kurucu dışında bir kişi.
                </p>
              </div>
              <Switch
                id="st-dashboard"
                checked={form.dashboardAdmin}
                disabled={editing?.roleCode === "KURUCU"}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, dashboardAdmin: checked }))}
              />
            </div>
          ) : null}

          {saveError ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {saveError}
            </p>
          ) : null}

          <div className="grid gap-2 pt-2">
            <Button
              className="h-12 w-full rounded-xl text-base"
              onClick={save}
              disabled={saving || rolesPending || Boolean(rolesError)}
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
