"use client"

import * as React from "react"
import Image from "next/image"
import { Check, Copy, Globe, MapPin } from "lucide-react"
import { useBookingAppearance } from "@/components/booking/booking-appearance"
import { DetailRow } from "@/components/booking-link/detail-row"
import { Button } from "@/components/ui/button"
import {
  formatWhatsapp,
  SocialLinkDrawer,
  useSocialLinks,
  type SocialKind,
} from "@/components/profile/social-links"
import { InstagramIcon } from "@/components/ui/instagram-icon"
import { LocationDrawer } from "@/components/profile/location-drawer"
import { AppearanceImageDrawer } from "@/components/profile/appearance-image-drawer"
import { DashboardThemeToggle } from "@/components/booking-link/theme-toggle"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon"
import { getBookingUrl, BUSINESS } from "@/lib/business"

const EMPTY = "Eklenmedi"

export function BookingLinkView() {
  const { instagram, whatsapp, website, location } = useSocialLinks()
  const [imageKind, setImageKind] = React.useState<"header" | "logo" | null>(null)
  const { dark, setDark, headerImages, logoImages, logoSrc, headerIntervalSeconds, setHeaderIntervalSeconds, logoIntervalSeconds, setLogoIntervalSeconds } = useBookingAppearance()
  const [copied, setCopied] = React.useState(false)
  const [socialKind, setSocialKind] = React.useState<SocialKind | null>(null)
  const copyResetRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    return () => {
      if (copyResetRef.current) window.clearTimeout(copyResetRef.current)
    }
  }, [])

  const handleCopyLink = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getBookingUrl())
      setCopied(true)
      if (copyResetRef.current) window.clearTimeout(copyResetRef.current)
      copyResetRef.current = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }, [])

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Randevu Linki</h1>
        <Button type="button" variant="outline" className={`rounded-full ${copied ? "text-emerald-600 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-400" : ""}`} onClick={handleCopyLink}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Kopyalandı" : "Linki kopyala"}
        </Button>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border bg-card [&>[data-slot=detail-row]]:h-[72px]">
          <header className="divider-dashed bg-muted/50 px-4 py-3">
            <h2 className="text-sm font-semibold">Sosyal Kanallar</h2>
            <p className="text-xs text-muted-foreground">
              Randevu linkinde görünen iletişim bilgileri
            </p>
          </header>
          <DetailRow
            label={
              <span className="inline-flex items-center gap-2">
                <InstagramIcon className="size-4" />
                Instagram
              </span>
            }
            value={instagram ? `@${instagram}` : EMPTY}
            onClick={() => setSocialKind("instagram")}
            showChevron
          />
          <DetailRow
            label={
              <span className="inline-flex items-center gap-2">
                <WhatsAppIcon className="size-4" />
                WhatsApp
              </span>
            }
            value={whatsapp ? formatWhatsapp(whatsapp) : EMPTY}
            onClick={() => setSocialKind("whatsapp")}
            showChevron
          />
          <DetailRow
            label={
              <span className="inline-flex items-center gap-2">
                <Globe className="size-4" />
                Web sitesi
              </span>
            }
            value={
              website
                ? website.replace(/^https?:\/\//i, "").replace(/\/$/, "")
                : EMPTY
            }
            onClick={() => setSocialKind("website")}
            showChevron
          />
          <DetailRow
            label={
              <span className="inline-flex items-center gap-2">
                <MapPin className="size-4" />
                Konum
              </span>
            }
            value={location || EMPTY}
            onClick={() => setSocialKind("location")}
            showChevron
            last
          />
        </section>

        <section className="overflow-hidden rounded-2xl border bg-card [&>[data-slot=detail-row]]:h-[72px]">
          <header className="divider-dashed bg-muted/50 px-4 py-3">
            <h2 className="text-sm font-semibold">Randevu sayfası görünümü</h2>
            <p className="text-xs text-muted-foreground">
              Müşterilerinizin gördüğü sayfayı kişiselleştirin
            </p>
          </header>
          <DetailRow
            label="Randevu sayfası koyu tema"
            trailing={
              <Switch
                size="md"
                checked={dark}
                onCheckedChange={setDark}
                aria-label="Randevu linki koyu teması"
              />
            }
          />
          <DetailRow label="Kapak görselleri" trailing={<div className="flex items-center -space-x-3">{(headerImages.length ? headerImages : BUSINESS.coverPhotos ?? []).map((src, index) => <span key={index} className="relative block size-11 shrink-0 overflow-hidden rounded-lg border-2 border-card bg-muted shadow-sm" style={{ zIndex: index }}><Image src={src} alt={`${index + 1}. kapak`} fill unoptimized className="object-cover" /></span>)}</div>} showChevron onClick={() => setImageKind("header")} />
          <DetailRow label="Kapak geçiş süresi" trailing={
            <IntervalSelect label="Kapak geçiş süresi" disabled={(headerImages.length ? headerImages.length : (BUSINESS.coverPhotos ?? []).length) < 2} value={headerIntervalSeconds} onChange={setHeaderIntervalSeconds} />
          } />
          <DetailRow label={`İşletme logoları${logoImages.length ? ` (${logoImages.length})` : ""}`} trailing={<span className="relative block size-11 overflow-hidden rounded-lg border bg-muted">{(logoSrc ?? BUSINESS.avatar) ? <Image src={(logoSrc ?? BUSINESS.avatar)!} alt="İşletme logosu" fill unoptimized className="object-cover" /> : null}</span>} showChevron onClick={() => setImageKind("logo")} />
          <DetailRow label="Logo geçiş süresi" trailing={<IntervalSelect label="Logo geçiş süresi" disabled={logoImages.length < 2} value={logoIntervalSeconds} onChange={setLogoIntervalSeconds} />} last />
        </section>
      </div>
      <section className="overflow-hidden rounded-2xl border bg-card [&>[data-slot=detail-row]]:h-[72px]">
        <header className="divider-dashed bg-muted/50 px-4 py-3"><h2 className="text-sm font-semibold">Yönetim paneli</h2><p className="text-xs text-muted-foreground">Yalnızca sizin kullandığınız panelin görünümü</p></header>
        <DetailRow label="Panel teması" trailing={<div className="w-36"><DashboardThemeToggle /></div>} last />
      </section>

      {imageKind ? <AppearanceImageDrawer key={imageKind} kind={imageKind} onClose={() => setImageKind(null)} /> : null}
      {socialKind === "location" ? <LocationDrawer onClose={() => setSocialKind(null)} /> : null}
      <SocialLinkDrawer
        kind={socialKind}
        open={socialKind !== null && socialKind !== "location"}
        onOpenChange={(open) => {
          if (!open) setSocialKind(null)
        }}
      />
    </div>
  )
}

function IntervalSelect({ label, value, onChange, disabled }: { label: string; value: number; onChange: (value: number) => void; disabled: boolean }) {
  const options = Array.from(new Set([3, 5, 8, 10, 15, 20, 30, 60, value])).sort((a, b) => a - b)
  return (
    <Select value={String(value)} onValueChange={(next) => onChange(Number(next))} disabled={disabled}>
      <SelectTrigger aria-label={label} className="w-32 rounded-xl bg-background data-[size=default]:h-10">
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="end">
        {options.map((seconds) => <SelectItem key={seconds} value={String(seconds)} className="font-medium">{seconds} saniye</SelectItem>)}
      </SelectContent>
    </Select>
  )
}
