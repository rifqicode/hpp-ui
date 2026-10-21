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
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Store,
  MapPin,
  Phone,
  Check,
  Coffee,
  UtensilsCrossed,
  Utensils,
  CupSoda,
  ChefHat,
  Pizza,
  HelpCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  PasswordStrengthIndicator,
  validatePassword,
} from "@/components/ui/password-strength-indicator"
import { cn } from "@/lib/utils"

import { authService } from "@/features/auth/services/auth-service"
import { settingsService } from "@/features/settings/services/settings-service"
import { useAuthStore } from "@/store/use-auth-store"

interface StoreCategoryOption {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  desc: string
}

const STORE_CATEGORIES: StoreCategoryOption[] = [
  {
    id: "cafe",
    name: "Cafe & Coffee Shop",
    icon: Coffee,
    desc: "Kopi, minuman, snack",
  },
  {
    id: "bakery",
    name: "Bakery & Pastry",
    icon: UtensilsCrossed,
    desc: "Roti, kue, cookies",
  },
  {
    id: "restaurant",
    name: "Restoran & Rumah Makan",
    icon: Utensils,
    desc: "Dine-in, masakan lauk",
  },
  {
    id: "cloud_kitchen",
    name: "Cloud Kitchen / Produksi",
    icon: Factory,
    desc: "Delivery & produksi batch",
  },
  {
    id: "beverage",
    name: "Minuman & Boba",
    icon: CupSoda,
    desc: "Boba, teh kekinian, jus",
  },
  {
    id: "catering",
    name: "Catering & Jasa Boga",
    icon: ChefHat,
    desc: "Prasmanan, nasi kotak",
  },
  {
    id: "fastfood",
    name: "Fast Food & Snack",
    icon: Pizza,
    desc: "Burger, gorengan, pizza",
  },
  {
    id: "retail",
    name: "Retail & Toko Kelontong",
    icon: Store,
    desc: "Toko kelontong, retail F&B",
  },
  {
    id: "other",
    name: "Other",
    icon: HelpCircle,
    desc: "Kategori bisnis lainnya",
  },
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
  const isSetupStoreRoute =
    location.pathname === "/setup-store" || initialStep === 2
  const [step, setStep] = React.useState<number>(
    isSetupStoreRoute || (token && user) ? 2 : 1
  )

  // Track tier parameter from query string (e.g. ?tier=GROWTH)
  const searchParams = new URLSearchParams(location.search)
  const tierParam = searchParams.get("tier")

  React.useEffect(() => {
    if (tierParam && (tierParam === "GROWTH" || tierParam === "MAX_GROWTH")) {
      sessionStorage.setItem("pending_upgrade_tier", tierParam)
      localStorage.setItem("pending_upgrade_tier", tierParam)
    }
  }, [tierParam])

  // Step 1: Account State
  const [name, setName] = React.useState<string>(user?.name || "")
  const [email, setEmail] = React.useState<string>(user?.email || "")
  const [password, setPassword] = React.useState<string>("")
  const [confirmPassword, setConfirmPassword] = React.useState<string>("")
  const [showPassword, setShowPassword] = React.useState<boolean>(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState<boolean>(false)
  const [agreeTerms, setAgreeTerms] = React.useState<boolean>(false)

  // Step 2: Store State
  const [storeName, setStoreName] = React.useState<string>("")
  const [category, setCategory] = React.useState<string>("Cafe & Coffee Shop")
  const [customCategory, setCustomCategory] = React.useState<string>("")
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

  // Step 1: Validate Account and go to Step 2 (client-side only)
  async function handleContinueToStore(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !password) {
      setError("Nama lengkap, email bisnis, dan kata sandi wajib diisi.")
      return
    }

    const passErr = validatePassword(password)
    if (passErr) {
      setError(passErr)
      return
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok dengan kata sandi.")
      return
    }

    if (!agreeTerms) {
      setError("Anda harus menyetujui Ketentuan Layanan & Kebijakan Privasi.")
      return
    }

    setError("")
    setStep(2)
  }

  // Step 2: Submit Bulk Registration or Create First Store
  async function handleSubmitRegistration(e: React.FormEvent) {
    e.preventDefault()
    if (!storeName.trim()) {
      setError("Nama toko atau unit usaha wajib diisi.")
      return
    }

    if (!category) {
      setError("Kategori bisnis wajib dipilih.")
      return
    }

    const finalCategory =
      category === "Other" && customCategory.trim()
        ? customCategory.trim()
        : category

    if (!finalCategory) {
      setError("Kategori bisnis wajib dipilih.")
      return
    }

    if (!storeLocation.trim()) {
      setError("Kota atau lokasi gerai utama wajib diisi.")
      return
    }

    if (phone.trim()) {
      const clean = phone.trim().replace(/[\s-]/g, "")
      if (!/^(\+62|62|0)8[0-9]{8,12}$/.test(clean)) {
        setError(
          "Format nomor WhatsApp tidak valid. Masukkan nomor yang valid (contoh: 08123456789 atau +628123456789)."
        )
        return
      }
    }

    setLoading(true)
    setError("")

    // Scenario A: User is already logged in on /setup-store
    if (isSetupStoreRoute && token) {
      try {
        const newStore = await settingsService.createStore({
          name: storeName.trim(),
          category: finalCategory,
          location: storeLocation.trim(),
          phone: phone.trim(),
          description: description.trim(),
        })

        setActiveStoreId(newStore.id)
        setStep(3)
        setTimeout(() => {
          navigate("/dashboard", { replace: true })
        }, 1500)
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "Gagal menyimpan data toko. Silakan coba kembali."
        setError(msg)
      } finally {
        setLoading(false)
      }
      return
    }

    // Scenario B: Bulk registration (User + Store)
    try {
      const res = await authService.register({
        name: name.trim(),
        email: email.trim(),
        password,
        store: {
          name: storeName.trim(),
          category: finalCategory,
          location: storeLocation.trim(),
          address: storeLocation.trim(),
          phone: phone.trim(),
          description: description.trim(),
        },
      })

      if (res.requires_verification || !res.token) {
        navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`, {
          replace: true,
          state: {
            email: email.trim(),
            message: "Pendaftaran berhasil! Silakan periksa email Anda dan masukkan 6 digit kode verifikasi.",
          },
        })
        return
      }

      setAuth(res.user, res.token)
      if (res.active_store_id) {
        setActiveStoreId(res.active_store_id)
      } else if (res.store?.id) {
        setActiveStoreId(res.store.id)
      }

      setStep(3)
      setTimeout(() => {
        navigate("/dashboard", { replace: true })
      }, 1500)
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Pendaftaran gagal. Silakan coba kembali."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full min-w-0 bg-slate-50 lg:bg-white grid lg:grid-cols-12">
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
      {/* RIGHT PANEL: Multi-Step Interactive Form Canvas (7 cols) */}
      {/* ======================================================== */}
      <div className="col-span-12 lg:col-span-8 flex flex-col justify-between w-full min-w-0 p-4 sm:p-10 lg:p-14 bg-white min-h-screen">
        {/* Top Bar: Back to Home & Mobile Header */}
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
        <div className="max-w-lg w-full mx-auto my-auto py-4">
          {/* ======================================================== */}
          {/* INTERACTIVE 3-STEP WIZARD PROGRESS BAR                   */}
          {/* ======================================================== */}
          <div className="mb-8">
            <div className="relative flex items-center justify-between">
              {/* Progress Connector Track */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full -z-0">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: step === 1 ? "25%" : step === 2 ? "65%" : "100%",
                  }}
                />
              </div>

              {/* Step 1 Indicator */}
              <div className="flex flex-col items-center relative z-10 bg-white px-2">
                <button
                  type="button"
                  onClick={() => step > 1 && setStep(1)}
                  disabled={step === 3 || loading}
                  className={cn(
                    "size-9 rounded-full flex items-center justify-center font-bold text-xs transition-all",
                    step > 1
                      ? "bg-emerald-500 text-white shadow-xs cursor-pointer"
                      : step === 1
                      ? "bg-primary text-white shadow-md shadow-primary/30 ring-4 ring-indigo-50 font-extrabold"
                      : "bg-slate-100 text-slate-400 border border-slate-200"
                  )}
                >
                  {step > 1 ? <Check className="size-4" /> : <User className="size-4" />}
                </button>
                <span
                  className={cn(
                    "text-[11px] mt-1.5 font-semibold transition-colors",
                    step === 1 ? "text-primary font-bold" : step > 1 ? "text-slate-800" : "text-slate-400"
                  )}
                >
                  Akun
                </span>
              </div>

              {/* Step 2 Indicator */}
              <div className="flex flex-col items-center relative z-10 bg-white px-2">
                <div
                  className={cn(
                    "size-9 rounded-full flex items-center justify-center font-bold text-xs transition-all",
                    step > 2
                      ? "bg-emerald-500 text-white shadow-xs"
                      : step === 2
                      ? "bg-primary text-white shadow-md shadow-primary/30 ring-4 ring-indigo-50 font-extrabold"
                      : "bg-slate-100 text-slate-400 border border-slate-200"
                  )}
                >
                  {step > 2 ? <Check className="size-4" /> : <Store className="size-4" />}
                </div>
                <span
                  className={cn(
                    "text-[11px] mt-1.5 font-semibold transition-colors",
                    step === 2 ? "text-primary font-bold" : step > 2 ? "text-slate-800" : "text-slate-400"
                  )}
                >
                  Profil Toko
                </span>
              </div>

              {/* Step 3 Indicator */}
              <div className="flex flex-col items-center relative z-10 bg-white px-2">
                <div
                  className={cn(
                    "size-9 rounded-full flex items-center justify-center font-bold text-xs transition-all",
                    step === 3
                      ? "bg-emerald-500 text-white shadow-md ring-4 ring-emerald-50 font-extrabold"
                      : "bg-slate-100 text-slate-400 border border-slate-200"
                  )}
                >
                  <CheckCircle2 className="size-4" />
                </div>
                <span
                  className={cn(
                    "text-[11px] mt-1.5 font-semibold transition-colors",
                    step === 3 ? "text-emerald-600 font-bold" : "text-slate-400"
                  )}
                >
                  Selesai
                </span>
              </div>
            </div>
          </div>

          {/* Error Alert Box */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1">
                <span className="font-bold block">Pemberitahuan</span>
                <span className="text-rose-600 text-xs">{error}</span>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 1: AKUN PENGELOLA FORM                              */}
          {/* ======================================================== */}
          {step === 1 && (
            <div className="animate-in fade-in duration-300">
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  Buat Akun Bisnis Baru
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Lengkapi data diri Anda sebagai pengelola utama sistem dapur.
                </p>
              </div>

              <form onSubmit={handleContinueToStore} noValidate className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="fullname" className="text-xs font-bold text-slate-700">
                    Nama Lengkap Pemilik / Pengelola <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input
                      id="fullname"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: Budi Santoso"
                      className="pl-10 rounded-xl h-11 text-sm bg-slate-50/50 border-slate-200 focus-visible:bg-white focus-visible:ring-primary"
                      required
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-bold text-slate-700">
                    Alamat Email Bisnis <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="budi@tokoroti.com"
                      className="pl-10 rounded-xl h-11 text-sm bg-slate-50/50 border-slate-200 focus-visible:bg-white focus-visible:ring-primary"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-bold text-slate-700">
                    Kata Sandi <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="pl-10 pr-10 rounded-xl h-11 text-sm bg-slate-50/50 border-slate-200 focus-visible:bg-white focus-visible:ring-primary"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>

                  <PasswordStrengthIndicator password={password} />
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className="text-xs font-bold text-slate-700">
                    Konfirmasi Kata Sandi <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang kata sandi"
                      className="pl-10 pr-10 rounded-xl h-11 text-sm bg-slate-50/50 border-slate-200 focus-visible:bg-white focus-visible:ring-primary"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Agree to terms */}
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 select-none">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 mt-0.5 cursor-pointer"
                    />
                    <span className="leading-relaxed">
                      Saya menyetujui{" "}
                      <Link to="/" className="text-primary font-semibold hover:underline">
                        Ketentuan Layanan
                      </Link>{" "}
                      dan{" "}
                      <Link to="/" className="text-primary font-semibold hover:underline">
                        Kebijakan Privasi
                      </Link>{" "}
                      HPP Tracker.
                    </span>
                  </label>
                </div>

                {/* Next Step Button */}
                <Button
                  type="submit"
                  className="w-full rounded-xl h-11 shadow-md shadow-primary/25 font-bold text-sm bg-primary hover:bg-primary/90 text-white transition-all hover:-translate-y-0.5 mt-2 cursor-pointer"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span>Lanjut ke Profil Toko</span>
                    <ArrowRight className="size-4" />
                  </span>
                </Button>
              </form>

              {/* Switch to Login */}
              <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-600">
                <span>Sudah memiliki akun pengelola?</span>
                <Link
                  to="/login"
                  className="ml-1.5 font-bold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
                >
                  <span>Masuk Sekarang</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 2: SETUP PROFIL TOKO PERTAMA FORM                   */}
          {/* ======================================================== */}
          {step === 2 && (
            <div className="animate-in fade-in duration-300">
              <div className="mb-5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  Setup Profil Toko Pertama
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Pilih kategori bisnis dan nama gerai untuk memetakan inventaris Anda.
                </p>
              </div>

              <form onSubmit={handleSubmitRegistration} noValidate className="space-y-4">
                {/* Category Grid Chips */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 block">
                    Kategori Bisnis Utama <span className="text-rose-500">*</span>
                  </Label>
                  <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                    {STORE_CATEGORIES.map((cat) => {
                      const Icon = cat.icon
                      const isSelected = category === cat.name
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.name)}
                          className={cn(
                            "p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5",
                            isSelected
                              ? "border-primary bg-indigo-50/80 text-primary shadow-xs ring-2 ring-primary/20"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                          )}
                        >
                          <div
                            className={cn(
                              "size-7 rounded-lg flex items-center justify-center shrink-0",
                              isSelected
                                ? "bg-primary text-white"
                                : "bg-slate-100 text-slate-600"
                            )}
                          >
                            <Icon className="size-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold block truncate">
                              {cat.name}
                            </span>
                            <span className="text-[10px] text-slate-500 block truncate">
                              {cat.desc}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {category === "Other" && (
                    <div className="pt-1.5 space-y-1.5 animate-in fade-in-50 slide-in-from-top-1 duration-200">
                      <Label htmlFor="custom-category" className="text-xs font-bold text-slate-700">
                        Spesifikasi Kategori (Opsional)
                      </Label>
                      <Input
                        id="custom-category"
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="Contoh: Distributor, Florist, Pet Shop, dll."
                        className="rounded-xl h-10 text-sm bg-slate-50/50 border-slate-200 focus-visible:bg-white focus-visible:ring-primary"
                      />
                    </div>
                  )}
                </div>

                {/* Store Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="store-name" className="text-xs font-bold text-slate-700">
                    Nama Toko / Unit Usaha <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input
                      id="store-name"
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="Contoh: Dapur Roti Senopati"
                      className="pl-10 rounded-xl h-11 text-sm bg-slate-50/50 border-slate-200 focus-visible:bg-white focus-visible:ring-primary"
                      required
                    />
                  </div>
                </div>

                {/* Store Location */}
                <div className="space-y-1.5">
                  <Label htmlFor="store-loc" className="text-xs font-bold text-slate-700">
                    Kota / Alamat Gerai <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input
                      id="store-loc"
                      type="text"
                      value={storeLocation}
                      onChange={(e) => setStoreLocation(e.target.value)}
                      placeholder="Contoh: Jakarta Selatan atau Jl. Senopati No. 12"
                      className="pl-10 rounded-xl h-11 text-sm bg-slate-50/50 border-slate-200 focus-visible:bg-white focus-visible:ring-primary"
                      required
                    />
                  </div>
                </div>

                {/* WhatsApp Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="store-phone" className="text-xs font-bold text-slate-700">
                    No. WhatsApp Operasional <span className="text-slate-400 font-normal text-[11px]">(Opsional)</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input
                      id="store-phone"
                      type="tel"
                      inputMode="tel"
                      maxLength={16}
                      value={phone}
                      onChange={(e) => {
                        const sanitized = e.target.value.replace(/[^0-9+\s-]/g, "")
                        setPhone(sanitized)
                      }}
                      placeholder="Contoh: 0812-3456-7890"
                      className="pl-10 rounded-xl h-11 text-sm bg-slate-50/50 border-slate-200 focus-visible:bg-white focus-visible:ring-primary"
                    />
                  </div>
                </div>

                {/* Currency Standard Badge */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Mata Uang Finansial:</span>
                  <Badge variant="outline" className="bg-white text-primary border-indigo-200 font-bold">
                    IDR (Rp) - Format Rupiah
                  </Badge>
                </div>

                {/* Store Description (Optional) */}
                <div className="space-y-1.5">
                  <Label htmlFor="store-desc" className="text-xs font-bold text-slate-700">
                    Catatan Singkat Usaha <span className="text-slate-400 font-normal text-[11px]">(Opsional)</span>
                  </Label>
                  <Textarea
                    id="store-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Contoh: Produksi harian kue artisan dan bakery fresh untuk cafe & takeaway."
                    rows={2}
                    className="rounded-xl text-xs bg-slate-50/50 border-slate-200"
                  />
                </div>

                {/* Action Buttons: Back & Complete */}
                <div className="flex items-center gap-3 pt-2">
                  {!isSetupStoreRoute && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setError("")
                        setStep(1)
                      }}
                      className="rounded-xl h-11 font-semibold border-slate-200 hover:bg-slate-50 px-4 cursor-pointer"
                      disabled={loading}
                    >
                      <ArrowLeft className="mr-1.5 size-4" />
                      <span>Kembali</span>
                    </Button>
                  )}

                  <Button
                    type="submit"
                    className="flex-1 rounded-xl h-11 shadow-md shadow-primary/25 font-bold text-sm bg-primary hover:bg-primary/90 text-white transition-all hover:-translate-y-0.5 cursor-pointer"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        <span>Mendaftarkan Usaha...</span>
                      </>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Sparkles className="size-4" />
                        <span>Selesaikan Pendaftaran</span>
                      </span>
                    )}
                  </Button>
                </div>
              </form>

              {/* Option to logout if arrived here via /setup-store */}
              {isSetupStoreRoute && (
                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                  <span className="truncate max-w-[200px]">Akun aktif: {email || user?.email}</span>
                  <button
                    type="button"
                    onClick={() => {
                      logout()
                      setStep(1)
                    }}
                    className="text-slate-500 hover:text-rose-600 underline text-xs cursor-pointer"
                  >
                    Ganti Akun
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 3: ONBOARDING SUCCESS & CELEBRATION                 */}
          {/* ======================================================== */}
          {step === 3 && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95 duration-500">
              <div className="relative">
                <div className="size-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/10 ring-8 ring-emerald-50 border border-emerald-200">
                  <CheckCircle2 className="size-10 animate-bounce" />
                </div>
              </div>

              <div className="space-y-2 max-w-sm">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Ruang Kerja Anda Telah Siap!
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Selamat datang di <strong className="text-slate-900">HPP Tracker</strong>. Gerai{" "}
                  <strong className="text-primary font-bold">{storeName || "Toko Baru"}</strong> telah berhasil dibuat dan siap digunakan.
                </p>
              </div>

              {/* Ready Checklist */}
              <div className="w-full max-w-xs rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2 text-left text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-emerald-600 shrink-0" />
                  <span>Akun Pengelola Terverifikasi</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-emerald-600 shrink-0" />
                  <span>Database Toko & Gudang Siap</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-emerald-600 shrink-0" />
                  <span>Modul HPP & FIFO/FEFO Diaktifkan</span>
                </div>
              </div>

              <div className="space-y-3 w-full max-w-xs pt-2">
                <div className="flex items-center justify-center gap-2 text-xs text-primary font-semibold">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Membuka Dashboard Kerja...</span>
                </div>

                <Button
                  onClick={() => navigate("/dashboard", { replace: true })}
                  className="w-full rounded-xl h-10 font-bold bg-primary hover:bg-primary/90 text-white cursor-pointer"
                >
                  Masuk ke Dashboard Sekarang
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Legal Notice */}
        <div className="text-center text-[11px] text-slate-400 py-2">
          Dengan mendaftar, Anda menyetujui{" "}
          <Link to="/" className="underline hover:text-slate-600">
            Ketentuan Layanan
          </Link>{" "}
          &{" "}
          <Link to="/" className="underline hover:text-slate-600">
            Kebijakan Privasi
          </Link>{" "}
          HPP Tracker.
        </div>
      </div>
    </div>
  )
}
