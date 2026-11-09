"use client"

import { useHydrated } from "@/presentation/lib/use-hydrated"

import * as React from "react"
import { Globe } from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/presentation/components/ui/drawer"
import { Button } from "@/presentation/components/ui/button"
import { InstagramIcon } from "@/presentation/components/ui/instagram-icon"
import { WhatsAppIcon } from "@/presentation/components/ui/whatsapp-icon"
import { cn } from "@/presentation/lib/utils"
import { BUSINESS_INSTAGRAM, BUSINESS_WEBSITE, BUSINESS_WHATSAPP } from "@/composition/config"

const STORAGE_KEY = "randevu-link.resat-berber.social-v1"

export type SocialLinks = {
  instagram: string
  whatsapp: string
  location: string
  website: string
}

export type SocialKind = "instagram" | "whatsapp" | "location" | "website"

type SocialLinksContextValue = SocialLinks & {
  setInstagram: (value: string) => void
  setWhatsapp: (value: string) => void
  setLocation: (value: string) => void
  setWebsite: (value: string) => void
  instagramUrl: string | null
  whatsappUrl: string | null
  websiteUrl: string | null
}

const DEFAULTS: SocialLinks = {
  instagram: BUSINESS_INSTAGRAM,
  whatsapp: BUSINESS_WHATSAPP,
  location: "",
  website: BUSINESS_WEBSITE,
}

const SocialLinksContext = React.createContext<SocialLinksContextValue | null>(
  null
)

export function normalizeInstagram(raw: string): string {
  return raw
    .trim()
    .replace(/^@+/, "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/\/.*$/, "")
    .replace(/[^a-zA-Z0-9._]/g, "")
}

export function normalizeWhatsapp(raw: string): string {
  let digits = raw.replace(/\D/g, "")
  if (digits.startsWith("00")) digits = digits.slice(2)
  if (digits.startsWith("0") && digits.length >= 11) {
    digits = `90${digits.slice(1)}`
  } else if (digits.length === 10 && digits.startsWith("5")) {
    digits = `90${digits}`
  }
  return digits
}

export function formatWhatsapp(digits: string): string {
  return digits ? "+90 5XX XXX XX XX" : ""
}

export function normalizeWebsite(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ""
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const url = new URL(withProto)
    if (!url.hostname.includes(".")) return ""
    url.hash = ""
    return url.toString().replace(/\/$/, "")
  } catch {
    return ""
  }
}

export function websiteLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url.replace(/^https?:\/\//i, "").replace(/\/$/, "")
  }
}

function readStored(): SocialLinks {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<SocialLinks>
    return {
      instagram:
        typeof parsed.instagram === "string"
          ? normalizeInstagram(parsed.instagram)
          : DEFAULTS.instagram,
      whatsapp:
        typeof parsed.whatsapp === "string"
          ? normalizeWhatsapp(parsed.whatsapp)
          : DEFAULTS.whatsapp,
      location:
        typeof parsed.location === "string" ? parsed.location.trim() : "",
      website:
        typeof parsed.website === "string"
          ? normalizeWebsite(parsed.website)
          : DEFAULTS.website,
    }
  } catch {
    return DEFAULTS
  }
}

export function SocialLinksProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const hydrated = useHydrated()
  const initial = React.useMemo(() => hydrated ? readStored() : DEFAULTS, [hydrated])
  const [choice, setLinks] = React.useState<SocialLinks>()
  const links = choice ?? initial
  const persist = React.useCallback((patch: Partial<SocialLinks>) => {
    const next = { ...links, ...patch }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setLinks(next)
  }, [links])

  const value = React.useMemo<SocialLinksContextValue>(
    () => ({
      ...links,
      setInstagram: (instagram) => persist({ instagram }),
      setWhatsapp: (whatsapp) => persist({ whatsapp }),
      setLocation: (location) => persist({ location }),
      setWebsite: (website) => persist({ website }),
      instagramUrl: links.instagram
        ? `https://www.instagram.com/${links.instagram}`
        : null,
      whatsappUrl: null,
      websiteUrl: links.website || null,
    }),
    [links, persist]
  )

  return (
    <SocialLinksContext.Provider value={value}>
      {children}
    </SocialLinksContext.Provider>
  )
}

export function useSocialLinks() {
  const ctx = React.useContext(SocialLinksContext)
  if (!ctx) {
    throw new Error("useSocialLinks must be used within SocialLinksProvider")
  }
  return ctx
}

const COPY: Record<
  SocialKind,
  { title: string; description: string; placeholder: string; prefix?: string }
> = {
  instagram: {
    title: "Instagram",
    description: "Kullanıcı adın randevu linkinde görünür.",
    placeholder: "Instagram kullanıcı adı",
    prefix: "@",
  },
  whatsapp: {
    title: "WhatsApp",
    description: "Müşteriler bu numaradan yazabilir.",
    placeholder: "05xx xxx xx xx",
  },
  location: {
    title: "Konum",
    description: "Kaydedilir. Yol tarifi şimdilik sabit, buraya bağlanacak.",
    placeholder: "İşletme adresi",
  },
  website: {
    title: "Web sitesi",
    description: "Müşteriler işletme sayfana gidebilir.",
    placeholder: "Web sitesi adresi",
  },
}

export function SocialLinkDrawer({
  kind,
  open,
  onOpenChange,
}: {
  kind: SocialKind | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!open || !kind) return null
  return <SocialLinkForm key={kind} kind={kind} onOpenChange={onOpenChange} />
}

function SocialLinkForm({ kind, onOpenChange }: { kind: SocialKind; onOpenChange: (open: boolean) => void }) {
  const {
    instagram,
    whatsapp,
    location,
    website,
    setInstagram,
    setWhatsapp,
    setLocation,
    setWebsite,
  } = useSocialLinks()
  const [draft, setDraft] = React.useState(() => ({
    instagram, whatsapp: formatWhatsapp(whatsapp), location, website,
  })[kind])

  const copy = COPY[kind]

  function save() {
    if (kind === "instagram") setInstagram(normalizeInstagram(draft))
    else if (kind === "whatsapp") setWhatsapp(normalizeWhatsapp(draft))
    else if (kind === "website") setWebsite(normalizeWebsite(draft))
    else setLocation(draft.trim())
    onOpenChange(false)
  }

  function clear() {
    if (kind === "instagram") setInstagram("")
    else if (kind === "whatsapp") setWhatsapp("")
    else if (kind === "website") setWebsite("")
    else setLocation("")
    onOpenChange(false)
  }

  return (
    <Drawer open onOpenChange={onOpenChange}>
      <DrawerContent
        className={cn(
          "link-floating-drawer mx-auto max-w-[834px] overflow-hidden outline-none shadow-2xl",
          "data-[vaul-drawer-direction=bottom]:mt-0",
          "data-[vaul-drawer-direction=bottom]:rounded-3xl",
          "data-[vaul-drawer-direction=bottom]:border"
        )}
      >
        <DrawerHeader className="gap-1 px-5 text-left group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
          <DrawerTitle className="font-display text-lg font-bold tracking-tight">
            {copy.title}
          </DrawerTitle>
          <DrawerDescription className="text-sm text-muted-foreground">
            {copy.description}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-5 pb-2">
          <label className="relative flex items-center rounded-xl bg-muted/70 ring-1 ring-border/70 focus-within:ring-2 focus-within:ring-indigo/40">
            {copy.prefix ? (
              <span className="pl-3.5 font-display text-sm font-semibold text-muted-foreground">
                {copy.prefix}
              </span>
            ) : null}
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") save()
              }}
              placeholder={copy.placeholder}
              inputMode={
                kind === "whatsapp"
                  ? "tel"
                  : kind === "website"
                    ? "url"
                    : "text"
              }
              autoCapitalize={kind === "location" ? "words" : "none"}
              autoCorrect={kind === "location" ? "on" : "off"}
              spellCheck={kind === "location"}
              className="h-12 w-full bg-transparent px-3.5 text-[15px] outline-none placeholder:text-muted-foreground/70"
            />
          </label>
        </div>

        <DrawerFooter className="flex-row gap-2 px-5 pb-5">
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1 rounded-xl"
            onClick={clear}
          >
            Kaldır
          </Button>
          <Button
            type="button"
            className="h-11 flex-1 rounded-xl"
            onClick={save}
          >
            Kaydet
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export function SocialActions({ className }: { className?: string }) {
  const { instagram, instagramUrl, whatsapp, whatsappUrl, websiteUrl } =
    useSocialLinks()

  if (!instagramUrl && !whatsappUrl && !websiteUrl) return null

  return (
    <div
      className={cn("mt-3 flex flex-wrap items-center justify-center gap-2", className)}
    >
      {instagramUrl ? (
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-card px-3 text-[13px] font-semibold ring-1 ring-border/80 transition-colors hover:bg-muted"
        >
          <InstagramIcon className="size-3.5" strokeWidth={2.2} />
          Instagram
          <span className="sr-only">{`@${instagram}`}</span>
        </a>
      ) : null}
      {whatsappUrl ? (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-card px-3 text-[13px] font-semibold ring-1 ring-border/80 transition-colors hover:bg-muted"
        >
          <WhatsAppIcon className="size-3.5 text-[#25D366]" />
          WhatsApp
          <span className="sr-only">{formatWhatsapp(whatsapp)}</span>
        </a>
      ) : null}
      {websiteUrl ? (
        <a
          href={websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-card px-3 text-[13px] font-semibold ring-1 ring-border/80 transition-colors hover:bg-muted"
        >
          <Globe className="size-3.5" strokeWidth={2.2} />
          Web
          <span className="sr-only">{websiteLabel(websiteUrl)}</span>
        </a>
      ) : null}
    </div>
  )
}

