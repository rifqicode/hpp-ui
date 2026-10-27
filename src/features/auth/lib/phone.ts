export function normalizeOperationalPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "")
  if (digits.startsWith("62")) return digits.slice(2)
  if (digits.startsWith("0")) return digits.slice(1)
  return digits
}
