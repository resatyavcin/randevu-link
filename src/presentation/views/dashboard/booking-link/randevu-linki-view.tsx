"use client"

import * as React from "react"
import { Check, Copy, Globe } from "lucide-react"
import { useBookingAppearance } from "@/presentation/components/booking/booking-appearance"
import { DetailRow } from "@/presentation/components/dashboard/profile/detail-row"
import { Button } from "@/presentation/components/ui/button"
import {
  formatWhatsapp,
  SocialLinkDrawer,
  useSocialLinks,
  type SocialKind,
} from "@/presentation/components/profile/social-links"
import { InstagramIcon } from "@/presentation/components/ui/instagram-icon"
import { Switch } from "@/presentation/components/ui/switch"
import { WhatsAppIcon } from "@/presentation/components/ui/whatsapp-icon"
import { getBookingUrl } from "@/composition/business"

const EMPTY = "Eklenmedi"

export function RandevuLinkiView() {
  const { instagram, whatsapp, website } = useSocialLinks()
  const { dark, setDark } = useBookingAppearance()
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
        <Button type="button" variant="outline" className="rounded-full" onClick={handleCopyLink}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Kopyalandı" : "Linki kopyala"}
        </Button>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border bg-card">
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
            last
          />
        </section>

        <section className="overflow-hidden rounded-2xl border bg-card">
          <header className="divider-dashed bg-muted/50 px-4 py-3">
            <h2 className="text-sm font-semibold">Görünüm</h2>
            <p className="text-xs text-muted-foreground">
              Randevu linkinde nasıl görüneceği
            </p>
          </header>
          <DetailRow
            last
            label="Koyu tema"
            trailing={
              <Switch
                checked={dark}
                onCheckedChange={setDark}
                aria-label="Randevu linki koyu teması"
              />
            }
          />
        </section>
      </div>

      <SocialLinkDrawer
        kind={socialKind}
        open={socialKind !== null}
        onOpenChange={(open) => {
          if (!open) setSocialKind(null)
        }}
      />
    </div>
  )
}
