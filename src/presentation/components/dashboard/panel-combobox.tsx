"use client"

import * as React from "react"
import { ComboboxContent as Content, ComboboxItem as Item } from "@/presentation/components/ui/combobox"
import { panelMenuItem } from "@/presentation/components/dashboard/menu-styles"
import { cn } from "@/presentation/lib/utils"

export * from "@/presentation/components/ui/combobox"

export function ComboboxContent({ className, ...props }: React.ComponentProps<typeof Content>) {
  return <Content {...props} className={cn(className, "rounded-lg max-w-[calc(100vw-2rem)]")} />
}
export function ComboboxItem({ className, ...props }: React.ComponentProps<typeof Item>) {
  return <Item {...props} className={cn(className, panelMenuItem, "pr-8")} />
}
