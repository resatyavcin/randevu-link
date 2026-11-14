export type CropArea = { x: number; y: number; width: number; height: number }

export async function cropImage(source: string, area: CropArea, maxWidth: number, transparent = false): Promise<string> {
  const image = new Image()
  image.src = source
  await image.decode()
  if (area.width <= 0 || area.height <= 0) throw new Error("Kırpma alanı geçersiz")
  const scale = Math.min(1, maxWidth / area.width)
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(area.width * scale))
  canvas.height = Math.max(1, Math.round(area.height * scale))
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Görsel hazırlanamadı")
  context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL(transparent ? "image/png" : "image/jpeg", 0.82)
}

export const COVER_ASPECT = 3
export const MAX_COVERS = 5
