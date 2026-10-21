import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Factory,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Check,
  ChevronDown,
} from "lucide-react"
import "./landing-page.css"
import { FeatureScrollShowcase } from "./components/feature-scroll-showcase"
import { ProductionWorkflow } from "./components/production-workflow"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/use-auth-store"
import { UpgradeModal } from "@/features/subscription/components/UpgradeModal"
import type { SubscriptionTier } from "@/features/subscription/types/subscription"

import { WhatsAppCTA, type WhatsAppCTAConfig } from "./components/whatsapp-cta"

const FAQ_ITEMS = [
  {
    question: "Usaha saya masih kecil, bisa pakai HPP Tracker?",
    answer:
      "Bisa. Paket Free Starter gratis untuk satu toko, dengan 20 bahan baku, 10 resep, dan 20 kali produksi per bulan. Mulai dengan mencatat harga bahan dan takaran satu resep. Anda bisa lanjut mencatat produksi dan penjualan saat membutuhkannya.",
  },
  {
    question: "Apa bedanya HPP, laba kotor, dan laba bersih?",
    answer:
      "HPP (Harga Pokok Produksi) adalah biaya membuat menu, termasuk bahan, kemasan, upah, dan biaya produksi yang Anda masukkan. Laba kotor adalah uang penjualan dikurangi HPP menu yang terjual. Untuk tahu laba bersih, kurangi lagi biaya usaha lain yang belum masuk HPP, seperti sewa tempat.",
  },
  {
    question: "Margin itu apa, dan apa bedanya dengan laba?",
    answer:
      "Laba kotor menunjukkan selisih harga jual dan HPP dalam rupiah. Margin laba kotor menunjukkan selisih itu sebagai persentase harga jual. Misalnya, harga jual Rp 18.000 dan HPP Rp 6.100 menghasilkan laba kotor Rp 11.900, atau margin sekitar 66,1%. Ini belum dikurangi biaya usaha lain di luar HPP.",
  },
  {
    question: "Kapan saya perlu pindah ke paket berbayar?",
    answer:
      "Pilih Growth jika Anda perlu mencatat lebih dari 10 resep, lebih dari 20 kali produksi per bulan, mengajak karyawan memakai aplikasi, atau menambah toko. Lihat perbandingan paket di bagian harga dan periksa rinciannya sebelum membayar.",
  },
  {
    question: "Bagaimana menentukan bahan yang perlu dipakai lebih dulu?",
    answer:
      "Anda bisa memilih bahan yang datang lebih dulu (FIFO), atau yang paling dekat tanggal kedaluwarsanya (FEFO). Aplikasi mencatat pengurangan stok mengikuti pilihan itu. Saat mengambil bahan di dapur, tetap ikuti urutan pada catatan agar bahan yang dipakai sesuai.",
  },
  {
    question: "Kalau punya lebih dari satu toko, bisa dikelola di sini?",
    answer:
      "Bisa. Paket Growth untuk hingga 3 toko, sedangkan Max Growth untuk hingga 10 toko. Setiap toko punya catatan stok sendiri. Anda juga bisa mengatur fitur yang boleh dipakai karyawan sesuai paket.",
  },
  {
    question: "Siapa yang bisa melihat resep dan catatan penjualan saya?",
    answer:
      "Data toko hanya bisa dibuka melalui akun yang punya izin. Sebagai pemilik, Anda bisa mengatur akses karyawan sesuai tugasnya dan mengeluarkan akun dari perangkat yang pernah dipakai melalui pengaturan akun.",
  },
  {
    question: "Bagaimana kalau ingin ganti paket?",
    answer:
      "Buka halaman langganan di aplikasi, lalu pilih paket yang dibutuhkan. Periksa harga dan masa aktifnya sebelum membayar. Pembayaran diproses melalui Midtrans.",
  },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const token = useAuthStore((state) => state.token)
  const isAuthenticated = Boolean(token)
  const [isUpgradeOpen, setIsUpgradeOpen] = React.useState(false)
  const [selectedTier, setSelectedTier] = React.useState<SubscriptionTier>("GROWTH")

  const [whatsapp, setWhatsapp] = React.useState<WhatsAppCTAConfig | null>(null)

  React.useEffect(() => {
    const controller = new AbortController()
    const baseURL = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "")
    // Public settings do not need the authenticated client's session or loading overlay.
    fetch(`${baseURL}/config/landing`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return
        const body = await response.json()
        if (body.success && !controller.signal.aborted) {
          setWhatsapp(body.data?.whatsapp ?? null)
        }
      })
      .catch(() => { /* The landing page remains usable when settings are unavailable. */ })
    return () => controller.abort()
  }, [])

  // FAQ Accordion state
  const [expandedFaqIndex, setExpandedFaqIndex] = React.useState<number | null>(0)

  // Smooth scroll handler with sticky header offset
  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    const element = document.getElementById(targetId)
    if (element) {
      const headerOffset = (document.querySelector("header")?.getBoundingClientRect().height ?? 64) + 12
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      })
      window.history.pushState(null, "", `#${targetId}`)
    }
  }

  const handlePlanAction = (tier: SubscriptionTier) => {
    if (tier === "FREE") {
      if (isAuthenticated) {
        navigate("/dashboard")
      } else {
        navigate("/register")
      }
      return
    }

    if (isAuthenticated) {
      setSelectedTier(tier)
      setIsUpgradeOpen(true)
    } else {
      navigate(`/register?tier=${tier}`)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col font-sans selection:bg-primary selection:text-white antialiased overflow-x-clip">
        <a href="#konten-utama" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-primary focus:shadow-lg">Lewati navigasi</a>
        {/* Integrated Navigation Header */}
        <header className="w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
            {/* Brand Logo */}
            <Link to="/" className="flex shrink-0 items-center gap-2 sm:gap-2.5 group">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/25 group-hover:scale-105 transition-transform">
                <Factory className="size-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold tracking-tight text-sm sm:text-lg text-slate-900 leading-tight">
                  HPP TRACKER
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-primary hidden sm:block">
                  HPP untuk usaha kuliner
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-4 text-sm font-medium text-slate-600">
              <a
                href="#fitur"
                onClick={(e) => handleScrollTo(e, "fitur")}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                Fitur
              </a>
              <a
                href="#alur-kerja"
                onClick={(e) => handleScrollTo(e, "alur-kerja")}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                Cara Kerja
              </a>
              <a
                href="#pricing"
                onClick={(e) => handleScrollTo(e, "pricing")}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                Harga Paket
              </a>
              <a
                href="#faq"
                onClick={(e) => handleScrollTo(e, "faq")}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                Tanya jawab
              </a>
            </nav>

            {/* Auth actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {isAuthenticated ? (
                <Button asChild className="bg-primary hover:bg-primary/90 text-white shadow-sm font-medium text-xs sm:text-sm h-9 sm:h-11 px-3 sm:px-4">
                  <Link to="/dashboard" aria-label="Buka aplikasi" className="flex items-center gap-2">
                    <span>Buka aplikasi</span>
                    <ArrowRight className="hidden sm:block size-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" asChild className="h-11 text-slate-700 hover:text-slate-900 font-medium text-xs sm:text-sm px-2 sm:px-4">
                    <Link to="/login">Masuk</Link>
                  </Button>
                  <Button asChild className="bg-primary hover:bg-primary/90 text-white shadow-sm shadow-primary/20 font-medium text-xs sm:text-sm h-11 px-2 sm:px-4">
                    <Link to="/register" className="flex items-center gap-1.5">
                      <span>Mulai Gratis</span>
                      <ArrowRight className="hidden min-[360px]:block size-3.5" />
                    </Link>
                  </Button>
                </>
              )}


            </div>
          </div>
          <nav aria-label="Navigasi halaman" className="grid grid-cols-4 border-t border-slate-100 px-3 text-xs font-semibold text-slate-600 lg:hidden">
            {[
              { id: "alur-kerja", label: "Cara kerja" },
              { id: "fitur", label: "Fitur" },
              { id: "pricing", label: "Harga" },
              { id: "faq", label: "Bantuan" },
            ].map(({ id, label }) => (
              <a key={id} href={`#${id}`} onClick={(e) => handleScrollTo(e, id)} className="flex min-h-11 items-center justify-center rounded-md hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">{label}</a>
            ))}
          </nav>
        </header>

      <main id="konten-utama" tabIndex={-1} className="scroll-mt-32 lg:scroll-mt-20">
      {/* ======================================================== */}
      {/* 1. HERO SECTION       */}
      {/* ======================================================== */}
      <section id="hero" aria-labelledby="hero-heading" className="relative min-h-[calc(100svh-110px)] lg:min-h-[calc(100svh-65px)] flex flex-col justify-between overflow-hidden bg-white border-b border-slate-200">
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute top-0 right-0 -translate-y-20 translate-x-20 w-[550px] h-[550px] bg-gradient-to-bl from-indigo-100/70 via-indigo-50/40 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-20 -translate-x-20 w-[600px] h-[600px] bg-gradient-to-tr from-violet-100/60 via-slate-100/40 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#e0e7ff_1px,transparent_1px)] [background-size:24px_24px] opacity-40 -z-10 pointer-events-none" />

        {/* Hero Main Body */}
        <div className="flex-1 flex items-center py-4 sm:py-8 lg:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 lg:gap-8 items-center">
              {/* Left Column: Heading, Typing Text, Call to Action */}
              <div className="lg:col-span-7 flex flex-col text-left">
                <p className="mb-4 text-sm font-semibold text-primary">Untuk pemilik usaha kuliner</p>

                {/* Main Heading */}
                <h1 id="hero-heading" className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12] mb-5">
                  Tahu Modalnya.{" "}
                  <span className="text-primary">
                    Atur Harganya. Jaga Untungnya.
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mb-5 sm:mb-7">
                  Hitung biaya tiap menu, tentukan harga jual berdasarkan margin, dan kelola bahan baku dalam satu aplikasi.
                </p>

                {/* Action CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4 sm:mb-8">
                  {isAuthenticated ? (
                    <Button
                      size="lg"
                      asChild
                      className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 h-12 px-7 font-bold text-base"
                    >
                      <Link to="/dashboard" className="flex items-center justify-center gap-2">
                        <span>Buka aplikasi</span>
                        <ArrowRight className="size-5" />
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        asChild
                        className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 h-12 px-7 font-bold text-base transition-all transform hover:-translate-y-0.5"
                      >
                        <Link to="/register" className="flex items-center justify-center gap-2">
                          <span>Hitung resep pertama</span>
                          <ArrowRight className="size-5" />
                        </Link>
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        asChild
                        className="border-slate-300 text-slate-700 hover:bg-slate-100 h-12 px-6 font-semibold text-base cursor-pointer"
                      >
                        <a
                          href="#alur-kerja"
                          onClick={(e) => handleScrollTo(e, "alur-kerja")}
                          className="flex items-center justify-center gap-2"
                        >
                          <ArrowRight className="size-4 text-primary" />
                          <span>Lihat cara kerja</span>
                        </a>
                      </Button>
                    </>
                  )}
                </div>

                {/* Trust Highlights Checklist */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 sm:pt-6 border-t border-slate-200/80 text-xs font-semibold text-slate-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Paket gratis Rp 0</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Biaya tiap porsi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Tanpa Kartu Kredit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Mulai dari 1 toko</span>
                  </div>
                </div>
              </div>

              <div className="relative lg:col-span-5 flex items-center justify-center">
                <img
                  src="/images/fnb-hero-cartoon.webp"
                  alt="Ilustrasi kopi susu, matcha, croissant, brownies, dan rice bowl untuk usaha kuliner"
                  width={1254}
                  height={1254}
                  fetchPriority="high"
                  decoding="async"
                  className="hero-food-illustration h-auto w-[min(48vw,200px)] sm:w-[min(40vw,300px)] lg:w-full lg:max-h-[60svh] object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Hero Bottom Anchor Indicator */}
        <div className="pb-4 sm:pb-6 pt-2 flex flex-col items-center justify-center text-slate-400 text-xs font-medium">
          <a
            href="#alur-kerja"
            onClick={(e) => handleScrollTo(e, "alur-kerja")}
            className="flex flex-col items-center gap-1.5 hover:text-primary transition-colors cursor-pointer group"
          >
            <span className="text-xs font-semibold text-slate-600 group-hover:text-primary">
              Lihat alur kerja HPP Tracker
            </span>
            <ChevronDown className="size-4 motion-safe:animate-bounce text-primary" />
          </a>
        </div>
      </section>

      <ProductionWorkflow />

      {/* ======================================================== */}
      {/* 3. CORE FEATURES SCROLL SHOWCASE                         */}
      {/* ======================================================== */}
      <section id="fitur" className="scroll-mt-32 lg:scroll-mt-20">
        <FeatureScrollShowcase />
      </section>

      {/* ======================================================== */}
      {/* 6. PRICING SECTION                                       */}
      {/* ======================================================== */}
      <section id="pricing" className="scroll-mt-32 lg:scroll-mt-20 py-12 sm:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
              Mulai sesuai kebutuhan usaha Anda
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Coba hitung satu resep dengan paket gratis. Pilih paket lain saat butuh lebih banyak resep, produksi, atau karyawan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {/* Free Starter Plan */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Free Starter</h3>
                  <p className="text-sm text-slate-600 mt-1">Untuk mulai mencatat biaya resep di satu toko</p>
                </div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-extrabold text-slate-900">Rp 0</span>
                  <span className="text-xs text-slate-500">/selamanya</span>
                </div>
                <ul className="space-y-3 text-sm text-slate-700 mb-8">
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>1 Toko / Cabang Utama</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>20 Bahan Baku & 10 Resep</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>20 kali produksi per bulan</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>Dikelola oleh pemilik toko</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>Laporan biaya dan laba kotor</span>
                  </li>
                </ul>
              </div>
              <Button
                variant="outline"
                onClick={() => handlePlanAction("FREE")}
                className="w-full text-sm font-semibold h-11 rounded-xl border-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                {isAuthenticated ? "Buka aplikasi" : "Mulai Gratis"}
              </Button>
            </div>

            {/* Growth Plan (Highlighted) */}
            <div className="rounded-2xl border-2 border-primary bg-indigo-50/20 p-7 shadow-lg relative flex flex-col justify-between ring-2 ring-primary/20">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white whitespace-nowrap text-[11px] font-bold px-3 py-1 rounded-full shadow-xs flex items-center gap-1">
                <Sparkles className="size-3" /> Usaha Berkembang
              </div>
              <div>
                <div className="mb-4 mt-1">
                  <h3 className="text-lg font-bold text-slate-900">Growth</h3>
                  <p className="text-sm text-slate-600 mt-1">Untuk produksi rutin dan berbagi tugas dengan karyawan</p>
                </div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-extrabold text-slate-900">Rp 149.000</span>
                  <span className="text-xs text-slate-500">/bulan</span>
                </div>
                <ul className="space-y-3 text-sm text-slate-700 mb-8">
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-primary shrink-0" />
                    <span className="font-semibold text-slate-900">Hingga 3 Toko / Cabang</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-primary shrink-0" />
                    <span>100 Bahan Baku & 50 Resep</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-primary shrink-0" />
                    <span>150 kali produksi per bulan</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-primary shrink-0" />
                    <span>3 karyawan per toko</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-primary shrink-0" />
                    <span>Unduh laporan usaha</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-primary shrink-0" />
                    <span>Laporan hasil produksi</span>
                  </li>
                </ul>
              </div>
              <Button
                onClick={() => handlePlanAction("GROWTH")}
                className="w-full text-sm font-semibold h-11 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/25 cursor-pointer"
              >
                Pilih Paket Growth
              </Button>
            </div>

            {/* Max Growth Plan */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xs hover:border-slate-400 transition-all flex flex-col justify-between relative">
              <div className="absolute -top-3 left-6 bg-slate-900 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Factory className="size-3 text-amber-400" /> Waralaba & Resto Besar
              </div>
              <div>
                <div className="mb-4 mt-1">
                  <h3 className="text-lg font-bold text-slate-900">Max Growth</h3>
                  <p className="text-sm text-slate-600 mt-1">Untuk mengurus banyak cabang dan lebih banyak karyawan</p>
                </div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-extrabold text-slate-900">Rp 499.000</span>
                  <span className="text-xs text-slate-500">/bulan</span>
                </div>
                <ul className="space-y-3 text-sm text-slate-700 mb-8">
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-slate-900">Hingga 10 Toko / Cabang</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-slate-900">Hingga 1 juta bahan & 1 juta resep</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-slate-900">Hingga 1 juta kali produksi per bulan</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>20 karyawan per toko</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>Laporan penjualan dan laba kotor</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>Atur akses tiap karyawan sesuai tugas</span>
                  </li>
                </ul>
              </div>
              <Button
                onClick={() => handlePlanAction("MAX_GROWTH")}
                className="w-full text-sm font-semibold h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
              >
                Pilih Paket Max Growth
              </Button>
            </div>
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-slate-600">Batas bahan, resep, produksi, dan karyawan berlaku untuk masing-masing toko. Satu kali produksi berarti satu catatan proses memasak, bukan satu porsi. Batas produksi dihitung per bulan. Jumlah toko mengikuti paket pemilik.</p>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 7. FAQ ACCORDION SECTION                                 */}
      {/* ======================================================== */}
      <section id="faq" className="scroll-mt-32 lg:scroll-mt-20 py-12 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="text-xs uppercase tracking-widest font-bold text-primary mb-2">
              Tanya jawab
            </h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Sebelum Anda mulai
            </p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => {
              const isExpanded = expandedFaqIndex === idx
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden transition-all"
                >
                  <button
                    aria-expanded={isExpanded}
                    aria-controls={`faq-answer-${idx}`}
                    id={`faq-question-${idx}`}
                    onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-slate-900 hover:text-primary transition-colors cursor-pointer"
                  >
                    <span>{item.question}</span>
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-slate-500 transition-transform duration-200",
                        isExpanded && "rotate-180 text-primary"
                      )}
                    />
                  </button>
                  <div hidden={!isExpanded} id={`faq-answer-${idx}`} aria-labelledby={`faq-question-${idx}`} role="region" className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-200/60 bg-white">
                      {item.answer}
                    </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 8. BOTTOM HIGH-CONVERSION CTA BANNER                     */}
      {/* ======================================================== */}
      <section className="py-20 bg-slate-950 text-white relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-primary/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-5 leading-tight">
            Mulai dari satu resep andalan Anda.
          </h2>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto mb-9 leading-relaxed">
            Masukkan bahan dan takarannya, lalu lihat perkiraan biaya tiap porsi. Coba dulu dengan paket gratis, tanpa kartu kredit.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            {isAuthenticated ? (
              <Button
                size="lg"
                asChild
                className="bg-primary hover:bg-primary/90 text-white font-bold px-8 h-12 shadow-xl shadow-primary/30"
              >
                <Link to="/dashboard" className="flex items-center gap-2">
                  <span>Buka aplikasi</span>
                  <ArrowRight className="size-5" />
                </Link>
              </Button>
            ) : (
              <Button
                size="lg"
                asChild
                className="bg-primary hover:bg-primary/90 text-white font-bold px-8 h-12 shadow-xl shadow-primary/30"
              >
                <Link to="/register" className="flex items-center gap-2">
                  <span>Hitung resep pertama</span>
                  <ArrowRight className="size-5" />
                </Link>
              </Button>
            )}
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-200 h-12 px-7 font-semibold"
            >
              <Link to="/login">Masuk ke Akun</Link>
            </Button>
          </div>
        </div>
      </section>
      </main>

      {/* ======================================================== */}
      {/* 9. PROFESSIONAL FOOTER                                   */}
      {/* ======================================================== */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-white">
                <Factory className="size-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-white tracking-tight">HPP TRACKER</span>
                <span className="text-xs text-slate-300">HPP, stok, dan penjualan</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 text-center md:text-right max-w-md">
              Bantu hitung biaya menu, atur harga jual, catat stok bahan, dan lihat hasil penjualan usaha kuliner Anda.
            </p>
          </div>
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} HPP Tracker. Hak cipta dilindungi.</p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center">
              <a
                href="#fitur"
                onClick={(e) => handleScrollTo(e, "fitur")}
                className="hover:text-slate-300 transition-colors cursor-pointer"
              >
                Fitur
              </a>
              <a
                href="#alur-kerja"
                onClick={(e) => handleScrollTo(e, "alur-kerja")}
                className="hover:text-slate-300 transition-colors cursor-pointer"
              >
                Cara Kerja
              </a>
              <a
                href="#pricing"
                onClick={(e) => handleScrollTo(e, "pricing")}
                className="hover:text-slate-300 transition-colors cursor-pointer"
              >
                Harga
              </a>
              <Link to="/login" className="hover:text-slate-300 transition-colors">
                Masuk
              </Link>
              <Link to="/register" className="hover:text-slate-300 transition-colors">
                Daftar
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <WhatsAppCTA config={whatsapp} />

      {/* Subscription Upgrade Modal */}
      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        initialSelectedTier={selectedTier}
        reason="Pilih paket sesuai jumlah resep, produksi, toko, dan karyawan yang Anda butuhkan."
      />
    </div>
  )
}
