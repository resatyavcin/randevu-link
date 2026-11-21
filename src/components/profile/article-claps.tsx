"use client"

import { HeartHandshake } from "lucide-react"
import { useRef, useState, useSyncExternalStore, type CSSProperties } from "react"

const limit = 50
const changeEvent = "article-claps-change"

function readClaps(key: string) {
  try {
    const value = Number(localStorage.getItem(key))
    return Number.isInteger(value) && value >= 0 ? Math.min(value, limit) : 0
  } catch {
    return 0
  }
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback)
  window.addEventListener(changeEvent, callback)
  return () => {
    window.removeEventListener("storage", callback)
    window.removeEventListener(changeEvent, callback)
  }
}

export function ArticleClaps({ articleId }: { articleId: string }) {
  const key = `randevu-link.article-claps.${articleId}`
  const count = useSyncExternalStore(subscribe, () => readClaps(key), () => 0)
  const atLimit = count >= limit
  const nextId = useRef(0)
  const [bursts, setBursts] = useState<{ id: number; x: number; rotation: number }[]>([])

  function clap() {
    const current = readClaps(key)
    if (current >= limit) return
    try {
      localStorage.setItem(key, String(current + 1))
      window.dispatchEvent(new Event(changeEvent))
      const id = nextId.current++
      const direction = id % 2 === 0 ? 1 : -1
      setBursts((previous) => [...previous, {
        id,
        x: direction * (8 + Math.random() * 8),
        rotation: direction * 4,
      }])
    } catch {
      // Keep the displayed count consistent with saved claps.
    }
  }

  return (
    <div className="flex items-center gap-2 border-t border-border py-8">
      <div className="relative shrink-0">
      <button
        type="button"
        onClick={clap}
        disabled={atLimit}
        aria-label={atLimit ? "50 alkış sınırına ulaştın" : `Alkışla, ${count} / ${limit} alkış verdin`}
        className="group inline-flex size-12 shrink-0 items-center justify-center rounded-full text-foreground transition duration-200 hover:bg-muted active:scale-90 disabled:cursor-default motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        <HeartHandshake aria-hidden className="size-6" strokeWidth={1.6} />
      </button>
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {bursts.map((burst) => <span
          key={burst.id}
          className="clap-burst absolute left-1/2 top-1 text-sm font-semibold tabular-nums text-foreground"
          style={{ "--clap-x": `${burst.x}px`, "--clap-rotation": `${burst.rotation}deg` } as CSSProperties}
          onAnimationEnd={() => setBursts((previous) => previous.filter((item) => item.id !== burst.id))}
        >+1</span>)}
      </div>
      </div>
      <div className="text-sm">
        <p className="text-muted-foreground tabular-nums" aria-live="polite" aria-atomic="true">{count} alkış</p>
      </div>
    </div>
  )
}
