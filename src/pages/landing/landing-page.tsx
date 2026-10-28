import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Factory,
  ArrowRight,
  Sparkles,
  Check,
  ChevronDown,
} from "lucide-react"
import { HeroVisual } from "./components/hero-visual"
import { PricingHost } from "./components/pricing-host"
import { FeatureScrollShowcase } from "./components/feature-scroll-showcase"
import { ProductionWorkflow } from "./components/production-workflow"
import { Button } from "@/components/ui/button"
import { APP_NAME, cn } from "@/lib/utils"
import { useAuthStore } from "@/store/use-auth-store"
import { UpgradeModal } from "@/features/subscription/components/UpgradeModal"
import type { SubscriptionTier } from "@/features/subscription/types/subscription"

import { WhatsAppCTA } from "./components/whatsapp-cta"
import { PublicHeader, PublicFooter } from "./components/public-navigation"
import { useLandingContact } from "./hooks/use-landing-contact"

const FAQ_ITEMS = [
  {
    question: `Usaha saya masih kecil, apakah cocok memakai ${APP_NAME}?`,
    answer:
      "Cocok. Anda bisa mulai dari satu toko dan satu resep, lalu mencatat produksi serta penjualan sesuai kebutuhan. Tidak perlu langsung memakai semua fitur.",
  },
  {
    question: "Apa yang perlu disiapkan untuk mulai?",
    answer:
      "Siapkan daftar bahan, harga beli, dan takaran resep yang ingin dihitung. Mulai dari satu menu dulu; bahan dan resep lain bisa ditambahkan bertahap. Catat juga stok yang tersedia sebelum mulai mencatat pemakaian bahan.",
  },
  {
    question: "Apakah pesanan kasir langsung terhubung ke dapur?",
    answer:
      "Ya, untuk menu yang diatur agar dibuat saat dipesan. Saat kasir mencatat penjualan, Ekatra membuat antrean produksi yang bisa ditindaklanjuti tim dapur. Untuk produk yang sudah siap jual, penjualan menggunakan stok produk jadi.",
  },
  {
    question: "Kapan stok bahan otomatis berkurang?",
    answer:
      "Stok bahan berkurang saat produksi ditandai selesai, mengikuti resep dan jumlah yang diproduksi. Pesanan yang baru masuk antrean dapur belum mengurangi stok bahan. Pastikan resep dan stok sudah dicatat agar pemakaiannya sesuai.",
  },
  {
    question: "Bagaimana Ekatra menghitung biaya dan laba setiap menu?",
    answer:
      "Ekatra menghitung HPP, yaitu biaya membuat menu, dari bahan dan biaya produksi yang Anda masukkan. Dari penjualan yang tercatat, Ekatra menghitung laba kotor dengan mengurangi nilai penjualan dengan HPP produk terjual. Laba kotor ini belum dikurangi biaya usaha lain di luar HPP.",
  },
  {
    question: "Apakah bisa mengelola beberapa toko?",
    answer:
      "Bisa. Paket Growth mendukung hingga 3 toko, sedangkan Max Growth hingga 10 toko. Setiap toko memiliki catatan stok dan transaksi sendiri, sehingga Anda bisa memeriksa usaha per toko.",
  },
  {
    question: "Apakah akses kasir, dapur, dan pemilik bisa dibedakan?",
    answer:
      "Bisa. Pemilik dapat mengatur akses karyawan sesuai tugas, seperti kasir, produksi, atau pengelolaan stok. Jumlah karyawan dan pilihan pengaturan akses mengikuti paket yang dipakai.",
  },
  {
    question: "Bisa mulai gratis? Kapan perlu pindah paket?",
    answer:
      "Bisa. Free Starter menyediakan 1 toko, 20 bahan baku, 10 resep, dan 20 kali produksi per bulan, yang dikelola oleh pemilik. Pilih paket berbayar saat membutuhkan kapasitas lebih besar, akses karyawan, atau tambahan toko. Anda bisa memilih paket melalui halaman langganan di aplikasi.",
  },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const token = useAuthStore((state) => state.token)
  const isAuthenticated = Boolean(token)
  const [isUpgradeOpen, setIsUpgradeOpen] = React.useState(false)
  const [selectedTier, setSelectedTier] = React.useState<SubscriptionTier>("GROWTH")

  const { whatsapp } = useLandingContact()

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

  React.useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(window.location.hash.slice(1))
      const offset = (document.querySelector("header")?.getBoundingClientRect().height ?? 64) + 12
      window.scrollTo({ top: target ? window.scrollY + target.getBoundingClientRect().top - offset : 0, behavior: "instant" })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

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
    <div className="brand-light-surface min-h-screen bg-slate-50/60 text-slate-900 flex flex-col font-sans selection:bg-primary selection:text-white antialiased overflow-x-clip">
        <a href="#konten-utama" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-primary focus:shadow-lg">Lewati navigasi</a>
        {/* Integrated Navigation Header */}
        <PublicHeader onSectionClick={handleScrollTo} />

      <main id="konten-utama" tabIndex={-1} className="scroll-mt-32 lg:scroll-mt-20">
      {/* ======================================================== */}
      {/* 1. HERO SECTION       */}
      {/* ======================================================== */}
      <section
        id="hero"
        aria-labelledby="hero-heading"
        className="relative min-h-0 sm:min-h-[calc(100svh-109px)] lg:min-h-[calc(100svh-65px)] flex flex-col justify-between overflow-hidden border-b border-slate-200"
        style={{ background: "radial-gradient(ellipse 36% 44% at 84% 43%, rgba(96, 165, 250, 0.22), transparent 100%), radial-gradient(ellipse 36% 42% at 66% 60%, rgba(var(--brand-indigo-rgb), 0.2), transparent 100%), #FFFFFF" }}
      >

        {/* Hero Main Body */}
        <div className="flex-1 flex items-center py-4 sm:py-8 lg:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 sm:gap-6 lg:gap-8 items-center">
              {/* Left Column: Heading, Typing Text, Call to Action */}
              <div className="lg:col-span-6 flex flex-col text-left">
                <p className="mb-2 sm:mb-4 text-xs sm:text-sm font-semibold text-primary">Untuk pemilik usaha kuliner</p>

                {/* Main Heading */}
                <h1 id="hero-heading" className="text-[clamp(1.75rem,7.5vw,2.5rem)] sm:text-5xl md:text-4xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-3 sm:mb-5">
                  <span className="block">Tahu Modalnya.</span>
                  <span className="block text-primary">Atur Harganya.</span>
                  <span className="block text-primary">Jaga Untungnya.</span>
                </h1>

                <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-xl mb-3 sm:mb-7">
                  Hitung biaya tiap menu, tentukan harga jual berdasarkan margin, dan kelola bahan baku dalam satu aplikasi.
                </p>

                {/* Action CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
                  {isAuthenticated ? (
                    <Button
                      size="lg"
                      asChild
                      className="public-mobile-button bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 h-12 px-7 font-bold text-base"
                    >
                      <Link to="/dashboard" className="flex items-center justify-center gap-2">
                        <span>Buka Dashboard</span>
                        <ArrowRight className="size-5" />
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        asChild
                        className="public-mobile-button bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 h-12 px-7 font-bold text-base transition-all transform hover:-translate-y-0.5"
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
                        className="public-mobile-button border-slate-300 text-slate-700 hover:bg-slate-100 h-12 px-6 font-semibold text-base cursor-pointer"
                      >
                        <a
                          href="#alur-kerja"
                          onClick={(e) => handleScrollTo(e, "alur-kerja")}
                          className="flex items-center justify-center gap-2"
                        >
                          <span>Lihat cara kerja</span>
                        </a>
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="relative mx-auto flex w-full max-w-sm items-center justify-center sm:max-w-none lg:col-span-6">
                <HeroVisual />
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
              Lihat alur kerja {APP_NAME}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8 max-w-6xl mx-auto items-stretch lg:px-20 xl:px-24">
            {/* Free Starter Plan */}
            <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6 lg:p-5 xl:p-7 hover:border-slate-300 transition-all flex flex-col justify-between">
              <PricingHost character="cashier" />
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Free Starter</h3>
                  <p className="text-sm text-slate-600 mt-1">Untuk mulai mencatat biaya resep di satu toko</p>
                </div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="whitespace-nowrap text-3xl font-extrabold text-slate-900">Rp 0</span>
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
                className="public-mobile-button w-full text-sm font-semibold h-12 rounded-xl sm:h-11 border-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                {isAuthenticated ? "Buka Dashboard" : "Mulai Gratis"}
              </Button>
            </div>

            {/* Growth Plan (Highlighted) */}
            <div className="rounded-2xl border-2 border-primary bg-indigo-50/20 p-5 shadow-lg sm:p-6 lg:p-5 xl:p-7 relative flex flex-col justify-between ring-2 ring-primary/20">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white whitespace-nowrap text-[11px] font-bold px-3 py-1 rounded-full shadow-xs flex items-center gap-1">
                <Sparkles className="size-3" /> Usaha Berkembang
              </div>
              <div>
                <div className="mb-4 mt-1">
                  <h3 className="text-lg font-bold text-slate-900">Growth</h3>
                  <p className="text-sm text-slate-600 mt-1">Untuk produksi rutin dan berbagi tugas dengan karyawan</p>
                </div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="whitespace-nowrap text-3xl font-extrabold text-slate-900">Rp 149.000</span>
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
                className="public-mobile-button w-full text-sm font-semibold h-12 rounded-xl sm:h-11 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/25 cursor-pointer"
              >
                Pilih Paket Growth
              </Button>
            </div>

            {/* Max Growth Plan */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6 lg:p-5 xl:p-7 hover:border-slate-400 transition-all flex flex-col justify-between relative sm:col-span-2 lg:col-span-1">
              <PricingHost character="chef" />
              <div className="absolute -top-3 left-6 bg-slate-900 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Factory className="size-3 text-amber-400" /> Waralaba & Resto Besar
              </div>
              <div>
                <div className="mb-4 mt-1">
                  <h3 className="text-lg font-bold text-slate-900">Max Growth</h3>
                  <p className="text-sm text-slate-600 mt-1">Untuk mengurus banyak cabang dan lebih banyak karyawan</p>
                </div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="whitespace-nowrap text-3xl font-extrabold text-slate-900">Rp 499.000</span>
                  <span className="text-xs text-slate-500">/bulan</span>
                </div>
                <ul className="space-y-3 text-sm text-slate-700 mb-8 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-3 sm:space-y-0 lg:block lg:space-y-3">
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
                className="public-mobile-button w-full text-sm font-semibold h-12 rounded-xl sm:h-11 bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
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
            <p className="text-xs uppercase tracking-widest font-bold text-primary mb-2">
              Pertanyaan umum
            </p>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Yang perlu Anda tahu tentang {APP_NAME}.
            </h2>
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

          <section aria-labelledby="contact-invitation-heading" className="mt-8 border-t border-slate-200 pt-6 sm:mt-10 sm:pt-8">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-6">
              <div>
                <h3 id="contact-invitation-heading" className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">Masih ada pertanyaan?</h3>
                <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-slate-600">Tanyakan kebutuhan usaha Anda langsung ke tim Ekatra.</p>
              </div>
              <Button variant="ghost" asChild className="public-mobile-button h-11 shrink-0 px-3 font-semibold text-primary hover:bg-indigo-50 hover:text-primary">
                <Link to="/hubungi-kami">Hubungi Kami <ArrowRight aria-hidden="true" className="ml-2 size-4" /></Link>
              </Button>
            </div>
          </section>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 8. BOTTOM HIGH-CONVERSION CTA BANNER                     */}
      {/* ======================================================== */}
      <section className="py-12 sm:py-20 bg-slate-950 text-white relative overflow-hidden">
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
                className="public-mobile-button bg-primary hover:bg-primary/90 text-white font-bold px-8 h-12 shadow-xl shadow-primary/30"
              >
                <Link to="/dashboard" className="flex items-center gap-2">
                  <span>Buka Dashboard</span>
                  <ArrowRight className="size-5" />
                </Link>
              </Button>
            ) : (
              <Button
                size="lg"
                asChild
                className="public-mobile-button bg-primary hover:bg-primary/90 text-white font-bold px-8 h-12 shadow-xl shadow-primary/30"
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
              className="public-mobile-button border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-200 h-12 px-7 font-semibold"
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
      <PublicFooter onSectionClick={handleScrollTo} />

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
