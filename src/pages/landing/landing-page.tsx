import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Factory,
  ArrowRight,
  Sparkles,
  Calculator,
  Boxes,
  ChefHat,
  ShoppingCart,
  CheckCircle2,
  ShieldCheck,
  BarChart3,
  Layers,
  Check,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/use-auth-store"
import { UpgradeModal } from "@/features/subscription/components/UpgradeModal"
import type { SubscriptionTier } from "@/features/subscription/types/subscription"

export default function LandingPage() {
  const navigate = useNavigate()
  const token = useAuthStore((state) => state.token)
  const isAuthenticated = Boolean(token)
  const [isUpgradeOpen, setIsUpgradeOpen] = React.useState(false)
  const [selectedTier, setSelectedTier] = React.useState<SubscriptionTier>('GROWTH')

  const handlePlanAction = (tier: SubscriptionTier) => {
    if (tier === 'FREE') {
      if (isAuthenticated) {
        navigate('/dashboard')
      } else {
        navigate('/register')
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
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
              <Factory className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-lg text-slate-900 leading-tight">
                HPP TRACKER
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-indigo-600">
                Culinary Cost Engine
              </span>
            </div>
          </Link>

          {/* Nav Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-medium">
                <Link to="/dashboard" className="flex items-center gap-2">
                  <span>Buka Dashboard</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild className="text-slate-600 hover:text-slate-900 font-medium">
                  <Link to="/login">Masuk</Link>
                </Button>
                <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-medium">
                  <Link to="/register" className="flex items-center gap-1.5">
                    <span>Mulai Gratis</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-100 to-violet-100 rounded-full blur-3xl -z-10 opacity-70 pointer-events-none" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100/80 text-indigo-700 text-xs sm:text-sm font-semibold mb-6 shadow-sm">
              <Sparkles className="size-4 text-indigo-600" />
              <span>Solusi Cerdas Manajemen HPP & Efisiensi Dapur Kuliner</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6">
              Hitung HPP Akurat, Kontrol Stok Bahan, dan{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Maksimalkan Margin Usaha
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-10">
              Platform terintegrasi untuk menghitung biaya resep per porsi, memantau stok bahan baku dengan FIFO, merencanakan batch produksi, dan mencatat transaksi penjualan kasir secara otomatis.
            </p>

            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
              {isAuthenticated ? (
                <Button size="lg" asChild className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 h-11 px-6 font-semibold">
                  <Link to="/dashboard" className="flex items-center justify-center gap-2">
                    <span>Masuk ke Dashboard Utama</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" asChild className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 h-11 px-6 font-semibold">
                    <Link to="/register" className="flex items-center justify-center gap-2">
                      <span>Mulai Gratis Sekarang</span>
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="w-full sm:w-auto border-slate-300 text-slate-700 hover:bg-slate-100 h-11 px-6 font-semibold">
                    <Link to="/login">Masuk ke Akun</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Feature Pills */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm font-medium text-slate-600">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200/80 shadow-xs">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span>Hitung HPP Otomatis</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200/80 shadow-xs">
                <Layers className="size-4 text-indigo-500" />
                <span>Metode Stok FIFO</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200/80 shadow-xs">
                <ShieldCheck className="size-4 text-amber-500" />
                <span>Anti Boncos & Waste</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200/80 shadow-xs">
                <BarChart3 className="size-4 text-blue-500" />
                <span>Laporan Margin Real-time</span>
              </div>
            </div>
          </div>
        </section>

        {/* Core Feature Grid */}
        <section className="py-16 bg-white border-y border-slate-200/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-xs uppercase tracking-widest font-bold text-indigo-600 mb-2">
                Fitur Unggulan
              </h2>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Dirancang Khusus untuk Bisnis F&B & Manufaktur Kuliner
              </p>
              <p className="text-sm sm:text-base text-slate-500 mt-2">
                Kelola seluruh siklus biaya bahan mentah dari pembelian supplier hingga kasir kasir dalam satu sistem yang rapi.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col group">
                <div className="h-12 w-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <Calculator className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Kalkulasi HPP & Resep
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed flex-1">
                  Hitung cost bahan baku per gram/ml secara presisi dan tentukan harga jual dengan target margin ideal.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center text-xs font-semibold text-indigo-600">
                  <span>Presisi Desimal Finansial</span>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col group">
                <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <Boxes className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Manajemen Stok & Bahan (FIFO)
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed flex-1">
                  Pantau sisa stok, expiry date, dan harga beli per batch pembelian secara transparan dan akurat.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center text-xs font-semibold text-blue-600">
                  <span>First-In First-Out Otomatis</span>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col group">
                <div className="h-12 w-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <ChefHat className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Produksi & Simulasi Dapur
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed flex-1">
                  Buat rencana batch produksi masakan, pantau rendemen/waste, dan otomatis potong stok bahan mentah.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center text-xs font-semibold text-violet-600">
                  <span>Auto Deduct Bahan Mentah</span>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col group">
                <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <ShoppingCart className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Kasir POS & Penjualan
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed flex-1">
                  Kasir cepat terhubung langsung ke inventaris dan laporan laba kotor real-time untuk setiap struk belanja.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center text-xs font-semibold text-emerald-600">
                  <span>Sinkronisasi Kasir & Laba</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Workflow Section: 3 Langkah Mudah */}
        <section className="py-16 md:py-20 bg-slate-50/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-14">
              <h2 className="text-xs uppercase tracking-widest font-bold text-indigo-600 mb-2">
                Alur Kerja Simpel
              </h2>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                3 Langkah Kendalikan Finansial Dapur
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Step 1 */}
              <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs relative">
                <div className="h-9 w-9 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center mb-5 shadow-xs">
                  1
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Catat Bahan Baku & Pembelian
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Input master bahan mentah serta faktur pembelian dengan harga beli riil. Sistem mencatat batch dan tanggal kedaluwarsa secara otomatis.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs relative">
                <div className="h-9 w-9 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center mb-5 shadow-xs">
                  2
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Formulasikan Resep Menu
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Rakit takaran resep untuk setiap menu. Tambahkan estimasi biaya overhead (gas, listrik, packaging) agar kalkulasi biaya porsi bulat sempurna.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs relative">
                <div className="h-9 w-9 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center mb-5 shadow-xs">
                  3
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Ketahui HPP & Laba Nyata
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Pantau margin keuntungan setiap kali pesanan masuk di POS atau saat batch produksi selesai. Tidak ada lagi tebak-tebakan harga jual!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-white border-t border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-3">
                <Sparkles className="size-3.5 text-indigo-600" />
                <span>Pilihan Paket Berlangganan</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
                Investasi Terbaik untuk Efisiensi Bisnis Kuliner Anda
              </h2>
              <p className="text-slate-600 text-base leading-relaxed">
                Pilih paket yang sesuai dengan skala usaha Anda. Upgrade kapan saja melalui sistem pembayaran instan Midtrans.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
              {/* Free Plan */}
              <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-900">Free Starter</h3>
                    <p className="text-xs text-slate-500 mt-1">Cocok untuk UMKM rintisan & tester menu baru</p>
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
                      <span>Laporan Biaya & Margin Standar</span>
                    </li>
                  </ul>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handlePlanAction('FREE')}
                  className="w-full text-xs font-semibold h-10 rounded-xl border-slate-200 hover:bg-slate-50"
                >
                  {isAuthenticated ? 'Buka Dashboard' : 'Mulai Gratis Sekarang'}
                </Button>
              </div>

              {/* Growth Plan - Highlighted */}
              <div className="rounded-2xl border-2 border-indigo-600 bg-indigo-50/20 p-7 shadow-lg relative flex flex-col justify-between ring-2 ring-indigo-500/20">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-sm flex items-center gap-1">
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
                      <Check className="size-4 text-indigo-600 shrink-0" />
                      <span className="font-semibold text-slate-900">Hingga 3 Toko / Cabang</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="size-4 text-indigo-600 shrink-0" />
                      <span>100 Bahan Baku & 50 Produk Resep</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="size-4 text-indigo-600 shrink-0" />
                      <span>150 Batch Produksi per Bulan</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="size-4 text-indigo-600 shrink-0" />
                      <span>3 Staf per Toko</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="size-4 text-indigo-600 shrink-0" />
                      <span>Ekspor Laporan Lengkap (Excel & PDF)</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="size-4 text-indigo-600 shrink-0" />
                      <span>Dukungan Teknis Prioritas</span>
                    </li>
                  </ul>
                </div>
                <Button
                  onClick={() => handlePlanAction('GROWTH')}
                  className="w-full text-xs font-semibold h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
                >
                  Pilih Paket Growth
                </Button>
              </div>

              {/* Max Growth Plan */}
              <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between relative">
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
                      <span>Analitik Produksi & Multi-Role Penuh</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="size-4 text-emerald-600 shrink-0" />
                      <span>Dedicated Account Specialist</span>
                    </li>
                  </ul>
                </div>
                <Button
                  onClick={() => handlePlanAction('MAX_GROWTH')}
                  className="w-full text-xs font-semibold h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white"
                >
                  Pilih Paket Max Growth
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="py-16 md:py-20 bg-indigo-900 text-white relative overflow-hidden">
          {/* Subtle gradient background accent */}
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
              Siap Mengendalikan Biaya Produksi & Menghentikan Kebocoran Dapur?
            </h2>
            <p className="text-indigo-200 text-sm sm:text-base max-w-2xl mx-auto mb-8 leading-relaxed">
              Bergabunglah dengan pengusaha kuliner yang telah mengoptimalkan kalkulasi HPP dan mengamankan margin keuntungan bisnis mereka.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
              {isAuthenticated ? (
                <Button size="lg" asChild className="bg-white text-indigo-950 hover:bg-indigo-50 font-bold px-7 h-11 shadow-lg">
                  <Link to="/dashboard" className="flex items-center gap-2">
                    <span>Lanjutkan ke Dashboard</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <Button size="lg" asChild className="bg-white text-indigo-950 hover:bg-indigo-50 font-bold px-7 h-11 shadow-lg">
                  <Link to="/register" className="flex items-center gap-2">
                    <span>Daftar Akun Baru Sekarang</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Factory className="size-4" />
              </div>
              <span className="font-bold text-white tracking-tight">HPP TRACKER</span>
            </div>
            <p className="text-xs text-slate-400 text-center md:text-right max-w-md">
              Aplikasi kalkulator HPP, kontrol stok FIFO, simulasi produksi resep, dan manajemen kasir terpadu untuk industri F&B.
            </p>
          </div>
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} HPP Tracker. All rights reserved.</p>
            <div className="flex items-center gap-4">
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

      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        initialSelectedTier={selectedTier}
        reason="Dapatkan fitur premium untuk mengoptimalkan operasional dan profit bisnis kuliner Anda."
      />
    </div>
  )
}
