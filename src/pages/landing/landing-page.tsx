import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Factory,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Check,
  ChevronDown,
  UtensilsCrossed,
} from "lucide-react"
import { FeatureScrollShowcase } from "./components/feature-scroll-showcase"
import { ProductionWorkflow } from "./components/production-workflow"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/use-auth-store"
import { UpgradeModal } from "@/features/subscription/components/UpgradeModal"
import type { SubscriptionTier } from "@/features/subscription/types/subscription"

const FAQ_ITEMS = [
  {
    question: "Apakah HPP Tracker cocok untuk usaha kuliner skala rintisan (UMKM)?",
    answer:
      "Sangat cocok. HPP Tracker dirancang dengan antarmuka yang intuitif sehingga pemula dapat langsung menghitung modal per menu tanpa rumus rumit. Anda bisa memulai langsung dengan paket Free Starter tanpa dipungut biaya.",
  },
  {
    question: "Bagaimana cara kerja pengurangan stok dengan metode FIFO dan FEFO?",
    answer:
      "Sistem mendukung metode FIFO (First-In, First-Out) untuk memotong batch bahan yang masuk paling awal, serta FEFO (First-Expired, First-Out) yang memprioritaskan bahan dengan tanggal kedaluwarsa terdekat. Pencatatan ini membantu melacak biaya dan prioritas pemakaian. Pemakaian bahan di dapur tetap perlu mengikuti catatan stok.",
  },
  {
    question: "Apakah sistem ini mendukung multi-cabang (banyak toko)?",
    answer:
      "Ya. Mulai dari paket Growth, Anda dapat mengelola hingga 3 cabang toko, sedangkan paket Max Growth mendukung hingga 10 cabang toko dengan stok terpisah serta hak akses staf berjenjang.",
  },
  {
    question: "Apakah data transaksi dan resep rahasia saya aman?",
    answer:
      "Akses data toko memerlukan akun dan dibatasi berdasarkan izin staf. Pemilik dapat mengatur peran staf serta mencabut sesi login dari pengaturan akun.",
  },
  {
    question: "Bisakah saya beralih paket langganan kapan saja?",
    answer:
      "Anda dapat memilih paket dari halaman langganan. Pembayaran diproses melalui Midtrans; periksa rincian paket dan periode aktif sebelum melanjutkan pembayaran.",
  },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const token = useAuthStore((state) => state.token)
  const isAuthenticated = Boolean(token)
  const [isUpgradeOpen, setIsUpgradeOpen] = React.useState(false)
  const [selectedTier, setSelectedTier] = React.useState<SubscriptionTier>("GROWTH")

  // FAQ Accordion state
  const [expandedFaqIndex, setExpandedFaqIndex] = React.useState<number | null>(0)

  // Smooth scroll handler with sticky header offset
  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    const element = document.getElementById(targetId)
    if (element) {
      const headerOffset = 70
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
                Fitur Unggulan
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
                FAQ
              </a>
            </nav>

            {/* Auth actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {isAuthenticated ? (
                <Button asChild className="bg-primary hover:bg-primary/90 text-white shadow-sm font-medium text-xs sm:text-sm h-9 sm:h-11 px-3 sm:px-4">
                  <Link to="/dashboard" aria-label="Buka Dashboard" className="flex items-center gap-2">
                    <span className="sm:hidden">Dashboard</span>
                    <span className="hidden sm:inline">Buka Dashboard</span>
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
        </header>

      {/* ======================================================== */}
      {/* 1. HERO SECTION       */}
      {/* ======================================================== */}
      <section className="relative min-h-[auto] flex flex-col justify-between overflow-hidden bg-white border-b border-slate-200">
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute top-0 right-0 -translate-y-20 translate-x-20 w-[550px] h-[550px] bg-gradient-to-bl from-indigo-100/70 via-indigo-50/40 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-20 -translate-x-20 w-[600px] h-[600px] bg-gradient-to-tr from-violet-100/60 via-slate-100/40 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#e0e7ff_1px,transparent_1px)] [background-size:24px_24px] opacity-40 -z-10 pointer-events-none" />

        {/* Hero Main Body */}
        <div className="flex-1 flex items-center py-6 sm:py-10 lg:py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
              {/* Left Column: Heading, Typing Text, Call to Action */}
              <div className="lg:col-span-7 flex flex-col text-left">
                {/* Pill Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50/90 border border-indigo-100 text-indigo-700 text-xs sm:text-sm font-semibold mb-6 w-fit shadow-xs">
                  <Sparkles className="size-4 text-primary shrink-0" />
                  <span>Untuk pemilik usaha kuliner</span>
                </div>

                {/* Main Heading */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12] mb-5">
                  Tahu biaya tiap menu.{" "}
                  <span className="bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">
                    Lebih yakin menentukan harga jual.
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mb-7">
                  Hitung HPP dari bahan, kemasan, dan biaya produksi. Pantau stok serta laba kotor penjualan dalam satu aplikasi untuk usaha kuliner Anda.
                </p>

                {/* Action CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mb-8">
                  {isAuthenticated ? (
                    <Button
                      size="lg"
                      asChild
                      className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 h-12 px-7 font-bold text-base"
                    >
                      <Link to="/dashboard" className="flex items-center justify-center gap-2">
                        <span>Lanjutkan ke Dashboard</span>
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
                          <span>Mulai Gratis</span>
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-200/80 text-xs font-semibold text-slate-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Free Starter Rp 0</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Biaya resep per porsi</span>
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

              {/* Right Column: Hero Visual Mockup Card */}
              <div className="lg:col-span-5 relative">
                {/* Visual Glow Backdrop */}
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary to-violet-600 opacity-20 blur-xl -z-10" />

                {/* Main Dashboard Preview Card */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-lg p-4 sm:p-6 relative">
                  {/* Mockup Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100 mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 text-primary flex items-center justify-center shrink-0">
                        <UtensilsCrossed className="size-4.5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 leading-tight">
                          Contoh: Kopi Susu Aren 250ml
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Ilustrasi biaya untuk 1 porsi
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold shrink-0">
                      Contoh perhitungan
                    </Badge>
                  </div>

                  {/* Recipe Cost Breakdown List */}
                  <div className="space-y-2.5 mb-5">
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                        <span className="font-medium text-slate-700">Bahan Baku (Espresso, Susu, Aren)</span>
                      </div>
                      <span className="font-bold text-slate-900 shrink-0">Rp 4.250</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                        <span className="font-medium text-slate-700">Packaging (Cup 14oz, Seal, Straw)</span>
                      </div>
                      <span className="font-bold text-slate-900 shrink-0">Rp 1.200</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                        <span className="font-medium text-slate-700">Overhead (Listrik, Gas, Tenaga)</span>
                      </div>
                      <span className="font-bold text-slate-900 shrink-0">Rp 650</span>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Total HPP / Porsi</span>
                      <span className="text-lg sm:text-xl font-extrabold text-slate-900">Rp 6.100</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">33,9% dari harga jual</span>
                    </div>
                    <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-100">
                      <span className="text-[10px] uppercase font-bold text-primary block">Harga Jual POS</span>
                      <span className="text-lg sm:text-xl font-extrabold text-primary">Rp 18.000</span>
                      <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                        Laba Kotor: Rp 11.900 (66,1%)
                      </span>
                    </div>
                  </div>

                  {/* FIFO Alert Mini Toast */}
                  <div className="p-3 rounded-xl bg-slate-900 text-white flex items-center gap-3 text-xs">
                    <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <ShieldCheck className="size-4" />
                    </div>
                    <div className="leading-tight">
                      <div className="font-bold text-slate-100">Stok FIFO & FEFO Berjalan Otomatis</div>
                      <div className="text-[11px] text-slate-400">
                        Batch #INV-2026-08 (Susu Fresh) dipotong lebih awal sesuai masa simpan
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Bottom Anchor Indicator */}
        <div className="pb-6 pt-2 flex flex-col items-center justify-center text-slate-400 text-xs font-medium">
          <a
            href="#alur-kerja"
            onClick={(e) => handleScrollTo(e, "alur-kerja")}
            className="flex flex-col items-center gap-1.5 hover:text-primary transition-colors cursor-pointer group"
          >
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 group-hover:text-primary">
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
      <section id="fitur" className="scroll-mt-20">
        <FeatureScrollShowcase />
      </section>

      {/* ======================================================== */}
      {/* 6. PRICING SECTION                                       */}
      {/* ======================================================== */}
      <section id="pricing" className="scroll-mt-20 py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-primary text-xs font-semibold mb-3">
              <Sparkles className="size-3.5" />
              <span>Paket Berlangganan Transparan</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
              Mulai sesuai kebutuhan usaha Anda
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Coba alur dasar dengan paket gratis. Pilih kapasitas lebih besar saat kebutuhan usaha bertambah.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {/* Free Starter Plan */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Free Starter</h3>
                  <p className="text-xs text-slate-500 mt-1">Cocok untuk UMKM rintisan & pengetesan menu baru</p>
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
                    <span>20 Batch Produksi per Bulan</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>Dikelola oleh pemilik toko</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>Laporan Margin Standar</span>
                  </li>
                </ul>
              </div>
              <Button
                variant="outline"
                onClick={() => handlePlanAction("FREE")}
                className="w-full text-sm font-semibold h-11 rounded-xl border-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                {isAuthenticated ? "Buka Dashboard" : "Mulai Gratis"}
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
                  <p className="text-xs text-slate-500 mt-1">Untuk bisnis kuliner yang mulai ekspansi cabang</p>
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
                    <span>150 Batch Produksi per Bulan</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-primary shrink-0" />
                    <span>3 Staf per Toko</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-primary shrink-0" />
                    <span>Akses fitur ekspor laporan</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-primary shrink-0" />
                    <span>Analitik produksi</span>
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
                  <p className="text-xs text-slate-500 mt-1">Untuk operasional banyak cabang</p>
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
                    <span className="font-semibold text-slate-900">Kapasitas hingga 1 juta bahan & resep</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-slate-900">Hingga 1 juta batch per bulan</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>20 Staf per Toko</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>Analitik Finansial Lengkap</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>Pengaturan peran staf khusus</span>
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
        </div>
      </section>

      {/* ======================================================== */}
      {/* 7. FAQ ACCORDION SECTION                                 */}
      {/* ======================================================== */}
      <section id="faq" className="scroll-mt-20 py-20 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="text-xs uppercase tracking-widest font-bold text-primary mb-2">
              Pertanyaan Umum
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-xs font-semibold mb-4 border border-white/10">
            <Sparkles className="size-3.5" />
            <span>Mulai Sekarang dengan Paket Gratis</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-5 leading-tight">
            Mulai dari satu resep andalan Anda.
          </h2>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto mb-9 leading-relaxed">
            Masukkan bahan dan takaran, lalu lihat estimasi biaya per porsinya. Mulai dengan paket gratis tanpa kartu kredit.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            {isAuthenticated ? (
              <Button
                size="lg"
                asChild
                className="bg-primary hover:bg-primary/90 text-white font-bold px-8 h-12 shadow-xl shadow-primary/30"
              >
                <Link to="/dashboard" className="flex items-center gap-2">
                  <span>Lanjutkan ke Dashboard</span>
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
                  <span>Mulai Gratis</span>
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
                <span className="text-[10px] text-slate-400">HPP, stok, dan penjualan</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 text-center md:text-right max-w-md">
              Solusi perhitungan HPP resep porsi, kontrol stok bahan baku metode FIFO & FEFO, simulasi dapur, dan kasir POS terpadu.
            </p>
          </div>
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} HPP Tracker. All rights reserved.</p>
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

      {/* Subscription Upgrade Modal */}
      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        initialSelectedTier={selectedTier}
        reason="Dapatkan fitur premium untuk mengoptimalkan operasional dan profit bisnis kuliner Anda."
      />
    </div>
  )
}
