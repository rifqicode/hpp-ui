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
  ArrowRight,
  Scale,
  Loader2,
  Calendar,
  Layers,
  DollarSign,
  PieChart,
  ShoppingBag,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { useAuthStore } from "@/store/use-auth-store"
import { useStoresQuery } from "@/features/settings/hooks/use-stores-query"
import { dashboardService } from "@/features/dashboard/services/dashboard-service"
import type {
  OperationalDashboardData,
  HPPDashboardData,
} from "@/features/dashboard/types"

function formatCurrencyIdr(val: number | string): string {
  const num = typeof val === "string" ? parseFloat(val) || 0 : val
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

function parseNum(val: number | string | undefined | null): number {
  if (val === undefined || val === null) return 0
  if (typeof val === "number") return val
  return parseFloat(val) || 0
}

export default function DashboardPage() {
  const activeStoreId = useAuthStore((state) => state.activeStoreId)
  const activeStoreName = useAuthStore((state) => state.activeStoreName)
  const { data: stores = [] } = useStoresQuery()
  const activeStore = (activeStoreId && stores.find((s) => s.id === activeStoreId)) || null
  const displayStoreName = activeStore?.name || activeStoreName || "Toko Aktif"
  const [activeTab, setActiveTab] = React.useState<"operational" | "hpp">("operational")
  const [hppPeriod, setHppPeriod] = React.useState<"today" | "week" | "month">("week")

  const [operationalData, setOperationalData] = React.useState<OperationalDashboardData | null>(null)
  const [hppData, setHppData] = React.useState<HPPDashboardData | null>(null)

  const [loading, setLoading] = React.useState<boolean>(true)
  const [refreshing, setRefreshing] = React.useState<boolean>(false)
  const [currentTime, setCurrentTime] = React.useState<number>(Date.now())

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now())
    }, 30000)
    return () => clearInterval(timer)
  }, [])

  const loadData = React.useCallback(async (period: "today" | "week" | "month") => {
    try {
      const [op, hpp] = await Promise.all([
        dashboardService.getOperationalDashboard(),
        dashboardService.getHPPDashboard(period),
      ])
      setOperationalData(op)
      setHppData(hpp)
    } catch (err) {
      console.error("Failed to load dashboard data:", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  React.useEffect(() => {
    loadData(hppPeriod)
  }, [loadData, hppPeriod])

  const handleRefresh = () => {
    setRefreshing(true)
    loadData(hppPeriod)
  }

  if (loading && !operationalData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">
          Memuat ringkasan analytics operasional & HPP...
        </p>
      </div>
    )
  }

  const activeBatches = operationalData?.active_batches || []
  const scrapStats = operationalData?.waste_scrap_summary
  const lowStockAlerts = operationalData?.low_stock_alerts || []
  const expiringBatches = operationalData?.expiring_batches || []
  const pendingPOCount = operationalData?.pending_po_count || 0
  const inventoryValuation = parseNum(operationalData?.total_inventory_valuation)

  const costBreakdown = hppData?.cost_breakdown
  const avgMargin = parseNum(hppData?.average_product_margin)
  const starProducts = hppData?.star_products || []
  const atRiskProducts = hppData?.at_risk_products || hppData?.atRisk_products || []
  const realizedVsRecipe = hppData?.realized_vs_recipe_hpp || []
  const salesSummary = hppData?.sales_summary

  return (
    <div className="flex flex-col gap-6 pb-16 animate-in fade-in duration-300">
      {/* ========================================================= */}
      {/* 1. HEADER & STORE IDENTITY BAR                           */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Dashboard Analytics & HPP
            </h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs font-semibold shrink-0">
              Real-Time
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 flex flex-wrap items-center gap-2 gap-y-1">
            <Store className="h-3.5 w-3.5 text-primary" />
            <span>{displayStoreName}</span>
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

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-xl h-9 text-xs font-semibold flex items-center gap-1.5 flex-1 sm:flex-initial"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Memperbarui..." : "Segarkan Data"}</span>
          </Button>

          <Button
            asChild
            size="sm"
            className="rounded-xl h-9 text-xs font-semibold bg-primary text-primary-foreground flex items-center gap-1.5 shadow-sm flex-1 sm:flex-initial"
          >
            <Link to="/production/batches/new">
              <Plus className="h-3.5 w-3.5" />
              <span>Mulai Batch Dapur</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. TAB CONTROLS                                           */}
      {/* ========================================================= */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "operational" | "hpp")}
        className="w-full space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex h-auto rounded-xl bg-muted/60 p-1">
            <TabsTrigger value="operational" className="rounded-lg text-[11px] sm:text-xs font-bold px-2.5 sm:px-4 py-2 flex items-center gap-2 truncate">
              <Factory className="h-4 w-4 shrink-0" />
              <span className="truncate">Operational Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="hpp" className="rounded-lg text-[11px] sm:text-xs font-bold px-2.5 sm:px-4 py-2 flex items-center gap-2 truncate">
              <TrendingUp className="h-4 w-4 shrink-0" />
              <span className="truncate">HPP & Margin Dashboard</span>
            </TabsTrigger>
          </TabsList>

          {activeTab === "hpp" && (
            <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-xl self-start sm:self-auto border border-border/60">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground ml-2 mr-1" />
              {(["today", "week", "month"] as const).map((p) => (
                <Button
                  key={p}
                  variant={hppPeriod === p ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setHppPeriod(p)}
                  className={`h-7 px-2.5 text-xs rounded-lg font-semibold capitalize ${
                    hppPeriod === p ? "shadow-xs" : "text-muted-foreground"
                  }`}
                >
                  {p === "today" ? "Hari Ini" : p === "week" ? "7 Hari" : "30 Hari"}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* 3. TAB CONTENT: OPERATIONAL DASHBOARD                     */}
        {/* ========================================================= */}
        <TabsContent value="operational" className="space-y-6 m-0">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Active Batches */}
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
                  {operationalData?.active_batch_count || activeBatches.length}{" "}
                  <span className="text-xs font-semibold text-muted-foreground">batch aktif</span>
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

            {/* Card 2: Scrap / Waste Rate */}
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
                  {parseNum(scrapStats?.scrap_rate_pct)}%
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] py-0 px-1.5 font-semibold">
                    {parseNum(scrapStats?.scrap_rate_pct) <= 5 ? "Efisien (<5%)" : "Perlu Pantau"}
                  </Badge>
                  <span className="text-[11px] truncate">
                    {scrapStats?.completed_batches || 0} batch selesai
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Inventory Valuation */}
            <Card className="rounded-2xl border-border shadow-sm bg-card">
              <CardHeader className="p-4 pb-1">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Valuasi Stok Gudang
                  </CardDescription>
                  <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Package className="h-4 w-4" />
                  </div>
                </div>
                <CardTitle className="text-xl sm:text-2xl font-black font-mono mt-1 text-foreground truncate">
                  {formatCurrencyIdr(inventoryValuation)}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <p className="text-[11px] text-muted-foreground">
                  Berdasarkan kalkulasi sisa stok batch aktif
                </p>
              </CardContent>
            </Card>

            {/* Card 4: Pending POs */}
            <Card className="rounded-2xl border-border shadow-sm bg-card">
              <CardHeader className="p-4 pb-1">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Pending Purchase Orders
                  </CardDescription>
                  <div className="h-7 w-7 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center">
                    <Layers className="h-4 w-4" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-black font-mono mt-1 text-foreground">
                  {pendingPOCount} <span className="text-xs font-semibold text-muted-foreground">PO</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <Link
                  to="/inventory/purchase-orders"
                  className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1"
                >
                  Kelola PO Masuk <ChevronRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              asChild
              variant="outline"
              className="h-20 flex-col items-start justify-center p-4 rounded-2xl border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group min-w-0 overflow-hidden"
            >
              <Link to="/production/batches/new">
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Factory className="h-4 w-4" />
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
                <span className="font-bold text-xs text-foreground block w-full truncate">Mulai Batch Baru</span>
                <span className="text-[10px] text-muted-foreground block w-full truncate">Kunci bahan baku FIFO dapur</span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-20 flex-col items-start justify-center p-4 rounded-2xl border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group min-w-0 overflow-hidden"
            >
              <Link to="/inventory/purchase-orders/new">
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Package className="h-4 w-4" />
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
                <span className="font-bold text-xs text-foreground block w-full truncate">Buat PO Bahan Baku</span>
                <span className="text-[10px] text-muted-foreground block w-full truncate">Pesan bahan ke supplier</span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-20 flex-col items-start justify-center p-4 rounded-2xl border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group min-w-0 overflow-hidden"
            >
              <Link to="/production/products/new">
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="h-8 w-8 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Boxes className="h-4 w-4" />
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
                <span className="font-bold text-xs text-foreground block w-full truncate">Tambah Produk Baru</span>
                <span className="text-[10px] text-muted-foreground block w-full truncate">Atur formula & standar HPP</span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-20 flex-col items-start justify-center p-4 rounded-2xl border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group min-w-0 overflow-hidden"
            >
              <Link to="/production/hpp">
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Calculator className="h-4 w-4" />
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
                <span className="font-bold text-xs text-foreground block w-full truncate">Kalkulator HPP & Ojol</span>
                <span className="text-[10px] text-muted-foreground block w-full truncate">Simulasi harga GoFood & BEP</span>
              </Link>
            </Button>
          </div>

          {/* Operational Split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 7 cols: Active Batches */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
                <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/80 flex flex-row items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Factory className="h-4 w-4 text-primary" />
                      <CardTitle className="text-base font-bold">
                        Dapur Produksi Sedang Berjalan
                      </CardTitle>
                    </div>
                    <CardDescription className="text-xs mt-0.5">
                      Batch aktif yang sedang dipanggang / diracik dengan alokasi bahan FIFO.
                    </CardDescription>
                  </div>

                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs font-mono font-semibold shrink-0">
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
                    activeBatches.map((b) => (
                      <div
                        key={b.id}
                        className="p-3.5 rounded-xl border border-border/80 bg-card hover:border-primary/40 hover:bg-muted/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs font-bold text-foreground">
                              {b.batch_number}
                            </span>
                            {b.category && (
                              <>
                                <span className="text-muted-foreground">•</span>
                                <Badge variant="secondary" className="text-[10px] py-0 px-2 font-medium">
                                  {b.category}
                                </Badge>
                              </>
                            )}
                          </div>
                          <h4 className="font-bold text-sm text-foreground truncate">
                            {b.product_name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-3 gap-y-1 text-xs text-muted-foreground mt-1">
                            <span>
                              Target: <strong className="text-foreground">{b.target_quantity} {b.product_unit}</strong>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-primary font-semibold">
                              <Clock className="h-3 w-3" />
                              <span>{b.elapsed_minutes} menit berjalan</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <Button
                            asChild
                            size="sm"
                            className="rounded-xl text-xs h-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs"
                          >
                            <Link to={`/production/batches/${b.id}`}>
                              Selesaikan Batch
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Expiring Stock Batches Alert */}
              <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
                <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/80 flex flex-row items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <CardTitle className="text-base font-bold">
                        Peringatan Kadaluarsa Batch Bahan (14 Hari)
                      </CardTitle>
                    </div>
                    <CardDescription className="text-xs mt-0.5">
                      Batch penerimaan bahan baku yang mendekati tanggal expired.
                    </CardDescription>
                  </div>

                  <Badge variant="outline" className="text-xs font-mono font-semibold shrink-0">
                    {expiringBatches.length} Batch
                  </Badge>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 space-y-2.5">
                  {expiringBatches.length === 0 ? (
                    <div className="p-6 text-center border border-dashed rounded-xl bg-muted/10 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1.5" />
                      <p className="font-semibold text-foreground">Tidak Ada Batch Kritis</p>
                      <p className="text-[11px] mt-0.5">Seluruh batch bahan baku dalam kondisi masa simpan aman.</p>
                    </div>
                  ) : (
                    expiringBatches.map((eb) => (
                      <div
                        key={eb.batch_id}
                        className="p-3 rounded-xl border border-amber-500/20 bg-amber-50/30 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <h5 className="font-bold text-foreground truncate">{eb.stock_name}</h5>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Sisa: <strong className="font-mono text-foreground">{eb.remaining_quantity} {eb.base_unit}</strong> @ {formatCurrencyIdr(eb.price_per_unit)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-[10px] py-0 font-semibold">
                            {eb.days_until_expiry <= 0 ? "Kadaluarsa Hari Ini" : `${eb.days_until_expiry} hari lagi`}
                          </Badge>
                          <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                            {new Date(eb.expired_at).toLocaleDateString("id-ID")}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right 5 cols: Low Stock Alerts */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
                <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/80 flex flex-row items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <CardTitle className="text-base font-bold">
                        Perhatian: Stok Kritis
                      </CardTitle>
                    </div>
                    <CardDescription className="text-xs mt-0.5">
                      Bahan baku di bawah batas minimum stok.
                    </CardDescription>
                  </div>

                  {lowStockAlerts.length > 0 ? (
                    <Badge variant="destructive" className="text-xs font-mono font-semibold shrink-0">
                      {lowStockAlerts.length} Kritis
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs font-semibold shrink-0">
                      Aman
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
                    lowStockAlerts.map((item) => (
                      <div
                        key={item.stock_id}
                        className="p-3 rounded-xl border border-amber-500/20 bg-amber-50/40 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <h5 className="font-bold text-xs text-foreground truncate">{item.stock_name}</h5>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Stok: <strong className="text-destructive font-mono">{item.current_stock} {item.base_unit}</strong> (Min: {item.min_stock})
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
            </div>
          </div>
        </TabsContent>

        {/* ========================================================= */}
        {/* 4. TAB CONTENT: HPP & MARGIN DASHBOARD                   */}
        {/* ========================================================= */}
        <TabsContent value="hpp" className="space-y-6 m-0">
          {/* Executive Overview Cards for HPP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Average Recipe Margin */}
            <Card className="rounded-2xl border-border shadow-sm bg-card">
              <CardHeader className="p-4 pb-1">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Rata-rata Margin Produk
                  </CardDescription>
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-black font-mono mt-1 text-foreground">
                  {avgMargin}%
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] py-0 px-1.5 font-semibold">
                    {avgMargin >= 50 ? "Target Terpenuhi (≥50%)" : "Perlu Penyesuaian"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Total Revenue (Period) */}
            <Card className="rounded-2xl border-border shadow-sm bg-card">
              <CardHeader className="p-4 pb-1">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Total Pendapatan
                  </CardDescription>
                  <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <DollarSign className="h-4 w-4" />
                  </div>
                </div>
                <CardTitle className="text-xl sm:text-2xl font-black font-mono mt-1 text-foreground truncate">
                  {formatCurrencyIdr(salesSummary?.total_revenue || 0)}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <p className="text-[11px] text-muted-foreground">
                  {salesSummary?.total_transactions || 0} transaksi kasir
                </p>
              </CardContent>
            </Card>

            {/* Card 3: Total Gross Profit (Period) */}
            <Card className="rounded-2xl border-border shadow-sm bg-card">
              <CardHeader className="p-4 pb-1">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Laba Kotor (Gross Profit)
                  </CardDescription>
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <PieChart className="h-4 w-4" />
                  </div>
                </div>
                <CardTitle className="text-xl sm:text-2xl font-black font-mono mt-1 text-emerald-600 truncate">
                  {formatCurrencyIdr(salesSummary?.gross_profit || 0)}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <p className="text-[11px] text-muted-foreground">
                  Margin kasir: {parseNum(salesSummary?.profit_margin_pct)}%
                </p>
              </CardContent>
            </Card>

            {/* Card 4: Total Production Cost (Period) */}
            <Card className="rounded-2xl border-border shadow-sm bg-card">
              <CardHeader className="p-4 pb-1">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Biaya Produksi Terwujud
                  </CardDescription>
                  <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <Factory className="h-4 w-4" />
                  </div>
                </div>
                <CardTitle className="text-xl sm:text-2xl font-black font-mono mt-1 text-foreground truncate">
                  {formatCurrencyIdr(costBreakdown?.total_cost || 0)}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <p className="text-[11px] text-muted-foreground">
                  BOM + Tenaga Kerja + Overhead
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Cost Structure Breakdown Bar */}
          <Card className="rounded-2xl border-border shadow-sm p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/80 pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground">Komposisi Struktur Biaya Produksi</h3>
                <p className="text-xs text-muted-foreground">
                  Proporsi biaya bahan baku (BOM), tenaga kerja, dan beban overhead selama periode terpilih.
                </p>
              </div>
              <Badge variant="outline" className="font-mono text-xs self-start sm:self-auto">
                Total: {formatCurrencyIdr(costBreakdown?.total_cost || 0)}
              </Badge>
            </div>

            {/* Visual Multi-Segment Bar */}
            <div className="w-full bg-muted/60 h-4 rounded-xl overflow-hidden flex">
              <div
                className="bg-primary h-full transition-all"
                style={{ width: `${parseNum(costBreakdown?.bom_share_pct)}%` }}
                title={`BOM: ${parseNum(costBreakdown?.bom_share_pct)}%`}
              />
              <div
                className="bg-amber-500 h-full transition-all"
                style={{ width: `${parseNum(costBreakdown?.labor_share_pct)}%` }}
                title={`Labor: ${parseNum(costBreakdown?.labor_share_pct)}%`}
              />
              <div
                className="bg-emerald-500 h-full transition-all"
                style={{ width: `${parseNum(costBreakdown?.overhead_share_pct)}%` }}
                title={`Overhead: ${parseNum(costBreakdown?.overhead_share_pct)}%`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    Bahan Baku (BOM)
                  </span>
                  <span className="font-mono text-xs font-bold">{parseNum(costBreakdown?.bom_share_pct)}%</span>
                </div>
                <p className="font-mono text-sm font-bold text-foreground">
                  {formatCurrencyIdr(costBreakdown?.bom_cost || 0)}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Tenaga Kerja (Labor)
                  </span>
                  <span className="font-mono text-xs font-bold">{parseNum(costBreakdown?.labor_share_pct)}%</span>
                </div>
                <p className="font-mono text-sm font-bold text-foreground">
                  {formatCurrencyIdr(costBreakdown?.labor_cost || 0)}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Beban Overhead
                  </span>
                  <span className="font-mono text-xs font-bold">{parseNum(costBreakdown?.overhead_share_pct)}%</span>
                </div>
                <p className="font-mono text-sm font-bold text-foreground">
                  {formatCurrencyIdr(costBreakdown?.overhead_cost || 0)}
                </p>
              </div>
            </div>
          </Card>

          {/* Product Margins & Realized vs Recipe HPP */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 6 cols: Star & At-Risk Products */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              {/* Star Products */}
              <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
                <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/80 flex flex-row items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      <CardTitle className="text-base font-bold">
                        Star Products (Margin Tertinggi)
                      </CardTitle>
                    </div>
                    <CardDescription className="text-xs mt-0.5">
                      Produk dengan kontribusi margin laba kotor tertinggi.
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 space-y-3">
                  {starProducts.length === 0 ? (
                    <div className="p-6 text-center border border-dashed rounded-xl bg-muted/10 text-xs text-muted-foreground">
                      Belum ada katalog produk.
                    </div>
                  ) : (
                    starProducts.map((p) => (
                      <div key={p.product_id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-foreground truncate">{p.product_name}</span>
                          <span className="font-mono font-bold text-emerald-600">
                            {p.margin_pct}% Margin
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[11px] text-muted-foreground font-mono">
                          <span>Jual: {formatCurrencyIdr(p.selling_price)}</span>
                          <span>HPP: {formatCurrencyIdr(p.hpp)}</span>
                          <span className="text-emerald-700">Laba: {formatCurrencyIdr(p.profit_unit)}/unit</span>
                        </div>
                        <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.max(5, parseNum(p.margin_pct)))}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* At-Risk Products */}
              {atRiskProducts.length > 0 && (
                <Card className="rounded-2xl border-destructive/30 shadow-sm overflow-hidden">
                  <CardHeader className="p-4 sm:p-5 pb-3 border-b border-destructive/20 bg-destructive/5 flex flex-row items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <CardTitle className="text-base font-bold text-destructive">
                          Produk Berisiko (Di Bawah Target Margin)
                        </CardTitle>
                      </div>
                      <CardDescription className="text-xs mt-0.5">
                        Margin aktual produk di bawah target margin yang ditetapkan.
                      </CardDescription>
                    </div>
                    <Badge variant="destructive" className="text-xs font-mono font-semibold shrink-0">
                      {atRiskProducts.length} Produk
                    </Badge>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-5 space-y-3">
                    {atRiskProducts.map((p) => (
                      <div
                        key={p.product_id}
                        className="p-3 rounded-xl border border-destructive/20 bg-destructive/5 flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0">
                          <h5 className="font-bold text-foreground truncate">{p.product_name}</h5>
                          <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                            HPP: {formatCurrencyIdr(p.hpp)} | Jual: {formatCurrencyIdr(p.selling_price)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-destructive block">
                            {p.margin_pct}%
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Target: {p.target_margin || "50"}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right 6 cols: Realized vs Recipe Standard HPP */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
                <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/80 flex flex-row items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-primary" />
                      <CardTitle className="text-base font-bold">
                        HPP Terwujud vs Standar Resep
                      </CardTitle>
                    </div>
                    <CardDescription className="text-xs mt-0.5">
                      Perbandingan HPP produksi aktual batch selesai dengan HPP standar formula resep.
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 space-y-3">
                  {realizedVsRecipe.length === 0 ? (
                    <div className="p-6 text-center border border-dashed rounded-xl bg-muted/10 text-xs text-muted-foreground">
                      Belum ada eksekusi batch selesai pada periode ini.
                    </div>
                  ) : (
                    realizedVsRecipe.map((item) => {
                      const varianceNum = parseNum(item.variance_amount)
                      const isOverBudget = varianceNum > 0
                      return (
                        <div
                          key={item.product_id}
                          className="p-3.5 rounded-xl border border-border/80 bg-card space-y-2"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-foreground truncate">{item.product_name}</span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-mono font-semibold py-0 ${
                                isOverBudget
                                  ? "bg-destructive/10 text-destructive border-destructive/20"
                                  : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              }`}
                            >
                              {isOverBudget ? `+${item.variance_pct}% (Over)` : `${item.variance_pct}% (Hemat)`}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 rounded-lg bg-muted/40 font-mono">
                              <span className="text-[10px] text-muted-foreground block">Standar Resep</span>
                              <span className="font-bold">{formatCurrencyIdr(item.recipe_hpp)}</span>
                            </div>
                            <div className="p-2 rounded-lg bg-muted/40 font-mono">
                              <span className="text-[10px] text-muted-foreground block">Aktual Terwujud</span>
                              <span className="font-bold">{formatCurrencyIdr(item.realized_hpp)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </CardContent>
              </Card>

              {/* Channel Delivery Commission Insight */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 flex items-start gap-3">
                <ShoppingBag className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-950">Simulasi Harga Ojol & Marketplace:</p>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    Pastikan produk dengan margin tipis (&lt;50%) disimulasikan melalui kalkulator HPP sebelum didaftarkan ke platform pengiriman makanan untuk mencegah kerugian akibat komisi agregator.
                  </p>
                  <Button asChild size="sm" variant="outline" className="mt-2 h-7 text-xs rounded-xl bg-background border-amber-300">
                    <Link to="/production/hpp">Buka Kalkulator HPP & Ojol</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
