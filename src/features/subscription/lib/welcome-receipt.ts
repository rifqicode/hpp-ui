const shownInSession = new Set<string>()

export function claimSubscriptionWelcome(userId: string, invoiceId: string): boolean {
  const key = `subscription-welcome:${userId}:${invoiceId}`
  if (shownInSession.has(key)) return false
  for (const storageName of ['localStorage', 'sessionStorage'] as const) {
    try {
      if (window[storageName].getItem(key) === 'shown') {
        shownInSession.add(key)
        return false
      }
    } catch { /* A blocked storage API must not interrupt the payment flow. */ }
  }
  shownInSession.add(key)
  for (const storageName of ['localStorage', 'sessionStorage'] as const) {
    try {
      window[storageName].setItem(key, 'shown')
      break
    } catch { /* Keep the in-memory receipt when browser storage is unavailable. */ }
  }
  return true
}
