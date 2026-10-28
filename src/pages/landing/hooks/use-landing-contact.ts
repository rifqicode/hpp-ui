import { useEffect, useState } from "react"
import type { WhatsAppCTAConfig } from "../components/whatsapp-cta"

export function useLandingContact() {
  const [whatsapp, setWhatsapp] = useState<WhatsAppCTAConfig | null>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const baseURL = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "")

    fetch(`${baseURL}/config/landing`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("Contact settings unavailable")
        const body = await response.json()
        if (!body.success) throw new Error("Contact settings unavailable")
        if (!controller.signal.aborted) {
          setWhatsapp(body.data?.whatsapp ?? null)
          setStatus("ready")
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("error")
      })

    return () => controller.abort()
  }, [attempt])

  function retry() {
    setStatus("loading")
    setAttempt(value => value + 1)
  }

  return { whatsapp, status, retry }
}
