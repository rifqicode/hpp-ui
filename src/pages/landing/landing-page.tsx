import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Factory,
  ArrowRight,
  Sparkles,
  Calculator,
  CheckCircle2,
  ShieldCheck,
  Check,
  Zap,
  ChevronDown,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  UtensilsCrossed,
  Menu,
} from "lucide-react"
import { FeatureScrollShowcase } from "./components/feature-scroll-showcase"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/use-auth-store"
import { UpgradeModal } from "@/features/subscription/components/UpgradeModal"
import type { SubscriptionTier } from "@/features/subscription/types/subscription"

const TYPING_PHRASES = [
  "Kalkulasi HPP Akurat hingga ke Satuan Gram & Ml",
  "Kontrol Pengurangan Stok Berbasis FIFO & FEFO Otomatis",
  "Simulasi Resep & Deteksi Margin Laba Sebelum Masak",
  "Kasir POS Terintegrasi Otomatis Potong Bahan Mentah",
  "Hentikan Boncos Operasional & Cegah Food Waste Dapur",
] as const

interface RecipePreset {
  name: string
  category: string
  materialsCost: number
  packagingCost: number
  overheadCost: number
  defaultSellPrice: number
}

const RECIPE_PRESETS: RecipePreset[] = [
  {
    name: "Kopi Susu Gula Aren",
    category: "Minuman",
    materialsCost: 4250,
    packagingCost: 1200,
    overheadCost: 650,
    defaultSellPrice: 18000,
  },
  {
    name: "Croissant Butter Almond",
    category: "Bakery",
    materialsCost: 7800,
    packagingCost: 1500,
    overheadCost: 1400,
    defaultSellPrice: 28000,
  },
  {
    name: "Ayam Goreng Sambal Bawang",
    category: "Makanan Utama",
    materialsCost: 11500,
    packagingCost: 2000,
    overheadCost: 1800,
    defaultSellPrice: 32000,
  },
  {
    name: "Matcha Latte Oat Milk",
    category: "Minuman",
    materialsCost: 6100,
    packagingCost: 1200,
    overheadCost: 700,
    defaultSellPrice: 24000,
  },
]

const FAQ_ITEMS = [
  {
    question: "Apakah HPP Tracker cocok untuk usaha kuliner skala rintisan (UMKM)?",
    answer:
      "Sangat cocok. HPP Tracker dirancang dengan antarmuka yang intuitif sehingga pemula dapat langsung menghitung modal per menu tanpa rumus rumit. Anda bisa memulai langsung dengan paket Free Starter tanpa dipungut biaya.",
  },
  {
    question: "Bagaimana cara kerja pengurangan stok dengan metode FIFO dan FEFO?",
    answer:
      "Sistem mendukung metode FIFO (First-In, First-Out) untuk memotong batch bahan yang masuk paling awal, serta FEFO (First-Expired, First-Out) yang memprioritaskan bahan dengan tanggal kedaluwarsa terdekat. Keduanya menjamin nilai HPP selalu akurat sekaligus mencegah pembusukan bahan mentah dan food waste.",
  },
  {
    question: "Apakah sistem ini mendukung multi-cabang (banyak toko)?",
    answer:
      "Ya. Mulai dari paket Growth, Anda dapat mengelola hingga 3 cabang toko, sedangkan paket Max Growth mendukung hingga 10 cabang toko dengan stok terpisah serta hak akses staf berjenjang.",
  },
  {
    question: "Apakah data transaksi dan resep rahasia saya aman?",
    answer:
      "Keamanan dan kerahasiaan formulasi resep Anda adalah prioritas kami. Semua data dienkripsi dengan standar industri perbankan dan hanya dapat diakses oleh akun Anda serta staf yang diberikan izin.",
  },
  {
    question: "Bisakah saya beralih paket langganan kapan saja?",
    answer:
      "Tentu. Anda dapat melakukan upgrade atau downgrade kapan pun secara instan menggunakan metode pembayaran otomatis via Midtrans seperti QRIS, Virtual Account, dan kartu kredit.",
  },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const token = useAuthStore((state) => state.token)
  const isAuthenticated = Boolean(token)
  const [isUpgradeOpen, setIsUpgradeOpen] = React.useState(false)
  const [selectedTier, setSelectedTier] = React.useState<SubscriptionTier>("GROWTH")

  // Typewriter state
  const [phraseIndex, setPhraseIndex] = React.useState(0)
  const [currentText, setCurrentText] = React.useState("")
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Interactive Calculator State
  const [selectedRecipeIndex, setSelectedRecipeIndex] = React.useState(0)
  const currentRecipe = RECIPE_PRESETS[selectedRecipeIndex]
  const [userSellPrice, setUserSellPrice] = React.useState<number | null>(null)
  const customSellPrice = userSellPrice ?? currentRecipe.defaultSellPrice

  // FAQ Accordion state
  const [expandedFaqIndex, setExpandedFaqIndex] = React.useState<number | null>(0)

  // Mobile navigation drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  // Smooth scroll handler with sticky header offset
  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    setIsMobileMenuOpen(false)
    const element = document.getElementById(targetId)
    if (element) {
      const headerOffset = 70
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      })
      window.history.pushState(null, "", `#${targetId}`)
    }
  }

  // Typewriter effect
  React.useEffect(() => {
    const fullText = TYPING_PHRASES[phraseIndex]
    const typingSpeed = isDeleting ? 12 : 25
    const pauseDelay = isDeleting ? 250 : 1400

    let timer: ReturnType<typeof setTimeout>

    if (!isDeleting && currentText === fullText) {
      timer = setTimeout(() => {
        setIsDeleting(true)
      }, pauseDelay)
    } else if (isDeleting && currentText === "") {
      timer = setTimeout(() => {
        setIsDeleting(false)
        setPhraseIndex((prev) => (prev + 1) % TYPING_PHRASES.length)
      }, 100)
    } else {
      timer = setTimeout(() => {
        const nextText = isDeleting
          ? fullText.substring(0, currentText.length - 1)
          : fullText.substring(0, currentText.length + 1)
        setCurrentText(nextText)
      }, typingSpeed)
    }

    return () => clearTimeout(timer)
  }, [currentText, isDeleting, phraseIndex])

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

  // Live Calculator calculations
  const totalHpp = currentRecipe.materialsCost + currentRecipe.packagingCost + currentRecipe.overheadCost
  const grossProfit = customSellPrice - totalHpp
  const marginPercentage = customSellPrice > 0 ? (grossProfit / customSellPrice) * 100 : 0
  const foodCostRatio = customSellPrice > 0 ? (totalHpp / customSellPrice) * 100 : 0

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val)
  }

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col font-sans selection:bg-primary selection:text-white antialiased">
      {/* ======================================================== */}
      {/* 1. HERO SECTION (FULL SCREEN 100vh / min-h-screen)       */}
      {/* ======================================================== */}
      <section className="relative min-h-[auto] lg:min-h-screen flex flex-col justify-between overflow-hidden bg-white border-b border-slate-200">
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute top-0 right-0 -translate-y-20 translate-x-20 w-[550px] h-[550px] bg-gradient-to-bl from-indigo-100/70 via-indigo-50/40 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-20 -translate-x-20 w-[600px] h-[600px] bg-gradient-to-tr from-violet-100/60 via-slate-100/40 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#e0e7ff_1px,transparent_1px)] [background-size:24px_24px] opacity-40 -z-10 pointer-events-none" />

        {/* Integrated Navigation Header */}
        <header className="w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Brand Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/25 group-hover:scale-105 transition-transform">
                <Factory className="size-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold tracking-tight text-lg text-slate-900 leading-tight">
                  HPP TRACKER
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-primary hidden sm:block">
                  Culinary Cost Engine
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600">
              <a
                href="#fitur"
                onClick={(e) => handleScrollTo(e, "fitur")}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                Fitur Unggulan
              </a>
              <a
                href="#simulator"
                onClick={(e) => handleScrollTo(e, "simulator")}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                Simulasi HPP
              </a>
              <a
                href="#perbandingan"
                onClick={(e) => handleScrollTo(e, "perbandingan")}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                Kenapa Kami
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

            {/* Auth CTAs & Mobile Menu */}
            <div className="flex items-center gap-2 sm:gap-3">
              {isAuthenticated ? (
                <Button asChild className="bg-primary hover:bg-primary/90 text-white shadow-sm font-medium text-xs sm:text-sm">
                  <Link to="/dashboard" className="flex items-center gap-2">
                    <span>Buka Dashboard</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" asChild className="text-slate-700 hover:text-slate-900 font-medium text-xs sm:text-sm px-2.5 sm:px-4">
                    <Link to="/login">Masuk</Link>
                  </Button>
                  <Button asChild className="bg-primary hover:bg-primary/90 text-white shadow-sm shadow-primary/20 font-medium text-xs sm:text-sm px-3 sm:px-4">
                    <Link to="/register" className="flex items-center gap-1.5">
                      <span>Coba Gratis</span>
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </>
              )}

              {/* Mobile Navigation Drawer Sheet */}
              <div className="lg:hidden">
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9 text-slate-700 border-slate-300">
                      <Menu className="size-5" />
                      <span className="sr-only">Buka Menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] sm:w-[350px] p-6 flex flex-col justify-between">
                    <div className="flex flex-col gap-6">
                      <SheetHeader className="p-0 text-left">
                        <SheetTitle className="flex items-center gap-2.5 text-base font-extrabold text-slate-900">
                          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white">
                            <Factory className="size-4" />
                          </div>
                          <span>HPP TRACKER</span>
                        </SheetTitle>
                      </SheetHeader>
                      <nav className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                        <a
                          href="#fitur"
                          onClick={(e) => handleScrollTo(e, "fitur")}
                          className="py-2.5 px-3 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          Fitur Unggulan
                        </a>
                        <a
                          href="#simulator"
                          onClick={(e) => handleScrollTo(e, "simulator")}
                          className="py-2.5 px-3 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          Simulasi HPP
                        </a>
                        <a
                          href="#perbandingan"
                          onClick={(e) => handleScrollTo(e, "perbandingan")}
                          className="py-2.5 px-3 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          Kenapa Kami
                        </a>
                        <a
                          href="#alur-kerja"
                          onClick={(e) => handleScrollTo(e, "alur-kerja")}
                          className="py-2.5 px-3 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          Cara Kerja
                        </a>
                        <a
                          href="#pricing"
                          onClick={(e) => handleScrollTo(e, "pricing")}
                          className="py-2.5 px-3 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          Harga Paket
                        </a>
                        <a
                          href="#faq"
                          onClick={(e) => handleScrollTo(e, "faq")}
                          className="py-2.5 px-3 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          FAQ
                        </a>
                      </nav>
                    </div>
                    <div className="flex flex-col gap-2.5 pt-6 border-t border-slate-200">
                      {isAuthenticated ? (
                        <Button asChild className="w-full bg-primary text-white">
                          <Link to="/dashboard">Masuk ke Dashboard</Link>
                        </Button>
                      ) : (
                        <>
                          <Button variant="outline" asChild className="w-full">
                            <Link to="/login">Masuk ke Akun</Link>
                          </Button>
                          <Button asChild className="w-full bg-primary text-white font-semibold">
                            <Link to="/register">Coba Gratis Sekarang</Link>
                          </Button>
                        </>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Main Body (Centered full screen content) */}
        <div className="flex-1 flex items-center py-6 sm:py-10 lg:py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
              {/* Left Column: Heading, Typing Text, Call to Action */}
              <div className="lg:col-span-7 flex flex-col text-left">
                {/* Pill Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50/90 border border-indigo-100 text-indigo-700 text-xs sm:text-sm font-semibold mb-6 w-fit shadow-xs">
                  <Sparkles className="size-4 text-primary shrink-0" />
                  <span>Platform Finansial & Operasional Kuliner Terpadu</span>
                </div>

                {/* Main Heading */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12] mb-5">
                  Hitung HPP Presisi, Amankan Margin, dan{" "}
                  <span className="bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">
                    Kendalikan Dapur Anda.
                  </span>
                </h1>

                {/* Dynamic Typing Text Container */}
                <div className="mb-6 p-3.5 sm:p-4 rounded-xl bg-slate-900 text-white shadow-md border border-slate-800 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0 text-indigo-400">
                    <Zap className="size-4" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300">
                      Otomatisasi Sistem Terintegrasi:
                    </span>
                    <div className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center min-h-[48px] sm:min-h-[28px]">
                      <span className="leading-snug">{currentText}</span>
                      <span className="inline-block w-2 h-4 ml-1 bg-indigo-400 animate-pulse shrink-0" />
                    </div>
                  </div>
                </div>

                {/* Subheading Narrative */}
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 max-w-2xl">
                  Tinggalkan spreadsheet Excel yang rumit. Hitung biaya resep per gram/ml, kelola stok metode FIFO & FEFO, jadwalkan batch produksi, hingga catat penjualan kasir tanpa risiko kebocoran modal.
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
                          <span>Coba Gratis Sekarang</span>
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
                          href="#simulator"
                          onClick={(e) => handleScrollTo(e, "simulator")}
                          className="flex items-center justify-center gap-2"
                        >
                          <Calculator className="size-4 text-primary" />
                          <span>Coba Simulasi HPP</span>
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
                    <span>Metode FIFO & FEFO</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Tanpa Kartu Kredit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Support Multi-Cabang</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Hero Visual Mockup Card */}
              <div className="lg:col-span-5 relative">
                {/* Visual Glow Backdrop */}
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary to-violet-600 opacity-20 blur-xl -z-10" />

                {/* Main Dashboard Preview Card */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-6 relative">
                  {/* Mockup Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 text-primary flex items-center justify-center">
                        <UtensilsCrossed className="size-4.5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 leading-tight">
                          Resep: Kopi Susu Aren 250ml
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Kategori: Minuman Dingin (Single Serving)
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                      Margin Sehat
                    </Badge>
                  </div>

                  {/* Recipe Cost Breakdown List */}
                  <div className="space-y-2.5 mb-5">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-indigo-500" />
                        <span className="font-medium text-slate-700">Bahan Baku (Espresso, Susu, Aren)</span>
                      </div>
                      <span className="font-bold text-slate-900">Rp 4.250</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        <span className="font-medium text-slate-700">Packaging (Cup 14oz, Seal, Straw)</span>
                      </div>
                      <span className="font-bold text-slate-900">Rp 1.150</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        <span className="font-medium text-slate-700">Overhead (Listrik, Gas, Tenaga)</span>
                      </div>
                      <span className="font-bold text-slate-900">Rp 600</span>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Total HPP / Porsi</span>
                      <span className="text-xl font-extrabold text-slate-900">Rp 6.000</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">33.3% dari harga jual</span>
                    </div>
                    <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-100">
                      <span className="text-[10px] uppercase font-bold text-primary block">Harga Jual POS</span>
                      <span className="text-xl font-extrabold text-primary">Rp 18.000</span>
                      <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                        Laba Kotor: +Rp 12.000 (66.7%)
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
            href="#fitur"
            onClick={(e) => handleScrollTo(e, "fitur")}
            className="flex flex-col items-center gap-1.5 hover:text-primary transition-colors cursor-pointer group"
          >
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 group-hover:text-primary">
              Eksplorasi Fitur & Simulasi
            </span>
            <ChevronDown className="size-4 animate-bounce text-primary" />
          </a>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. INTERACTIVE HPP SIMULATOR SECTION                     */}
      {/* ======================================================== */}
      <section id="simulator" className="scroll-mt-20 py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-primary text-xs font-semibold mb-3">
              <Calculator className="size-3.5" />
              <span>Simulasi Interaktif Langsung</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Coba Hitung Margin Resep Anda Sendiri
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-3">
              Pilih menu preset di bawah ini atau atur perkiraan harga jual untuk melihat kalkulasi biaya porsi dan persentase keuntungan secara instan.
            </p>
          </div>

          {/* Interactive Calculator Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            {/* Preset Selector Bar */}
            <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 mr-2 uppercase tracking-wider">
                Pilih Contoh Menu:
              </span>
              {RECIPE_PRESETS.map((preset, idx) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    setSelectedRecipeIndex(idx)
                    setUserSellPrice(null)
                  }}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                    selectedRecipeIndex === idx
                      ? "bg-primary text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-700 hover:border-indigo-300"
                  )}
                >
                  {preset.name}
                </button>
              ))}
            </div>

            <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Cost Breakdown Inputs */}
              <div className="lg:col-span-7 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900">
                    Struktur Biaya Porsi: <span className="text-primary">{currentRecipe.name}</span>
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {currentRecipe.category}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-xs text-slate-500 block mb-1">1. Bahan Baku</span>
                    <span className="text-lg font-extrabold text-slate-900">
                      {formatRupiah(currentRecipe.materialsCost)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">Dihitung per takaran gram/ml</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-xs text-slate-500 block mb-1">2. Packaging</span>
                    <span className="text-lg font-extrabold text-slate-900">
                      {formatRupiah(currentRecipe.packagingCost)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">Wadah, seal, sedotan/box</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-xs text-slate-500 block mb-1">3. Overhead</span>
                    <span className="text-lg font-extrabold text-slate-900">
                      {formatRupiah(currentRecipe.overheadCost)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">Gas, listrik, tenaga kerja</span>
                  </div>
                </div>

                {/* Selling Price Adjustment: Slider + Direct Input */}
                <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">Target Harga Jual Menu:</span>
                      <span className="text-[11px] text-slate-500">Geser slider atau ketik langsung nominalnya</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-3 py-1.5 shadow-xs focus-within:border-primary focus-within:ring-1 focus-within:ring-primary w-fit">
                      <span className="text-xs font-bold text-slate-400">Rp</span>
                      <input
                        type="number"
                        min={totalHpp}
                        max={totalHpp * 10}
                        step={500}
                        value={customSellPrice}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          setUserSellPrice(isNaN(val) || val < 0 ? 0 : val)
                        }}
                        className="w-24 text-right text-base font-extrabold text-primary outline-hidden bg-transparent"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min={totalHpp}
                    max={totalHpp * 4}
                    step={500}
                    value={Math.min(Math.max(customSellPrice, totalHpp), totalHpp * 4)}
                    onChange={(e) => setUserSellPrice(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Titik Impas (BEP): {formatRupiah(totalHpp)}</span>
                    <span>Batas Slider: {formatRupiah(totalHpp * 4)}</span>
                  </div>
                </div>
              </div>

              {/* Calculated Outputs & Financial Diagnosis */}
              <div className="lg:col-span-5 bg-slate-900 rounded-xl p-6 text-white flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                    <span className="text-xs uppercase tracking-wider font-semibold text-indigo-300">
                      Hasil Analisis Finansial
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                      Real-Time
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="text-xs text-slate-400 block">Total HPP per Porsi</span>
                      <div className="text-2xl font-extrabold text-white">
                        {formatRupiah(totalHpp)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                        <span className="text-[10px] uppercase text-slate-400 block font-semibold">
                          Laba Kotor
                        </span>
                        <span className="text-lg font-bold text-emerald-400">
                          {formatRupiah(grossProfit)}
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                        <span className="text-[10px] uppercase text-slate-400 block font-semibold">
                          Margin Persen
                        </span>
                        <span className="text-lg font-bold text-indigo-400">
                          {marginPercentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="flex justify-between text-xs text-slate-300 mb-1">
                        <span>Rasio Food Cost Ideal:</span>
                        <span className="font-bold">{foodCostRatio.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            foodCostRatio <= 35
                              ? "bg-emerald-500"
                              : foodCostRatio <= 45
                              ? "bg-amber-500"
                              : "bg-red-500"
                          )}
                          style={{ width: `${Math.min(foodCostRatio, 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {foodCostRatio <= 35
                          ? "Food cost sangat ideal (<35%) untuk bisnis F&B."
                          : foodCostRatio <= 45
                          ? "Food cost moderat (35-45%). Cocok untuk kafe & resto kasual."
                          : "Peringatan: Food cost tinggi (>45%). Pertimbangkan penyesuaian harga atau kurangi bahan."}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-slate-800">
                  <Button
                    asChild
                    className="w-full bg-primary hover:bg-primary/90 text-white font-semibold text-xs h-10"
                  >
                    <Link to="/register" className="flex items-center justify-center gap-1.5">
                      <span>Hitung Semua Resep Anda di Sistem</span>
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. CORE FEATURES SCROLL SHOWCASE                         */}
      {/* ======================================================== */}
      <section id="fitur" className="scroll-mt-20">
        <FeatureScrollShowcase />
      </section>

      {/* ======================================================== */}
      {/* 4. COMPARISON: SPREADSHEET VS HPP TRACKER                */}
      {/* ======================================================== */}
      <section id="perbandingan" className="scroll-mt-20 py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs uppercase tracking-widest font-bold text-primary mb-2">
              Kenapa Harus Beralih?
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Excel Manual vs HPP Tracker
            </p>
            <p className="text-slate-600 text-sm sm:text-base mt-3">
              Ketahui alasan mengapa ratusan pengusaha beralih dari file spreadsheet yang rawan rusak ke sistem kami.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Old Way: Spreadsheet Manual */}
            <div className="p-7 rounded-2xl bg-white border border-red-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-5">
                  <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                    <FileSpreadsheet className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Cara Lama: Excel / Catatan Kertas</h3>
                    <span className="text-xs text-red-600 font-semibold">Rawan Boncos & Rumit</span>
                  </div>
                </div>

                <ul className="space-y-3.5 text-xs text-slate-600">
                  <li className="flex items-start gap-2.5">
                    <XCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
                    <span>Rumus rawan tertimpa atau error saat staf lain memasukkan data bahan baru.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <XCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
                    <span>Tidak ada otomatisasi FIFO atau FEFO. Bahan mudah basi dan harga beli lama-baru bercampur secara manual.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <XCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
                    <span>Penjualan kasir tidak memotong stok bahan baku mentah secara langsung.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <XCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
                    <span>Sangat sulit memonitor beberapa cabang atau gudang bahan dalam satu tampilan.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400">
                Memakan waktu 2-3 jam setiap minggu hanya untuk merekap nota supplier.
              </div>
            </div>

            {/* Modern Way: HPP Tracker */}
            <div className="p-7 rounded-2xl bg-indigo-50/40 border-2 border-primary shadow-lg flex flex-col justify-between relative ring-2 ring-primary/10">
              <div className="absolute -top-3 right-6 bg-primary text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                <Sparkles className="size-3" /> Solusi Modern
              </div>
              <div>
                <div className="flex items-center gap-3 pb-4 border-b border-indigo-100 mb-5">
                  <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
                    <Factory className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Sistem Baru: HPP Tracker</h3>
                    <span className="text-xs text-primary font-semibold">Akurat, Cepat & Terintegrasi</span>
                  </div>
                </div>

                <ul className="space-y-3.5 text-xs text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="size-4 text-primary shrink-0 mt-0.5" />
                    <span>Perhitungan HPP otomatis per takaran resep dengan formula baku anti error.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="size-4 text-primary shrink-0 mt-0.5" />
                    <span>Algoritma FIFO & FEFO presisi melacak batch pembelian supplier dan memprioritaskan pemakaian bahan sebelum kedaluwarsa.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="size-4 text-primary shrink-0 mt-0.5" />
                    <span>Penjualan kasir POS langsung mengurangi stok porsi atau bahan secara real-time.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="size-4 text-primary shrink-0 mt-0.5" />
                    <span>Dukungan multi-toko dengan isolasi stok bahan serta kontrol akses staf per cabang.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-indigo-100 text-xs text-primary font-semibold flex items-center justify-between">
                <span>Efisiensi waktu hingga 85% untuk audit modal resep</span>
                <ArrowRight className="size-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. 3-STEP STREAMLINED WORKFLOW                           */}
      {/* ======================================================== */}
      <section id="alur-kerja" className="scroll-mt-20 py-20 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="text-xs uppercase tracking-widest font-bold text-primary mb-2">
              Alur Kerja Simpel
            </h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              3 Langkah Kendalikan Finansial Dapur
            </p>
            <p className="text-slate-600 text-sm mt-2">
              Mulai dalam hitungan menit tanpa pelatihan teknis rumit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-slate-50 p-7 rounded-2xl border border-slate-200 shadow-xs relative">
              <div className="h-10 w-10 rounded-xl bg-primary text-white font-extrabold text-base flex items-center justify-center mb-5 shadow-xs">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Input Bahan & Pembelian
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Catat master bahan mentah serta faktur pembelian dengan harga riil supplier. Sistem mencatat batch dan expiry date secara otomatis.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 p-7 rounded-2xl border border-slate-200 shadow-xs relative">
              <div className="h-10 w-10 rounded-xl bg-primary text-white font-extrabold text-base flex items-center justify-center mb-5 shadow-xs">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Formulasikan Resep Menu
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Rakit takaran resep untuk setiap menu. Tambahkan estimasi packaging dan overhead agar kalkulasi biaya porsi bulat sempurna.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50 p-7 rounded-2xl border border-slate-200 shadow-xs relative">
              <div className="h-10 w-10 rounded-xl bg-primary text-white font-extrabold text-base flex items-center justify-center mb-5 shadow-xs">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Pantau HPP & Laba Nyata
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Pantau margin keuntungan saat pesanan masuk di POS atau saat batch produksi selesai. Tidak ada lagi tebak-tebakan harga jual!
              </p>
            </div>
          </div>
        </div>
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
              Pilihan Investasi Terbaik untuk Skala Usaha Anda
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Mulai gratis atau pilih paket bisnis dengan fitur lengkap. Upgrade instan kapan saja via Midtrans.
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
                <ul className="space-y-3 text-xs text-slate-700 mb-8">
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>1 Toko / Cabang Utama</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>15 Bahan Baku & 5 Produk Resep</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>10 Batch Produksi per Bulan</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>1 Staf Toko</span>
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
                className="w-full text-xs font-semibold h-11 rounded-xl border-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                {isAuthenticated ? "Buka Dashboard" : "Coba Gratis Sekarang"}
              </Button>
            </div>

            {/* Growth Plan (Highlighted) */}
            <div className="rounded-2xl border-2 border-primary bg-indigo-50/20 p-7 shadow-lg relative flex flex-col justify-between ring-2 ring-primary/20">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                <Sparkles className="size-3" /> Paling Populer
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
                <ul className="space-y-3 text-xs text-slate-700 mb-8">
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
                    <span>Ekspor Excel & PDF Lengkap</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-primary shrink-0" />
                    <span>Dukungan Teknis Prioritas</span>
                  </li>
                </ul>
              </div>
              <Button
                onClick={() => handlePlanAction("GROWTH")}
                className="w-full text-xs font-semibold h-11 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/25 cursor-pointer"
              >
                Pilih Paket Growth
              </Button>
            </div>

            {/* Max Growth Plan */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xs hover:border-slate-400 transition-all flex flex-col justify-between relative">
              <div className="absolute -top-3 left-6 bg-slate-900 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Zap className="size-3 text-amber-400" /> Waralaba & Resto Besar
              </div>
              <div>
                <div className="mb-4 mt-1">
                  <h3 className="text-lg font-bold text-slate-900">Max Growth</h3>
                  <p className="text-xs text-slate-500 mt-1">Kapasitas maksimal tanpa batas operasional</p>
                </div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-extrabold text-slate-900">Rp 499.000</span>
                  <span className="text-xs text-slate-500">/bulan</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-700 mb-8">
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-slate-900">Hingga 10 Toko / Cabang</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-slate-900">Bahan Baku & Resep Tak Terbatas</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-slate-900">Batch Produksi Tak Terbatas</span>
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
                    <span>Dedicated Support Specialist</span>
                  </li>
                </ul>
              </div>
              <Button
                onClick={() => handlePlanAction("MAX_GROWTH")}
                className="w-full text-xs font-semibold h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
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
              Frequently Asked Questions
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
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-200/60 bg-white">
                      {item.answer}
                    </div>
                  )}
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
            <span>Mulai Sekarang Tanpa Risiko</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-5 leading-tight">
            Siap Menghitung HPP Akurat & Mengamankan Margin Usaha Kuliner Anda?
          </h2>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto mb-9 leading-relaxed">
            Bergabunglah dengan pengusaha kuliner yang telah meninggalkan tebak-tebakan harga jual dan mengendalikan stok secara presisi dengan HPP Tracker.
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
                  <span>Coba Gratis Sekarang</span>
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
                <span className="text-[10px] text-slate-400">Culinary Cost Engine & Inventory</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 text-center md:text-right max-w-md">
              Solusi perhitungan HPP resep porsi, kontrol stok bahan baku metode FIFO & FEFO, simulasi dapur, dan kasir POS terpadu.
            </p>
          </div>
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} HPP Tracker. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a
                href="#fitur"
                onClick={(e) => handleScrollTo(e, "fitur")}
                className="hover:text-slate-300 transition-colors cursor-pointer"
              >
                Fitur
              </a>
              <a
                href="#simulator"
                onClick={(e) => handleScrollTo(e, "simulator")}
                className="hover:text-slate-300 transition-colors cursor-pointer"
              >
                Simulasi
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
