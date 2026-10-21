import * as React from "react"
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom"
import {
  Factory,
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  ShieldCheck,
  RefreshCw,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authService } from "@/features/auth/services/auth-service"
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
      if (res.permissions) {
        setPermissions(res.permissions)
      }
      if (res.active_store_id) {
        setActiveStoreId(res.active_store_id)
      }
      if (res.store?.name) {
        setActiveStoreName(res.store.name)
      }

      navigate(res.active_store_id ? "/dashboard" : "/setup-store", { replace: true })
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
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl border border-border bg-card">
        {/* Left Side: Branding */}
        <div className="hidden lg:flex flex-col justify-between p-10 bg-slate-900 text-slate-100 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Logo */}
          <div className="flex items-center gap-3 relative z-10">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30">
              <Factory className="h-6 w-6" />
            </div>
            <div>
              <span className="font-black text-xl tracking-tight text-white block leading-none">HPP TRACKER</span>
              <span className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">SaaS Biaya & Inventaris UMKM</span>
            </div>
          </div>

          {/* Value Prop */}
          <div className="space-y-6 relative z-10 my-auto py-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
                Verifikasi Akun <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-indigo-300">
                  Satu Langkah Lagi
                </span>
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Kami melindungi akun bisnis dan data finansial Anda dengan memastikan kepemilikan alamat email resmi.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Kode verifikasi berlaku selama 15 menit</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Otentikasi aman & proteksi data terpusat</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500 relative z-10">
            &copy; {new Date().getFullYear()} HPP Tracker. Seluruh hak cipta dilindungi.
          </div>
        </div>

        {/* Right Side: Verification Form */}
        <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12 bg-white">
          <div className="space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Mail className="h-6 w-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold tracking-tight text-foreground">
                Verifikasi Alamat Email
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Masukkan 6 digit kode yang telah kami kirimkan ke email Anda untuk mengaktifkan akun.
              </p>
            </div>

            {infoMessage && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-primary text-sm leading-relaxed">
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{infoMessage}</span>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm leading-relaxed">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{error}</span>
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

            <div className="pt-2 text-center space-y-3">
              <div className="text-sm text-muted-foreground">
                Tidak menerima kode?{" "}
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={cooldown > 0 || resending}
                  className="font-semibold text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
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
                  className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                  Kembali ke Halaman Masuk
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
