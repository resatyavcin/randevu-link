import Link from "next/link"

export function DashboardNotFoundView() {
  return (
    <div className="px-4 py-6 md:px-6">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
        Link bulunamadı
      </h1>
      <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Bu sayfa yok veya kaldırılmış olabilir.
      </p>
      <Link
        href="/booking-link"
        className="mt-6 inline-flex h-9 items-center rounded-lg bg-foreground px-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        Panele dön
      </Link>
    </div>
  )
}
