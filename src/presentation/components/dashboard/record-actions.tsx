"use client"

import { ChevronDown, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/presentation/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/presentation/components/dashboard/panel-dropdown-menu"

export function RecordActions({ name, active, onEdit, onRemove }: {
  name: string
  active: boolean
  onEdit: () => void
  onRemove: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-11 gap-2 rounded-xl" aria-label={`${name} işlemleri`}>
          İşlemler <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onEdit}><Pencil /> Düzenle</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" disabled={!active} onSelect={onRemove}><Trash2 /> Pasifleştir</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
