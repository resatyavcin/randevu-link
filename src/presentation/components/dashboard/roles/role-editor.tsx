"use client"

import * as React from "react"
import { Button } from "@/presentation/components/ui/button"
import { Input } from "@/presentation/components/ui/input"
import { Label } from "@/presentation/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/presentation/components/dashboard/panel-sheet"
import { Switch } from "@/presentation/components/ui/switch"
import { rolesApi } from "@/composition/services"
import type { RoleDto } from "@/domain/models/contracts"
import { showUndoToast } from "@/presentation/lib/undo-toast"
import { useRecordMutation } from "@/presentation/hooks/use-record-mutation"

type FormState = {
  name: string
  active: boolean
}

const EMPTY_FORM: FormState = {
  name: "",
  active: true,
}

export function RoleEditor({ editing, onClose }: { editing: RoleDto | null; onClose: () => void }) {
  const [form, setForm] = React.useState<FormState>(() =>
    editing ? { name: editing.name, active: editing.active } : EMPTY_FORM,
  )
  const mutation = useRecordMutation("roles", async () => {
    if (!form.name.trim()) {
      throw new Error("Rol adı gerekli")
    }
    const body = { name: form.name.trim(), active: form.active }
    if (editing) {
      await rolesApi.update(editing.id, body)
    } else {
      await rolesApi.create(body)
    }
  })
  function save() {
    mutation.mutate(undefined, {
      onSuccess: () => {
        showUndoToast(editing ? "Rol güncellendi" : "Rol eklendi")
        onClose()
      },
    })
  }
  const saving = mutation.isPending
  const saveError = mutation.error?.message

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{editing ? "Rolü düzenle" : "Yeni rol"}</SheetTitle>
          <SheetDescription>
            Pasif roller servislerde ekli kalır, Pasif olarak görünür.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 [&_[role=combobox]]:h-12 [&_[role=combobox]]:w-full [&_[role=combobox]]:rounded-xl [&_[role=combobox]]:text-base">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="role-name">Ad</Label>
            <Input
              className="h-12 rounded-xl bg-muted/70 px-3.5 text-base md:text-base"
              id="role-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="ör. Kuaför"
            />
          </div>

          {editing ? (
            <p className="text-xs text-muted-foreground">
              Kod: <span className="font-mono">{editing.code}</span>
            </p>
          ) : null}

          <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 p-3">
            <Label htmlFor="role-active">Aktif</Label>
            <Switch
              id="role-active"
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
            <Button className="h-12 w-full rounded-xl text-base" onClick={save} disabled={saving}>
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
