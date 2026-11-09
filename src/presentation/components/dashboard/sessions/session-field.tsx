import type { ReactNode } from "react"
import { Label } from "@/presentation/components/ui/label"

export function SessionField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
