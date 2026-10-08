import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Factory,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  TrendingUp,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

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
        navigate("/dashboard")
      } else {
        navigate("/setup-store")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal masuk. Periksa kembali email dan kata sandi Anda."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl border border-border bg-card">
        {/* Left Side: Branding & Value Prop */}
        <div className="hidden lg:flex flex-col justify-between p-10 bg-slate-900 text-slate-100 relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Logo & Name */}
          <div className="flex items-center gap-3 relative z-10">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30">
              <Factory className="h-6 w-6" />
            </div>
            <div>
              <span className="font-black text-xl tracking-tight text-white block leading-none">HPP TRACKER</span>
              <span className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">SaaS Biaya & Inventaris UMKM</span>
            </div>
          </div>

          {/* Middle: Value Prop */}
          <div className="space-y-6 relative z-10 my-auto py-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
                Simple HPP, <br />
                <span className="text-primary">Accurate Profits.</span>
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Kendalikan harga pokok penjualan secara riil dengan kalkulasi FIFO otomatis, lacak pemakaian bahan resep, dan cegah boncos terselubung.
              </p>
            </div>

            {/* Benefit bullet points */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs text-slate-200">
                <div className="h-6 w-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <span>Pelacakan Batch Stok Bahan FIFO Akurat</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-200">
                <div className="h-6 w-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <span>Perhitungan HPP Dapur & Absorpsi Scrap / Waste</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-200">
                <div className="h-6 w-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span>Laporan Laba Rugi & Margin Produk Real-Time</span>
              </div>
            </div>
          </div>

          {/* Bottom Footer Quote */}
          <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 relative z-10">
            &copy; {new Date().getFullYear()} HPP Tracker Inc. Dirancang untuk efisiensi bisnis Anda.
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 sm:p-10 flex flex-col justify-center bg-card">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <Factory className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight">HPP TRACKER</span>
          </div>

          <CardHeader className="p-0 pb-6">
            <CardTitle className="text-2xl font-bold text-foreground tracking-tight">
              Selamat Datang Kembali
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Masukkan kredensial akun Anda untuk mengakses dashboard dan operasional toko.
            </CardDescription>
          </CardHeader>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-destructive/10 text-destructive text-xs font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                Alamat Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@tokoroti.com"
                  className="pl-9 rounded-xl h-10 text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                  Kata Sandi
                </Label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault()
                    alert("Tautan reset kata sandi telah dikirimkan ke email Anda.")
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  Lupa kata sandi?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 pr-9 rounded-xl h-10 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                />
                <span>Ingat saya di perangkat ini</span>
              </label>
            </div>

            <Button type="submit" className="w-full rounded-xl h-10 shadow-sm font-semibold" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Masuk ke Akun
            </Button>
          </form>

          <CardFooter className="p-0 pt-6 flex justify-center text-xs text-muted-foreground">
            <span>Belum memiliki akun?</span>
            <Link to="/register" className="ml-1 text-primary font-semibold hover:underline flex items-center">
              Daftar Sekarang <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardFooter>
        </div>
      </div>
    </div>
  )
}
