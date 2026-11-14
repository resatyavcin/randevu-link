"use client"

import * as React from "react"
import type { MapPoint } from "@/types/places"
import "leaflet/dist/leaflet.css"

export default function LocationMap({ point, onSelect }: { point?: MapPoint; onSelect: (point: MapPoint) => void }) {
  const container = React.useRef<HTMLDivElement>(null)
  const mapRef = React.useRef<import("leaflet").Map | null>(null)
  const markerRef = React.useRef<import("leaflet").Marker | null>(null)
  const onSelectRef = React.useRef(onSelect)
  const initialPoint = React.useRef(point)
  const [failed, setFailed] = React.useState(false)

  React.useEffect(() => { onSelectRef.current = onSelect }, [onSelect])
  React.useEffect(() => {
    let disposed = false
    const observer = new ResizeObserver(() => mapRef.current?.invalidateSize())
    void import("leaflet").then((L) => {
      if (disposed || !container.current) return
      const initial = initialPoint.current
      const map = L.map(container.current).setView(initial ? [initial.lat, initial.lng] : [39, 35], initial ? 16 : 5)
      mapRef.current = map
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)
      const marker = L.marker(initial ? [initial.lat, initial.lng] : [39, 35], {
        draggable: true,
        title: "İşletme konumu — taşımak için sürükle veya ok tuşlarını kullan",
        icon: L.divIcon({ className: "", html: '<span style="display:block;width:24px;height:24px;border:4px solid white;border-radius:50% 50% 50% 0;background:#18181b;transform:rotate(-45deg);box-shadow:0 2px 8px #0005"></span>', iconSize: [24, 24], iconAnchor: [12, 24] }),
      })
      markerRef.current = marker
      if (initial) marker.addTo(map)
      map.on("click", (event) => {
        marker.setLatLng(event.latlng).addTo(map)
        onSelectRef.current({ lat: event.latlng.lat, lng: event.latlng.lng })
      })
      marker.on("dragend", () => {
        const position = marker.getLatLng()
        onSelectRef.current({ lat: position.lat, lng: position.lng })
      })
      observer.observe(container.current)
    }).catch(() => { if (!disposed) setFailed(true) })
    return () => { disposed = true; observer.disconnect(); mapRef.current?.remove(); mapRef.current = null; markerRef.current = null }
  }, [])

  React.useEffect(() => {
    if (!point || !mapRef.current || !markerRef.current) return
    markerRef.current.setLatLng([point.lat, point.lng]).addTo(mapRef.current)
    mapRef.current.setView([point.lat, point.lng], Math.max(mapRef.current.getZoom(), 16))
  }, [point])

  return failed ? <p role="alert" className="p-4 text-sm text-destructive">Harita yüklenemedi. Lütfen tekrar aç.</p> : <div ref={container} data-vaul-no-drag="" aria-label="Konum seçme haritası" className="relative z-0 h-64 w-full rounded-xl" />
}
