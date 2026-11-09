"use client"

import * as React from "react"
import { SelectContent as Content, SelectItem as Item } from "@/presentation/components/ui/select"
import { panelMenuItem } from "@/presentation/components/dashboard/menu-styles"
import { cn } from "@/presentation/lib/utils"

export * from "@/presentation/components/ui/select"

export function SelectContent({ className, position = "popper", align = "start", ...props }: React.ComponentProps<typeof Content>) {
  return <Content {...props} position={position} align={align} className={cn(className, "z-80 min-w-0 max-w-[calc(100vw-2rem)] rounded-lg")} />
}
export function SelectItem({ className, ...props }: React.ComponentProps<typeof Item>) {
  return <Item {...props} className={cn(className, panelMenuItem, "pr-8 whitespace-normal break-words")} />
}
