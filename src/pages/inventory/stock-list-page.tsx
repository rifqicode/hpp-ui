import * as React from "react"
import { Link } from "react-router-dom"
import {
  Plus,
  ArrowRightLeft,
  ArrowUpDown,
  RefreshCw,
  Loader2,
  Package,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Eye,
  MoreVertical,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TablePagination } from "@/components/ui/table-pagination"
import { ListFilters } from "@/components/ui/list-filters"
import { usePermission } from "@/hooks/use-permission"
import { useStocks, useStockSummaryQuery } from "@/features/inventory/hooks"
import { RecordMovementDialog } from "@/features/inventory/components/record-movement-dialog"
import { QuotaBadge, useSubscriptionGuards } from "@/features/subscription"

const BASE_UNITS = [
  { value: "kg", label: "Kilogram (kg)" },
  { value: "g", label: "Gram (g)" },
  { value: "mg", label: "Miligram (mg)" },
  { value: "L", label: "Liter (L)" },
  { value: "ml", label: "Mililiter (ml)" },
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "pack", label: "Pack" },
  { value: "box", label: "Box" },
  { value: "bottle", label: "Bottle" },
  { value: "can", label: "Can" },
] as const

type StockStatus = "healthy" | "low" | "out"

type MaterialStockRow = {
  id: string
  name: string
  baseUnit: string
  current: number
  min: number
  inventoryMethod: "FIFO" | "FEFO"
}

function getStatus(row: MaterialStockRow): StockStatus {
  if (row.current <= 0) return "out"
  if (row.current < row.min) return "low"
  return "healthy"
}

function formatStock(row: MaterialStockRow) {
  const value = Number.isInteger(row.current) ? row.current.toString() : row.current.toFixed(2)
  return `${value} ${row.baseUnit}`
}

type StatusFilter = "all" | StockStatus

function StatusBadge({ status }: { status: StockStatus }) {
  if (status === "healthy") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Healthy
      </span>
    )
  }
  if (status === "low") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Low
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
      Habis
    </span>
  )
}

export default function StockListPage() {
  const {
    stocks,
    total,
    page,
    totalPages,
    search,
    setSearch,
    sortBy,
    setSortBy,
    setPage,
    inventoryMethod,
    setInventoryMethod,
    loading,
    isFetching,
    error,
    isSubmitting,
    loadStocks,
    handleCreateStock,
  } = useStocks()

  const { data: summary, refetch: refetchSummary } = useStockSummaryQuery()
  const { can } = usePermission()
  const { isQuotaReached } = useSubscriptionGuards()
  const canCreate = can("stocks:create")
  const canAdjust = can("stocks:adjust")

  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all")

  // Modal Dialog States
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isMovementOpen, setIsMovementOpen] = React.useState(false)
  const [newName, setNewName] = React.useState("")
  const [newBaseUnit, setNewBaseUnit] = React.useState("kg")
  const [newMethod, setNewMethod] = React.useState<"FIFO" | "FEFO">("FIFO")
  const [createError, setCreateError] = React.useState("")

  const materialRows: MaterialStockRow[] = React.useMemo(() => {
    return stocks.map((s) => ({
      id: s.id,
      name: s.name,
      baseUnit: s.base_unit,
      current: Number(s.current_stock) || 0,
      min: 0,
      inventoryMethod: s.inventory_method || "FIFO",
    }))
  }, [stocks])

  const filteredRows = React.useMemo(() => {
    let rows = materialRows
    if (statusFilter !== "all") rows = rows.filter((r) => getStatus(r) === statusFilter)
    return rows
  }, [materialRows, statusFilter])

  const handleRefresh = async () => {
    await Promise.all([loadStocks(), refetchSummary()])
  }

  const handleOpenCreateModal = (e?: React.MouseEvent) => {
    if (e) e.preventDefault()
    if (isQuotaReached("stocks")) {
      window.dispatchEvent(
        new CustomEvent("open-upgrade-modal", {
          detail: {
            message: "Batas kuota bahan baku Anda telah tercapai. Tingkatkan paket untuk menambah bahan baku baru.",
          },
        })
      )
      return
    }
    setNewName("")
    setNewBaseUnit("kg")
    setNewMethod("FIFO")
    setCreateError("")
    setIsCreateOpen(true)
  }

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) {
      setCreateError("Nama bahan baku wajib diisi")
      return
    }
    try {
      await handleCreateStock({
        name: newName.trim(),
        base_unit: newBaseUnit.trim(),
        inventory_method: newMethod,
      })
      setIsCreateOpen(false)
      refetchSummary()
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Gagal menambahkan bahan baku")
    }
  }

  return (
    <div className="space-y-6">
      {/* Feedback / Error Alert */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl text-sm font-medium border shadow-xs bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
          <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Bahan Baku & Inventaris
                </h1>
                <QuotaBadge
                  resource="stocks"
                  label="Kapasitas Stok"
                  onUpgradeClick={() => {
                    window.dispatchEvent(
                      new CustomEvent("open-upgrade-modal", {
                        detail: {
                          message: "Tingkatkan paket Anda untuk kuota bahan baku lebih banyak.",
                        },
                      })
                    )
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Kelola stok bahan baku, pembelian, alur FIFO/FEFO, dan penyesuaian inventaris
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 shadow-2xs hover:bg-muted"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {canAdjust && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMovementOpen(true)}
              className="flex items-center gap-1.5 shadow-2xs hover:bg-muted"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              Stock Adjustment
            </Button>
          )}

          {canCreate && (
            <>
              <Button
                onClick={handleOpenCreateModal}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-2xs"
              >
                <Plus className="h-4 w-4" />
                Tambah Bahan Baku
              </Button>

              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-md">
                  <form onSubmit={handleSubmitCreate}>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        Tambah Bahan Baku Baru
                      </DialogTitle>
                      <DialogDescription>
                        Bahan baku akan digunakan dalam resep produk dan pencatatan pembelian inventaris.
                      </DialogDescription>
                    </DialogHeader>

                    {createError && (
                      <div className="my-3 bg-destructive/10 text-destructive text-sm p-3 rounded-xl border border-destructive/20">
                        {createError}
                      </div>
                    )}

                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="stock-name">Nama Bahan Baku</Label>
                        <Input
                          id="stock-name"
                          placeholder="misal: Tepung Terigu Segitiga Biru"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          required
                          className="h-9"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="stock-unit">Satuan Dasar (Base Unit)</Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              id="stock-unit"
                              type="button"
                              variant="outline"
                              className="w-full justify-between h-9"
                            >
                              <span>
                                {BASE_UNITS.find((u) => u.value === newBaseUnit)?.label || newBaseUnit}
                              </span>
                              <span className="text-xs text-muted-foreground">Pilih</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-60 overflow-y-auto">
                            <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground/70">
                              Satuan Standar
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {BASE_UNITS.map((unit) => (
                              <DropdownMenuItem
                                key={unit.value}
                                onClick={() => setNewBaseUnit(unit.value)}
                                className="cursor-pointer"
                              >
                                {unit.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="grid gap-2">
                        <Label>Metode Inventaris</Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full justify-between h-9 text-left font-normal"
                            >
                              <span className="font-semibold">{newMethod}</span>
                              <span className="text-xs text-muted-foreground">Ubah</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]" align="start">
                            <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground/70">
                              Metode Inventaris
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setNewMethod("FIFO")}
                              className="cursor-pointer flex flex-col items-start gap-0.5"
                            >
                              <span className="font-semibold">FIFO (First In, First Out)</span>
                              <span className="text-[11px] text-muted-foreground">Untuk bahan umum/kering (tgl kadaluwarsa opsional)</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setNewMethod("FEFO")}
                              className="cursor-pointer flex flex-col items-start gap-0.5"
                            >
                              <span className="font-semibold">FEFO (First Expired, First Out)</span>
                              <span className="text-[11px] text-muted-foreground">Untuk bahan mudah basi/segar (wajib isi tgl kadaluwarsa)</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <DialogFooter className="pt-2 gap-2 sm:gap-0">
                      <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                        Batal
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Simpan Bahan Baku
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {/* KPI / Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Bahan Baku */}
        <Card className="py-3 px-4 shadow-2xs border-border/80 bg-card">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Total Bahan Baku</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  {summary?.total_materials ?? total}
                </span>
                <span className="text-xs text-muted-foreground">material</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Package className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Stok Aman / Healthy */}
        <Card className="py-3 px-4 shadow-2xs border-border/80 bg-card">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Stok Aman (Healthy)</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  {summary?.healthy_stock ?? 0}
                </span>
                <span className="text-xs text-muted-foreground">tersedia cukup</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Stok Menipis / Low */}
        <Card className="py-3 px-4 shadow-2xs border-border/80 bg-card">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Stok Menipis (Low)</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                  {summary?.low_stock ?? 0}
                </span>
                <span className="text-xs text-muted-foreground">dibawah batas min</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Stok Habis / Out */}
        <Card className="py-3 px-4 shadow-2xs border-border/80 bg-card">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Stok Habis (Kosong)</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                  {summary?.out_of_stock ?? 0}
                </span>
                <span className="text-xs text-muted-foreground">perlu order segera</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <ListFilters
        label="Filter bahan baku"
        search={{
          label: "Cari bahan baku",
          placeholder: "Cari nama bahan baku...",
          value: search,
          onChange: (value) => { setSearch(value); setPage(1) },
        }}
        filters={[
          {
            id: "status", label: "Status stok", value: statusFilter,
            onChange: (value) => { setStatusFilter(value as StatusFilter); setPage(1) },
            options: [
              { value: "all", label: "Semua status" },
              { value: "healthy", label: "Healthy" },
              { value: "low", label: "Low" },
              { value: "out", label: "Habis" },
            ],
          },
          {
            id: "inventory-method", label: "Metode alur", value: inventoryMethod || "all",
            onChange: (value) => { setInventoryMethod(value === "FIFO" || value === "FEFO" ? value : undefined); setPage(1) },
            options: [
              { value: "all", label: "Semua metode" },
              { value: "FIFO", label: "FIFO" },
              { value: "FEFO", label: "FEFO" },
            ],
          },
        ]}
        summary={loading ? "Memuat bahan baku..." : error ? "Data belum tersedia" : statusFilter !== "all"
          ? `${filteredRows.length} bahan baku di halaman ini`
          : `${total} bahan baku${search.trim() || inventoryMethod ? ` dari ${summary?.total_materials ?? total}` : ""}`}
        hasFilters={Boolean(search.trim()) || inventoryMethod !== undefined || statusFilter !== "all" || sortBy !== "name-asc"}
        onReset={() => { setSearch(""); setInventoryMethod(undefined); setStatusFilter("all"); setSortBy("name-asc"); setPage(1) }}
        isFetching={isFetching && !loading}
        fetchingLabel="Memperbarui bahan baku"
        trailingActions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 gap-1.5 text-xs rounded-md shadow-2xs">
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                Urutkan
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 text-xs">
              <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground/70">
                Urutan
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setSortBy("name-asc")}
                className="cursor-pointer"
              >
                Nama (A - Z)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy("name-desc")}
                className="cursor-pointer"
              >
                Nama (Z - A)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy("current-desc")}
                className="cursor-pointer"
              >
                Stok Terbanyak
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy("current-asc")}
                className="cursor-pointer"
              >
                Stok Paling Sedikit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 border rounded-2xl bg-card shadow-2xs">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Memuat data inventaris...</p>
        </div>
      ) : (summary?.total_materials ?? total) === 0 && !search && inventoryMethod === undefined && statusFilter === "all" ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-12 sm:p-16 text-center rounded-2xl border-2 border-dashed border-border bg-card/60 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-inner">
            <Package className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Belum Ada Bahan Baku</h2>
          <p className="text-sm text-muted-foreground max-w-md mt-1 mb-6">
            Mulai tambahkan bahan baku dan atur metode FIFO atau FEFO untuk menghitung HPP produksi secara presisi.
          </p>
          {canCreate && (
            <Button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-xs"
            >
              <Plus className="h-4 w-4" />
              Tambah Bahan Baku Baru
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Polished Table Container */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
                  <tr>
                    <th className="px-3.5 sm:px-5 py-3">Nama Bahan Baku</th>
                    <th className="px-3.5 sm:px-5 py-3">Metode Alur</th>
                    <th className="px-3.5 sm:px-5 py-3">Satuan (Base Unit)</th>
                    <th className="px-3.5 sm:px-5 py-3 font-mono">Stok Saat Ini</th>
                    <th className="px-3.5 sm:px-5 py-3 text-center">Status</th>
                    <th className="px-3.5 sm:px-5 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3.5 sm:px-5 py-12 text-center text-muted-foreground">
                        <p className="font-medium text-foreground">Tidak ada bahan baku yang cocok</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Coba sesuaikan kata kunci pencarian atau filter status inventaris.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-muted/30 transition-colors group"
                      >
                        <td className="px-3.5 sm:px-5 py-3 font-medium text-foreground">
                          <div className="flex flex-col">
                            <Link
                              to={`/inventory/stocks/${row.id}`}
                              className="font-semibold text-foreground group-hover:text-primary transition-colors underline-offset-4 hover:underline"
                            >
                              {row.name}
                            </Link>
                            <span className="text-[11px] text-muted-foreground font-normal">
                              ID: {row.id.slice(0, 12)}...
                            </span>
                          </div>
                        </td>

                        <td className="px-3.5 sm:px-5 py-3">
                          <Badge
                            variant={row.inventoryMethod === "FEFO" ? "warning" : "info"}
                            className="text-[11px] font-mono uppercase tracking-wider"
                          >
                            {row.inventoryMethod}
                          </Badge>
                        </td>

                        <td className="px-3.5 sm:px-5 py-3 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{row.baseUnit}</span>
                        </td>

                        <td className="px-3.5 sm:px-5 py-3 font-mono text-xs font-semibold text-foreground">
                          {formatStock(row)}
                        </td>

                        <td className="px-3.5 sm:px-5 py-3 text-center">
                          <StatusBadge status={getStatus(row)} />
                        </td>

                        <td className="px-3.5 sm:px-5 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label={`Aksi untuk ${row.name}`} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/inventory/stocks/${row.id}`}>
                                  <Eye className="mr-2 h-3.5 w-3.5" />
                                  Lihat detail
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table Pagination */}
          <TablePagination
            total={total}
            displayedCount={filteredRows.length}
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={loading}
            label="bahan baku"
          />
        </div>
      )}

      {/* Record Movement Dialog */}
      {isMovementOpen && (
        <RecordMovementDialog
          open={isMovementOpen}
          onOpenChange={setIsMovementOpen}
          onSuccess={() => {
            loadStocks()
            refetchSummary()
          }}
        />
      )}
    </div>
  )
}
