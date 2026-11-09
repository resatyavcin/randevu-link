"use client"

import * as React from "react"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/presentation/components/dashboard/panel-combobox"
import { cn } from "@/presentation/lib/utils"

export type RoleOption = { id: string; name: string; active?: boolean }

function isSelectable(option: RoleOption, selectedIds: string[]) {
  return option.active !== false || selectedIds.includes(option.id)
}

function RoleItemLabel({ option }: { option: RoleOption }) {
  return (
    <>
      <span className="min-w-0 flex-1 truncate">{option.name}</span>
      {option.active === false ? (
        <span className="text-[11px] text-muted-foreground">Pasif</span>
      ) : null}
    </>
  )
}

export function RoleCombobox({
  id,
  value,
  options,
  onChange,
  placeholder = "Rol seç",
  disabled,
}: {
  id?: string
  value: string
  options: RoleOption[]
  onChange: (id: string) => void
  placeholder?: string
  disabled?: boolean
}) {
  const listed = options.filter((option) => isSelectable(option, [value]))
  const selected = listed.find((option) => option.id === value) ?? null

  return (
    <Combobox
      items={listed}
      value={selected}
      onValueChange={(next) => {
        if (next) onChange(next.id)
      }}
      itemToStringLabel={(item) => item.name}
      isItemEqualToValue={(a, b) => a.id === b.id}
      disabled={disabled}
      autoHighlight
    >
      <ComboboxInput id={id} placeholder={placeholder} />
      <ComboboxContent>
        <ComboboxEmpty>Rol bulunamadı</ComboboxEmpty>
        <ComboboxList>
          {(item: RoleOption) => (
            <ComboboxItem key={item.id} value={item}>
              <RoleItemLabel option={item} />
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

export function RoleMultiCombobox({
  id,
  value,
  options,
  onChange,
  placeholder = "Rol ekle",
  emptyText = "Rol bulunamadı",
  showRemove = false,
  disabled,
}: {
  id?: string
  value: string[]
  options: RoleOption[]
  onChange: (ids: string[]) => void
  placeholder?: string
  emptyText?: string
  showRemove?: boolean
  disabled?: boolean
}) {
  const listed = options.filter((option) => isSelectable(option, value))
  const selected = listed.filter((option) => value.includes(option.id))
  const anchor = useComboboxAnchor()

  return (
    <Combobox
      items={listed}
      multiple
      value={selected}
      onValueChange={(next) => onChange(next.map((item) => item.id))}
      itemToStringLabel={(item) => item.name}
      isItemEqualToValue={(a, b) => a.id === b.id}
      disabled={disabled}
      autoHighlight
    >
      <ComboboxChips ref={anchor}>
        <ComboboxValue>
          {(values: RoleOption[]) => (
            <>
              {values.map((item) => (
                <ComboboxChip
                  key={item.id}
                  showRemove={showRemove}
                  className={cn(
                    item.active === false &&
                      "bg-muted text-muted-foreground dark:text-muted-foreground"
                  )}
                >
                  {item.name}
                  {item.active === false ? " Pasif" : null}
                </ComboboxChip>
              ))}
            </>
          )}
        </ComboboxValue>
        <ComboboxChipsInput id={id} placeholder={placeholder} disabled={disabled} />
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>{emptyText}</ComboboxEmpty>
        <ComboboxList>
          {(item: RoleOption) => (
            <ComboboxItem key={item.id} value={item}>
              <RoleItemLabel option={item} />
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
