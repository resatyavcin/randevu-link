import { BUSINESS_NAME } from "@/lib/config"

export function SiteFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-2 border-t border-border/60 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between gap-3">
        <div className="font-display text-[13px] font-bold tracking-tight">
          {BUSINESS_NAME}
        </div>
        <p className="text-right text-[11px] leading-relaxed text-muted-foreground">
          © {year} {BUSINESS_NAME}. Tüm hakları saklıdır.
        </p>
      </div>
    </footer>
  )
}
