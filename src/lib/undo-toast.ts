"use client"

import { toast } from "sonner"

export function showUndoToast(message: string) {
  toast.success(message)
}

export function showCopiedToast() {
  toast.success("Kopyalandı", { duration: 1500 })
}
