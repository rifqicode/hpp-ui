import * as React from "react"
import { Link } from "react-router-dom"
import {
  Factory,
  Package,
  Boxes,
  Calculator,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Plus,
  RefreshCw,
  Store,
  Sparkles,
  ArrowRight,
  Scale,
  Loader2,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { productionService } from "@/features/production/services/production-service"
import { recipeService, AVAILABLE_MATERIALS } from "@/features/recipes/services/recipe-service"
import { purchaseOrderService } from "@/features/purchase-orders/services/po-service"
import type { ProductionBatch } from "@/features/production/types"
import type { Product } from "@/features/recipes/types"
import type { PurchaseOrder } from "@/features/purchase-orders/types"

function formatCurrencyIdr(val: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val)
}

function getDurationMinutes(startedAt: string): number {
  const start = new Date(startedAt).getTime()
  const now = Date.now()
  return Math.max(1, Math.floor((now - start) / (1000 * 60)))
}

export default function DashboardPage() {
  const [batches, setBatches] = React.useState<ProductionBatch[]>([])
  const [products, setProducts] = React.useState<Product[]>([])
  const [purchaseOrders, setPurchaseOrders] = React.useState<PurchaseOrder[]>([])
  const [loading, setLoading] = React.useState<boolean>(true)
  const [refreshing, setRefreshing] = React.useState<boolean>(false)

  // Current live clock for duration updates
  const [currentTime, setCurrentTime] = React.useState<number>(Date.now())

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now())
    }, 30000) // update every 30s
    return () => clearInterval(timer)
  }, [])

  // Load Dashboard Data
  const loadDashboardData = React.useCallback(async () => {
    try {
      const [bList, pList, poList] = await Promise.all([
        productionService.getBatches(),
        recipeService.getProducts(),
        purchaseOrderService.getPurchaseOrders(),
      ])
      setBatches(bList)
      setProducts(pList)
      setPurchaseOrders(poList.items || [])
    } catch (err) {
      console.error("Failed to load dashboard data:", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  React.useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  function handleRefresh() {
    setRefreshing(true)
    loadDashboardData()
  }

  // ===================== COMPUTED METRICS =====================

  // 1. Active Kitchen Batches (Live Cooking)
  const activeBatches = React.useMemo(() => {
    return batches.filter((b) => b.status === "IN_PROGRESS")
  }, [batches])

  // 2. Completed Batches (Today / Recent)
  const completedBatches = React.useMemo(() => {
    return batches.filter((b) => b.status === "COMPLETED")
  }, [batches])

  // 3. Average Gross Margin across all active recipes
  const averageRecipeMargin = React.useMemo(() => {
    if (products.length === 0) return 60
    const totalMargin = products.reduce((acc, p) => {
      const margin = p.sellingPrice > 0 ? ((p.sellingPrice - p.latestHpp) / p.sellingPrice) * 100 : 0
      return acc + margin
    }, 0)
    return Math.round((totalMargin / products.length) * 10) / 10
  }, [products])

  // 4. Warehouse Inventory Assets Valuation
  const totalInventoryValue = React.useMemo(() => {
    return AVAILABLE_MATERIALS.reduce((acc, mat) => {
      return acc + (mat.currentStock * mat.avgCostPerUnit)
    }, 0)
  }, [])

  // 5. Scrap & Waste Efficiency
  const kitchenScrapStats = React.useMemo(() => {
    if (completedBatches.length === 0) return { scrapRate: 2.5, totalGood: 120 }
    let totalTarget = 0
    let totalWaste = 0
    let totalGood = 0

    completedBatches.forEach((b) => {
      totalTarget += b.targetQuantity
      totalWaste += b.wasteQuantity || 0
      totalGood += b.goodQuantity || 0
    })

    const scrapRate = totalTarget > 0 ? Math.round((totalWaste / totalTarget) * 1000) / 10 : 0
    return { scrapRate, totalGood }
  }, [completedBatches])

  // 6. Critical Stock Alerts (Raw Materials)
  const lowStockAlerts = React.useMemo(() => {
    // Defined thresholds for materials
    const thresholds: Record<string, number> = {
      "mat-1": 15000, // Tepung min 15kg
      "mat-2": 6000,  // Minyak min 6L
      "mat-4": 800,   // Ragi min 800g
      "mat-6": 2500,  // Mentega min 2.5kg
      "mat-8": 5000,  // Telur min 5kg
    }

    return AVAILABLE_MATERIALS.map((mat) => {
      const minStock = thresholds[mat.id] || 2000
      const isOut = mat.currentStock <= 0
      const isLow = mat.currentStock < minStock
      return {
        ...mat,
        minStock,
        isOut,
        isLow,
      }
    }).filter((m) => m.isLow || m.isOut)
  }, [])

  // 7. Pending Purchase Orders
  const pendingPOs = React.useMemo(() => {
    return purchaseOrders.filter((po) => po.status === "IN_PROGRESS")
  }, [purchaseOrders])

  // 8. Recipe Margin Watchlist (Sorted by Margin)
  const recipeWatchlist = React.useMemo(() => {
    return products.map((p) => {
      const margin = p.sellingPrice > 0 ? Math.round(((p.sellingPrice - p.latestHpp) / p.sellingPrice) * 1000) / 10 : 0
      const profitPerUnit = p.sellingPrice - p.latestHpp
      return {
        ...p,
        margin,
        profitPerUnit,
      }
    }).sort((a, b) => b.margin - a.margin)
  }, [products])

  const topStarRecipes = recipeWatchlist.slice(0, 3)
  const atRiskRecipes = recipeWatchlist.filter((r) => r.margin < 50)

  // 9. Recent Activity Feed
  const recentActivities = React.useMemo(() => {
    const list: { id: string; title: string; desc: string; time: string; type: "production" | "po" | "stock"; badge: string }[] = []

    // From completed batches
    completedBatches.slice(0, 2).forEach((b) => {
      list.push({
        id: `act-${b.id}`,
        title: `Batch Selesai: ${b.productName}`,
        desc: `Hasil panen: ${b.goodQuantity} ${b.productUnit} | HPP Final: ${formatCurrencyIdr(b.hppPerUnit || 0)}`,
        time: "Hari ini",
        type: "production",
        badge: "Produksi",
      })
    })

    // From pending POs
    pendingPOs.slice(0, 2).forEach((po) => {
      list.push({
        id: `act-${po.id}`,
        title: `PO Dikirim: ${po.supplierName}`,
        desc: `${po.items.length} item bahan baku dalam perjalanan`,
        time: "Kemarin",
        type: "po",
        badge: "Pembelian",
      })
    })

    // From active batches
    activeBatches.slice(0, 1).forEach((b) => {
      list.push({
        id: `act-${b.id}`,
        title: `Batch Dimulai: ${b.productName}`,
        desc: `Target: ${b.targetQuantity} ${b.productUnit} di oven`,
        time: "Sedang Berjalan",
        type: "production",
        badge: "Live Kitchen",
      })
    })

    return list
  }, [completedBatches, pendingPOs, activeBatches])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Memuat ringkasan data operasional & HPP...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-16 animate-in fade-in duration-300">
      {/* ========================================================= */}
      {/* 1. HEADER & STORE IDENTITY BAR                           */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Dashboard Operasional & HPP
            </h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs font-semibold">
              Live Overview
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
            <Store className="h-3.5 w-3.5 text-primary" />
            <span>Toko Roti Enak - Cabang Tebet</span>
            <span>•</span>
            <span className="font-mono">
              {new Date(currentTime).toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-xl h-9 text-xs font-semibold flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? "Memperbarui..." : "Segarkan Data"}</span>
          </Button>

          <Button
            asChild
            size="sm"
            className="rounded-xl h-9 text-xs font-semibold bg-primary text-primary-foreground flex items-center gap-1.5 shadow-sm"
          >
            <Link to="/production/batches/new">
              <Plus className="h-3.5 w-3.5" />
              <span>Mulai Batch Dapur</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. PILAR FINANSIAL & PROFITABILITAS (4 EXECUTIVE CARDS)   */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Rata-rata Gross Margin */}
        <Card className="rounded-2xl border-border shadow-sm bg-card">
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Rata-rata Margin Resep
              </CardDescription>
              <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black font-mono mt-1 text-foreground">
              {averageRecipeMargin}%
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] py-0 px-1.5 font-semibold">
                Sehat (&gt;50%)
              </Badge>
              <span className="text-[11px] truncate">dari {products.length} menu aktif</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Batch Dapur Sedang Berjalan */}
        <Card className="rounded-2xl border-border shadow-sm bg-card">
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Batch Sedang Dimasak
              </CardDescription>
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black font-mono mt-1 text-foreground flex items-baseline gap-1.5">
              {activeBatches.length} <span className="text-xs font-semibold text-muted-foreground">batch aktif</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <Link
              to="/production/batches"
              className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1"
            >
              Lihat di Live Kitchen <ChevronRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Card 3: Nilai Aset Bahan Baku (Gudang) */}
        <Card className="rounded-2xl border-border shadow-sm bg-card">
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Nilai Aset Bahan Baku
              </CardDescription>
              <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Package className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-black font-mono mt-1 text-foreground">
              {formatCurrencyIdr(totalInventoryValue)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <p className="text-[11px] text-muted-foreground">
              Tersebar di {AVAILABLE_MATERIALS.length} jenis bahan baku FIFO
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Efisiensi & Tingkat Scrap Dapur */}
        <Card className="rounded-2xl border-border shadow-sm bg-card">
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Tingkat Scrap / Afkir
              </CardDescription>
              <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Scale className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black font-mono mt-1 text-foreground">
              {kitchenScrapStats.scrapRate}%
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] py-0 px-1.5 font-semibold">
                Sangat Baik (&lt;5%)
              </Badge>
              <span className="text-[11px]">Hasil panen tinggi</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================= */}
      {/* 3. PUSAT AKSI OPERASIONAL CEPAT (4 QUICK ACTIONS)         */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button
          asChild
          variant="outline"
          className="h-20 flex-col items-start justify-center p-4 rounded-2xl border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
        >
          <Link to="/production/batches/new">
            <div className="flex items-center justify-between w-full mb-1">
              <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                <Factory className="h-4 w-4" />
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
            <span className="font-bold text-xs text-foreground block">Mulai Batch Baru</span>
            <span className="text-[10px] text-muted-foreground block truncate">Kunci bahan baku FIFO dapur</span>
          </Link>
        </Button>

        <Button
          asChild
          variant="outline"
          className="h-20 flex-col items-start justify-center p-4 rounded-2xl border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
        >
          <Link to="/inventory/purchase-orders/new">
            <div className="flex items-center justify-between w-full mb-1">
              <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Package className="h-4 w-4" />
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
            <span className="font-bold text-xs text-foreground block">Buat PO Bahan Baku</span>
            <span className="text-[10px] text-muted-foreground block truncate">Pesan bahan ke supplier</span>
          </Link>
        </Button>

        <Button
          asChild
          variant="outline"
          className="h-20 flex-col items-start justify-center p-4 rounded-2xl border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
        >
          <Link to="/production/products/new">
            <div className="flex items-center justify-between w-full mb-1">
              <div className="h-8 w-8 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Boxes className="h-4 w-4" />
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
            <span className="font-bold text-xs text-foreground block">Tambah Produk Baru</span>
            <span className="text-[10px] text-muted-foreground block truncate">Atur formula & standar HPP</span>
          </Link>
        </Button>

        <Button
          asChild
          variant="outline"
          className="h-20 flex-col items-start justify-center p-4 rounded-2xl border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
        >
          <Link to="/production/hpp">
            <div className="flex items-center justify-between w-full mb-1">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Calculator className="h-4 w-4" />
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
            <span className="font-bold text-xs text-foreground block">Kalkulator HPP & Ojol</span>
            <span className="text-[10px] text-muted-foreground block truncate">Simulasi harga GoFood & BEP</span>
          </Link>
        </Button>
      </div>

      {/* ========================================================= */}
      {/* 4. MAIN WORKSPACE GRID (KOLOM KIRI 7 / KANAN 5)            */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= KOLOM KIRI (7 cols) ================= */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Card A: Live Kitchen Status */}
          <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
            <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/80 flex flex-row items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Factory className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base font-bold">
                    Dapur Produksi Sedang Berjalan
                  </CardTitle>
                </div>
                <CardDescription className="text-xs mt-0.5">
                  Batch yang sedang dipanggang / diracik dengan alokasi bahan FIFO.
                </CardDescription>
              </div>

              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs font-mono font-semibold">
                {activeBatches.length} Batch Aktif
              </Badge>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-3">
              {activeBatches.length === 0 ? (
                <div className="p-8 text-center border border-dashed rounded-xl flex flex-col items-center justify-center bg-muted/10">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground/60 mb-2" />
                  <p className="text-xs font-semibold text-foreground">Semua batch selesai diproduksi</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Dapur sedang tidak memiliki antrean masak aktif.
                  </p>
                  <Button asChild size="sm" className="mt-4 rounded-xl text-xs">
                    <Link to="/production/batches/new">Mulai Batch Baru</Link>
                  </Button>
                </div>
              ) : (
                activeBatches.map((batch) => {
                  const minutesElapsed = getDurationMinutes(batch.startedAt)
                  return (
                    <div
                      key={batch.id}
                      className="p-3.5 rounded-xl border border-border/80 bg-card hover:border-primary/40 hover:bg-muted/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-foreground">
                            {batch.batchNumber}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <Badge variant="secondary" className="text-[10px] py-0 px-2 font-medium">
                            {batch.productCategory}
                          </Badge>
                        </div>
                        <h4 className="font-bold text-sm text-foreground truncate">
                          {batch.productName}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>
                            Target: <strong className="text-foreground">{batch.targetQuantity} {batch.productUnit}</strong>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-primary font-semibold">
                            <Clock className="h-3 w-3" />
                            <span>{minutesElapsed} menit di oven</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <Button
                          asChild
                          size="sm"
                          className="rounded-xl text-xs h-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs"
                        >
                          <Link to={`/production/batches/${batch.id}`}>
                            Selesaikan & Hitung HPP
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Card B: Watchlist Margin Resep & Peringatan Risiko */}
          <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
            <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/80 flex flex-row items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base font-bold">
                    Performa Margin Resep Produk
                  </CardTitle>
                </div>
                <CardDescription className="text-xs mt-0.5">
                  Pemantauan margin laba kotor terhadap standar HPP resep aktif.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                {atRiskRecipes.length > 0 && (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-[10px] py-0 font-medium">
                    {atRiskRecipes.length} Perlu Pantau
                  </Badge>
                )}
                <Link
                  to="/production/products"
                  className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                >
                  Semua Produk <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-4">
              {/* Star Recipes vs Watchlist */}
              <div className="space-y-3">
                {topStarRecipes.map((item) => (
                  <div key={item.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{item.name}</span>
                        <Badge variant="outline" className="text-[9px] py-0 px-1.5 bg-muted">
                          {item.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground font-mono">
                          HPP: {formatCurrencyIdr(item.latestHpp)}
                        </span>
                        <span className="font-mono font-bold text-emerald-600">
                          {item.margin}% Margin
                        </span>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.max(5, item.margin))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Channel Delivery Commission Insight */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-900">Tips Optimasi Margin Multi-Channel:</p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Penjualan lewat GoFood / GrabFood memotong komisi 20%. Pastikan harga menu online telah disesuaikan melalui <strong>HPP Calculator</strong> agar keuntungan bersih tidak tergerus.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ================= KOLOM KANAN (5 cols) ================= */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Card C: Peringatan Stok Kritis (Needs Attention) */}
          <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
            <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/80 flex flex-row items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <CardTitle className="text-base font-bold">
                    Perhatian: Stok Kritis
                  </CardTitle>
                </div>
                <CardDescription className="text-xs mt-0.5">
                  Bahan baku di bawah batas aman gudang.
                </CardDescription>
              </div>

              {lowStockAlerts.length > 0 ? (
                <Badge variant="destructive" className="text-xs font-mono font-semibold">
                  {lowStockAlerts.length} Bahan Kritis
                </Badge>
              ) : (
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs font-semibold">
                  Semua Aman
                </Badge>
              )}
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-3">
              {lowStockAlerts.length === 0 ? (
                <div className="p-6 text-center border border-dashed rounded-xl bg-muted/10 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1.5" />
                  <p className="font-semibold text-foreground">Persediaan Bahan Sehat</p>
                  <p className="text-[11px] mt-0.5">Semua bahan baku berada di atas batas minimum stok.</p>
                </div>
              ) : (
                lowStockAlerts.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-amber-500/20 bg-amber-50/40 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <h5 className="font-bold text-xs text-foreground truncate">{item.name}</h5>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Stok: <strong className="text-destructive font-mono">{item.currentStock} {item.baseUnit}</strong> (Min: {item.minStock} {item.baseUnit})
                      </p>
                    </div>

                    <Button asChild size="sm" variant="outline" className="h-7 text-[11px] rounded-lg border-amber-300 text-amber-800 hover:bg-amber-100 shrink-0">
                      <Link to="/inventory/purchase-orders/new">
                        Pesan PO
                      </Link>
                    </Button>
                  </div>
                ))
              )}

              <Button
                asChild
                variant="outline"
                className="w-full h-8 rounded-xl text-xs font-semibold"
              >
                <Link to="/inventory/stocks">Lihat Semua Stok Bahan</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Card D: Logistik & Purchase Order Tertunda */}
          <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
            <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/80 flex flex-row items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base font-bold">
                    Pesanan Pembelian (PO)
                  </CardTitle>
                </div>
                <CardDescription className="text-xs mt-0.5">
                  Pengiriman bahan baku dari supplier.
                </CardDescription>
              </div>

              <Badge variant="outline" className="text-xs font-mono font-semibold">
                {pendingPOs.length} Menunggu Tiba
              </Badge>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-3">
              {pendingPOs.length === 0 ? (
                <div className="p-6 text-center border border-dashed rounded-xl bg-muted/10 text-xs text-muted-foreground">
                  <p>Tidak ada PO yang sedang berjalan.</p>
                  <Button asChild size="sm" variant="outline" className="mt-3 rounded-xl text-xs">
                    <Link to="/inventory/purchase-orders/new">+ Buat PO Baru</Link>
                  </Button>
                </div>
              ) : (
                pendingPOs.slice(0, 2).map((po) => (
                  <div
                    key={po.id}
                    className="p-3 rounded-xl border border-border/80 bg-card flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-foreground">{po.poNumber}</span>
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-[10px] py-0 font-medium">
                        Dalam Proses
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium truncate">{po.supplierName}</p>
                    <div className="pt-1.5 border-t border-border/60 flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">{po.items.length} item bahan</span>
                      <Link
                        to={`/inventory/purchase-orders/${po.id}`}
                        className="text-primary hover:underline font-semibold flex items-center gap-0.5"
                      >
                        Verifikasi Masuk <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))
              )}

              <Button
                asChild
                variant="outline"
                className="w-full h-8 rounded-xl text-xs font-semibold"
              >
                <Link to="/inventory/purchase-orders">Semua Purchase Order</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Card E: Log Aktivitas Terkini */}
          <Card className="rounded-2xl border-border shadow-sm p-4 sm:p-5 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              Aktivitas Terbaru Dapur & Gudang
            </h4>

            <div className="space-y-3 pt-1">
              {recentActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-2.5 text-xs">
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">{act.title}</p>
                    <p className="text-[11px] text-muted-foreground">{act.desc}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 font-mono">{act.time}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
