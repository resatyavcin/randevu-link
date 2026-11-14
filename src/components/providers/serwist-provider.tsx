"use client"

import { useEffect } from "react"
import {
  SerwistProvider as SerwistReactProvider,
  useSerwist,
  type SerwistProviderProps,
} from "@serwist/turbopack/react"

const UPDATE_CHECK_MS = 15 * 60 * 1000

function PwaUpdateListener() {
  const { serwist } = useSerwist()

  useEffect(() => {
    if (!serwist || !("serviceWorker" in navigator)) return

    let cancelled = false
    const ready = serwist.controlling.then(() => undefined)

    const onWaiting = () => {
      serwist.messageSkipWaiting()
    }

    const onControlling = (event: { isUpdate?: boolean }) => {
      if (event.isUpdate) {
        window.location.reload()
      }
    }

    serwist.addEventListener("waiting", onWaiting)
    serwist.addEventListener("controlling", onControlling)

    const checkForUpdate = () => {
      void ready.then(() => {
        if (cancelled) return
        void serwist.update()
      })
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        checkForUpdate()
      }
    }

    checkForUpdate()
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("focus", checkForUpdate)
    window.addEventListener("pageshow", checkForUpdate)
    const intervalId = window.setInterval(checkForUpdate, UPDATE_CHECK_MS)

    return () => {
      cancelled = true
      serwist.removeEventListener("waiting", onWaiting)
      serwist.removeEventListener("controlling", onControlling)
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("focus", checkForUpdate)
      window.removeEventListener("pageshow", checkForUpdate)
      window.clearInterval(intervalId)
    }
  }, [serwist])

  return null
}

export function SerwistProvider({
  options,
  children,
  ...props
}: SerwistProviderProps) {
  return (
    <SerwistReactProvider
      reloadOnOnline
      options={{ updateViaCache: "none", ...options }}
      {...props}
    >
      <PwaUpdateListener />
      {children}
    </SerwistReactProvider>
  )
}
