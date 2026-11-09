export function normalizeTrPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (digits.length >= 12 && digits.startsWith("90")) {
    return digits.slice(-10)
  }
  if (digits.length >= 11 && digits.startsWith("0")) {
    return digits.slice(-10)
  }
  return digits.slice(0, 10)
}

export function formatTrPhoneDisplay(phone10: string): string {
  const d = normalizeTrPhone(phone10)
  if (d.length !== 10) return d
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`
}
