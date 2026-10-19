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
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authService } from "@/features/auth/services/auth-service"
import { settingsService } from "@/features/settings/services/settings-service"
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

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError("Email dan kata sandi wajib diisi")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await authService.login({ email, password })
      setAuth(res.user, res.token)

      const stores = await settingsService.getStoresList()
      if (stores && stores.length > 0) {
        useAuthStore.getState().setActiveStoreId(stores[0].id)
        useAuthStore.getState().setActiveStoreName(stores[0].name)
        navigate("/dashboard")
      } else {
        navigate("/setup-store")
      }
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
          : "Gagal masuk. Periksa kembali email dan kata sandi Anda."
      if (msg.toLowerCase() === "unauthorized") {
        msg = "Email atau kata sandi salah. Silakan coba lagi."
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 lg:bg-white grid lg:grid-cols-12">
      {/* Desktop brand panel */}
      <aside className="relative hidden overflow-hidden border-r border-slate-800 bg-slate-950 p-10 text-white lg:col-span-4 lg:flex lg:flex-col xl:p-12">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 size-96 rounded-full bg-primary/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-20 size-96 rounded-full bg-violet-600/15 blur-3xl" />

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center py-12 text-center">
          <Link to="/" aria-label="HPP Tracker — Beranda" className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-950">
            <Factory aria-hidden="true" className="size-6" />
          </Link>
          <h2 className="text-3xl font-extrabold tracking-tight text-white xl:text-4xl">HPP TRACKER</h2>
          <p className="mt-4 text-base leading-relaxed text-slate-400">
            Biaya lebih jelas.<br />Usaha lebih terarah.
          </p>
        </div>

        <p className="relative z-10 text-center text-xs text-slate-500">&copy; {new Date().getFullYear()} HPP Tracker</p>
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
                HPP TRACKER
              </span>
            </Link>
          </div>

          <div className="ml-auto">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-primary transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="size-4" />
              <span>Kembali ke Beranda</span>
            </Link>
          </div>
        </div>

        {/* Centered Form Body */}
        <div className="max-w-lg w-full mx-auto my-auto py-6">
          <div className="mb-8">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-primary text-xs font-semibold mb-2">
              <span>Masuk ke Ruang Kerja</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Selamat Datang Kembali
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
              Masukkan email dan kata sandi Anda untuk mengakses dashboard finansial toko.
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
