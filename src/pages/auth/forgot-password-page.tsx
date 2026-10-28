import { EkatraBrand } from "@/components/brand/ekatra-logo"
import { Link } from "react-router-dom"
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  ShieldCheck,
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
import { useForgotPassword } from "@/features/auth/hooks"
import { APP_NAME } from "@/lib/utils"

export default function ForgotPasswordPage() {
  const {
    email,
    setEmail,
    isSubmitting,
    isSuccess,
    errorMessage,
    handleSubmit,
    resetForm,
  } = useForgotPassword()

  return (
    <div className="brand-light-surface min-h-screen w-full flex items-center justify-center bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl border border-border bg-card">
        {/* Left Side: Branding */}
        <div className="hidden lg:flex flex-col justify-between p-10 bg-slate-900 text-slate-100 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Logo */}
          <div className="flex items-center gap-3 relative z-10">
            <EkatraBrand darkMode tagline className="text-xl" />
          </div>

          {/* Value Prop */}
          <div className="space-y-6 relative z-10 my-auto py-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
                Pemulihan Akun <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-emerald-400">
                  Cepat & Aman
                </span>
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Akses kembali akun bisnis Anda untuk memantau kalkulasi HPP, margin, dan stok inventaris multi-outlet.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Tautan reset berlaku 15 menit</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Enkripsi satu arah & keamanan sesi</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500 relative z-10">
            &copy; {new Date().getFullYear()} {APP_NAME}. Seluruh hak cipta dilindungi.
          </div>
        </div>

        {/* Right Side: Form / Success Card */}
        <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
          <Link to="/" aria-label={`${APP_NAME}, beranda`} className="mb-6 inline-flex min-h-11 items-center self-start rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden">
            <EkatraBrand className="text-base sm:text-lg" />
          </Link>
          {isSuccess ? (
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                <CheckCircle2 className="h-6 w-6" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight text-foreground">
                  Tautan Reset Telah Dikirim
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Jika alamat email <strong className="text-foreground">{email}</strong> terdaftar di sistem kami, kami telah mengirimkan tautan untuk mengatur ulang kata sandi.
                </p>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  Tautan ini hanya berlaku selama <strong>15 menit</strong>. Setelah digunakan atau kedaluwarsa, tautan tidak akan dapat dipakai kembali.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <Button
                  variant="outline"
                  className="w-full rounded-xl h-11 text-sm font-semibold"
                  onClick={resetForm}
                >
                  Kirim Ulang ke Email Lain
                </Button>
                <Button
                  asChild
                  className="w-full rounded-xl h-11 text-sm font-semibold"
                >
                  <Link to="/login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali ke Halaman Masuk
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-2xl font-bold tracking-tight">Lupa Kata Sandi?</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-1.5">
                  Masukkan email akun terdaftar Anda. Kami akan mengirimkan tautan reset kata sandi yang berlaku selama 15 menit.
                </CardDescription>
              </CardHeader>

              {errorMessage && (
                <div className="mb-6 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium leading-relaxed">{errorMessage}</p>
                </div>
              )}

              <p className="mb-4 text-sm text-foreground">Pakai akun staf dengan username? Minta pemilik toko mereset kata sandi dari menu Anggota Tim.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                      placeholder="nama@perusahaan.com"
                      autoComplete="email"
                      autoFocus
                      required
                      className="pl-9 rounded-xl h-10 text-sm"
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
                      Memproses...
                    </>
                  ) : (
                    <>
                      Kirim Tautan Reset
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
                  Kembali ke Masuk
                </Link>
              </CardFooter>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
