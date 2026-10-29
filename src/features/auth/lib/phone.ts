export function normalizeOperationalPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "")
  if (digits.startsWith("62")) return digits.slice(2)
  if (digits.startsWith("0")) return digits.slice(1)
  return digits
}

/** Returns the full international format ("+62812...") or "" when there are no digits. */
export function formatInternationalPhone(value: string): string {
  const national = normalizeOperationalPhoneInput(value).replace(/^0+/, "")
  return national ? `+62${national}` : ""
}
