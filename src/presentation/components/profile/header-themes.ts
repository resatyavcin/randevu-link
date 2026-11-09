export type HeaderThemeId = "peach" | "lavender" | "sky"

export type HeaderTheme = {
  id: HeaderThemeId
  label: string
  /** Preview swatch — solid soft tone */
  swatch: string
  banner: string
  mesh: {
    base: string
    blobs: [string, string, string, string, string]
  }
}

export const HEADER_THEMES: HeaderTheme[] = [
  {
    id: "peach",
    label: "Şeftali",
    swatch: "linear-gradient(135deg, #ffe4e6, #fed7aa)",
    banner: `
      radial-gradient(ellipse 80% 90% at 15% 80%, #fda4af 0%, transparent 55%),
      radial-gradient(ellipse 70% 80% at 85% 20%, #fdba74 0%, transparent 50%),
      radial-gradient(ellipse 60% 70% at 50% 50%, #fecdd3 0%, transparent 45%),
      radial-gradient(ellipse 50% 60% at 70% 75%, #fed7aa 0%, transparent 40%),
      linear-gradient(135deg, #fff7ed 0%, #ffe4e6 45%, #ffedd5 100%)
    `,
    mesh: {
      base: "#fff7ed",
      blobs: ["#fecdd3", "#fed7aa", "#fda4af", "#fdba74", "#fff7ed"],
    },
  },
  {
    id: "lavender",
    label: "Lavanta",
    swatch: "linear-gradient(135deg, #e0e7ff, #f5d0fe)",
    banner: `
      radial-gradient(ellipse 80% 90% at 15% 80%, #c4b5fd 0%, transparent 55%),
      radial-gradient(ellipse 70% 80% at 85% 20%, #a5b4fc 0%, transparent 50%),
      radial-gradient(ellipse 60% 70% at 50% 50%, #e9d5ff 0%, transparent 45%),
      radial-gradient(ellipse 50% 60% at 70% 75%, #ddd6fe 0%, transparent 40%),
      linear-gradient(135deg, #eef2ff 0%, #f3e8ff 45%, #e0e7ff 100%)
    `,
    mesh: {
      base: "#eef2ff",
      blobs: ["#e9d5ff", "#c4b5fd", "#a5b4fc", "#ddd6fe", "#f5d0fe"],
    },
  },
  {
    id: "sky",
    label: "Gök",
    swatch: "linear-gradient(135deg, #e0f2fe, #bfdbfe)",
    banner: `
      radial-gradient(ellipse 80% 90% at 15% 80%, #7dd3fc 0%, transparent 55%),
      radial-gradient(ellipse 70% 80% at 85% 20%, #93c5fd 0%, transparent 50%),
      radial-gradient(ellipse 60% 70% at 50% 50%, #bae6fd 0%, transparent 45%),
      radial-gradient(ellipse 50% 60% at 70% 75%, #bfdbfe 0%, transparent 40%),
      linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 45%, #dbeafe 100%)
    `,
    mesh: {
      base: "#f0f9ff",
      blobs: ["#bae6fd", "#93c5fd", "#7dd3fc", "#bfdbfe", "#f0f9ff"],
    },
  },
]

export const HEADER_THEME_STORAGE_KEY = "randevu-header-theme"

/** Public booking link always uses Lavanta for the empty cover/logo mesh. */
export const BOOKING_HEADER_THEME_ID: HeaderThemeId = "lavender"

export function getHeaderTheme(id: HeaderThemeId): HeaderTheme {
  return HEADER_THEMES.find((t) => t.id === id) ?? HEADER_THEMES[0]
}

export const BOOKING_HEADER_THEME = getHeaderTheme(BOOKING_HEADER_THEME_ID)
