import * as React from "react"
import { Link } from "react-router-dom"
import {
  ChevronDown,
  Filter,
  Plus,
  ArrowRightLeft,
  RefreshCcw,
  Loader2,
  Package,
} from "lucide-react"

import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePermission } from "@/hooks/use-permission"
import { useStocks } from "@/features/inventory/hooks/use-stocks"
import { RecordPurchaseDialog } from "@/features/inventory/components/record-purchase-dialog"
import { RecordMovementDialog } from "@/features/inventory/components/record-movement-dialog"

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
type LevelFilter = "all" | "below_min"
type SortKey = "name" | "baseUnit" | "current" | "status"
type SortDir = "asc" | "desc"

function sortRows(rows: MaterialStockRow[], sortKey: SortKey, sortDir: SortDir) {
  const sorted = [...rows]
  sorted.sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1

    if (sortKey === "name") return a.name.localeCompare(b.name) * dir
    if (sortKey === "baseUnit") return a.baseUnit.localeCompare(b.baseUnit) * dir
    if (sortKey === "current") return (a.current - b.current) * dir

    const aStatus = getStatus(a)
    const bStatus = getStatus(b)
    const order: Record<StockStatus, number> = { out: 0, low: 1, healthy: 2 }
    return (order[aStatus] - order[bStatus]) * dir
  })
  return sorted
}

function StatusBadge({ status }: { status: StockStatus }) {
  if (status === "healthy") return <Badge variant="success">Healthy</Badge>
  if (status === "low") return <Badge variant="warning">Low</Badge>
  return <Badge variant="destructive">Out</Badge>
}

export default function StockListPage() {
  const {
    stocks,
    total,
    page,
    totalPages,
    search,
    setSearch,
    setPage,
    inventoryMethod,
    setInventoryMethod,
    loading,
    error,
    isSubmitting,
    loadStocks,
    handleCreateStock,
  } = useStocks()

  const { can } = usePermission()
  const canCreate = can("stocks:create")
  const canAdjust = can("stocks:adjust")

  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all")
  const [levelFilter, setLevelFilter] = React.useState<LevelFilter>("all")
  const [sortKey] = React.useState<SortKey>("name")
  const [sortDir] = React.useState<SortDir>("asc")

  // Modal Dialog States
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isPurchaseOpen, setIsPurchaseOpen] = React.useState(false)
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
    if (levelFilter === "below_min") rows = rows.filter((r) => r.current < r.min)
    return sortRows(rows, sortKey, sortDir)
  }, [materialRows, statusFilter, levelFilter, sortKey, sortDir])

  function resetFilters() {
    setSearch("")
    setInventoryMethod(undefined)
    setStatusFilter("all")
    setLevelFilter("all")
    setPage(1)
  }

  const activeFiltersCount =
    (search.trim() ? 1 : 0) +
    (inventoryMethod ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (levelFilter !== "all" ? 1 : 0)

  const handleOpenCreateModal = () => {
    setNewName("")
    setNewBaseUnit("kg")
    setNewMethod("FIFO")
    setCreateError("")
    setIsCreateOpen(true)
  }

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) {
      setCreateError("Material name is required")
      return
    }
    try {
      await handleCreateStock({
        name: newName.trim(),
        base_unit: newBaseUnit.trim(),
        inventory_method: newMethod,
      })
      setIsCreateOpen(false)
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Failed to create material")
    }
  }

  const columns = [
    {
      header: "Bahan Baku",
      accessor: (row: MaterialStockRow) => (
        <Link to={`/inventory/stocks/${row.id}`} className="font-medium text-primary underline underline-offset-4 hover:opacity-90 transition-colors">
          {row.name}
        </Link>
      ),
    },
    {
      header: "Metode",
      accessor: (row: MaterialStockRow) => (
        <Badge variant={row.inventoryMethod === "FEFO" ? "warning" : "info"} className="text-[11px] font-mono">
          {row.inventoryMethod}
        </Badge>
      ),
    },
    { header: "Base Unit", accessor: (row: MaterialStockRow) => <span className="text-muted-foreground">{row.baseUnit}</span> },
    {
      header: "Current Stock",
      accessor: (row: MaterialStockRow) => (
        <span className="font-mono">
          {formatStock(row)}
        </span>
      ),
    },
    { header: "Status", accessor: (row: MaterialStockRow) => <StatusBadge status={getStatus(row)} /> },
  ]

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Bahan Baku</h1>
          <p className="text-sm text-muted-foreground">Kelola stok bahan baku, pembelian, dan penyesuaian inventaris.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canCreate && (
            <>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleOpenCreateModal} variant="outline" className="rounded-xl">
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Bahan Baku
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Tambah Bahan Baku</DialogTitle>
                    <DialogDescription>
                      Tambahkan bahan baku baru untuk dicatat dan dilacak pada inventaris.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmitCreate} className="space-y-4 py-2">
                    {createError && (
                      <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                        {createError}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="material-name">Nama Bahan Baku</Label>
                      <Input
                        id="material-name"
                        placeholder="Contoh: Biji Kopi Arabika, Susu Segar, Tepung Terigu"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Base Unit</Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-between rounded-xl"
                          >
                            <span>
                              {BASE_UNITS.find((u) => u.value === newBaseUnit)?.label ?? newBaseUnit ?? "Select base unit"}
                            </span>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]" align="start">
                          <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground/70">
                            Base Units
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {BASE_UNITS.map((u) => (
                            <DropdownMenuItem
                              key={u.value}
                              onClick={() => setNewBaseUnit(u.value)}
                              className="cursor-pointer"
                            >
                              {u.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="space-y-2">
                      <Label>Metode Pengelolaan Stok</Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-between rounded-xl"
                          >
                            <span>
                              {newMethod === "FEFO"
                                ? "FEFO (First Expired, First Out)"
                                : "FIFO (First In, First Out)"}
                            </span>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
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
                    <DialogFooter className="pt-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Simpan Bahan Baku
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Button onClick={() => setIsPurchaseOpen(true)} variant="outline" className="rounded-xl">
                <Package className="mr-2 h-4 w-4" />
                Record Purchase
              </Button>
            </>
          )}

          {canAdjust && (
            <Button onClick={() => setIsMovementOpen(true)} className="rounded-xl">
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Record Movement
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-xl border border-destructive/20">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Daftar Bahan Baku</CardTitle>
              <CardDescription>Cari, filter, dan pantau stok bahan baku.</CardDescription>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {loading ? "Loading..." : `${filteredRows.length} items`}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {/* Filter Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1">
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                  }}
                  placeholder="Cari bahan baku..."
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-xl">
                    <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                    Status
                    <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground/70">
                    Status
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setStatusFilter("all")
                    }}
                    className="cursor-pointer"
                  >
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setStatusFilter("healthy")
                    }}
                    className="cursor-pointer"
                  >
                    Healthy
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setStatusFilter("low")
                    }}
                    className="cursor-pointer"
                  >
                    Low
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setStatusFilter("out")
                    }}
                    className="cursor-pointer"
                  >
                    Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-xl">
                    Stock Level
                    <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground/70">
                    Stock Level
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setLevelFilter("all")
                    }}
                    className="cursor-pointer"
                  >
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setLevelFilter("below_min")
                    }}
                    className="cursor-pointer"
                  >
                    Below Min Only
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-xl">
                    Metode
                    <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground/70">
                    Metode Inventaris
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setInventoryMethod(undefined)
                      setPage(1)
                    }}
                    className="cursor-pointer"
                  >
                    Semua
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setInventoryMethod("FIFO")
                      setPage(1)
                    }}
                    className="cursor-pointer"
                  >
                    FIFO
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setInventoryMethod("FEFO")
                      setPage(1)
                    }}
                    className="cursor-pointer"
                  >
                    FEFO
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                className="rounded-xl"
                onClick={resetFilters}
                disabled={activeFiltersCount === 0}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>

          {/* Active filter summary */}
          {activeFiltersCount > 0 && (
            <div className="text-xs text-muted-foreground">
              Filters active: {activeFiltersCount}
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading stocks...
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredRows}
              total={total}
              page={page}
              totalPages={totalPages}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
              label="bahan baku"
              loading={loading}
            />
          )}
        </CardContent>
      </Card>

      <RecordPurchaseDialog
        open={isPurchaseOpen}
        onOpenChange={setIsPurchaseOpen}
        onSuccess={loadStocks}
      />

      <RecordMovementDialog
        open={isMovementOpen}
        onOpenChange={setIsMovementOpen}
        onSuccess={loadStocks}
      />
    </div>
  )
}
