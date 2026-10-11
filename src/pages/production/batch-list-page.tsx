import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  MoreVertical,
  Check,
  RotateCcw,
  Loader2,
  RefreshCw,
  X,
  History,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { TablePagination } from "@/components/ui/table-pagination"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { productionService } from "@/features/production/services/production-service"
import type {
  ProductionBatch,
  CompleteProductionInput,
  ProductionOverheadDetail,
} from "@/features/production/types"
import { overheadService } from "@/features/overheads/services/overhead-service"
import type { OverheadType } from "@/features/overheads/types"

function formatCurrencyIdr(val: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val)
}

function formatElapsedTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  if (diffMinutes < 1) return "Baru saja"
  if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`
  const hours = Math.floor(diffMinutes / 60)
  const remainingMinutes = diffMinutes % 60
  return `${hours} jam ${remainingMinutes > 0 ? remainingMinutes + " mnt" : ""} yang lalu`
}

export default function BatchListPage() {
  const navigate = useNavigate()

  const [batches, setBatches] = React.useState<ProductionBatch[]>([])
  const [loading, setLoading] = React.useState<boolean>(true)

  // Filter & Search
  const [search, setSearch] = React.useState<string>("")
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL")

  // Modal: Complete Production
  const [isCompleteOpen, setIsCompleteOpen] = React.useState<boolean>(false)
  const [batchToComplete, setBatchToComplete] = React.useState<ProductionBatch | null>(null)
  const [activeOverheads, setActiveOverheads] = React.useState<OverheadType[]>([])
  const [completeOverheadItems, setCompleteOverheadItems] = React.useState<ProductionOverheadDetail[]>([])
  const [completeData, setCompleteData] = React.useState<CompleteProductionInput>({
    goodQuantity: 0,
    wasteQuantity: 0,
    notes: "",
  })
  const [completeError, setCompleteError] = React.useState<string>("")

  // Modal: Cancel Production
  const [isCancelOpen, setIsCancelOpen] = React.useState<boolean>(false)
  const [batchToCancel, setBatchToCancel] = React.useState<ProductionBatch | null>(null)
  const [cancelReason, setCancelReason] = React.useState<string>("")

  const [submitting, setSubmitting] = React.useState<boolean>(false)

  // Pagination
  const [page, setPage] = React.useState(1)
  const pageSize = 10

  const fetchBatchData = React.useCallback(async () => {
    setLoading(true)
    try {
      const [bList, ohList] = await Promise.all([
        productionService.getBatches(),
        overheadService.getOverheads({ activeOnly: true, category: 'PRODUCTION' }),
      ])
      setBatches(bList)
      setActiveOverheads(ohList)
    } catch (err) {
      console.error("Failed to load batch data:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchBatchData()
  }, [fetchBatchData])

  // Aggregate statistics
  const stats = React.useMemo(() => {
    const queuedCount = batches.filter((b) => b.status === "QUEUED").length
    const activeCount = batches.filter((b) => b.status === "IN_PROGRESS").length
    const completedList = batches.filter((b) => b.status === "COMPLETED")
    const completedCount = completedList.length

    let totalTarget = 0
    let totalGood = 0
    let totalSpent = 0

    completedList.forEach((b) => {
      totalTarget += b.targetQuantity
      totalGood += b.goodQuantity || 0
      totalSpent += b.totalCost || 0
    })

    const avgYield = totalTarget > 0 ? Math.round((totalGood / totalTarget) * 1000) / 10 : 100

    return { queuedCount, activeCount, completedCount, avgYield, totalSpent }
  }, [batches])

  // Filtered batches
  const filteredBatches = React.useMemo(() => {
    return batches.filter((b) => {
      const matchSearch =
        b.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
        b.productName.toLowerCase().includes(search.toLowerCase()) ||
        (b.notes && b.notes.toLowerCase().includes(search.toLowerCase()))

      const matchStatus = statusFilter === "ALL" || b.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [batches, search, statusFilter])

  // Paginated batches
  const totalPages = Math.ceil(filteredBatches.length / pageSize) || 1
  const paginatedBatches = React.useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredBatches.slice(start, start + pageSize)
  }, [filteredBatches, page, pageSize])

  // In-progress list
  const activeBatches = React.useMemo(() => {
    return batches.filter((b) => b.status === "IN_PROGRESS")
  }, [batches])

  // Queued list (MTO / Pesanan Baru)
  const queuedBatches = React.useMemo(() => {
    return batches.filter((b) => b.status === "QUEUED")
  }, [batches])

  // Pickup Batch Handler
  async function handlePickupBatch(batchId: string) {
    try {
      const updated = await productionService.pickupProduction(batchId)
      setBatches((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
    } catch (err) {
      console.error("Failed to pickup production batch:", err)
    }
  }

  // Open complete modal
  function openCompleteDialog(batch: ProductionBatch) {
    setBatchToComplete(batch)

    // Build initial overhead items
    let initialOhs: ProductionOverheadDetail[] = []
    if (batch.recipeSnapshot?.overheads && batch.recipeSnapshot.overheads.length > 0) {
      initialOhs = batch.recipeSnapshot.overheads.map((so) => ({
        overheadTypeId: so.overhead_type_id,
        name: so.name,
        amount: so.amount || 0,
      }))
    } else if (activeOverheads.length > 0) {
      initialOhs = activeOverheads
        .filter((ao) => !ao.category || ao.category === "PRODUCTION")
        .map((ao) => ({
          overheadTypeId: ao.id,
          name: ao.name,
          amount: ao.defaultAmount || 0,
        }))
    }

    setCompleteOverheadItems(initialOhs)
    setCompleteData({
      goodQuantity: batch.targetQuantity,
      wasteQuantity: 0,
      notes: "",
    })
    setCompleteError("")
    setIsCompleteOpen(true)
  }

  // Handle Complete Production Submit
  async function handleCompleteSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!batchToComplete) return
    if (completeData.goodQuantity <= 0) {
      setCompleteError("Jumlah unit bagus harus lebih dari 0")
      return
    }

    setSubmitting(true)
    setCompleteError("")
    try {
      const payload: CompleteProductionInput = {
        ...completeData,
        overheads: completeOverheadItems,
      }
      const completed = await productionService.completeProduction(batchToComplete.id, payload)
      setBatches((prev) => prev.map((b) => (b.id === completed.id ? completed : b)))
      setIsCompleteOpen(false)
      setBatchToComplete(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyelesaikan produksi"
      setCompleteError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Cancel Production Submit
  async function handleCancelSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!batchToCancel) return

    setSubmitting(true)
    try {
      const cancelled = await productionService.cancelProduction(batchToCancel.id, cancelReason)
      setBatches((prev) => prev.map((b) => (b.id === cancelled.id ? cancelled : b)))
      setIsCancelOpen(false)
      setBatchToCancel(null)
      setCancelReason("")
    } catch (err) {
      console.error("Failed to cancel production:", err)
    } finally {
      setSubmitting(false)
    }
  }

  // Calculations for Complete modal
  const completeStockCost = batchToComplete ? batchToComplete.stockCost : 0
  const completeOverheadTotal = completeOverheadItems.reduce((acc, it) => acc + (it.amount || 0), 0)
  const completeTotalCost = completeStockCost + completeOverheadTotal
  const completeHppPerUnit = completeData.goodQuantity > 0 ? Math.round(completeTotalCost / completeData.goodQuantity) : 0
  const completeSellingPrice = batchToComplete?.sellingPrice || 0
  const completeMargin = completeSellingPrice > 0 ? Math.round(((completeSellingPrice - completeHppPerUnit) / completeSellingPrice) * 1000) / 10 : 0

  return (
    <div className="flex flex-col gap-6 pb-16 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <History className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Dapur Produksi & Batch HPP
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Pantau batch yang sedang berjalan, input hasil panen (yield), dan hitung HPP aktual otomatis berbasis FIFO
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBatchData}
            disabled={loading}
            className="flex items-center gap-1.5 shadow-2xs hover:bg-muted"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </Button>
          <Button
            onClick={() => navigate("/production/batches/new")}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-2xs"
          >
            <Plus className="h-4 w-4" />
            Mulai Batch Baru
          </Button>
        </div>
      </div>

      {/* KPI / Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Batch */}
        <Card className="py-3 px-4 shadow-2xs border-border/80 bg-card">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Total Batch Produksi</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  {batches.length}
                </span>
                <span className="text-xs text-muted-foreground">batch tercatat</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <History className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Sedang Berjalan */}
        <Card className="py-3 px-4 shadow-2xs border-border/80 bg-card">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Sedang Berjalan</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                  {stats.activeCount}
                </span>
                <span className="text-xs text-muted-foreground">di dapur aktif</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Selesai */}
        <Card className="py-3 px-4 shadow-2xs border-border/80 bg-card">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Batch Selesai</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  {stats.completedCount}
                </span>
                <span className="text-xs text-muted-foreground">yield {stats.avgYield}%</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Dibatalkan */}
        <Card className="py-3 px-4 shadow-2xs border-border/80 bg-card">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Dibatalkan / Void</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                  {batches.filter((b) => b.status === "CANCELLED" || b.status === "VOID").length}
                </span>
                <span className="text-xs text-muted-foreground">batch batal</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <XCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION: QUEUED BATCHES (MTO & ANTREAN PESANAN BARU) */}
      {(statusFilter === "ALL" || statusFilter === "QUEUED") && queuedBatches.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-purple-500 animate-pulse" />
              <h2 className="text-base font-bold text-foreground">Antrean Pesanan Masuk (Make-to-Order)</h2>
              <Badge variant="outline" className="bg-purple-500/10 text-purple-700 border-purple-300 font-mono text-xs font-bold">
                {queuedBatches.length} Antrean
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">Klik 'Mulai Proses' untuk mulai memasak</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {queuedBatches.map((batch) => (
              <Card
                key={batch.id}
                onClick={() => navigate(`/production/batches/${batch.id}`)}
                className="rounded-2xl border-purple-200/90 shadow-sm hover:shadow-md hover:border-purple-400 transition-all duration-200 overflow-hidden bg-purple-50/20 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="p-5 pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                        {batch.batchNumber}
                      </span>
                      <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300 text-[11px] font-bold">
                        Antrean Dapur
                      </Badge>
                    </div>

                    <h3 className="text-base font-bold text-foreground group-hover:text-purple-700 transition-colors mt-2.5 line-clamp-1">
                      {batch.productName}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground/80" />
                      {formatElapsedTime(batch.startedAt)}
                    </p>
                  </div>

                  <div className="px-5 py-3 bg-white/80 border-y border-purple-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Jumlah Pesanan</span>
                      <span className="font-mono font-bold text-sm text-foreground">
                        {batch.targetQuantity} {batch.productUnit}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-muted-foreground block text-[11px]">Tipe Produksi</span>
                      <span className="font-bold text-xs text-purple-700">
                        {batch.saleId ? 'Pesanan Kasir (MTO)' : 'Rencana Produksi'}
                      </span>
                    </div>
                  </div>

                  {batch.notes && (
                    <div className="p-5 py-2 text-xs text-muted-foreground line-clamp-1 italic">
                      "{batch.notes}"
                    </div>
                  )}
                </div>

                <div className="p-4 pt-2 border-t border-purple-100 bg-white flex items-center gap-2">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePickupBatch(batch.id)
                    }}
                    className="flex-1 rounded-xl h-9 text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 shadow-sm"
                  >
                    <Clock className="h-3.5 w-3.5 mr-1.5" /> Mulai Proses (Pickup)
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* SECTION: ACTIVE BATCHES IN PROGRESS (DAPUR LANGSUNG) */}
      {(statusFilter === "ALL" || statusFilter === "IN_PROGRESS") && activeBatches.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h2 className="text-base font-bold text-foreground">Sedang Berlangsung di Dapur</h2>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-300 font-mono text-xs font-bold">
                {activeBatches.length} Batch
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">Klik kartu untuk melihat detail audit</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeBatches.map((batch) => (
              <Card
                key={batch.id}
                onClick={() => navigate(`/production/batches/${batch.id}`)}
                className="rounded-2xl border-slate-200/90 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 overflow-hidden bg-card cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="p-5 pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        {batch.batchNumber}
                      </span>
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-300 text-[11px] font-bold flex items-center gap-1">
                        <Clock className="h-3 w-3 animate-spin" /> Sedang Diproduksi
                      </Badge>
                    </div>

                    <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors mt-2.5 line-clamp-1">
                      {batch.productName}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground/80" />
                      {formatElapsedTime(batch.startedAt)}
                    </p>
                  </div>

                  <div className="px-5 py-3 bg-slate-50/80 border-y border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Target Produksi</span>
                      <span className="font-mono font-bold text-sm text-foreground">
                        {batch.targetQuantity} {batch.productUnit}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-muted-foreground block text-[11px]">Bahan Terpotong</span>
                      <span className="font-mono font-bold text-sm text-primary">
                        {formatCurrencyIdr(batch.stockCost)}
                      </span>
                    </div>
                  </div>

                  {batch.notes && (
                    <div className="p-5 py-2 text-xs text-muted-foreground line-clamp-1 italic">
                      "{batch.notes}"
                    </div>
                  )}
                </div>

                <div className="p-4 pt-2 border-t border-slate-100 bg-white flex items-center gap-2">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      openCompleteDialog(batch)
                    }}
                    className="flex-1 rounded-xl h-9 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                  >
                    <Check className="h-3.5 w-3.5 mr-1.5" /> Selesaikan & Hitung HPP
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => e.stopPropagation()}
                        className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 rounded-xl">
                      <DropdownMenuItem onClick={() => navigate(`/production/batches/${batch.id}`)}>
                        Detail Bahan & Audit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          setBatchToCancel(batch)
                          setIsCancelOpen(true)
                        }}
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Batalkan Batch
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Standalone Search & Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-card p-3 rounded-xl border border-border shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nomor batch, produk, catatan..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9 bg-background/50 h-9 text-xs"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("")
                setPage(1)
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/50 text-xs overflow-x-auto">
          {[
            { key: "ALL", label: "Semua", count: batches.length },
            { key: "QUEUED", label: "Antrean MTO", count: stats.queuedCount },
            { key: "IN_PROGRESS", label: "Dapur Aktif", count: stats.activeCount },
            { key: "COMPLETED", label: "Selesai", count: stats.completedCount },
            { key: "CANCELLED", label: "Batal", count: batches.filter((b) => b.status === "CANCELLED" || b.status === "VOID").length },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setStatusFilter(tab.key)
                setPage(1)
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
                statusFilter === tab.key
                  ? "bg-background text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                  statusFilter === tab.key
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* FULL BATCH TABLE */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Memuat data batch produksi...</p>
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 sm:p-16 text-center rounded-2xl border-2 border-dashed border-border bg-card/60 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-inner">
            <History className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Tidak Ada Data Batch Produksi</h2>
          <p className="text-sm text-muted-foreground max-w-md mt-1 mb-6">
            {search || statusFilter !== "ALL"
              ? "Tidak ada batch yang cocok dengan kata kunci atau filter status saat ini."
              : "Mulai jalankan batch produksi pertama Anda untuk menghitung HPP secara presisi!"}
          </p>
          <Button
            onClick={() => navigate("/production/batches/new")}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Mulai Batch Pertama
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
                  <tr>
                    <th className="px-5 py-3.5">Nomor Batch & Waktu</th>
                    <th className="px-5 py-3.5">Produk Jadi</th>
                    <th className="px-5 py-3.5">Hasil Produksi (Yield)</th>
                    <th className="px-5 py-3.5">Biaya Bahan (BOM)</th>
                    <th className="px-5 py-3.5">Biaya Overhead</th>
                    <th className="px-5 py-3.5">HPP per Unit</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {paginatedBatches.map((batch) => {
                    const yieldRate = batch.goodQuantity && batch.targetQuantity > 0
                      ? Math.round((batch.goodQuantity / batch.targetQuantity) * 1000) / 10
                      : null

                    return (
                      <tr
                        key={batch.id}
                        onClick={() => navigate(`/production/batches/${batch.id}`)}
                        className="hover:bg-muted/30 transition-colors group cursor-pointer"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col">
                            <span className="font-mono font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                              {batch.batchNumber}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {new Date(batch.startedAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm text-foreground">
                              {batch.productName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {batch.productCategory || "Tanpa Kategori"} • Satuan: {batch.productUnit}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          {batch.status === "COMPLETED" ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="font-mono font-bold text-sm text-foreground">
                                {batch.goodQuantity} {batch.productUnit}
                                {batch.wasteQuantity ? (
                                  <span className="text-xs font-normal text-amber-600 dark:text-amber-400 ml-1">
                                    (Afkir: {batch.wasteQuantity})
                                  </span>
                                ) : null}
                              </span>
                              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                Yield: {yieldRate}%
                              </span>
                            </div>
                          ) : batch.status === "IN_PROGRESS" ? (
                            <span className="font-mono text-sm text-muted-foreground">
                              Target: {batch.targetQuantity} {batch.productUnit}
                            </span>
                          ) : (
                            <span className="text-xs text-rose-600 dark:text-rose-400">Dibatalkan</span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 font-mono font-bold text-sm text-foreground">
                          {formatCurrencyIdr(batch.stockCost)}
                        </td>

                        <td className="px-5 py-3.5 font-mono text-sm text-muted-foreground">
                          {batch.overheadCost ? formatCurrencyIdr(batch.overheadCost) : "-"}
                        </td>

                        <td className="px-5 py-3.5">
                          {batch.hppPerUnit ? (
                            <div className="flex flex-col">
                              <span className="font-mono font-black text-sm text-primary">
                                {formatCurrencyIdr(batch.hppPerUnit)}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                per {batch.productUnit}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Menunggu panen</span>
                          )}
                        </td>

                        <td className="px-5 py-3.5">
                          {batch.status === "QUEUED" && (
                            <Badge variant="outline" className="text-xs font-semibold bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 flex items-center gap-1 w-fit">
                              <Clock className="h-3 w-3" /> Antrean Dapur
                            </Badge>
                          )}
                          {batch.status === "IN_PROGRESS" && (
                            <Badge variant="outline" className="text-xs font-semibold bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 flex items-center gap-1 w-fit">
                              <Clock className="h-3 w-3" /> Berjalan
                            </Badge>
                          )}
                          {batch.status === "COMPLETED" && (
                            <Badge variant="outline" className="text-xs font-semibold bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="h-3 w-3" /> Selesai
                            </Badge>
                          )}
                          {(batch.status === "CANCELLED" || batch.status === "VOID") && (
                            <Badge variant="outline" className="text-xs font-semibold bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 flex items-center gap-1 w-fit">
                              <XCircle className="h-3 w-3" /> {batch.status === "VOID" ? "Void" : "Batal"}
                            </Badge>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          {batch.status === "QUEUED" ? (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handlePickupBatch(batch.id)
                              }}
                              className="rounded-lg text-xs h-8 bg-purple-600 text-white hover:bg-purple-700 font-medium shadow-2xs"
                            >
                              Mulai (Pickup)
                            </Button>
                          ) : batch.status === "IN_PROGRESS" ? (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                openCompleteDialog(batch)
                              }}
                              className="rounded-lg text-xs h-8 bg-primary text-primary-foreground font-medium shadow-2xs hover:bg-primary/90"
                            >
                              Hitung HPP
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/production/batches/${batch.id}`)
                              }}
                              className="rounded-lg text-xs h-8 shadow-2xs hover:bg-muted"
                            >
                              Audit HPP
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <TablePagination
            total={filteredBatches.length}
            displayedCount={paginatedBatches.length}
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={loading}
            label="batch"
          />
        </div>
      )}

      {/* DIALOG 2: SELESAIKAN BATCH PRODUKSI & HITUNG HPP */}
      <Dialog open={isCompleteOpen} onOpenChange={setIsCompleteOpen}>
        <DialogContent className="sm:max-w-[560px] rounded-2xl p-6">
          <DialogHeader>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl font-bold">
              Selesaikan Batch & Kalkulasi HPP
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Batch <strong className="text-foreground">{batchToComplete?.batchNumber}</strong>: Masukkan hasil panen aktual dan biaya overhead riil.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCompleteSubmit} className="space-y-4 py-2">
            {completeError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{completeError}</span>
              </div>
            )}

            {/* Yield Input Section */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                1. Hasil Panen Produksi (Yield)
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs font-semibold">
                    Unit Bagus / Berhasil <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={completeData.goodQuantity}
                    onChange={(e) => setCompleteData({ ...completeData, goodQuantity: Number(e.target.value) })}
                    className="rounded-xl h-10 font-mono font-bold text-base"
                    required
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs font-semibold">Unit Rusak / Afkir (Scrap)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={completeData.wasteQuantity}
                    onChange={(e) => setCompleteData({ ...completeData, wasteQuantity: Number(e.target.value) })}
                    className="rounded-xl h-10 font-mono text-base"
                  />
                </div>
              </div>
            </div>

            {/* Overhead Cost Inputs */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  2. Biaya Overhead Operasional (Batch Ini)
                </span>
                <span className="text-xs font-mono font-bold text-slate-700">
                  Total: {formatCurrencyIdr(completeOverheadTotal)}
                </span>
              </div>

              {completeOverheadItems.length === 0 ? (
                <div className="text-xs text-muted-foreground py-2 text-center">
                  Tidak ada overhead aktif untuk batch ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {completeOverheadItems.map((oh, idx) => (
                    <div key={oh.overheadTypeId || idx} className="grid gap-1 bg-white p-2.5 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-slate-800 truncate" title={oh.name}>
                          {oh.name}
                        </Label>
                        <Badge variant="outline" className="text-[9px] py-0 px-1 font-medium bg-emerald-50 text-emerald-700 border-emerald-200">
                          Biaya Produksi
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium">Rp</span>
                        <Input
                          type="number"
                          min="0"
                          step="500"
                          value={oh.amount === 0 ? "0" : (oh.amount || "")}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0
                            setCompleteOverheadItems((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, amount: val } : item))
                            )
                          }}
                          className="rounded-lg h-8 text-xs font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live HPP Calculation Summary Preview */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary block">
                3. Hasil Kalkulasi HPP Akhir
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Total Modal Batch:</span>
                  <div className="font-mono font-bold text-foreground">
                    {formatCurrencyIdr(completeTotalCost)}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    (Bahan: {formatCurrencyIdr(completeStockCost)} + Overhead: {formatCurrencyIdr(completeOverheadTotal)})
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-muted-foreground">HPP per Unit:</span>
                  <div className="font-mono font-black text-xl text-primary">
                    {formatCurrencyIdr(completeHppPerUnit)}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold">
                    Margin: +{completeMargin}%
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCompleteOpen(false)}
                className="rounded-xl"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-primary text-primary-foreground font-semibold"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Simpan & Masukkan ke Stok Jadi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: BATALKAN BATCH */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl p-6">
          <DialogHeader>
            <div className="h-10 w-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-2">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle className="text-lg font-bold">Batalkan Batch Produksi?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Batch <strong className="text-foreground">{batchToCancel?.batchNumber}</strong> akan dibatalkan. Bahan baku yang telah terpotong akan <strong>dikembalikan ke stok gudang</strong> secara otomatis.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCancelSubmit} className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label className="text-xs font-semibold">Alasan Pembatalan</Label>
              <Input
                placeholder="Contoh: Oven mati, adonan rusak/terkontaminasi..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="rounded-xl h-10 text-sm"
                required
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCancelOpen(false)}
                className="rounded-xl"
              >
                Kembali
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={submitting}
                className="rounded-xl"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Batalkan & Pulihkan Stok
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
