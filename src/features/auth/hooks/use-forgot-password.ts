import * as React from "react"
import { authService } from "../services/auth-service"

export function useForgotPassword() {
  const [email, setEmail] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setErrorMessage("Silakan masukkan alamat email Anda.")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage("Format email tidak valid.")
      return
    }

    try {
      setIsSubmitting(true)
      await authService.forgotPassword(trimmedEmail)
      setIsSuccess(true)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage("Terjadi kesalahan saat memproses permintaan.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setEmail("")
    setIsSuccess(false)
    setErrorMessage(null)
  }

  return {
    email,
    setEmail,
    isSubmitting,
    isSuccess,
    errorMessage,
    handleSubmit,
    resetForm,
  }
}
