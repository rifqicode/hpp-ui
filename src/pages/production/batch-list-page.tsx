import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
  Factory,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  TrendingUp,
  MoreVertical,
  Check,
  RotateCcw,
  Loader2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { productionService } from "@/features/production/services/production-service"
import type {
  ProductionBatch,
  CompleteProductionInput,
} from "@/features/production/types"

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
  const [completeData, setCompleteData] = React.useState<CompleteProductionInput>({
    goodQuantity: 0,
    wasteQuantity: 0,
    overheadLabor: 15000,
    overheadEnergy: 10000,
    overheadPackaging: 12000,
    overheadOther: 0,
    notes: "",
  })
  const [completeError, setCompleteError] = React.useState<string>("")

  // Modal: Cancel Production
  const [isCancelOpen, setIsCancelOpen] = React.useState<boolean>(false)
  const [batchToCancel, setBatchToCancel] = React.useState<ProductionBatch | null>(null)
  const [cancelReason, setCancelReason] = React.useState<string>("")

  const [submitting, setSubmitting] = React.useState<boolean>(false)

  React.useEffect(() => {
    let ignore = false
    productionService.getBatches()
      .then((bList) => {
        if (!ignore) {
          setBatches(bList)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error("Failed to load batch data:", err)
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [])

  // Aggregate statistics
  const stats = React.useMemo(() => {
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

    return { activeCount, completedCount, avgYield, totalSpent }
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

  // In-progress list
  const activeBatches = React.useMemo(() => {
    return batches.filter((b) => b.status === "IN_PROGRESS")
  }, [batches])

  // Open complete modal
  function openCompleteDialog(batch: ProductionBatch) {
    setBatchToComplete(batch)
    setCompleteData({
      goodQuantity: batch.targetQuantity,
      wasteQuantity: 0,
      overheadLabor: 15000,
      overheadEnergy: 10000,
      overheadPackaging: 12000,
      overheadOther: 0,
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
      const completed = await productionService.completeProduction(batchToComplete.id, completeData)
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
  const completeOverheadTotal =
    (completeData.overheadLabor || 0) +
    (completeData.overheadEnergy || 0) +
    (completeData.overheadPackaging || 0) +
    (completeData.overheadOther || 0)
  const completeTotalCost = completeStockCost + completeOverheadTotal
  const completeHppPerUnit = completeData.goodQuantity > 0 ? Math.round(completeTotalCost / completeData.goodQuantity) : 0
  const completeSellingPrice = batchToComplete?.sellingPrice || 0
  const completeMargin = completeSellingPrice > 0 ? Math.round(((completeSellingPrice - completeHppPerUnit) / completeSellingPrice) * 1000) / 10 : 0

  return (
    <div className="flex flex-col gap-6 pb-16 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Dapur Produksi & Batch HPP
            </h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs font-semibold">
              Live Cooking
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Pantau batch yang sedang berjalan, input hasil panen (yield), dan hitung HPP aktual otomatis berbasis FIFO.
          </p>
        </div>

          <Button
            onClick={() => navigate("/production/batches/new")}
            className="rounded-xl shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center gap-2 h-10"
          >
            <Plus className="h-4 w-4" />
            <span>Mulai Batch Baru</span>
          </Button>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-card">
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Batch di Dapur
              </CardDescription>
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black font-mono mt-1 text-foreground flex items-baseline gap-1.5">
              {stats.activeCount}{" "}
              <span className="text-xs font-semibold text-muted-foreground">batch aktif</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <p className="text-xs text-muted-foreground">Sedang proses memasak/oven</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-card">
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Batch Selesai
              </CardDescription>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black font-mono text-foreground mt-1">
              {stats.completedCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <p className="text-xs text-muted-foreground">Stok jadi masuk ke gudang</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-card">
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Rata-rata Yield
              </CardDescription>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black font-mono text-emerald-600 mt-1">
              {stats.avgYield}%
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <p className="text-xs text-muted-foreground">Tingkat keberhasilan adonan</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-card">
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Akumulasi Modal
              </CardDescription>
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Factory className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-xl font-black font-mono text-foreground mt-1 truncate">
              {formatCurrencyIdr(stats.totalSpent)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <p className="text-xs text-muted-foreground">Total biaya produksi selesai</p>
          </CardContent>
        </Card>
      </div>

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

      {/* FILTER & SEARCH TOOLBAR */}
      <Card className="rounded-2xl border-slate-200/80 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari nomor batch, produk, catatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl h-10 text-sm bg-muted/20"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {[
              { key: "ALL", label: "Semua Batch", count: batches.length },
              { key: "IN_PROGRESS", label: "Dapur Aktif", count: stats.activeCount },
              { key: "COMPLETED", label: "Selesai (HPP)", count: stats.completedCount },
              { key: "CANCELLED", label: "Dibatalkan", count: batches.filter((b) => b.status === "CANCELLED").length },
            ].map((tab) => (
              <Button
                key={tab.key}
                type="button"
                size="sm"
                variant={statusFilter === tab.key ? "default" : "outline"}
                onClick={() => setStatusFilter(tab.key)}
                className={`rounded-xl text-xs font-semibold h-8 transition-all shrink-0 ${
                  statusFilter === tab.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-muted/50 border-slate-200 text-muted-foreground"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`ml-1.5 text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                    statusFilter === tab.key
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {tab.count}
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FULL BATCH TABLE */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Memuat data batch produksi...</p>
        </div>
      ) : filteredBatches.length === 0 ? (
        <Card className="rounded-2xl border-dashed border-2 p-12 text-center flex flex-col items-center justify-center bg-muted/10">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
            <Factory className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Tidak ada data batch produksi</h3>
          <p className="text-sm text-muted-foreground max-w-md mt-1 mb-6">
            {search || statusFilter !== "ALL"
              ? "Tidak ada batch yang cocok dengan kata kunci atau filter status saat ini."
              : "Mulai jalankan batch produksi pertama Anda untuk menghitung HPP secara presisi!"}
          </p>
          <Button
            onClick={() => navigate("/production/batches/new")}
            className="rounded-xl flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Mulai Batch Pertama</span>
          </Button>
        </Card>
      ) : (
        <Card className="rounded-2xl border-slate-200/80 shadow-sm overflow-hidden w-full bg-card">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="font-bold text-xs uppercase text-muted-foreground">Nomor Batch & Waktu</TableHead>
                <TableHead className="font-bold text-xs uppercase text-muted-foreground">Produk Jadi</TableHead>
                <TableHead className="font-bold text-xs uppercase text-muted-foreground">Hasil Produksi (Yield)</TableHead>
                <TableHead className="font-bold text-xs uppercase text-muted-foreground">Biaya Bahan (BOM)</TableHead>
                <TableHead className="font-bold text-xs uppercase text-muted-foreground">Biaya Overhead</TableHead>
                <TableHead className="font-bold text-xs uppercase text-muted-foreground">HPP per Unit</TableHead>
                <TableHead className="font-bold text-xs uppercase text-muted-foreground">Status</TableHead>
                <TableHead className="text-right font-bold text-xs uppercase text-muted-foreground">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBatches.map((batch) => {
                const yieldRate = batch.goodQuantity && batch.targetQuantity > 0
                  ? Math.round((batch.goodQuantity / batch.targetQuantity) * 1000) / 10
                  : null

                return (
                  <TableRow
                    key={batch.id}
                    onClick={() => navigate(`/production/batches/${batch.id}`)}
                    className="hover:bg-primary/5 cursor-pointer transition-colors"
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-sm text-foreground">
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
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-foreground">
                          {batch.productName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {batch.productCategory} • Satuan: {batch.productUnit}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {batch.status === "COMPLETED" ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono font-bold text-sm text-foreground">
                            {batch.goodQuantity} {batch.productUnit}
                            {batch.wasteQuantity ? (
                              <span className="text-xs font-normal text-amber-600 ml-1">
                                (Afkir: {batch.wasteQuantity})
                              </span>
                            ) : null}
                          </span>
                          <span className="text-[11px] text-emerald-600 font-semibold">
                            Yield: {yieldRate}%
                          </span>
                        </div>
                      ) : batch.status === "IN_PROGRESS" ? (
                        <span className="font-mono text-sm text-muted-foreground">
                          Target: {batch.targetQuantity} {batch.productUnit}
                        </span>
                      ) : (
                        <span className="text-xs text-red-600">Dibatalkan</span>
                      )}
                    </TableCell>

                    <TableCell className="font-mono font-bold text-sm text-slate-800">
                      {formatCurrencyIdr(batch.stockCost)}
                    </TableCell>

                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {batch.overheadCost ? formatCurrencyIdr(batch.overheadCost) : "-"}
                    </TableCell>

                    <TableCell>
                      {batch.hppPerUnit ? (
                        <div className="flex flex-col">
                          <span className="font-mono font-black text-sm text-primary">
                            {formatCurrencyIdr(batch.hppPerUnit)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Jual: {formatCurrencyIdr(batch.sellingPrice)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Menunggu panen</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {batch.status === "IN_PROGRESS" && (
                        <Badge variant="warning" className="text-[10px] font-bold flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Berjalan
                        </Badge>
                      )}
                      {batch.status === "COMPLETED" && (
                        <Badge variant="success" className="text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Selesai
                        </Badge>
                      )}
                      {batch.status === "CANCELLED" && (
                        <Badge variant="destructive" className="text-[10px] font-bold flex items-center gap-1">
                          <XCircle className="h-3 w-3" /> Batal
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      {batch.status === "IN_PROGRESS" ? (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            openCompleteDialog(batch)
                          }}
                          className="rounded-xl text-xs h-8 bg-primary text-primary-foreground font-semibold"
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
                          className="rounded-xl text-xs h-8"
                        >
                          Audit HPP
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
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
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                2. Biaya Overhead Operasional (Batch Ini)
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="grid gap-1">
                  <Label className="text-[11px] text-muted-foreground">Upah Tenaga Kerja</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1000"
                    value={completeData.overheadLabor || ""}
                    onChange={(e) => setCompleteData({ ...completeData, overheadLabor: Number(e.target.value) || 0 })}
                    className="rounded-xl h-9 text-xs font-mono"
                  />
                </div>

                <div className="grid gap-1">
                  <Label className="text-[11px] text-muted-foreground">Gas & Listrik Oven</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1000"
                    value={completeData.overheadEnergy || ""}
                    onChange={(e) => setCompleteData({ ...completeData, overheadEnergy: Number(e.target.value) || 0 })}
                    className="rounded-xl h-9 text-xs font-mono"
                  />
                </div>

                <div className="grid gap-1 col-span-2 sm:col-span-1">
                  <Label className="text-[11px] text-muted-foreground">Kemasan & Plastik</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1000"
                    value={completeData.overheadPackaging || ""}
                    onChange={(e) => setCompleteData({ ...completeData, overheadPackaging: Number(e.target.value) || 0 })}
                    className="rounded-xl h-9 text-xs font-mono"
                  />
                </div>
              </div>
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
