"use client"

import confetti from "canvas-confetti"

/** Brand-aligned burst: indigo + warm gold. */
export function fireBookingConfetti() {
  if (typeof window === "undefined") return

  const colors = ["#7c6af0", "#a78bfa", "#fbbf24", "#fde68a", "#ffffff"]

  const canvas = document.createElement("canvas")
  canvas.setAttribute("aria-hidden", "true")
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "2147483647",
  })
  document.body.appendChild(canvas)

  // Workers can fail in some WebViews; keep it on the main thread.
  const fire = confetti.create(canvas, {
    resize: true,
    useWorker: false,
  })

  const burst = (originX: number, count = 90) =>
    fire({
      particleCount: count,
      spread: 72,
      startVelocity: 48,
      origin: { x: originX, y: 0.68 },
      colors,
      disableForReducedMotion: false,
    })

  try {
    burst(0.2)
    burst(0.8)
    burst(0.5, 55)

    window.setTimeout(() => {
      fire({
        particleCount: 150,
        spread: 110,
        startVelocity: 34,
        origin: { x: 0.5, y: 0.38 },
        colors,
        scalar: 1.1,
        disableForReducedMotion: false,
      })
    }, 160)
  } catch {
    confetti({
      particleCount: 160,
      spread: 100,
      origin: { y: 0.55 },
      colors,
      disableForReducedMotion: false,
    })
  }

  window.setTimeout(() => {
    try {
      fire.reset()
    } catch {
      // ignore
    }
    canvas.remove()
  }, 4500)
}
