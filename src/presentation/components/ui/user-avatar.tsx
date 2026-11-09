"use client"

import { cn } from "@/presentation/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/presentation/components/ui/avatar"
import type { HeaderTheme } from "@/presentation/components/profile/header-themes"
import { getHeaderTheme } from "@/presentation/components/profile/header-themes"

type UserAvatarProps = {
  src?: string | null
  alt?: string
  className?: string
  size?: "default" | "sm" | "lg"
  mesh?: HeaderTheme["mesh"]
}

function MeshFallback({
  alt,
  mesh,
}: {
  alt: string
  mesh: HeaderTheme["mesh"]
}) {
  const [a, b, c, d, e] = mesh.blobs

  return (
    <AvatarFallback
      className="relative size-full overflow-hidden rounded-full border-2 border-white [container-type:size]"
      style={{ backgroundColor: mesh.base }}
      aria-label={alt}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 size-[112px] -ml-[56px] -mt-[56px] overflow-hidden rounded-full [transform:scale(calc(100cqmin/112px))]"
      >
        <span
          className="absolute -left-[15%] -top-[20%] size-[75%] rounded-full blur-md"
          style={{ backgroundColor: a }}
        />
        <span
          className="absolute -right-[18%] -top-[15%] size-[70%] rounded-full blur-md"
          style={{ backgroundColor: b }}
        />
        <span
          className="absolute -bottom-[15%] -left-[10%] size-[75%] rounded-full blur-md"
          style={{ backgroundColor: c }}
        />
        <span
          className="absolute top-[30%] -right-[18%] size-[65%] rounded-full blur-md"
          style={{ backgroundColor: d }}
        />
        <span
          className="absolute left-[25%] top-[28%] size-[50%] rounded-full blur-lg"
          style={{ backgroundColor: e }}
        />
      </span>
    </AvatarFallback>
  )
}

export function UserAvatar({
  src,
  alt = "Profil",
  className,
  size = "default",
  mesh,
}: UserAvatarProps) {
  const resolvedMesh = mesh ?? getHeaderTheme("lavender").mesh

  return (
    <Avatar
      size={size}
      className={cn(
        "rounded-full after:rounded-full after:border-white/90 after:mix-blend-normal dark:after:mix-blend-normal",
        "shadow-sm ring-1 ring-black/5",
        className
      )}
    >
      {src ? (
        <AvatarImage
          src={src}
          alt={alt}
          className="rounded-full object-cover"
        />
      ) : null}
      <MeshFallback alt={alt} mesh={resolvedMesh} />
    </Avatar>
  )
}
