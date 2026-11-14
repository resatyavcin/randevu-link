"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { Search } from "lucide-react"
import type { MapPoint, PlaceResult } from "@/types/places"
import { searchPlaces } from "@/data/places"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer"
import { useSocialLinks } from "@/components/profile/social-links"

const LocationMap = dynamic(() => import("./location-map"), { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-xl bg-muted" /> })

export function LocationDrawer({ onClose }: { onClose: () => void }) {
  const { location, locationPoint, setLocation, setLocationSelection } = useSocialLinks()
  const [query, setQuery] = React.useState(location)
  const [point, setPoint] = React.useState<MapPoint | undefined>(locationPoint)
  const [label, setLabel] = React.useState(location)
  const [results, setResults] = React.useState<PlaceResult[]>([])
  const [busy, setBusy] = React.useState(false)
  const [message, setMessage] = React.useState("")
  const controller = React.useRef<AbortController | null>(null)
  React.useEffect(() => () => controller.current?.abort(), [])

  async function search(event: React.FormEvent) {
    event.preventDefault()
    if (query.trim().length < 3 || busy) return
    controller.current?.abort()
    const request = new AbortController()
    controller.current = request
    setBusy(true)
    setMessage("")
    setResults([])
    try {
      const places = await searchPlaces(query.trim(), request.signal)
      if (request.signal.aborted) return
      setResults(places)
      if (!places.length) setMessage("Konum bulunamadı. İlçe veya şehir ekleyerek tekrar ara.")
    } catch {
      if (!request.signal.aborted) setMessage("Arama yapılamadı. Tekrar deneyebilir veya haritadan nokta seçebilirsin.")
    } finally { if (!request.signal.aborted) setBusy(false) }
  }

  return (
    <Drawer open onOpenChange={(open) => { if (!open) onClose() }}>
      <DrawerContent className="link-floating-drawer mx-auto max-w-[834px] overflow-y-auto rounded-3xl border outline-none shadow-2xl">
        <DrawerHeader className="px-5 text-left group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
          <DrawerTitle>Konum</DrawerTitle>
          <DrawerDescription>İşletmeni ara, ardından pini haritada tam yerine taşı.</DrawerDescription>
        </DrawerHeader>
        <div className="space-y-3 px-5">
          <form onSubmit={search} className="flex gap-2">
            <input aria-label="İşletme adı veya adres" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="İşletme adı, adres veya şehir" className="h-11 min-w-0 flex-1 rounded-xl border bg-muted/50 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            <Button type="submit" variant="outline" className="h-11 rounded-xl" disabled={busy || query.trim().length < 3}><Search className="size-4" />{busy ? "Aranıyor" : "Ara"}</Button>
          </form>
          {message ? <p role="status" className="text-xs text-muted-foreground">{message}</p> : null}
          {results.length > 0 ? <ul className="max-h-36 overflow-y-auto rounded-xl border divide-y">{results.map((result, index) => <li key={`${result.lat}-${result.lng}-${index}`}><button type="button" className="w-full px-3 py-2.5 text-left text-sm hover:bg-muted focus-visible:bg-muted" onClick={() => { setPoint({ lat: result.lat, lng: result.lng }); setLabel(result.label); setQuery(result.label); setResults([]) }}>{result.label}</button></li>)}</ul> : null}
          <LocationMap point={point} onSelect={(next) => { setPoint(next); setResults([]); setLabel(`${next.lat.toFixed(6)}, ${next.lng.toFixed(6)}`) }} />
          <p aria-live="polite" className="text-xs leading-relaxed text-muted-foreground">{point ? `Seçilen konum: ${label}` : "Haritaya dokunarak da pin bırakabilirsin."}</p>
        </div>
        <DrawerFooter className="flex-row gap-2 px-5 pb-5">
          <Button variant="outline" className="h-11 flex-1 rounded-xl" onClick={() => { setLocation(""); onClose() }}>Kaldır</Button>
          <Button className="h-11 flex-1 rounded-xl" disabled={!point} onClick={() => { if (point) { setLocationSelection(label, point); onClose() } }}>Kaydet</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
