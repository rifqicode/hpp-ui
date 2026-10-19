import * as React from "react"
import { ProductionStatusBadge } from "@/features/production/components/production-status"
import { useInitialLoading } from "@/hooks/use-initial-loading"
import { useParams, Link, useLocation } from "react-router-dom"
import {
  ArrowLeft,
  Factory,
  AlertTriangle,
  ChevronRight,
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
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { productionService } from "@/features/production/services/production-service"
import type {
  ProductionBatch,
  CompleteProductionInput,
  ProductionOverheadDetail,
} from "@/features/production/types"
import { overheadService } from "@/features/overheads/services/overhead-service"
import type { OverheadType } from "@/features/overheads/types"
import { CurrencyText } from "@/components/ui/currency-text"

function calculateGrossMargin(sellingPrice: number, cost: number): number {
  if (!sellingPrice || sellingPrice <= 0) return 0
  const margin = ((sellingPrice - cost) / sellingPrice) * 100
  return Math.round(margin * 10) / 10
}

export default function BatchDetailPage() {
  const location = useLocation()
  const returnToValue: unknown = location.state?.returnTo
  const returnTo = typeof returnToValue === "string" && /^\/production\/batches(?:\?|$)/.test(returnToValue) ? returnToValue : "/production/batches"
  const { batchId } = useParams<{ batchId: string }>()

  const [batch, setBatch] = React.useState<ProductionBatch | null>(null)
  const [loading, setLoading] = React.useState<boolean>(true)

  // Modals
  const [isCompleteOpen, setIsCompleteOpen] = React.useState<boolean>(false)
  const [activeOverheads, setActiveOverheads] = React.useState<OverheadType[]>([])
  const [completeOverheadItems, setCompleteOverheadItems] = React.useState<ProductionOverheadDetail[]>([])
  const [completeData, setCompleteData] = React.useState<CompleteProductionInput>({
    goodQuantity: 0,
    wasteQuantity: 0,
    notes: "",
  })
  const [completeError, setCompleteError] = React.useState<string>("")

  const [isCancelOpen, setIsCancelOpen] = React.useState<boolean>(false)
  const [cancelReason, setCancelReason] = React.useState<string>("")
  const [cancelError, setCancelError] = React.useState<string>("")
  const [submitting, setSubmitting] = React.useState<boolean>(false)

  // Helper to build initial overhead items
  function buildInitialOverheads(batchData: ProductionBatch, masterOhs: OverheadType[]): ProductionOverheadDetail[] {
    if (batchData.recipeSnapshot?.overheads && batchData.recipeSnapshot.overheads.length > 0) {
      return batchData.recipeSnapshot.overheads.map((so) => ({
        overheadTypeId: so.overhead_type_id,
        name: so.name,
        amount: so.amount || 0,
      }))
    }

    if (masterOhs.length > 0) {
      return masterOhs
        .filter((ao) => !ao.category || ao.category === "PRODUCTION")
        .map((ao) => ({
          overheadTypeId: ao.id,
          name: ao.name,
          amount: ao.defaultAmount || 0,
        }))
    }

    return []
  }

  React.useEffect(() => {
    if (!batchId) return
    let ignore = false

    Promise.all([
      productionService.getBatchById(batchId),
      overheadService.getOverheads({ activeOnly: true, category: 'PRODUCTION' }),
    ])
      .then(([data, masterOhs]) => {
        if (!ignore) {
          setBatch(data)
          setActiveOverheads(masterOhs)
          setCompleteOverheadItems(buildInitialOverheads(data, masterOhs))
          setCompleteData({
            goodQuantity: data.targetQuantity,
            wasteQuantity: 0,
            notes: "",
          })
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error("Failed to load batch:", err)
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [batchId])

  function openCompleteModal() {
    if (!batch) return
    setCompleteOverheadItems(buildInitialOverheads(batch, activeOverheads))
    setCompleteData({
      goodQuantity: batch.targetQuantity,
      wasteQuantity: 0,
      notes: "",
    })
    setCompleteError("")
    setIsCompleteOpen(true)
  }

  async function handleCompleteSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!batch) return
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
      const updated = await productionService.completeProduction(batch.id, payload)
      setBatch(updated)
      setIsCompleteOpen(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyelesaikan batch produksi"
      setCompleteError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCancelSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!batch) return

    setSubmitting(true)
    setCancelError("")
    try {
      const updated = await productionService.cancelProduction(batch.id, cancelReason)
      setBatch(updated)
      setIsCancelOpen(false)
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.message || (err instanceof Error ? err.message : "Gagal membatalkan / void batch produksi")
      setCancelError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const isInitialLoading = useInitialLoading(loading)
  if (isInitialLoading) {
    // Global LoadingOverlay renders the spinner on top of this placeholder
    return <div className="min-h-[60vh]" />
  }

  if (!batch) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <AlertTriangle className="h-10 w-10 text-amber-500" />
        <h2 className="text-xl font-bold">Batch Produksi Tidak Ditemukan</h2>
        <Button asChild variant="outline" className="rounded-xl">
          <Link to={returnTo}>Kembali ke Daftar Batch</Link>
        </Button>
      </div>
    )
  }

  const yieldRate = batch.goodQuantity && batch.targetQuantity > 0
    ? Math.round((batch.goodQuantity / batch.targetQuantity) * 1000) / 10
    : null

  const margin = batch.hppPerUnit ? calculateGrossMargin(batch.sellingPrice, batch.hppPerUnit) : null

  // Complete calculations
  const completeStockCost = batch.stockCost
  const completeOverheadTotal = completeOverheadItems.reduce((acc, it) => acc + (it.amount || 0), 0)
  const completeTotalCost = completeStockCost + completeOverheadTotal
  const completeHppPerUnit = completeData.goodQuantity > 0 ? Math.round(completeTotalCost / completeData.goodQuantity) : 0

  return (
    <div className="flex flex-col gap-6 pb-16 animate-in fade-in duration-500">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-xl text-xs">
            <Link to={returnTo}>
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Daftar Batch
            </Link>
          </Button>
          <span className="text-xs text-muted-foreground">/</span>
          <span className="font-mono text-xs font-bold text-foreground">
            {batch.batchNumber}
          </span>
        </div>

        {batch.status === "IN_PROGRESS" && (
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={openCompleteModal}
              size="sm"
              className="rounded-xl text-xs font-semibold bg-primary text-primary-foreground h-9 flex-1 sm:flex-initial"
            >
              <Check className="h-3.5 w-3.5 mr-1.5" /> Selesaikan & Hitung HPP
            </Button>
            <Button
              onClick={() => {
                setCancelReason("")
                setCancelError("")
                setIsCancelOpen(true)
              }}
              variant="destructive"
              size="sm"
              className="rounded-xl text-xs h-9 flex-1 sm:flex-initial"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Batalkan Batch
            </Button>
          </div>
        )}

        {batch.status === "COMPLETED" && (
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={() => {
                setCancelReason("")
                setCancelError("")
                setIsCancelOpen(true)
              }}
              variant="outline"
              size="sm"
              className="rounded-xl text-xs h-9 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 flex-1 sm:flex-initial"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Void Produksi
            </Button>
          </div>
        )}
      </div>

      {/* Hero Header Card */}
      <Card className="rounded-3xl border-slate-200/80 shadow-sm overflow-hidden bg-card w-full">
        <div className="p-4 sm:p-6 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Factory className="h-7 w-7" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xl font-black text-foreground">
                    {batch.batchNumber}
                  </span>
                  <ProductionStatusBadge status={batch.status} />
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Link
                    to={`/production/products/${batch.productId}`}
                    className="text-sm font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <span>{batch.productName}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                  <span className="text-xs text-muted-foreground">• {batch.productCategory}</span>
                </div>

                <p className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-3 gap-y-1">
                  <span>
                    Mulai:{" "}
                    {new Date(batch.startedAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {batch.completedAt && (
                    <span>
                      Selesai:{" "}
                      {new Date(batch.completedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {batch.notes && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-muted-foreground max-w-sm">
                <span className="font-semibold text-slate-700 block mb-0.5">Catatan Dapur:</span>
                "{batch.notes}"
              </div>
            )}
          </div>
        </div>

        {/* 5-Column Metric Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border-t border-slate-100 gap-px bg-slate-200/60 dark:bg-slate-800">
          <div className="p-3 px-4 bg-slate-50/90 dark:bg-slate-900/90 min-w-0">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block truncate">
              Target vs Hasil
            </span>
            <div className="text-base sm:text-lg font-black font-mono text-foreground mt-0.5 truncate">
              {batch.goodQuantity !== undefined ? batch.goodQuantity : "-"} / {batch.targetQuantity}{" "}
              <span className="text-xs font-normal text-muted-foreground">{batch.productUnit}</span>
            </div>
            {yieldRate !== null && (
              <span className="text-[10px] text-emerald-600 font-bold block truncate">
                Yield: {yieldRate}% ({batch.wasteQuantity || 0} afkir)
              </span>
            )}
          </div>

          <div className="p-3 px-4 bg-slate-50/90 dark:bg-slate-900/90 min-w-0">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block truncate">
              Biaya Bahan Baku (BOM)
            </span>
            <div className="text-base sm:text-lg font-black font-mono text-slate-800 dark:text-slate-100 mt-0.5 truncate">
              <CurrencyText value={batch.stockCost} />
            </div>
            <span className="text-[10px] text-muted-foreground block truncate">{batch.ingredients.length} bahan terpotong</span>
          </div>

          <div className="p-3 px-4 bg-slate-50/90 dark:bg-slate-900/90 min-w-0">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block truncate">
              Biaya Overhead
            </span>
            <div className="text-base sm:text-lg font-black font-mono text-slate-800 dark:text-slate-100 mt-0.5 truncate">
              {batch.overheadCost !== undefined ? <CurrencyText value={batch.overheadCost} /> : "-"}
            </div>
            <span className="text-[10px] text-muted-foreground block truncate">Listrik, Gas, Tenaga Kerja</span>
          </div>

          <div className="p-3 px-4 bg-slate-50/90 dark:bg-slate-900/90 min-w-0">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block truncate">
              HPP per Unit Aktual
            </span>
            <div className="text-base sm:text-lg font-black font-mono text-primary mt-0.5 truncate">
              {batch.hppPerUnit ? <CurrencyText value={batch.hppPerUnit} /> : "-"}
            </div>
            <span className="text-[10px] text-muted-foreground block truncate">Harga Jual: <CurrencyText value={batch.sellingPrice} /></span>
          </div>

          <div className="p-3 px-4 col-span-2 sm:col-span-1 bg-slate-50/90 dark:bg-slate-900/90 min-w-0">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block truncate">
              Gross Margin Batch
            </span>
            <div className="mt-1">
              {margin !== null ? (
                <Badge
                  variant="outline"
                  className={`font-mono text-xs font-bold px-2 py-0.5 ${
                    margin >= 50
                      ? "bg-emerald-500/10 text-emerald-700 border-emerald-300"
                      : margin >= 25
                      ? "bg-amber-500/10 text-amber-700 border-amber-300"
                      : "bg-red-500/10 text-red-700 border-red-300"
                  }`}
                >
                  +{margin}%
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground italic">Menunggu kalkulasi</span>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground mt-0.5 block truncate">
              {batch.totalCost ? <>Total Modal: <CurrencyText value={batch.totalCost} /></> : "Dalam proses"}
            </span>
          </div>
        </div>
      </Card>

      {/* SECTION 1: RINCIAN KONSUMSI BAHAN BAKU (FIFO AUDIT TRAIL) */}
      <Card className="rounded-2xl border-slate-200/80 shadow-sm w-full bg-card">
        <CardHeader className="p-5 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-bold">Audit Konsumsi Bahan Baku (BOM FIFO)</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Rincian kuantitas bahan yang diambil dari gudang untuk mengeksekusi batch produksi ini.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs font-mono font-semibold self-start sm:self-auto shrink-0">
              Total Bahan: <CurrencyText value={batch.stockCost} />
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table className="min-w-[600px]">
            <TableHeader className="bg-slate-50/70">
              <TableRow>
                <TableHead className="text-xs font-bold uppercase text-muted-foreground">Nama Bahan Baku</TableHead>
                <TableHead className="text-xs font-bold uppercase text-muted-foreground">Kuantitas Terpakai</TableHead>
                <TableHead className="text-xs font-bold uppercase text-muted-foreground">Modal Bahan (FIFO)</TableHead>
                <TableHead className="text-xs font-bold uppercase text-muted-foreground">Porsi dari Total Biaya Bahan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batch.ingredients.map((ing) => {
                const share = batch.stockCost > 0 ? Math.round((ing.cost / batch.stockCost) * 1000) / 10 : 0

                return (
                  <TableRow key={ing.stockId}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground">{ing.stockName}</span>
                        <span className="text-[11px] text-muted-foreground font-mono">ID: {ing.stockId}</span>
                      </div>
                    </TableCell>

                    <TableCell className="font-mono font-bold text-sm text-foreground">
                      {ing.quantity.toLocaleString("id-ID")} {ing.baseUnit}
                    </TableCell>

                    <TableCell className="font-mono font-bold text-sm text-slate-800">
                      <CurrencyText value={ing.cost} />
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full"
                            style={{ width: `${Math.min(share, 100)}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs font-semibold text-slate-700">
                          {share}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* SECTION 2: RINCIAN BIAYA OVERHEAD */}
      {batch.overheadBreakdown && (
        <Card className="rounded-2xl border-slate-200/80 shadow-sm w-full bg-card">
          <CardHeader className="p-5 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-lg font-bold">Rincian Biaya Overhead Operasional</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Alokasi biaya langsung non-bahan yang diserap ke dalam HPP unit barang bagus.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-mono font-semibold self-start sm:self-auto shrink-0">
                Total Overhead: <CurrencyText value={batch.overheadCost || 0} />
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-5 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-xs text-muted-foreground block">Tenaga Kerja Langsung</span>
                <span className="font-mono font-bold text-base text-foreground mt-1 block">
                  <CurrencyText value={batch.overheadBreakdown.labor} />
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-xs text-muted-foreground block">Gas, Listrik & Oven</span>
                <span className="font-mono font-bold text-base text-foreground mt-1 block">
                  <CurrencyText value={batch.overheadBreakdown.energy} />
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-xs text-muted-foreground block">Kemasan & Plastik</span>
                <span className="font-mono font-bold text-base text-foreground mt-1 block">
                  <CurrencyText value={batch.overheadBreakdown.packaging} />
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-xs text-muted-foreground block">Biaya Lain-lain</span>
                <span className="font-mono font-bold text-base text-foreground mt-1 block">
                  <CurrencyText value={batch.overheadBreakdown.other || 0} />
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* COMPLETE DIALOG */}
      <Dialog open={isCompleteOpen} onOpenChange={setIsCompleteOpen}>
        <DialogContent className="sm:max-w-[540px] rounded-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Selesaikan Batch & Kalkulasi HPP</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Masukkan hasil panen dan overhead riil untuk menghitung HPP per unit final.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCompleteSubmit} className="space-y-4 py-2">
            {completeError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{completeError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold">Unit Bagus</Label>
                <Input
                  type="number"
                  min="1"
                  value={completeData.goodQuantity}
                  onChange={(e) => setCompleteData({ ...completeData, goodQuantity: Number(e.target.value) })}
                  className="rounded-xl h-10 font-mono font-bold"
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold">Unit Rusak (Afkir)</Label>
                <Input
                  type="number"
                  min="0"
                  value={completeData.wasteQuantity}
                  onChange={(e) => setCompleteData({ ...completeData, wasteQuantity: Number(e.target.value) })}
                  className="rounded-xl h-10 font-mono"
                />
              </div>
            </div>

            {/* Dynamic Overhead Items */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Biaya Overhead Operasional (Batch Ini)
                </span>
                <span className="text-xs font-mono font-bold text-slate-700">
                  Total: <CurrencyText value={completeOverheadTotal} />
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

            <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span>Proyeksi HPP per Unit:</span>
              <span className="font-mono font-black text-lg text-primary">
                <CurrencyText value={completeHppPerUnit} />
              </span>
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsCompleteOpen(false)} className="rounded-xl">
                Batal
              </Button>
              <Button type="submit" disabled={submitting} className="rounded-xl bg-primary text-primary-foreground">
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Selesaikan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CANCEL / VOID DIALOG */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {batch?.status === "COMPLETED" ? "Void Produksi Batch Ini?" : "Batalkan Batch Produksi?"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {batch?.status === "COMPLETED"
                ? "Membatalkan batch ini akan membatalkan batch barang jadi dan mengembalikan stok bahan baku ke gudang."
                : "Bahan baku yang telah dialokasikan akan dikembalikan ke stok gudang."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCancelSubmit} className="space-y-4 py-2">
            {cancelError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {cancelError}
              </div>
            )}

            <div className="grid gap-2">
              <Label className="text-xs font-semibold">Alasan Pembatalan / Void</Label>
              <Input
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Alasan pembatalan..."
                className="rounded-xl h-10 text-sm"
                required
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCancelOpen(false)} className="rounded-xl">
                Kembali
              </Button>
              <Button type="submit" variant="destructive" disabled={submitting} className="rounded-xl">
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {batch?.status === "COMPLETED" ? "Void Batch" : "Batalkan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
