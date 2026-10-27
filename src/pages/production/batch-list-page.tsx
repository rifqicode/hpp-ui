import * as React from "react"
import { ProductionKanban } from "@/features/production/components/production-kanban"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MoreVertical,
  Check,
  RotateCcw,
  Loader2,
  RefreshCw,
  X,
  History,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { TablePagination } from "@/components/ui/table-pagination"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ProductionStatusBadge } from "@/features/production/components/production-status"
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

import { useQueryClient } from "@tanstack/react-query"
import { productionService } from "@/features/production/services/production-service"
import {
  useBatchesQuery,
  productionKeys,
} from "@/features/production/hooks/use-production-query"
import type {
  ProductionBatch,
  CompleteProductionInput,
  ProductionOverheadDetail,
} from "@/features/production/types"
import { overheadService } from "@/features/overheads/services/overhead-service"
import type { OverheadType } from "@/features/overheads/types"
import { CurrencyText } from "@/components/ui/currency-text"

function formatBatchDate(value: string): string {
  return new Date(value).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

function isFinished(batch: ProductionBatch) {
  return batch.status === "COMPLETED" || batch.status === "VOID"
}

export default function BatchListPage() {
  const navigate = useNavigate()
  const [viewParams, setViewParams] = useSearchParams()
  const activeView = viewParams.get("tab") || "kanban"
  const queryClient = useQueryClient()

  const {
    data: batches = [],
    isLoading: loading,
    isFetching,
    error: queryError,
    refetch: refetchBatches,
  } = useBatchesQuery({ enabled: activeView === "list" || activeView === "kanban" })

  const returnTo = `/production/batches?${viewParams.toString()}`
  const [pickingUp, setPickingUp] = React.useState<string | null>(null)
  const [actionError, setActionError] = React.useState("")

  // Filter & Search
  const [search, setSearch] = React.useState<string>("")
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL")

  // Modal: Complete Production
  const [isCompleteOpen, setIsCompleteOpen] = React.useState<boolean>(false)
  const [batchToComplete, setBatchToComplete] = React.useState<ProductionBatch | null>(null)
  const [activeOverheads, setActiveOverheads] = React.useState<OverheadType[]>([])
  const [completeOverheadItems, setCompleteOverheadItems] = React.useState<
    Array<Omit<ProductionOverheadDetail, "amount"> & { amount: number | "" }>
  >([])
  const [completeData, setCompleteData] = React.useState<{
    goodQuantity: number | ""
    wasteQuantity: number | ""
    notes?: string
  }>({
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

  React.useEffect(() => {
    if (activeView !== "list" && activeView !== "kanban") return
    overheadService
      .getOverheads({ activeOnly: true, category: 'PRODUCTION' })
      .then((ohList) => setActiveOverheads(ohList))
      .catch((err) => console.error("Failed to load overheads:", err))
  }, [activeView])

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
        b.batchNumber.toLowerCase().includes(search.trim().toLowerCase()) ||
        b.productName.toLowerCase().includes(search.trim().toLowerCase()) ||
        (b.notes && b.notes.toLowerCase().includes(search.trim().toLowerCase()))

      const matchStatus = statusFilter === "ALL" || b.status === statusFilter || (statusFilter === "CANCELLED" && b.status === "VOID")
      return matchSearch && matchStatus
    })
  }, [batches, search, statusFilter])

  // Paginated batches
  const totalPages = Math.ceil(filteredBatches.length / pageSize) || 1
  const currentPage = Math.min(page, totalPages)
  const paginatedBatches = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredBatches.slice(start, start + pageSize)
  }, [filteredBatches, currentPage, pageSize])

  // Pickup Batch Handler
  async function handlePickupBatch(batchId: string) {
    if (pickingUp) return
    setPickingUp(batchId)
    setActionError("")
    try {
      await productionService.pickupProduction(batchId)
      queryClient.invalidateQueries({ queryKey: productionKeys.all })
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal memulai produksi. Coba lagi.")
    } finally {
      setPickingUp(null)
    }
  }

  // Open complete modal
  function openCompleteDialog(batch: ProductionBatch) {
    setBatchToComplete(batch)

    // Build initial overhead items
    let initialOhs: Array<Omit<ProductionOverheadDetail, "amount"> & { amount: number | "" }> = []
    if (Array.isArray(batch.recipeSnapshot?.overheads)) {
      initialOhs = batch.recipeSnapshot.overheads.map((so) => ({
        overheadTypeId: so.overhead_type_id,
        name: so.name,
        amount: Number(so.amount) || 0,
      }))
    } else if (activeOverheads.length > 0) {
      initialOhs = activeOverheads
        .filter((ao) => !ao.category || ao.category === "PRODUCTION")
        .map((ao) => ({
          overheadTypeId: ao.id,
          name: ao.name,
          amount: Number(ao.defaultAmount) || 0,
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
    const goodQty = typeof completeData.goodQuantity === "number" ? completeData.goodQuantity : (Number(completeData.goodQuantity) || 0)
    if (goodQty <= 0) {
      setCompleteError("Jumlah unit bagus harus lebih dari 0")
      return
    }

    setSubmitting(true)
    setCompleteError("")
    try {
      const payload: CompleteProductionInput = {
        goodQuantity: goodQty,
        wasteQuantity: typeof completeData.wasteQuantity === "number" ? completeData.wasteQuantity : (Number(completeData.wasteQuantity) || 0),
        notes: completeData.notes,
        overheads: completeOverheadItems.map((oh) => ({
          ...oh,
          amount: Number(oh.amount) || 0,
        })),
      }
      await productionService.completeProduction(batchToComplete.id, payload)
      queryClient.invalidateQueries({ queryKey: productionKeys.all })
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
      await productionService.cancelProduction(batchToCancel.id, cancelReason)
      queryClient.invalidateQueries({ queryKey: productionKeys.all })
      setIsCancelOpen(false)
      setBatchToCancel(null)
      setCancelReason("")
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal membatalkan batch. Coba lagi.")
    } finally {
      setSubmitting(false)
    }
  }

  function renderBatchActions(batch: ProductionBatch) {
    return <div className="flex items-center justify-end gap-2">
      {batch.status === "QUEUED" || batch.status === "DRAFT" ? <Button size="sm" disabled={pickingUp !== null} onClick={() => void handlePickupBatch(batch.id)} className="mr-auto lg:mr-0">
        {pickingUp === batch.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Mulai proses
      </Button> : batch.status === "IN_PROGRESS" ? <Button size="sm" onClick={() => openCompleteDialog(batch)} className="mr-auto lg:mr-0"><Check className="mr-1 h-4 w-4" />Selesaikan</Button> : null}
      <Button variant="outline" size="sm" asChild><Link to={`/production/batches/${batch.id}`} state={{ returnTo }}>Detail</Link></Button>
      {batch.status === "IN_PROGRESS" && <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Aksi lainnya untuk ${batch.batchNumber}`} className="h-9 w-9"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => navigate(`/production/batches/${batch.id}`, { state: { returnTo } })}>Lihat rincian</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { setBatchToCancel(batch); setCancelReason(""); setActionError(""); setIsCancelOpen(true) }}><RotateCcw className="mr-2 h-4 w-4" />Batalkan batch</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}
    </div>
  }

  // Calculations for Complete modal
  const completeStockCost = Number(batchToComplete?.stockCost) || 0
  const completeOverheadTotal = completeOverheadItems.reduce((acc, it) => acc + (Number(it.amount) || 0), 0)
  const completeTotalCost = completeStockCost + completeOverheadTotal
  const goodQty = typeof completeData.goodQuantity === "number" ? completeData.goodQuantity : (Number(completeData.goodQuantity) || 0)
  const completeHppPerUnit = goodQty > 0 ? Math.round(completeTotalCost / goodQty) : 0
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
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Produksi
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Kelola antrean, pantau progres, dan catat hasil produksi.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {(activeView === "list" || activeView === "kanban") && <Button
            variant="outline"
            size="sm"
            onClick={() => refetchBatches()}
            disabled={isFetching}
            className="flex items-center gap-1.5 shadow-2xs hover:bg-muted flex-1 sm:flex-initial"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Perbarui
          </Button>}
          <Button
            onClick={() => navigate("/production/batches/new")}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-2xs flex-1 sm:flex-initial"
          >
            <Plus className="h-4 w-4" />
            Mulai Batch Baru
          </Button>
        </div>
      </div>

      <Tabs value={activeView} onValueChange={(value) => setViewParams((current) => {
        const next = new URLSearchParams(current)
        next.set("tab", value)
        return next
      })}>
        <TabsList aria-label="Tampilan produksi" className="mb-4 grid w-full max-w-md grid-flow-col auto-cols-fr">
          {[
            { value: "kanban", label: "Papan Kanban" },
            { value: "list", label: "Daftar Tabel" },
          ].map((tab) => <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>)}
        </TabsList>
        <TabsContent value="kanban" className="space-y-4">
          {actionError && !isCancelOpen && (
            <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {actionError}
            </div>
          )}
          {loading ? (
            <div role="status" className="flex items-center justify-center gap-3 p-16 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Memuat papan kanban produksi…
            </div>
          ) : queryError ? (
            <div role="alert" className="space-y-3 p-10 text-center">
              <p>Data produksi belum berhasil dimuat.</p>
              <Button variant="outline" onClick={() => void refetchBatches()}>Coba lagi</Button>
            </div>
          ) : (
            <ProductionKanban
              batches={filteredBatches}
              onPickup={handlePickupBatch}
              onComplete={(b) => {
                openCompleteDialog(b);
                setBatchToComplete(b);
                setIsCompleteOpen(true);
              }}
              isPickingUp={pickingUp}
            />
          )}
        </TabsContent>
        <TabsContent value="list" className="space-y-5">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Ringkasan produksi">
            {[
              { status: "ALL", label: "Semua batch", count: batches.length, icon: History, color: "text-primary", description: "Seluruh riwayat produksi" },
              { status: "QUEUED", label: "Antrean", count: stats.queuedCount, icon: Clock, color: "text-violet-600 dark:text-violet-400", description: "Siap untuk mulai diproses" },
              { status: "IN_PROGRESS", label: "Sedang berjalan", count: stats.activeCount, icon: RefreshCw, color: "text-amber-600 dark:text-amber-400", description: "Menunggu hasil produksi" },
              { status: "COMPLETED", label: "Selesai", count: stats.completedCount, icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", description: "Hasil dan HPP sudah tercatat" },
            ].map((item) => <button key={item.status} type="button" aria-pressed={statusFilter === item.status}
              onClick={() => { setStatusFilter(item.status); setPage(1) }}
              className={`rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${statusFilter === item.status ? "border-primary/50 ring-1 ring-primary/15" : "border-border"}`}>
              <div className="flex items-center justify-between gap-2"><span className="text-xs font-medium text-muted-foreground">{item.label}</span><item.icon className={`h-4 w-4 shrink-0 ${item.color}`} /></div>
              <p className={`mt-3 text-3xl font-semibold tabular-nums tracking-tight ${item.color}`}>{loading ? "—" : item.count}</p>
              <p className="mt-1 hidden text-xs text-muted-foreground sm:block">{item.description}</p>
            </button>)}
          </div>

          <section className="overflow-hidden rounded-xl border bg-card" aria-label="Daftar batch produksi">
            <div className="space-y-4 border-b p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div><h2 className="font-semibold">Daftar batch</h2><p className="mt-1 text-xs text-muted-foreground">Pantau progres dan catat hasil produksi dari satu tempat.</p></div>
                <div className="relative w-full sm:max-w-xs">
                  <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input aria-label="Cari batch produksi" placeholder="Cari batch, produk, atau catatan…" value={search}
                    onChange={(event) => { setSearch(event.target.value); setPage(1) }} className="h-10 pl-9 pr-9" />
                  {search && <button type="button" aria-label="Hapus pencarian" onClick={() => { setSearch(""); setPage(1) }} className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2" aria-label="Filter status batch">
                {[
                  { key: "ALL", label: "Semua" }, { key: "QUEUED", label: "Antrean" },
                  { key: "IN_PROGRESS", label: "Berjalan" }, { key: "COMPLETED", label: "Selesai" },
                  { key: "DRAFT", label: "Draft" }, { key: "CANCELLED", label: "Batal / Void" },
                ].map((item) => <button key={item.key} type="button" aria-pressed={statusFilter === item.key}
                  onClick={() => { setStatusFilter(item.key); setPage(1) }}
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${statusFilter === item.key ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"}`}>{item.label}</button>)}
              </div>
            </div>
            {actionError && !isCancelOpen && <div role="alert" className="m-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{actionError}</div>}
            {loading ? <div role="status" className="flex items-center justify-center gap-3 p-16 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Memuat batch produksi…</div>
              : queryError ? <div role="alert" className="space-y-3 p-10 text-center"><p>Data produksi belum berhasil dimuat.</p><Button variant="outline" onClick={() => void refetchBatches()}>Coba lagi</Button></div>
              : filteredBatches.length === 0 ? <div className="flex flex-col items-center px-5 py-14 text-center">
                <div className="mb-4 rounded-2xl bg-muted p-4"><History className="h-7 w-7 text-muted-foreground" /></div>
                <h3 className="font-semibold">{search || statusFilter !== "ALL" ? "Batch tidak ditemukan" : "Belum ada batch produksi"}</h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">{search || statusFilter !== "ALL" ? "Coba kata kunci lain atau hapus filter untuk melihat semua batch." : "Buat batch pertama untuk mulai mencatat hasil produksi dan biaya per unit."}</p>
                <Button className="mt-5" variant={search || statusFilter !== "ALL" ? "outline" : "default"} onClick={() => {
                  if (search || statusFilter !== "ALL") { setSearch(""); setStatusFilter("ALL"); setPage(1) }
                  else navigate("/production/batches/new")
                }}>{search || statusFilter !== "ALL" ? "Reset filter" : "Mulai batch pertama"}</Button>
              </div> : <>
                <div className="divide-y lg:hidden">
                  {paginatedBatches.map((batch) => <article key={batch.id} className="space-y-4 p-4">
                    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><Link to={`/production/batches/${batch.id}`} state={{ returnTo }} className="block truncate font-semibold hover:text-primary hover:underline">{batch.productName}</Link><p className="mt-1 text-xs font-mono text-muted-foreground">{batch.batchNumber}</p></div><ProductionStatusBadge status={batch.status} /></div>
                    <p className="text-xs text-muted-foreground">{formatBatchDate(batch.startedAt)}</p>
                    <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/40 p-3 text-sm"><div><p className="mb-1 text-xs text-muted-foreground">{isFinished(batch) ? "Hasil / target" : "Target produksi"}</p><p className="font-medium tabular-nums">{isFinished(batch) ? `${batch.goodQuantity ?? 0} / ` : ""}{batch.targetQuantity} {batch.productUnit}</p></div><div className="text-right"><p className="mb-1 text-xs text-muted-foreground">HPP per unit</p>{isFinished(batch) ? <CurrencyText value={batch.hppPerUnit ?? 0} /> : <span className="text-xs text-muted-foreground">Belum final</span>}</div></div>
                    {batch.notes && <p className="line-clamp-2 text-xs text-muted-foreground">{batch.notes}</p>}
                    {renderBatchActions(batch)}
                  </article>)}
                </div>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b bg-muted/40 text-xs text-muted-foreground"><tr>
                      <th scope="col" className="px-5 py-3 font-medium">Batch & produk</th><th scope="col" className="px-4 py-3 font-medium">Status</th><th scope="col" className="px-4 py-3 font-medium">Hasil / target</th><th scope="col" className="px-4 py-3 text-right font-medium">Total biaya</th><th scope="col" className="px-4 py-3 text-right font-medium">HPP / unit</th><th scope="col" className="px-5 py-3 text-right font-medium">Aksi</th>
                    </tr></thead>
                    <tbody className="divide-y">{paginatedBatches.map((batch) => <tr key={batch.id} className="hover:bg-muted/20">
                      <td className="px-5 py-4"><Link to={`/production/batches/${batch.id}`} state={{ returnTo }} className="font-semibold hover:text-primary hover:underline">{batch.productName}</Link><p className="mt-1 font-mono text-xs text-muted-foreground">{batch.batchNumber}</p><p className="mt-1 text-xs text-muted-foreground">{formatBatchDate(batch.startedAt)}</p></td>
                      <td className="px-4 py-4"><ProductionStatusBadge status={batch.status} /></td>
                      <td className="px-4 py-4 tabular-nums"><p>{isFinished(batch) ? `${batch.goodQuantity ?? 0} / ` : ""}{batch.targetQuantity} {batch.productUnit}</p><p className="mt-1 text-xs text-muted-foreground">{isFinished(batch) ? `${batch.wasteQuantity ?? 0} afkir` : "Target produksi"}</p></td>
                      <td className="px-4 py-4 text-right tabular-nums">{isFinished(batch) ? <CurrencyText value={batch.totalCost ?? 0} /> : <span className="text-muted-foreground">—</span>}</td>
                      <td className="px-4 py-4 text-right font-medium tabular-nums">{isFinished(batch) ? <CurrencyText value={batch.hppPerUnit ?? 0} /> : <span className="text-xs font-normal text-muted-foreground">Belum final</span>}</td>
                      <td className="px-5 py-4">{renderBatchActions(batch)}</td>
                    </tr>)}</tbody>
                  </table>
                </div>
                <div className="space-y-3 border-t p-4"><p className="text-xs text-muted-foreground">Halaman {currentPage} dari {totalPages}</p><TablePagination total={filteredBatches.length} displayedCount={paginatedBatches.length} page={currentPage} totalPages={totalPages} onPrev={() => setPage(Math.max(1, currentPage - 1))} onNext={() => setPage(Math.min(totalPages, currentPage + 1))} disabled={loading} label="batch" prevLabel="Sebelumnya" nextLabel="Berikutnya" /></div>
              </>}
          </section>
        </TabsContent>
      </Tabs>

      {/* DIALOG 2: SELESAIKAN BATCH PRODUKSI & HITUNG HPP */}
      <Dialog open={isCompleteOpen} onOpenChange={setIsCompleteOpen}>
        <DialogContent className="sm:max-w-[560px] rounded-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs font-semibold">
                    Unit Bagus / Berhasil <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={completeData.goodQuantity}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === "") {
                        setCompleteData((prev) => ({ ...prev, goodQuantity: "" }))
                      } else {
                        const parsed = parseInt(val, 10)
                        setCompleteData((prev) => ({ ...prev, goodQuantity: isNaN(parsed) ? "" : parsed }))
                      }
                    }}
                    onBlur={() => {
                      if (completeData.goodQuantity === "" || Number(completeData.goodQuantity) <= 0) {
                        setCompleteData((prev) => ({ ...prev, goodQuantity: 1 }))
                      }
                    }}
                    className="rounded-xl h-10 font-mono font-bold text-base"
                    required
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs font-semibold">Unit Rusak / Afkir (Scrap)</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={completeData.wasteQuantity}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === "") {
                        setCompleteData((prev) => ({ ...prev, wasteQuantity: "" }))
                      } else {
                        const parsed = parseInt(val, 10)
                        setCompleteData((prev) => ({ ...prev, wasteQuantity: isNaN(parsed) ? "" : parsed }))
                      }
                    }}
                    onBlur={() => {
                      if (completeData.wasteQuantity === "" || Number(completeData.wasteQuantity) < 0) {
                        setCompleteData((prev) => ({ ...prev, wasteQuantity: 0 }))
                      }
                    }}
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
                          placeholder="0"
                          value={oh.amount === "" ? "" : oh.amount}
                          onChange={(e) => {
                            const val = e.target.value
                            setCompleteOverheadItems((prev) =>
                              prev.map((item, i) =>
                                i === idx
                                  ? {
                                      ...item,
                                      amount: val === "" ? "" : Number(val),
                                    }
                                  : item
                              )
                            )
                          }}
                          onBlur={() => {
                            if (oh.amount === "" || (typeof oh.amount === "number" && oh.amount < 0)) {
                              setCompleteOverheadItems((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, amount: 0 } : item
                                )
                              )
                            }
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Total Modal Batch:</span>
                  <div className="font-mono font-bold text-foreground">
                    <CurrencyText value={completeTotalCost} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    (Bahan: <CurrencyText value={completeStockCost} /> + Overhead: <CurrencyText value={completeOverheadTotal} />)
                  </span>
                </div>

                <div className="sm:text-right">
                  <span className="text-muted-foreground">HPP per Unit:</span>
                  <div className="font-mono font-black text-xl text-primary">
                    <CurrencyText value={completeHppPerUnit} />
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold">
                    Margin: +{completeMargin}%
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
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
              Batch <strong className="text-foreground">{batchToCancel?.batchNumber}</strong> akan dihentikan. Stok bahan belum dipotong pada tahap ini.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCancelSubmit} className="space-y-4 py-2">
            {actionError && <p role="alert" className="text-sm text-destructive">{actionError}</p>}
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
