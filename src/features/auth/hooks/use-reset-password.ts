import * as React from "react"
import { useSearchParams } from "react-router-dom"
import { authService } from "../services/auth-service"

export function useResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token") || ""

  const [isValidating, setIsValidating] = React.useState(true)
  const [isTokenValid, setIsTokenValid] = React.useState(false)
  const [userEmail, setUserEmail] = React.useState("")
  const [tokenError, setTokenError] = React.useState<string | null>(null)

  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function validateToken() {
      if (!token) {
        setTokenError("Tautan reset kata sandi tidak memiliki token yang valid.")
        setIsValidating(false)
        setIsTokenValid(false)
        return
      }

      try {
        setIsValidating(true)
        const res = await authService.validateResetToken(token)
        setIsTokenValid(res.valid)
        setUserEmail(res.email)
        setTokenError(null)
      } catch (err: unknown) {
        setIsTokenValid(false)
        if (err instanceof Error) {
          setTokenError(err.message)
        } else {
          setTokenError("Tautan reset kata sandi tidak valid atau telah kedaluwarsa.")
        }
      } finally {
        setIsValidating(false)
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!password) {
      setFormError("Kata sandi baru wajib diisi.")
      return
    }

    if (password.length < 6) {
      setFormError("Kata sandi minimal 6 karakter.")
      return
    }

    if (password !== confirmPassword) {
      setFormError("Konfirmasi kata sandi tidak cocok.")
      return
    }

    try {
      setIsSubmitting(true)
      await authService.resetPassword({
        token,
        new_password: password,
      })
      setIsSuccess(true)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message)
      } else {
        setFormError("Gagal mengatur ulang kata sandi. Silakan coba lagi.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    token,
    isValidating,
    isTokenValid,
    userEmail,
    tokenError,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    isSubmitting,
    isSuccess,
    formError,
    handleSubmit,
  }
}
