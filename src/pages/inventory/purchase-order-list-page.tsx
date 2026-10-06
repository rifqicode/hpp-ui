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
  Loader2,
  Ban,
  Edit3,
  ChevronDown,
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
import { Textarea } from "@/components/ui/textarea"
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
import { TablePagination } from "@/components/ui/table-pagination"
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

import { usePurchaseOrders } from "@/features/purchase-orders/hooks"
import type { PurchaseOrderStatus } from "@/features/purchase-orders/types"
import { supplierService } from "@/features/suppliers/services/supplier-service"
import type { Supplier } from "@/features/suppliers/types"

export default function PurchaseOrderListPage() {
  const {
    orders,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    page,
    totalPages,
    total,
    handleNextPage,
    handlePrevPage,
    // Approve
    approvingPO,
    setApprovingPO,
    approveSupplierId,
    setApproveSupplierId,
    approveNotes,
    setApproveNotes,
    handleOpenApprove,
    handleConfirmApprove,
    // Reject
    rejectingPO,
    setRejectingPO,
    rejectReason,
    setRejectReason,
    handleOpenReject,
    handleConfirmReject,
    // Complete
    completingPO,
    setCompletingPO,
    completeSupplierId,
    setCompleteSupplierId,
    itemPrices,
    setItemPrices,
    handleOpenComplete,
    handleConfirmComplete,
    // Actions & Permissions
    submitting,
    handleCancelPO,
    canProcess,
    canRequest,
    canEditPO,
    // Stats
    totalCount,
    requestCount,
    orderCount,
    completedCount,
    totalCompletedAmount,
    formatRupiah,
    formatDate,
  } = usePurchaseOrders()

  const [suppliers, setSuppliers] = React.useState<Supplier[]>([])

  React.useEffect(() => {
    supplierService
      .getAllSuppliers()
      .then((data) => setSuppliers(data))
      .catch((err) => console.error("Failed to load suppliers:", err))
  }, [])

  function getStatusBadge(status: PurchaseOrderStatus) {
    switch (status) {
      case "PURCHASE_REQUEST":
        return (
          <Badge variant="outline" className="border-blue-500/40 text-blue-600 bg-blue-500/10 flex items-center gap-1 w-fit">
            <Clock className="h-3 w-3" /> Purchase Request
          </Badge>
        )
      case "PURCHASE_ORDER":
        return (
          <Badge variant="warning" className="flex items-center gap-1 w-fit">
            <Receipt className="h-3 w-3" /> Purchase Order
          </Badge>
        )
      case "COMPLETED":
        return (
          <Badge variant="success" className="flex items-center gap-1 w-fit">
            <CheckCircle2 className="h-3 w-3" /> Selesai / Diterima
          </Badge>
        )
      case "REJECTED":
        return (
          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
            <XCircle className="h-3 w-3" /> Ditolak
          </Badge>
        )
      case "CANCELLED":
        return (
          <Badge variant="outline" className="text-muted-foreground flex items-center gap-1 w-fit">
            <Ban className="h-3 w-3" /> Dibatalkan
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
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
            Purchase Orders
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola pengajuan pembelian (Purchase Request) ke vendor dan pantau status barang hingga siap masuk stok.
          </p>
        </div>
        {canRequest && (
          <div className="flex gap-2">
            <Button asChild className="rounded-xl shadow-sm">
              <Link to="/inventory/purchase-orders/new">
                <Plus className="mr-2 h-4 w-4" />
                Buat Purchase Request
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pengajuan
            </CardTitle>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Receipt className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalCount} Pesanan</div>
            <p className="text-xs text-muted-foreground mt-1">Seluruh riwayat PR & PO</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Purchase Request
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{requestCount} Request</div>
            <p className="text-xs text-muted-foreground mt-1">Menunggu persetujuan Tim Finance</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Purchase Order
            </CardTitle>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
              <Receipt className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{orderCount} Pesanan</div>
            <p className="text-xs text-muted-foreground mt-1">Menunggu barang & realisasi harga</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Selesai / Masuk Stok
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{completedCount} Pesanan</div>
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              {formatRupiah(totalCompletedAmount)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card className="rounded-xl shadow-sm border-border">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Daftar Purchase Orders & Requests</CardTitle>
              <CardDescription>
                Daftar alur pengadaan bahan baku dari pengajuan, order, hingga penerimaan stok.
              </CardDescription>
            </div>
            <div className="text-xs text-muted-foreground">
              {total} order ditemukan
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
                <TabsTrigger value="PURCHASE_REQUEST" className="rounded-lg text-xs">
                  Request ({requestCount})
                </TabsTrigger>
                <TabsTrigger value="PURCHASE_ORDER" className="rounded-lg text-xs">
                  PO ({orderCount})
                </TabsTrigger>
                <TabsTrigger value="COMPLETED" className="rounded-lg text-xs">
                  Selesai ({completedCount})
                </TabsTrigger>
                <TabsTrigger value="REJECTED" className="rounded-lg text-xs">
                  Ditolak
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
                  <TableHead className="font-semibold text-foreground">No. Pengajuan / PO</TableHead>
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
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-1.5 py-4">
                        <Receipt className="h-8 w-8 text-muted-foreground/50 mb-1" />
                        <span className="font-medium text-foreground">Belum ada data pengajuan</span>
                        <span className="text-xs">
                          {search ? "Tidak ditemukan pesanan dengan kata kunci tersebut." : "Mulai dengan membuat Purchase Request pertama."}
                        </span>
                        {!search && canRequest && (
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
                  orders.map((po) => (
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
                          <span className="font-medium text-foreground">
                            {po.supplierName || (
                              <span className="text-muted-foreground text-xs italic font-normal">
                                Belum ditentukan
                              </span>
                            )}
                          </span>
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
                        {po.status === "PURCHASE_REQUEST" || po.totalAmount === 0 ? (
                          <span className="text-xs text-muted-foreground italic">Menunggu harga</span>
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

                            {po.status === "PURCHASE_REQUEST" && (
                              <>
                                {canEditPO(po) && (
                                  <DropdownMenuItem asChild className="cursor-pointer text-blue-600">
                                    <Link to={`/inventory/purchase-orders/${po.id}/edit`}>
                                      <Edit3 className="mr-2 h-4 w-4" />
                                      Edit Request
                                    </Link>
                                  </DropdownMenuItem>
                                )}
                                {canProcess && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => handleOpenApprove(po)}
                                      className="cursor-pointer text-emerald-600 font-medium"
                                    >
                                      <Check className="mr-2 h-4 w-4" />
                                      Setujui (Jadikan PO)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleOpenReject(po)}
                                      className="cursor-pointer text-destructive"
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Tolak Request
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </>
                            )}

                            {po.status === "PURCHASE_ORDER" && canProcess && (
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

          {/* Pagination Controls */}
          <TablePagination
            total={total}
            displayedCount={orders.length}
            page={page}
            totalPages={totalPages}
            onPrev={handlePrevPage}
            onNext={handleNextPage}
            disabled={loading}
            label="pesanan"
          />
        </CardContent>
      </Card>

      {/* Modal 1: Approve Purchase Request -> PO */}
      <Dialog open={!!approvingPO} onOpenChange={(open) => !open && setApprovingPO(null)}>
        <DialogContent className="sm:max-w-[500px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-600" />
              Setujui Purchase Request
            </DialogTitle>
            <DialogDescription>
              Ubah status <strong className="text-foreground">{approvingPO?.poNumber}</strong> menjadi{" "}
              <strong>Purchase Order</strong>. Anda dapat menetapkan supplier kandidat sekarang atau nanti.
            </DialogDescription>
          </DialogHeader>

          {approvingPO && (
            <form onSubmit={handleConfirmApprove} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Vendor / Supplier (Opsional)</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between rounded-xl h-10"
                    >
                      <span className="truncate">
                        {suppliers.find((s) => s.id === approveSupplierId)?.name || "Pilih Supplier (Bisa nanti)"}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-60 overflow-y-auto" align="start">
                    <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground/70">
                      Pilihan Supplier
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setApproveSupplierId("")}
                      className="cursor-pointer italic text-muted-foreground"
                    >
                      -- Belum Ditentukan (Nanti) --
                    </DropdownMenuItem>
                    {suppliers.map((s) => (
                      <DropdownMenuItem
                        key={s.id}
                        onClick={() => setApproveSupplierId(s.id)}
                        className="cursor-pointer"
                      >
                        {s.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2">
                <Label htmlFor="approve-notes" className="text-sm font-semibold">
                  Catatan Persetujuan (Opsional)
                </Label>
                <Textarea
                  id="approve-notes"
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  placeholder="e.g. Disetujui untuk PO, vendor sudah dikonfirmasi ketersediaannya."
                  className="rounded-xl min-h-[80px]"
                />
              </div>

              <DialogFooter className="pt-2 sm:space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setApprovingPO(null)}
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
                  Setujui & Terbitkan PO
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal 2: Reject Purchase Request */}
      <Dialog open={!!rejectingPO} onOpenChange={(open) => !open && setRejectingPO(null)}>
        <DialogContent className="sm:max-w-[450px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Tolak Purchase Request
            </DialogTitle>
            <DialogDescription>
              Pengajuan <strong className="text-foreground">{rejectingPO?.poNumber}</strong> akan ditolak. Masukkan alasan penolakan untuk catatan riwayat.
            </DialogDescription>
          </DialogHeader>

          {rejectingPO && (
            <form onSubmit={handleConfirmReject} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="reject-reason" className="text-sm font-semibold">
                  Alasan Penolakan <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Anggaran belanja bahan baku bulan ini sudah melebihi kuota."
                  className="rounded-xl min-h-[90px]"
                  required
                />
              </div>

              <DialogFooter className="pt-2 sm:space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRejectingPO(null)}
                  className="rounded-xl"
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  className="rounded-xl"
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Tolak Request
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal 3: Set Harga & Selesaikan PO */}
      <Dialog open={!!completingPO} onOpenChange={(open) => !open && setCompletingPO(null)}>
        <DialogContent className="sm:max-w-[580px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Selesaikan Pesanan & Set Harga Stok
            </DialogTitle>
            <DialogDescription>
              Pesanan <strong className="text-foreground">{completingPO?.poNumber}</strong> telah tiba.
              Pilih supplier final dan masukkan harga satuan faktur untuk memasukkan barang ke stok bahan baku.
            </DialogDescription>
          </DialogHeader>

          {completingPO && (
            <form onSubmit={handleConfirmComplete} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Vendor / Supplier Final <span className="text-destructive">*</span>
                </Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between rounded-xl h-10"
                    >
                      <span className="truncate">
                        {suppliers.find((s) => s.id === completeSupplierId)?.name || "Pilih Vendor Final..."}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-60 overflow-y-auto" align="start">
                    <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground/70">
                      Daftar Supplier
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {suppliers.map((s) => (
                      <DropdownMenuItem
                        key={s.id}
                        onClick={() => setCompleteSupplierId(s.id)}
                        className="cursor-pointer"
                      >
                        {s.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

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
