import { useEffect, useState } from "react"
import { authService } from "../services/auth-service"
import type { ServiceAgreementDocument } from "../types"

interface AgreementState {
  document: ServiceAgreementDocument | null
  loading: boolean
  error: string
}

export function useServiceAgreement(enabled: boolean) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<AgreementState>({ document: null, loading: enabled, error: "" })

  useEffect(() => {
    if (!enabled) return
    let active = true
    authService.getServiceAgreement().then(
      (document) => { if (active) setState({ document, loading: false, error: "" }) },
      (error: unknown) => {
        if (active) setState({
          document: null,
          loading: false,
          error: error instanceof Error ? error.message : "Gagal memuat dokumen ketentuan.",
        })
      },
    )
    return () => { active = false }
  }, [enabled, attempt])

  function retry() {
    setState({ document: null, loading: true, error: "" })
    setAttempt((value) => value + 1)
  }

  return { ...state, retry }
}
