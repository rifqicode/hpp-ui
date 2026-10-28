import { AuthBrandPanel } from "@/features/auth/components/auth-brand-panel"
import { EkatraBrand } from "@/components/brand/ekatra-logo"
import * as React from "react"
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom"
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  RefreshCw,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authService } from "@/features/auth/services/auth-service"
import { settingsService } from "@/features/settings/services/settings-service"
import { APP_NAME } from "@/lib/utils"
import { useAuthStore } from "@/store/use-auth-store"

function maskEmail(val: string): string {
  if (!val) return ""
  const parts = val.split("@")
  if (parts.length !== 2) return val
  const [local, domain] = parts
  const visible = local.slice(0, 3)
  return `${visible}***@${domain}`
}

const getRemainingCooldown = (targetEmail: string): number => {
  if (!targetEmail) return 0
  const storedUntil = localStorage.getItem(`verify_resend_until_${targetEmail.toLowerCase()}`)
  if (!storedUntil) return 0
  const until = parseInt(storedUntil, 10)
  if (isNaN(until)) return 0
  const diff = Math.ceil((until - Date.now()) / 1000)
  return diff > 0 ? diff : 0
}

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocation()

  const setAuth = useAuthStore((state) => state.setAuth)
  const setActiveStoreId = useAuthStore((state) => state.setActiveStoreId)
  const setActiveStoreName = useAuthStore((state) => state.setActiveStoreName)
  const setPermissions = useAuthStore((state) => state.setPermissions)

  const initialEmail =
    searchParams.get("email") ||
    (location.state as { email?: string; message?: string } | null)?.email ||
    sessionStorage.getItem("verify_email") ||
    ""
  if (initialEmail) {
    sessionStorage.setItem("verify_email", initialEmail)
  }
  const initialMessage =
    (location.state as { email?: string; message?: string } | null)?.message || ""

  const [email] = React.useState<string>(initialEmail)
  const [otp, setOtp] = React.useState<string[]>(["", "", "", "", "", ""])
  const [loading, setLoading] = React.useState<boolean>(false)
  const [resending, setResending] = React.useState<boolean>(false)
  const [error, setError] = React.useState<string>("")
  const [infoMessage, setInfoMessage] = React.useState<string>(initialMessage)
  const [cooldown, setCooldown] = React.useState<number>(() => getRemainingCooldown(initialEmail))

  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])

  // Cooldown countdown timer
  React.useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      const remaining = getRemainingCooldown(email)
      setCooldown(remaining)
      if (remaining <= 0) {
        localStorage.removeItem(`verify_resend_until_${email.trim().toLowerCase()}`)
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown > 0, email])

  // Focus the first empty digit box on mount
  React.useEffect(() => {
    const firstEmptyIndex = otp.findIndex((val) => val === "")
    const targetIndex = firstEmptyIndex === -1 ? 0 : firstEmptyIndex
    inputRefs.current[targetIndex]?.focus()
  }, [])

  function handleDigitChange(index: number, value: string) {
    // Keep only the last character entered and ensure it's a digit
    const cleaned = value.replace(/\D/g, "")
    if (!cleaned) {
      const nextOtp = [...otp]
      nextOtp[index] = ""
      setOtp(nextOtp)
      return
    }

    const nextOtp = [...otp]
    nextOtp[index] = cleaned[cleaned.length - 1]
    setOtp(nextOtp)
    setError("")

    // Move focus to next input if available
    if (index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        // Current input is already empty, move to previous
        inputRefs.current[index - 1]?.focus()
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (!pastedData) return

    const nextOtp = [...otp]
    for (let i = 0; i < 6; i++) {
      nextOtp[i] = pastedData[i] || ""
    }
    setOtp(nextOtp)
    setError("")

    const nextFocusIndex = Math.min(pastedData.length, 5)
    inputRefs.current[nextFocusIndex]?.focus()
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    const fullCode = otp.join("")

    if (!email.trim()) {
      setError("Alamat email wajib diisi.")
      return
    }

    if (fullCode.length !== 6) {
      setError("Silakan masukkan 6 digit kode verifikasi lengkap.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await authService.verifyEmail({
        email: email.trim(),
        code: fullCode,
      })

      setAuth(res.user, res.token)
      const storeId = res.active_store_id ?? res.store?.id
      if (storeId) {
        setActiveStoreId(storeId)
      }
      if (res.permissions) {
        setPermissions(res.permissions)
      } else if (storeId) {
        await settingsService.getStorePermissions(storeId)
      }
      if (res.store?.name) {
        setActiveStoreName(res.store.name)
      }

      const isOwner = res.user.account_type !== 'STAFF' && ['OWNER', 'STORE_OWNER'].includes(res.user.role)
      navigate(storeId ? (isOwner ? "/onboarding" : "/dashboard") : "/setup-store", { replace: true })
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Gagal memverifikasi kode. Periksa kembali kode Anda."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  async function handleResendCode() {
    if (!email.trim()) {
      setError("Alamat email wajib diisi untuk mengirim ulang kode.")
      return
    }

    if (cooldown > 0) return

    setResending(true)
    setError("")
    setInfoMessage("")

    try {
      await authService.resendVerification(email.trim())
      setInfoMessage("Kode verifikasi baru telah dikirimkan ke email Anda.")
      const until = Date.now() + 60 * 1000
      localStorage.setItem(`verify_resend_until_${email.trim().toLowerCase()}`, until.toString())
      setCooldown(60)
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Gagal mengirim ulang kode. Silakan coba lagi nanti."
      setError(msg)
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="brand-light-surface min-h-screen w-full min-w-0 bg-slate-50 lg:bg-white grid lg:grid-cols-12">
      <AuthBrandPanel page="verification" />

      {/* Right Canvas */}
      <div className="col-span-12 lg:col-span-8 flex flex-col justify-between w-full min-w-0 p-4 sm:p-10 lg:p-14 bg-white min-h-screen">
        {/* Top Bar: Back to Login & Mobile Logo */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-4 pb-6 sm:pb-8">
          {/* Mobile Header Logo */}
          <div className="lg:hidden flex items-center gap-2.5">
            <Link to="/" className="flex items-center gap-2">
              <EkatraBrand className="gap-3 text-xl sm:text-2xl" logoClassName="h-10 w-14 sm:h-12 sm:w-[4.25rem]" />
            </Link>
          </div>

          <div className="ml-auto">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-primary transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="size-4" />
              <span>Kembali ke Halaman Masuk</span>
            </Link>
          </div>
        </div>

        {/* Centered content container */}
        <div className="mx-auto w-full max-w-lg my-auto py-6">
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-primary text-xs font-semibold mb-2">
              <ShieldCheck className="size-3.5" />
              <span>Aktivasi Akun</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Verifikasi Alamat Email
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              Masukkan 6 digit kode yang telah kami kirimkan ke email Anda untuk mengaktifkan akun.
            </p>
          </div>

          {infoMessage && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm font-medium flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-600" />
              <div className="flex-1">
                <span className="font-bold block">Pemberitahuan</span>
                <span className="text-emerald-600 text-xs">{infoMessage}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1">
                <span className="font-bold block">Pemberitahuan</span>
                <span className="text-rose-600 text-xs">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Alamat Email
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="text"
                  value={maskEmail(email)}
                  readOnly
                  placeholder="nama@bisnis.com"
                  className="h-11 pl-10 bg-muted/50 cursor-not-allowed selection:bg-transparent text-muted-foreground font-mono"
                />
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                6-Digit Kode Verifikasi
              </Label>
              <div className="flex justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-xs"
                    aria-label={`Digit ke-${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || otp.join("").length !== 6}
              className="w-full h-11 text-base font-semibold shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  Verifikasi Email
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="pt-4 text-center space-y-3">
            <div className="text-sm text-slate-500">
              Tidak menerima kode?{" "}
              <button
                type="button"
                onClick={handleResendCode}
                disabled={cooldown > 0 || resending}
                className="font-semibold text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5 cursor-pointer"
              >
                {resending && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                {cooldown > 0
                  ? `Kirim ulang dalam ${cooldown}d`
                  : "Kirim Ulang Kode"}
              </button>
            </div>

            <div>
              <Link
                to="/login"
                className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Kembali ke Halaman Masuk
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom footer */}
        <div className="text-center text-[11px] text-slate-400 py-2">
          &copy; {new Date().getFullYear()} {APP_NAME}. Seluruh hak cipta dilindungi.
        </div>
      </div>
    </div>
  )
}
