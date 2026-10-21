import { Link } from "react-router-dom"
import {
  Factory,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  ShieldAlert,
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
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator"
import { useResetPassword } from "@/features/auth/hooks"

export default function ResetPasswordPage() {
  const {
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
  } = useResetPassword()

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl border border-border bg-card">
        {/* Left Side: Branding */}
        <div className="hidden lg:flex flex-col justify-between p-10 bg-slate-900 text-slate-100 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

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
                Keamanan Akun <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-emerald-400">
                  Prioritas Utama
                </span>
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Buat kata sandi baru yang kuat untuk melindungi data resep, harga pokok penjualan, dan operasional toko Anda.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Tautan kedaluwarsa otomatis setelah dipakai</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <ShieldAlert className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Sesi aktif sebelumnya otomatis dihentikan</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500 relative z-10">
            &copy; {new Date().getFullYear()} HPP Tracker. Seluruh hak cipta dilindungi.
          </div>
        </div>

        {/* Right Side: Form / State Display */}
        <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
          {isValidating ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Memvalidasi Tautan Reset...</p>
                <p className="text-xs text-muted-foreground">Mohon tunggu sebentar selagi sistem memverifikasi token.</p>
              </div>
            </div>
          ) : !isTokenValid ? (
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
                <AlertCircle className="h-6 w-6" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight text-foreground">
                  Tautan Tidak Valid atau Kedaluwarsa
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {tokenError || "Tautan reset kata sandi telah kedaluwarsa (lebih dari 15 menit) atau sudah pernah digunakan sebelumnya."}
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <Button
                  asChild
                  className="w-full rounded-xl h-11 text-sm font-semibold"
                >
                  <Link to="/forgot-password">
                    Minta Tautan Reset Baru
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full rounded-xl h-11 text-sm font-semibold"
                >
                  <Link to="/login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali ke Halaman Masuk
                  </Link>
                </Button>
              </div>
            </div>
          ) : isSuccess ? (
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                <CheckCircle2 className="h-6 w-6" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight text-foreground">
                  Kata Sandi Berhasil Diperbarui
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Kata sandi baru Anda telah aktif. Seluruh sesi sebelumnya telah dinonaktifkan demi keamanan akun Anda.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  asChild
                  className="w-full rounded-xl h-11 text-sm font-semibold shadow-lg shadow-primary/25"
                >
                  <Link to="/login">
                    Masuk dengan Kata Sandi Baru
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <CardHeader className="p-0 mb-6">
                <div className="flex lg:hidden items-center gap-2 mb-6">
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                    <Factory className="h-5 w-5" />
                  </div>
                  <span className="font-extrabold text-lg tracking-tight text-foreground">HPP TRACKER</span>
                </div>

                <CardTitle className="text-2xl font-bold tracking-tight">Atur Kata Sandi Baru</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-1.5">
                  {userEmail
                    ? `Perbarui kata sandi untuk akun ${userEmail}.`
                    : "Masukkan kata sandi baru minimal 8 karakter."}
                </CardDescription>
              </CardHeader>

              {formError && (
                <div className="mb-6 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium leading-relaxed">{formError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                    Kata Sandi Baru
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 8 karakter"
                      autoFocus
                      required
                      className="pl-9 pr-9 rounded-xl h-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <PasswordStrengthIndicator password={password} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground">
                    Konfirmasi Kata Sandi Baru
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang kata sandi baru"
                      required
                      className="pl-9 pr-9 rounded-xl h-10 text-sm"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl h-11 text-sm font-semibold shadow-lg shadow-primary/25 mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      Simpan Kata Sandi Baru
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <CardFooter className="p-0 mt-6 flex justify-center">
                <Link
                  to="/login"
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Batal dan Kembali ke Masuk
                </Link>
              </CardFooter>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
