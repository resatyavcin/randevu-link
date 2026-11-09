function read(value: string | undefined, fallback: string) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : fallback
}

function readList(value: string | undefined, fallback: string[]) {
  const items = value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean)
  return items && items.length > 0 ? items : fallback
}

function readBool(value: string | undefined, fallback: boolean) {
  const normalized = value?.trim().toLowerCase()
  if (normalized === "true" || normalized === "1") return true
  if (normalized === "false" || normalized === "0") return false
  return fallback
}

/** Short public name (sidebar, footer, topbar). */
export const BUSINESS_NAME = read(
  process.env.NEXT_PUBLIC_BUSINESS_NAME,
  "Reşat Berber"
)

export const BUSINESS_COMPANY_NAME = read(
  process.env.NEXT_PUBLIC_BUSINESS_COMPANY_NAME,
  "Reşat Berber"
)

export const BUSINESS_SLUG = read(
  process.env.NEXT_PUBLIC_BUSINESS_SLUG,
  "resat-berber"
)

export const BUSINESS_INITIALS = read(
  process.env.NEXT_PUBLIC_BUSINESS_INITIALS,
  "RB"
)

export const BUSINESS_LOCATION = read(
  process.env.NEXT_PUBLIC_BUSINESS_LOCATION,
  ""
)

export const BUSINESS_MAPS_DESTINATION = read(
  process.env.NEXT_PUBLIC_BUSINESS_MAPS_DESTINATION,
  ""
)

export const BUSINESS_AVATAR = read(
  process.env.NEXT_PUBLIC_BUSINESS_AVATAR,
  ""
)

export const BUSINESS_VERIFIED = readBool(
  process.env.NEXT_PUBLIC_BUSINESS_VERIFIED,
  true
)

export const BUSINESS_COVER_PHOTOS = readList(
  process.env.NEXT_PUBLIC_BUSINESS_COVER_PHOTOS,
  []
)

export const BUSINESS_INSTAGRAM = read(
  process.env.NEXT_PUBLIC_BUSINESS_INSTAGRAM,
  ""
)

// The public demo must not link to a potentially real phone number.
export const BUSINESS_WHATSAPP = ""

export const BUSINESS_WEBSITE = read(
  process.env.NEXT_PUBLIC_BUSINESS_WEBSITE,
  ""
)
