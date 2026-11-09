/** Public demo privacy policy: never render a complete telephone number. */
export function formatTrPhoneDisplay(phone: string): string {
  return phone ? "5XX XXX XX XX" : ""
}
