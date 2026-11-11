"use client"

import * as React from "react"
import Image from "next/image"
import Cropper from "react-easy-crop"
import { ArrowLeft, ArrowRight, Crop, Plus, X } from "lucide-react"
import { fileToDataUrl, useBookingAppearance } from "@/presentation/components/booking/booking-appearance"
import { MOCK_BUSINESS } from "@/composition/business"
import { cropImage, COVER_ASPECT, MAX_COVERS, type CropArea } from "@/presentation/lib/crop-image"
import { Button } from "@/presentation/components/ui/button"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/presentation/components/ui/drawer"

export function AppearanceImageDrawer({ kind, onClose }: { kind: "header" | "logo"; onClose: () => void }) {
  const { headerImages, logoImages, setHeaderImages, setLogoImages } = useBookingAppearance()
  const [images, setImages] = React.useState(kind === "header" ? headerImages : logoImages)
  const [source, setSource] = React.useState<string | null>(null)
  const [editing, setEditing] = React.useState<number | null>(null)
  const [queue, setQueue] = React.useState<File[]>([])
  const [crop, setCrop] = React.useState({ x: 0, y: 0 })
  const [zoom, setZoom] = React.useState(1)
  const [area, setArea] = React.useState<CropArea | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState("")
  const [coverAspect, setCoverAspect] = React.useState(COVER_ASPECT)
  React.useEffect(() => {
    if (kind !== "header") return
    const banner = document.querySelector("[data-cover-banner]")
    if (!banner) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width && height) setCoverAspect(width / height)
    })
    observer.observe(banner)
    return () => observer.disconnect()
  }, [kind])
  const input = React.useRef<HTMLInputElement>(null)
  const title = kind === "header" ? "Kapak görselleri" : "İşletme logosu"
  const limit = MAX_COVERS
  const fallback = kind === "header" ? MOCK_BUSINESS.coverPhotos ?? [] : MOCK_BUSINESS.avatar ? [MOCK_BUSINESS.avatar] : []

  function beginCrop(image: string, index: number | null) {
    setCrop({ x: 0, y: 0 }); setZoom(1); setArea(null); setEditing(index); setSource(image)
  }

  async function openFile(file: File) {
    setBusy(true)
    try { beginCrop(await fileToDataUrl(file, 2400, 2400), null) }
    catch { setError("Görsel açılamadı. Başka bir dosya seç."); setQueue([]) }
    finally { setBusy(false) }
  }

  async function select(files: File[]) {
    if (!files.length) return
    setError("")
    const remaining = limit - images.length
    if (files.length > remaining) { setError(`En fazla ${limit} görsel ekleyebilirsin. Önce mevcut görsellerden birini kaldır.`); return }
    if (files.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024)) {
      setError("Her görsel en fazla 10 MB boyutunda JPG, PNG veya WebP olmalı."); return
    }
    setQueue(files.slice(1))
    await openFile(files[0])
  }

  async function applyCrop() {
    if (!source || !area || busy) return
    setBusy(true); setError("")
    try {
      const result = await cropImage(source, area, kind === "header" ? 1440 : 512, kind === "logo")
      setImages((previous) => editing === null ? [...previous, result] : previous.map((image, index) => index === editing ? result : image))
      setSource(null); setArea(null)
      const [next, ...rest] = queue
      setQueue(rest)
      if (next) await openFile(next)
    } catch { setError("Görsel kırpılamadı. Lütfen tekrar dene.") }
    finally { setBusy(false) }
  }

  function reorder(index: number, step: number) {
    const next = [...images]
    const target = index + step
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setImages(next)
  }

  function save() {
    const saved = kind === "header" ? setHeaderImages(images) : setLogoImages(images)
    if (saved) onClose()
    else setError("Görseller kaydedilemedi. Daha az veya daha küçük görselle tekrar dene.")
  }

  return (
    <Drawer open shouldScaleBackground={false} disablePreventScroll={false} handleOnly onOpenChange={(open) => { if (!open && !busy) onClose() }}>
      <DrawerContent className="link-floating-drawer mx-auto max-w-[834px] overflow-hidden rounded-3xl border outline-none shadow-2xl">
        <DrawerHeader className="px-5 text-left group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
          <DrawerTitle>{source ? "Görseli kırp" : title}</DrawerTitle>
          <DrawerDescription>{source ? (kind === "header" ? "Çerçevenin içinde kalan alan kapakta aynen görünecek. Sürükleyip yakınlaştır." : "Logonu kare çerçeveye yerleştir. Yuvarlak görünüm için ortada tut.") : (kind === "header" ? "En fazla 5 kapak ekle. İlk görsel önce görünür; sırayı değiştirebilirsin." : "En fazla 5 logo ekle. Logolar belirlediğin sürede otomatik değişir.")}</DrawerDescription>
        </DrawerHeader>
        <div className="min-h-0 space-y-4 overflow-y-auto overscroll-contain px-5">
          {source ? <>
            <div data-vaul-no-drag="" className="relative h-[min(38dvh,320px)] overflow-hidden rounded-2xl bg-zinc-950">
              <Cropper image={source} crop={crop} zoom={zoom} objectFit={kind === "header" ? "horizontal-cover" : "cover"} aspect={kind === "header" ? coverAspect : 1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, pixels) => setArea(pixels)} showGrid cropShape="rect" />
            </div>
            <label className="flex items-center gap-4 text-xs text-muted-foreground" data-vaul-no-drag="">
              Yakınlaştır
              <input aria-label="Görseli yakınlaştır" type="range" min={1} max={3} step={0.01} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="appearance-zoom min-w-0 flex-1" style={{ "--zoom-progress": `${(zoom - 1) / 2 * 100}%` } as React.CSSProperties} />
              <output className="w-12 text-right font-medium tabular-nums text-foreground">{Math.round(zoom * 100)}%</output>
            </label>
            {queue.length ? <p className="text-xs text-muted-foreground">Ardından {queue.length} görsel daha kırpılacak.</p> : null}
          </> : <>
            <div className="grid grid-cols-3 gap-3 pb-2 sm:grid-cols-6">
              {(images.length ? images : fallback).map((image, index) => (
                <div key={`${index}-${image.slice(-24)}`} className="min-w-0 space-y-2">
                  <button type="button" disabled={!images.length || busy} aria-label={`${index + 1}. görseli kırp`} onClick={() => beginCrop(image, index)} className="group relative block aspect-square w-full overflow-hidden rounded-xl border bg-muted focus-visible:outline-2 focus-visible:outline-ring">
                    <Image src={image} alt={`${title} ${index + 1}`} fill unoptimized className="object-cover" />
                    {images.length ? <span className="absolute bottom-1.5 right-1.5 rounded-md bg-white/90 p-1 text-black"><Crop className="size-3.5" /></span> : null}
                  </button>
                  {images.length ? <div className="flex items-center justify-between">
                    {<><button aria-label={`${index + 1}. kapağı sola taşı`} type="button" disabled={index === 0} onClick={() => reorder(index, -1)} className="rounded-md p-1.5 hover:bg-muted disabled:opacity-25"><ArrowLeft className="size-3.5" /></button><button aria-label={`${index + 1}. kapağı sağa taşı`} type="button" disabled={index === images.length - 1} onClick={() => reorder(index, 1)} className="rounded-md p-1.5 hover:bg-muted disabled:opacity-25"><ArrowRight className="size-3.5" /></button></>}
                    <button type="button" aria-label={`${index + 1}. görseli kaldır`} onClick={() => setImages((previous) => previous.filter((_, at) => at !== index))} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"><X className="size-3.5" /></button>
                  </div> : <p className="text-xs text-muted-foreground">Varsayılan</p>}
                </div>
              ))}
              {(images.length < limit) ? <button type="button" disabled={busy} onClick={() => input.current?.click()} className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/30 text-xs text-muted-foreground hover:bg-muted"><Plus className="size-5" />Görsel ekle</button> : null}
            </div>
            {images.length ? <div style={kind === "header" ? { aspectRatio: coverAspect } : undefined} className={kind === "header" ? "relative overflow-hidden rounded-2xl bg-muted" : "relative mx-auto size-24 overflow-hidden rounded-full bg-muted"}>
              <Image src={images[0]} alt={kind === "header" ? "İlk kapağın sayfadaki görünümü" : "Logonun sayfadaki görünümü"} fill unoptimized className="object-cover" />
            </div> : null}
            {images.length ? <p className="text-xs text-muted-foreground">{kind === "header" ? "İlk kapağın sayfada görüneceği çerçeve." : "Logonun sayfadaki yuvarlak görünümü."}</p> : null}
          </>}
          <input ref={input} type="file" aria-label="Görsel yükle" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} onChange={(event) => { void select(Array.from(event.target.files ?? [])); event.target.value = "" }} className="sr-only" tabIndex={-1} />
          {busy ? <p role="status" className="text-xs text-muted-foreground">Görsel hazırlanıyor…</p> : null}
          {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
        </div>
        <DrawerFooter className="shrink-0 flex-row gap-2 px-5 pb-5">
          {source ? <><Button variant="outline" disabled={busy} className="h-11 flex-1 rounded-xl" onClick={() => { setSource(null); setQueue([]); setError("") }}>Vazgeç</Button><Button disabled={busy || !area} className="h-11 flex-1 rounded-xl" onClick={() => void applyCrop()}>Kırpmayı uygula</Button></> : <><Button variant="outline" disabled={busy} className="h-11 flex-1 rounded-xl" onClick={() => setImages([])}>Varsayılana dön</Button><Button disabled={busy} className="h-11 flex-1 rounded-xl" onClick={save}>Kaydet</Button></>}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
