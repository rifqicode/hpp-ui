import * as React from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import {
  Factory,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Store,
  MapPin,
  Phone,
  Building2,
  Check,
  ShieldCheck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { authService } from "@/features/auth/services/auth-service"
import { settingsService } from "@/features/settings/services/settings-service"
import { useAuthStore } from "@/store/use-auth-store"

const STORE_CATEGORIES = [
  "Bakery & Pastry",
  "Cafe & Coffee Shop",
  "Restoran & Rumah Makan",
  "Cloud Kitchen / Produksi",
  "Minuman & Boba",
  "Catering & Jasa Boga",
  "Pizzaria & Fast Food",
  "Lainnya",
]

interface RegisterPageProps {
  initialStep?: 1 | 2
}

export default function RegisterPage({ initialStep }: RegisterPageProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const setAuth = useAuthStore((state) => state.setAuth)
  const setActiveStoreId = useAuthStore((state) => state.setActiveStoreId)
  const logout = useAuthStore((state) => state.logout)

  // Determine starting step: if on /setup-store or user already has token, start at step 2
  const isSetupStoreRoute = location.pathname === "/setup-store" || initialStep === 2
  const [step, setStep] = React.useState<number>(isSetupStoreRoute || (token && user) ? 2 : 1)

  // Step 1: Account State
  const [name, setName] = React.useState<string>(user?.name || "")
  const [email, setEmail] = React.useState<string>(user?.email || "")
  const [password, setPassword] = React.useState<string>("")
  const [confirmPassword, setConfirmPassword] = React.useState<string>("")
  const [showPassword, setShowPassword] = React.useState<boolean>(false)
  const [agreeTerms, setAgreeTerms] = React.useState<boolean>(true)

  // Step 2: Store State
  const [storeName, setStoreName] = React.useState<string>("")
  const [category, setCategory] = React.useState<string>("Bakery & Pastry")
  const [storeLocation, setStoreLocation] = React.useState<string>("")
  const [phone, setPhone] = React.useState<string>("")
  const [description, setDescription] = React.useState<string>("")

  // Loading & Error State
  const [loading, setLoading] = React.useState<boolean>(false)
  const [error, setError] = React.useState<string>("")

  // Check if authenticated user already has stores; if so, redirect to dashboard
  React.useEffect(() => {
    async function checkExistingStores() {
      if (token) {
        try {
          const stores = await settingsService.getStoresList()
          if (stores && stores.length > 0) {
            navigate("/dashboard", { replace: true })
          }
        } catch {
          // Stay on setup
        }
      }
    }
    if (isSetupStoreRoute || token) {
      checkExistingStores()
    }
  }, [token, isSetupStoreRoute, navigate])

  // Submit Step 1: Register Account
  async function handleRegisterAccount(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !password) {
      setError("Nama lengkap, email, dan kata sandi wajib diisi.")
      return
    }

    if (password.length < 6) {
      setError("Kata sandi minimal 6 karakter.")
      return
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.")
      return
    }

    if (!agreeTerms) {
      setError("Anda harus menyetujui Ketentuan Layanan & Kebijakan Privasi.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await authService.register({ name, email, password })
      setAuth(res.user, res.token)
      setStep(2)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Pendaftaran gagal. Silakan coba kembali."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // Submit Step 2: Create First Store
  async function handleCreateStore(e: React.FormEvent) {
    e.preventDefault()
    if (!storeName.trim()) {
      setError("Nama toko atau unit usaha wajib diisi.")
      return
    }

    if (!storeLocation.trim()) {
      setError("Lokasi atau alamat toko wajib diisi.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const newStore = await settingsService.createStore({
        name: storeName.trim(),
        category,
        location: storeLocation.trim(),
        phone: phone.trim(),
        description: description.trim(),
      })

      setActiveStoreId(newStore.id)
      setStep(3)

      // Auto redirect to dashboard after 1.5 seconds celebration
      setTimeout(() => {
        navigate("/dashboard", { replace: true })
      }, 1500)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan data toko. Silakan coba kembali."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl border border-border bg-card">
        {/* Left Side: Branding & Interactive Onboarding Progress */}
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
              <span className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">Onboarding Bisnis F&B</span>
            </div>
          </div>

          {/* Middle: Step Guidance & Value Props */}
          <div className="space-y-6 relative z-10 my-auto py-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
                {step === 1 && (
                  <>
                    Mulai Efisiensi, <br />
                    <span className="text-primary">Kunci Margin Usaha.</span>
                  </>
                )}
                {step === 2 && (
                  <>
                    Satu Langkah Lagi, <br />
                    <span className="text-primary">Profil Usaha Anda.</span>
                  </>
                )}
                {step === 3 && (
                  <>
                    Semua Siap, <br />
                    <span className="text-emerald-400">Selamat Datang!</span>
                  </>
                )}
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                {step === 1 && "Daftarkan akun pengelola untuk mengaktifkan sistem kalkulasi HPP, resep digital, dan pelacakan batch stok."}
                {step === 2 && "Setup gerai pertama Anda untuk memetakan inventaris bahan mentah, resep produk, dan pencatatan transaksi."}
                {step === 3 && "Ruang kerja bisnis F&B Anda berhasil dikonfigurasi. Mengalihkan ke dashboard..."}
              </p>
            </div>

            {/* Stepper Visualizer on Sidebar */}
            <div className="space-y-4 pt-2">
              {/* Step 1 Visual Item */}
              <div className="flex items-start gap-3">
                <div
                  className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                    step > 1
                      ? "bg-emerald-500 text-white"
                      : step === 1
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                      : "bg-slate-800 text-slate-500"
                  }`}
                >
                  {step > 1 ? <Check className="h-4 w-4" /> : "1"}
                </div>
                <div>
                  <p className={`text-xs font-semibold ${step >= 1 ? "text-white" : "text-slate-400"}`}>
                    Akun Pengelola Bisnis
                  </p>
                  <p className="text-[11px] text-slate-400">Kredensial akses & keamanan akun owner</p>
                </div>
              </div>

              {/* Connecting line */}
              <div className="w-0.5 h-4 bg-slate-800 ml-3.5" />

              {/* Step 2 Visual Item */}
              <div className="flex items-start gap-3">
                <div
                  className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                    step === 3
                      ? "bg-emerald-500 text-white"
                      : step === 2
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/30 ring-2 ring-primary/40"
                      : "bg-slate-800 text-slate-500"
                  }`}
                >
                  {step === 3 ? <Check className="h-4 w-4" /> : "2"}
                </div>
                <div>
                  <p className={`text-xs font-semibold ${step >= 2 ? "text-white" : "text-slate-400"}`}>
                    Setup Profil Toko Pertama
                  </p>
                  <p className="text-[11px] text-slate-400">Nama toko, kategori, dan alamat gerai utama</p>
                </div>
              </div>
            </div>

            {/* Extra assurance bullet */}
            <div className="pt-4 border-t border-slate-800/80 flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Data aman terenkripsi & siap multi-cabang</span>
            </div>
          </div>

          {/* Bottom Footer Quote */}
          <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 relative z-10">
            &copy; {new Date().getFullYear()} HPP Tracker. Solusi terpercaya operasional F&B UMKM.
          </div>
        </div>

        {/* Right Side: Step Wizard Form */}
        <div className="p-8 sm:p-10 flex flex-col justify-center bg-card">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center gap-2.5 mb-6">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <Factory className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight">HPP TRACKER</span>
          </div>

          {/* Progress Step Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-2">
              <span className={step === 1 ? "text-primary font-bold" : step > 1 ? "text-foreground" : ""}>
                1. Akun Pengelola
              </span>
              <span className={step === 2 ? "text-primary font-bold" : step === 3 ? "text-foreground" : ""}>
                2. Setup Data Toko
              </span>
              <span className={step === 3 ? "text-emerald-500 font-bold" : ""}>
                3. Selesai
              </span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 rounded-full"
                style={{
                  width: step === 1 ? "35%" : step === 2 ? "80%" : "100%",
                }}
              />
            </div>
          </div>

          {/* Error Message Box */}
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-destructive/10 text-destructive text-xs font-medium flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ================= STEP 1: ACCOUNT REGISTRATION ================= */}
          {step === 1 && (
            <div className="space-y-4">
              <CardHeader className="p-0 pb-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary w-fit mb-1">
                  <User className="h-3 w-3" /> Langkah 1 dari 2
                </div>
                <CardTitle className="text-2xl font-bold text-foreground tracking-tight">
                  Buat Akun Bisnis Baru
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-1">
                  Daftarkan akun pengelola untuk memulai kontrol operasional dan HPP bisnis Anda.
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleRegisterAccount} className="space-y-3.5">
                <div className="space-y-1">
                  <Label htmlFor="reg-name" className="text-xs font-semibold text-foreground">
                    Nama Lengkap <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: Budi Santoso"
                      className="pl-9 rounded-xl h-10 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="reg-email" className="text-xs font-semibold text-foreground">
                    Alamat Email Bisnis <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="budi@tokoroti.com"
                      className="pl-9 rounded-xl h-10 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="reg-password" className="text-xs font-semibold text-foreground">
                    Kata Sandi <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
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

                <div className="space-y-1">
                  <Label htmlFor="reg-confirm" className="text-xs font-semibold text-foreground">
                    Konfirmasi Kata Sandi <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-confirm"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi"
                      className="pl-9 rounded-xl h-10 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                  />
                  <label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer leading-tight">
                    Saya menyetujui <span className="text-primary hover:underline">Ketentuan Layanan</span> dan{" "}
                    <span className="text-primary hover:underline">Kebijakan Privasi</span>.
                  </label>
                </div>

                <Button type="submit" className="w-full rounded-xl h-10 shadow-sm mt-3 font-semibold" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mendaftarkan Akun...
                    </>
                  ) : (
                    <>
                      Lanjut ke Setup Toko
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <CardFooter className="p-0 pt-4 flex justify-center text-xs text-muted-foreground">
                <span>Sudah memiliki akun?</span>
                <Link to="/login" className="ml-1 text-primary font-semibold hover:underline flex items-center">
                  Masuk Sekarang <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </CardFooter>
            </div>
          )}

          {/* ================= STEP 2: STORE SETUP ================= */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <CardHeader className="p-0 pb-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit mb-1">
                  <Store className="h-3 w-3" /> Langkah 2 dari 2: Setup Usaha
                </div>
                <CardTitle className="text-2xl font-bold text-foreground tracking-tight">
                  Setup Toko / Usaha Pertama
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-1">
                  {name ? `Halo ${name.split(" ")[0]}! ` : ""}
                  Lengkapi profil toko atau dapur produksi pertama Anda untuk mulai mengelola stok & HPP.
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleCreateStore} className="space-y-3.5">
                <div className="space-y-1">
                  <Label htmlFor="store-name" className="text-xs font-semibold text-foreground">
                    Nama Toko / Bisnis <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="store-name"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="Contoh: Dapur Roti Senopati, Kopi Senja, dll."
                      className="pl-9 rounded-xl h-10 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="store-category" className="text-xs font-semibold text-foreground">
                    Kategori Bisnis <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <select
                      id="store-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full pl-9 pr-3 rounded-xl h-10 text-sm border border-input bg-background text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {STORE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="store-location" className="text-xs font-semibold text-foreground">
                    Alamat / Lokasi Operasional <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="store-location"
                      value={storeLocation}
                      onChange={(e) => setStoreLocation(e.target.value)}
                      placeholder="Contoh: Jl. Senopati No. 45, Jakarta Selatan"
                      className="pl-9 rounded-xl h-10 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="store-phone" className="text-xs font-semibold text-foreground">
                      No. Kontak / WhatsApp
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="store-phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0812-3456-7890"
                        className="pl-9 rounded-xl h-10 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="store-currency" className="text-xs font-semibold text-foreground">
                      Mata Uang Utama
                    </Label>
                    <Input
                      id="store-currency"
                      value="IDR (Rupiah Indonesia)"
                      disabled
                      className="rounded-xl h-10 text-sm bg-muted/50 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="store-desc" className="text-xs font-semibold text-foreground">
                    Deskripsi Singkat Usaha <span className="text-muted-foreground text-[10px]">(Opsional)</span>
                  </Label>
                  <Textarea
                    id="store-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Contoh: Dapur produksi kue artisan dan bakery fresh harian untuk cafe dan takeaway."
                    rows={2}
                    className="rounded-xl text-sm"
                  />
                </div>

                {/* Info Callout */}
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground flex items-start gap-2.5">
                  <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    Toko ini akan otomatis diset sebagai <strong className="text-foreground">Toko Utama</strong>. Anda dapat menambah cabang atau staf lain kapan saja di menu Pengaturan.
                  </span>
                </div>

                <Button type="submit" className="w-full rounded-xl h-10 shadow-sm mt-3 font-semibold" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyiapkan Toko Anda...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Selesaikan & Buka Dashboard
                    </>
                  )}
                </Button>
              </form>

              {/* Option to logout if arrived here accidentally */}
              <div className="pt-2 flex justify-between items-center text-xs text-muted-foreground">
                <span className="truncate max-w-[200px]">Akun: {email || user?.email}</span>
                <button
                  type="button"
                  onClick={() => {
                    logout()
                    setStep(1)
                  }}
                  className="text-muted-foreground hover:text-destructive underline text-xs"
                >
                  Ganti Akun
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: CELEBRATION / SUCCESS ================= */}
          {step === 3 && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95 duration-500">
              <div className="h-16 w-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/10 ring-8 ring-emerald-500/5">
                <CheckCircle2 className="h-10 w-10 animate-bounce" />
              </div>
              <div className="space-y-1 max-w-xs">
                <h3 className="text-xl font-bold text-foreground">Toko Berhasil Disiapkan!</h3>
                <p className="text-xs text-muted-foreground">
                  Selamat datang di <strong className="text-foreground">HPP Tracker</strong>. Sistem sedang mengalihkan Anda ke dashboard kerja...
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-primary font-medium pt-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Membuka Dashboard...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
