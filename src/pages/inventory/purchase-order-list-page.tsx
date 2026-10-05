import * as React from "react"
import { Link } from "react-router-dom"
import {
  ClipboardList,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Check,
  MoreVertical,
  Calendar,
  Building2,
  Receipt,
  DollarSign,
  Loader2,
  Ban,
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
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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

import { purchaseOrderService } from "@/features/purchase-orders/services/po-service"
import type { PurchaseOrder, PurchaseOrderStatus } from "@/features/purchase-orders/types"

export default function PurchaseOrderListPage() {
  const [orders, setOrders] = React.useState<PurchaseOrder[]>([])
  const [loading, setLoading] = React.useState<boolean>(true)
  const [search, setSearch] = React.useState<string>("")
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL")

  // Modal complete price state
  const [completingPO, setCompletingPO] = React.useState<PurchaseOrder | null>(null)
  const [itemPrices, setItemPrices] = React.useState<Record<string, number>>({})
  const [submitting, setSubmitting] = React.useState<boolean>(false)

  // Load PO list
  const loadOrders = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await purchaseOrderService.getPurchaseOrders()
      setOrders(data)
    } catch (err) {
      console.error("Failed to load POs:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // Open Complete Dialog
  function handleOpenComplete(po: PurchaseOrder) {
    setCompletingPO(po)
    const initial: Record<string, number> = {}
    po.items.forEach((it) => {
      initial[it.id] = it.unitPrice || 0
    })
    setItemPrices(initial)
  }

  // Submit Complete with Prices
  async function handleConfirmComplete(e: React.FormEvent) {
    e.preventDefault()
    if (!completingPO) return

    setSubmitting(true)
    try {
      const prices = completingPO.items.map((it) => ({
        itemId: it.id,
        unitPrice: Number(itemPrices[it.id]) || 0,
      }))

      await purchaseOrderService.completePurchaseOrder(completingPO.id, prices)
      setCompletingPO(null)
      await loadOrders()
    } catch (err) {
      console.error("Failed to complete PO:", err)
    } finally {
      setSubmitting(false)
    }
  }

  // Cancel PO
  async function handleCancelPO(id: string) {
    try {
      await purchaseOrderService.cancelPurchaseOrder(id)
      await loadOrders()
    } catch (err) {
      console.error("Failed to cancel PO:", err)
    }
  }

  // Filter & Search
  const filteredOrders = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders.filter((o) => {
      const matchSearch =
        o.poNumber.toLowerCase().includes(q) ||
        o.supplierName.toLowerCase().includes(q) ||
        o.items.some((it) => it.stockName.toLowerCase().includes(q))
      
      const matchStatus = statusFilter === "ALL" || o.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [orders, search, statusFilter])

  // Metrics
  const totalCount = orders.length
  const inProgressCount = orders.filter((o) => o.status === "IN_PROGRESS").length
  const completedCount = orders.filter((o) => o.status === "COMPLETED").length
  const totalCompletedAmount = orders
    .filter((o) => o.status === "COMPLETED")
    .reduce((acc, o) => acc + o.totalAmount, 0)

  function formatRupiah(amount: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  function formatDate(dateStr: string) {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(dateStr))
  }

  function getStatusBadge(status: PurchaseOrderStatus) {
    switch (status) {
      case "IN_PROGRESS":
        return (
          <Badge variant="warning" className="flex items-center gap-1 w-fit">
            <Clock className="h-3 w-3" /> Dalam Proses
          </Badge>
        )
      case "COMPLETED":
        return (
          <Badge variant="success" className="flex items-center gap-1 w-fit">
            <CheckCircle2 className="h-3 w-3" /> Selesai / Diterima
          </Badge>
        )
      case "CANCELLED":
        return (
          <Badge variant="outline" className="text-muted-foreground flex items-center gap-1 w-fit">
            <XCircle className="h-3 w-3" /> Dibatalkan
          </Badge>
        )
    }
  }

  const calculatedDialogTotal = completingPO
    ? completingPO.items.reduce((acc, it) => {
        const p = Number(itemPrices[it.id]) || 0
        return acc + p * it.quantity
      }, 0)
    : 0

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            Purchase Orders (Pengadaan Stok)
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola pengajuan pembelian (Purchase Request) ke vendor dan pantau status barang hingga siap masuk stok.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild className="rounded-xl shadow-sm">
            <Link to="/inventory/purchase-orders/new">
              <Plus className="mr-2 h-4 w-4" />
              Buat Purchase Request
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total PO
            </CardTitle>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Receipt className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalCount} Pesanan</div>
            <p className="text-xs text-muted-foreground mt-1">Seluruh riwayat PO</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dalam Proses (Vendor)
            </CardTitle>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{inProgressCount} Pesanan</div>
            <p className="text-xs text-muted-foreground mt-1">Menunggu pengiriman & set harga</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Selesai / Diterima
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{completedCount} Pesanan</div>
            <p className="text-xs text-muted-foreground mt-1">Stok berhasil ditambahkan</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Nilai Masuk Stok
            </CardTitle>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground font-mono">
              {formatRupiah(totalCompletedAmount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Akumulasi PO selesai</p>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card className="rounded-xl shadow-sm border-border">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Daftar Purchase Orders</CardTitle>
              <CardDescription>
                Daftar pesanan pembelian bahan baku dengan status proses dan realisasi harga.
              </CardDescription>
            </div>
            <div className="text-xs text-muted-foreground">
              {filteredOrders.length} order ditemukan
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {/* Controls: Search & Tabs */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nomor PO, vendor, atau bahan..."
                className="pl-9 rounded-xl"
              />
            </div>

            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList className="rounded-xl bg-muted/60 p-1 border border-border">
                <TabsTrigger value="ALL" className="rounded-lg text-xs">Semua</TabsTrigger>
                <TabsTrigger value="IN_PROGRESS" className="rounded-lg text-xs">
                  Dalam Proses ({inProgressCount})
                </TabsTrigger>
                <TabsTrigger value="COMPLETED" className="rounded-lg text-xs">
                  Selesai ({completedCount})
                </TabsTrigger>
                <TabsTrigger value="CANCELLED" className="rounded-lg text-xs">
                  Dibatalkan
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-semibold text-foreground">No. Purchase Order</TableHead>
                  <TableHead className="font-semibold text-foreground">Vendor / Supplier</TableHead>
                  <TableHead className="font-semibold text-foreground">Tanggal Pesan</TableHead>
                  <TableHead className="font-semibold text-foreground">Item Bahan</TableHead>
                  <TableHead className="font-semibold text-foreground">Status</TableHead>
                  <TableHead className="font-semibold text-foreground text-right">Total Nilai</TableHead>
                  <TableHead className="w-[80px] text-center"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span>Memuat data Purchase Orders...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-1.5 py-4">
                        <Receipt className="h-8 w-8 text-muted-foreground/50 mb-1" />
                        <span className="font-medium text-foreground">Belum ada data Purchase Order</span>
                        <span className="text-xs">
                          {search ? "Tidak ditemukan pesanan dengan kata kunci tersebut." : "Mulai dengan membuat Purchase Request pertama."}
                        </span>
                        {!search && (
                          <Button asChild size="sm" className="mt-2 rounded-lg">
                            <Link to="/inventory/purchase-orders/new">
                              <Plus className="mr-1.5 h-3.5 w-3.5" /> Buat Purchase Request
                            </Link>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((po) => (
                    <TableRow key={po.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">
                        <Link
                          to={`/inventory/purchase-orders/${po.id}`}
                          className="font-mono font-bold text-primary hover:underline"
                        >
                          {po.poNumber}
                        </Link>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium text-foreground">{po.supplierName}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(po.orderDate)}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-0.5 text-xs">
                          <span className="font-medium text-foreground">{po.items.length} jenis item</span>
                          <span className="text-muted-foreground truncate max-w-[200px]">
                            {po.items.map((it) => `${it.stockName} (${it.quantity}${it.baseUnit})`).join(", ")}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>{getStatusBadge(po.status)}</TableCell>

                      <TableCell className="text-right font-mono font-medium">
                        {po.status === "IN_PROGRESS" && po.totalAmount === 0 ? (
                          <span className="text-xs text-amber-600 italic">Menunggu harga</span>
                        ) : (
                          formatRupiah(po.totalAmount)
                        )}
                      </TableCell>

                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild className="cursor-pointer">
                              <Link to={`/inventory/purchase-orders/${po.id}`}>
                                <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
                                Lihat Detail
                              </Link>
                            </DropdownMenuItem>

                            {po.status === "IN_PROGRESS" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleOpenComplete(po)}
                                  className="cursor-pointer text-emerald-600 font-medium"
                                >
                                  <Check className="mr-2 h-4 w-4" />
                                  Set Harga & Selesaikan
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleCancelPO(po.id)}
                                  className="text-destructive cursor-pointer"
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  Batalkan PO
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Set Harga & Selesaikan PO */}
      <Dialog open={!!completingPO} onOpenChange={(open) => !open && setCompletingPO(null)}>
        <DialogContent className="sm:max-w-[550px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Selesaikan Pesanan & Set Harga Stok
            </DialogTitle>
            <DialogDescription>
              Pesanan <strong className="text-foreground">{completingPO?.poNumber}</strong> dari vendor{" "}
              <strong className="text-foreground">{completingPO?.supplierName}</strong> telah diproses.
              Masukkan harga satuan yang ditagihkan untuk menentukan HPP batch stok.
            </DialogDescription>
          </DialogHeader>

          {completingPO && (
            <form onSubmit={handleConfirmComplete} className="space-y-4 py-2">
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Bahan Baku</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="w-[180px]">Harga Satuan (Rp)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completingPO.items.map((it) => (
                      <TableRow key={it.id}>
                        <TableCell className="font-medium text-sm">
                          {it.stockName}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {it.quantity} {it.baseUnit}
                        </TableCell>
                        <TableCell>
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              value={itemPrices[it.id] ?? ""}
                              onChange={(e) =>
                                setItemPrices({
                                  ...itemPrices,
                                  [it.id]: Number(e.target.value),
                                })
                              }
                              placeholder="e.g. 15000"
                              className="rounded-lg h-8 text-right font-mono text-sm"
                              required
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Total Summary */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Total Nilai Pembelian:</span>
                <span className="text-base font-bold font-mono text-primary">
                  {formatRupiah(calculatedDialogTotal)}
                </span>
              </div>

              <DialogFooter className="pt-2 sm:space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCompletingPO(null)}
                  className="rounded-xl"
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Konfirmasi & Masukkan ke Stok
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
