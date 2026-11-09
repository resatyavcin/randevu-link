import Image from "next/image"
import { MOCK_BUSINESS } from "@/composition/business"
import { cn } from "@/presentation/lib/utils"

export function CoverBanner({ className }: { className?: string }) {
  const photo = MOCK_BUSINESS.coverPhotos?.[0]
  if (!photo) return null

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      <Image
        src={photo}
        alt="Reşat Berber salonu"
        fill
        unoptimized
        sizes="(max-width: 834px) 100vw, 834px"
        className="object-cover object-[center_45%]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
    </div>
  )
}
