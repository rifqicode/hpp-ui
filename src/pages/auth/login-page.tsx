import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Factory,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Laptop,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authService } from "@/features/auth/services/auth-service"
import { settingsService } from "@/features/settings/services/settings-service"
import { APP_NAME } from "@/lib/utils"
import { useAuthStore } from "@/store/use-auth-store"

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  const [email, setEmail] = React.useState<string>("")
  const [password, setPassword] = React.useState<string>("")
  const [showPassword, setShowPassword] = React.useState<boolean>(false)
  const [rememberMe, setRememberMe] = React.useState<boolean>(false)

  const [loading, setLoading] = React.useState<boolean>(false)
  const [error, setError] = React.useState<string>("")

  // Device verification state (Adaptive 2FA)
  const [isVerifyingDevice, setIsVerifyingDevice] = React.useState<boolean>(false)
  const [challengeToken, setChallengeToken] = React.useState<string>("")
  const [emailMasked, setEmailMasked] = React.useState<string>("")
  const [deviceInfo, setDeviceInfo] = React.useState<string>("")
  const [otpDigits, setOtpDigits] = React.useState<string[]>(["", "", "", "", "", ""])
  const [resendCountdown, setResendCountdown] = React.useState<number>(60)
  const [resending, setResending] = React.useState<boolean>(false)
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])

  // Resend OTP countdown timer
  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (isVerifyingDevice && resendCountdown > 0) {
      interval = setInterval(() => {
        setResendCountdown((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isVerifyingDevice, resendCountdown])

  // Focus first OTP input when switching to verification screen
  React.useEffect(() => {
    if (isVerifyingDevice) {
      setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 50)
    }
  }, [isVerifyingDevice])

  const handleDigitChange = (index: number, val: string) => {
    const char = val.slice(-1)
    if (char && !/^\d$/.test(char)) return
    const next = [...otpDigits]
    next[index] = char
    setOtpDigits(next)
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === "Enter" && otpDigits.join("").length === 6) {
      handleVerifyDevice()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (!pasted) return
    const next = [...otpDigits]
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] || ""
    }
    setOtpDigits(next)
    const lastIdx = Math.min(pasted.length - 1, 5)
    inputRefs.current[lastIdx]?.focus()
  }

  async function proceedLoginSuccess(user: any, token: string) {
    setAuth(user, token)
    const stores = await settingsService.getStoresList()
    if (stores && stores.length > 0) {
      useAuthStore.getState().setActiveStoreId(stores[0].id)
      useAuthStore.getState().setActiveStoreName(stores[0].name)
      await settingsService.getStorePermissions(stores[0].id)
      navigate("/dashboard")
    } else {
      navigate("/setup-store")
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError("Email atau username dan kata sandi wajib diisi")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await authService.login({ email, password })

      if (res.requires_device_verification) {
        setIsVerifyingDevice(true)
        setChallengeToken(res.challenge_token || "")
        setEmailMasked(res.email_masked || email)
        setDeviceInfo(res.device_info || "Perangkat Baru")
        setOtpDigits(["", "", "", "", "", ""])
        setResendCountdown(60)
        return
      }

      await proceedLoginSuccess(res.user, res.token)
    } catch (err: unknown) {
      const errObj = err as any
      const isUnverified =
        errObj?.status === 403 ||
        (errObj?.message && (
          errObj.message.toLowerCase().includes("not verified") ||
          errObj.message.toLowerCase().includes("belum diverifikasi") ||
          errObj.message.toLowerCase().includes("verify your email")
        ))

      if (isUnverified) {
        navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`, {
          state: {
            email: email.trim(),
            message: "Email Anda belum diverifikasi. Silakan masukkan kode verifikasi yang telah dikirimkan ke email Anda.",
          },
        })
        return
      }

      let msg =
        err instanceof Error
          ? err.message
          : "Gagal masuk. Periksa kembali email atau username dan kata sandi Anda."
      if (msg.toLowerCase() === "unauthorized") {
        msg = "Email, username, atau kata sandi salah. Silakan coba lagi."
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyDevice(e?: React.FormEvent) {
    if (e) e.preventDefault()
    const code = otpDigits.join("")
    if (code.length !== 6) {
      setError("Silakan masukkan 6 digit kode verifikasi")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await authService.verifyDevice(challengeToken, code)
      await proceedLoginSuccess(res.user, res.token)
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Kode verifikasi salah atau telah kedaluwarsa."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  async function handleResendOTP() {
    if (resendCountdown > 0 || resending) return
    setResending(true)
    setError("")

    try {
      await authService.resendDeviceOTP(challengeToken)
      setResendCountdown(60)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengirim ulang kode verifikasi."
      setError(msg)
    } finally {
      setResending(false)
    }
  }

  function handleBackToLogin() {
    setIsVerifyingDevice(false)
    setError("")
    setOtpDigits(["", "", "", "", "", ""])
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 lg:bg-white grid lg:grid-cols-12">
      {/* Desktop brand panel */}
      <aside className="relative hidden overflow-hidden border-r border-slate-800 bg-slate-950 p-10 text-white lg:col-span-4 lg:flex lg:flex-col xl:p-12">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 size-96 rounded-full bg-primary/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-20 size-96 rounded-full bg-violet-600/15 blur-3xl" />

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center py-12 text-center">
          <Link to="/" aria-label={`${APP_NAME} — Beranda`} className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-950">
            <Factory aria-hidden="true" className="size-6" />
          </Link>
          <h2 className="text-3xl font-extrabold tracking-tight text-white xl:text-4xl">{APP_NAME.toUpperCase()}</h2>
          <p className="mt-4 text-base leading-relaxed text-slate-400">
            Biaya lebih jelas.<br />Usaha lebih terarah.
          </p>
        </div>

        <p className="relative z-10 text-center text-xs text-slate-500">&copy; {new Date().getFullYear()} {APP_NAME}</p>
      </aside>

      {/* ======================================================== */}
      {/* RIGHT PANEL: Clean Auth Canvas (7 cols)                  */}
      {/* ======================================================== */}
      <div className="col-span-12 lg:col-span-8 flex flex-col justify-between p-6 sm:p-10 lg:p-14 bg-white min-h-screen">
        {/* Top Bar: Back to Home & Mobile Logo */}
        <div className="flex items-center justify-between pb-6 sm:pb-8">
          {/* Mobile Header Logo */}
          <div className="lg:hidden flex items-center gap-2.5">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                <Factory className="size-5" />
              </div>
              <span className="font-black text-lg tracking-tight text-slate-900">
                {APP_NAME.toUpperCase()}
              </span>
            </Link>
          </div>

          <div className="ml-auto">
            {isVerifyingDevice ? (
              <button
                type="button"
                onClick={handleBackToLogin}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-primary transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <ArrowLeft className="size-4" />
                <span>Kembali ke Form Login</span>
              </button>
            ) : (
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-primary transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-100"
              >
                <ArrowLeft className="size-4" />
                <span>Kembali ke Beranda</span>
              </Link>
            )}
          </div>
        </div>

        {/* Centered Form Body */}
        <div className="max-w-lg w-full mx-auto my-auto py-6">
          {isVerifyingDevice ? (
            /* ===================================================== */
            /* 2FA NEW DEVICE VERIFICATION SCREEN                    */
            /* ===================================================== */
            <div>
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-primary text-xs font-semibold mb-2">
                  <ShieldCheck className="size-3.5" />
                  <span>Verifikasi Keamanan</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  Verifikasi Perangkat Baru
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                  Kode verifikasi 6-digit telah dikirim ke{" "}
                  <strong className="text-slate-800 font-semibold">{emailMasked}</strong> untuk konfirmasi login dari{" "}
                  <span className="font-semibold text-slate-800 inline-flex items-center gap-1">
                    <Laptop className="size-3.5 inline text-slate-500" />
                    {deviceInfo}
                  </span>
                  .
                </p>
              </div>

              {/* Error Alert Box */}
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-600" />
                  <div className="flex-1">
                    <span className="font-bold block">Verifikasi Gagal</span>
                    <span className="text-rose-600 text-xs">{error}</span>
                  </div>
                </div>
              )}

              {/* 6-Digit OTP Boxes */}
              <div className="flex justify-center items-center gap-2 sm:gap-3 my-6">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    className="w-11 h-14 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    aria-label={`Digit ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Submit Button */}
              <Button
                type="button"
                onClick={() => handleVerifyDevice()}
                className="w-full rounded-xl h-11 shadow-md shadow-primary/25 font-bold text-sm bg-primary hover:bg-primary/90 text-white transition-all hover:-translate-y-0.5 cursor-pointer"
                disabled={loading || otpDigits.join("").length !== 6}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    <span>Memverifikasi Perangkat...</span>
                  </>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>Verifikasi & Masuk</span>
                    <ArrowRight className="size-4" />
                  </span>
                )}
              </Button>

              {/* Action Buttons: Resend Code & Switch Account */}
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendCountdown > 0 || resending}
                  className="text-xs font-semibold text-primary hover:text-primary/80 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {resending && <Loader2 className="size-3.5 animate-spin" />}
                  {resendCountdown > 0 ? (
                    <span>Kirim ulang kode ({resendCountdown}s)</span>
                  ) : (
                    <span>Kirim Ulang Kode Verifikasi</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="size-3.5" />
                  <span>Ganti Akun</span>
                </button>
              </div>
            </div>
          ) : (
            /* ===================================================== */
            /* STANDARD LOGIN FORM                                   */
            /* ===================================================== */
            <div>
              <div className="mb-8">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-primary text-xs font-semibold mb-2">
                  <span>Masuk ke Ruang Kerja</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  Selamat Datang Kembali
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
                  Masuk dengan email pemilik atau username staf dan kata sandi Anda.
                </p>
              </div>

              {/* Error Alert Box */}
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-600" />
                  <div className="flex-1">
                    <span className="font-bold block">Gagal Masuk</span>
                    <span className="text-rose-600 text-xs">{error}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleLogin} noValidate className="space-y-4">
                {/* Email Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-bold text-slate-700">
                    Alamat Email atau Username
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input
                      id="email"
                      type="text"
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@email.com atau staf@toko"
                      className="pl-10 rounded-xl h-11 text-sm bg-slate-50/50 border-slate-200 focus-visible:bg-white focus-visible:ring-primary"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-bold text-slate-700">
                      Kata Sandi
                    </Label>
                    <Link
                      to="/forgot-password"
                      className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      Lupa kata sandi?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 pr-10 rounded-xl h-11 text-sm bg-slate-50/50 border-slate-200 focus-visible:bg-white focus-visible:ring-primary"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                      aria-label={showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    />
                    <span>Ingat saya di perangkat ini</span>
                  </label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full rounded-xl h-11 shadow-md shadow-primary/25 font-bold text-sm bg-primary hover:bg-primary/90 text-white transition-all hover:-translate-y-0.5 mt-2 cursor-pointer"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      <span>Memverifikasi Akun...</span>
                    </>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span>Masuk ke Dashboard</span>
                      <ArrowRight className="size-4" />
                    </span>
                  )}
                </Button>
              </form>

              {/* Switch to Register */}
              <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-600">
                <span>Belum memiliki akun bisnis?</span>
                <Link
                  to="/register"
                  className="ml-1.5 font-bold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
                >
                  <span>Daftar Gratis Sekarang</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Legal Notice */}
        <div className="text-center text-[11px] text-slate-400 py-2">
          Dilindungi oleh reCAPTCHA dan berlaku{" "}
          <Link to="/" className="underline hover:text-slate-600">
            Ketentuan Layanan
          </Link>{" "}
          &{" "}
          <Link to="/" className="underline hover:text-slate-600">
            Kebijakan Privasi
          </Link>
          .
        </div>
      </div>
    </div>
  )
}
