const KEY = "randevu-link.copied"

export function rememberCopied(value: string) {
  const text = value.trim()
  if (!text) return
  try {
    sessionStorage.setItem(KEY, text)
  } catch {
    /* private mode */
  }
}

export function lastCopied() {
  try {
    return sessionStorage.getItem(KEY)?.trim() ?? ""
  } catch {
    return ""
  }
}
