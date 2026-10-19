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
  RefreshCw,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CurrencyText, formatCurrency } from "@/components/ui/currency-text"
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
import type {
  PurchaseOrderStatus,
  PurchaseOrder,
  PurchaseOrderItem,
} from "@/features/purchase-orders/types"
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
    itemTotalPrices,
    setItemTotalPrices,
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
    formatDate,
  } = usePurchaseOrders()

  const [suppliers, setSuppliers] = React.useState<Supplier[]>([])

  const loadSupplierList = React.useCallback(() => {
    supplierService
      .getAllSuppliers()
      .then((data) => setSuppliers(data))
      .catch((err) => console.error("Failed to load suppliers:", err))
  }, [])

  React.useEffect(() => {
    loadSupplierList()
  }, [loadSupplierList])

  function getStatusBadge(status: PurchaseOrderStatus) {
    switch (status) {
      case "PURCHASE_REQUEST":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Clock className="h-3 w-3" />
            Request
          </span>
        )
      case "PURCHASE_ORDER":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Receipt className="h-3 w-3" />
            PO
          </span>
        )
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="h-3 w-3" />
            Selesai
          </span>
        )
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle className="h-3 w-3" />
            Ditolak
          </span>
        )
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
            <Ban className="h-3 w-3" />
            Batal
          </span>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const calculatedDialogTotal = completingPO
    ? completingPO.items.reduce((acc, it) => {
        const total = Number(itemTotalPrices[it.id]) || 0
        return acc + total
      }, 0)
    : 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Purchase Orders & Pengadaan
                </h1>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Kelola pengajuan pembelian ke vendor dan pantau alur barang hingga masuk ke stok inventaris
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadSupplierList()
              // re-trigger by resetting search or filter
              setSearch((s) => s)
            }}
            disabled={loading}
            className="flex items-center gap-1.5 shadow-2xs hover:bg-muted flex-1 sm:flex-initial"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {canRequest && (
            <Button
              asChild
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-2xs flex-1 sm:flex-initial"
            >
              <Link to="/inventory/purchase-orders/new">
                <Plus className="h-4 w-4" />
                Buat Purchase Request
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* KPI / Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Pengajuan */}
        <Card className="py-3 px-4 shadow-2xs border-border/80 bg-card">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Total Pengajuan</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  {totalCount}
                </span>
                <span className="text-xs text-muted-foreground">pesanan tercatat</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Receipt className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Purchase Request */}
        <Card className="py-3 px-4 shadow-2xs border-border/80 bg-card">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Purchase Request</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                  {requestCount}
                </span>
                <span className="text-xs text-muted-foreground">menunggu persetujuan</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Purchase Order */}
        <Card className="py-3 px-4 shadow-2xs border-border/80 bg-card">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Purchase Order</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                  {orderCount}
                </span>
                <span className="text-xs text-muted-foreground">menunggu kiriman vendor</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Receipt className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Selesai / Masuk Stok */}
        <Card className="py-3 px-4 shadow-2xs border-border/80 bg-card">
          <CardContent className="p-0 flex items-center justify-between gap-2">
            <div className="space-y-0.5 min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Selesai / Masuk Stok</p>
              <div className="flex flex-wrap items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  {completedCount}
                </span>
                <span className="text-xs text-muted-foreground font-mono truncate max-w-full">
                  (<CurrencyText value={totalCompletedAmount} />)
                </span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 border rounded-2xl bg-card shadow-2xs">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Memuat data Purchase Orders...</p>
        </div>
      ) : totalCount === 0 && !search && statusFilter === "ALL" ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-12 sm:p-16 text-center rounded-2xl border-2 border-dashed border-border bg-card/60 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-inner">
            <Receipt className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Belum Ada Pengajuan Pembelian</h2>
          <p className="text-sm text-muted-foreground max-w-md mt-1 mb-6">
            Mulai buat Purchase Request untuk pengadaan bahan baku dan dapatkan kontrol penuh atas biaya faktur inventaris.
          </p>
          {canRequest && (
            <Button
              asChild
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-xs"
            >
              <Link to="/inventory/purchase-orders/new">
                <Plus className="h-4 w-4" />
                Buat Purchase Request
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Standalone Filter & Search Bar */}
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-card p-3 rounded-xl border border-border shadow-2xs min-w-0">
            <div className="relative flex-1 max-w-md min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nomor PO, vendor, atau item bahan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background/50 h-9 text-xs"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Status Segmented Filter Pills */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/50 text-xs overflow-x-auto max-w-full no-scrollbar">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  statusFilter === "ALL"
                    ? "bg-background text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Semua ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("PURCHASE_REQUEST")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  statusFilter === "PURCHASE_REQUEST"
                    ? "bg-background text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Request ({requestCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("PURCHASE_ORDER")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  statusFilter === "PURCHASE_ORDER"
                    ? "bg-background text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                PO ({orderCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("COMPLETED")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  statusFilter === "COMPLETED"
                    ? "bg-background text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Selesai ({completedCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("REJECTED")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  statusFilter === "REJECTED"
                    ? "bg-background text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Ditolak
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("CANCELLED")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  statusFilter === "CANCELLED"
                    ? "bg-background text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Batal
              </button>
            </div>
          </div>

          {/* Polished Table Container */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
                  <tr>
                    <th className="px-5 py-3.5">No. Pengajuan / PO</th>
                    <th className="px-5 py-3.5">Vendor / Supplier</th>
                    <th className="px-5 py-3.5">Tanggal Pesan</th>
                    <th className="px-5 py-3.5">Item Bahan Baku</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-right font-mono">Total Nilai</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                        <p className="font-medium text-foreground">Tidak ada pesanan yang cocok</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {search
                            ? "Coba sesuaikan kata kunci pencarian nomor PO atau vendor."
                            : "Tidak ada pengajuan pada kategori status ini."}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    orders.map((po: PurchaseOrder) => (
                      <tr
                        key={po.id}
                        className="hover:bg-muted/30 transition-colors group"
                      >
                        <td className="px-5 py-3.5 font-medium text-foreground">
                          <Link
                            to={`/inventory/purchase-orders/${po.id}`}
                            className="font-mono font-bold text-primary group-hover:underline underline-offset-4"
                          >
                            {po.poNumber}
                          </Link>
                        </td>

                        <td className="px-5 py-3.5 text-xs">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="font-medium text-foreground">
                              {po.supplierName || (
                                <span className="text-muted-foreground text-xs italic font-normal">
                                  Belum ditentukan
                                </span>
                              )}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            <span>{formatDate(po.orderDate)}</span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex flex-col gap-0.5 text-xs">
                            <span className="font-medium text-foreground">{po.items.length} jenis item</span>
                            <span className="text-muted-foreground truncate max-w-[200px]" title={po.items.map((it: PurchaseOrderItem) => `${it.stockName} (${it.quantity}${it.baseUnit})`).join(", ")}>
                              {po.items.map((it: PurchaseOrderItem) => `${it.stockName} (${it.quantity}${it.baseUnit})`).join(", ")}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-center">
                          {getStatusBadge(po.status)}
                        </td>

                        <td className="px-5 py-3.5 text-right font-mono text-xs font-semibold text-foreground">
                          {po.status === "PURCHASE_REQUEST" || po.totalAmount === 0 ? (
                            <span className="text-xs text-muted-foreground italic font-normal">Menunggu harga</span>
                          ) : (
                            <CurrencyText value={po.totalAmount} />
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="text-xs">
                              <DropdownMenuItem asChild className="cursor-pointer">
                                <Link to={`/inventory/purchase-orders/${po.id}`}>
                                  <Eye className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                  Lihat Detail
                                </Link>
                              </DropdownMenuItem>

                              {po.status === "PURCHASE_REQUEST" && (
                                <>
                                  {canEditPO(po) && (
                                    <DropdownMenuItem asChild className="cursor-pointer text-blue-600">
                                      <Link to={`/inventory/purchase-orders/${po.id}/edit`}>
                                        <Edit3 className="mr-2 h-3.5 w-3.5" />
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
                                        <Check className="mr-2 h-3.5 w-3.5" />
                                        Setujui (Jadikan PO)
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleOpenReject(po)}
                                        className="cursor-pointer text-destructive"
                                      >
                                        <XCircle className="mr-2 h-3.5 w-3.5" />
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
                                    <Check className="mr-2 h-3.5 w-3.5" />
                                    Set Harga & Selesaikan
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleCancelPO(po)}
                                    className="text-destructive cursor-pointer focus:text-destructive focus:bg-destructive/10"
                                  >
                                    <Ban className="mr-2 h-3.5 w-3.5" />
                                    Batalkan PO
                                  </DropdownMenuItem>
                                </>
                              )}
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
            displayedCount={orders.length}
            page={page}
            totalPages={totalPages}
            onPrev={handlePrevPage}
            onNext={handleNextPage}
            disabled={loading}
            label="pesanan"
          />
        </div>
      )}

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
                      className="w-full justify-between h-9 text-xs"
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
                  className="min-h-[80px]"
                />
              </div>

              <DialogFooter className="pt-2 gap-2 sm:gap-0 sm:space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setApprovingPO(null)}
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
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
                  className="min-h-[90px]"
                  required
                />
              </div>

              <DialogFooter className="pt-2 gap-2 sm:gap-0 sm:space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRejectingPO(null)}
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
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
        <DialogContent className="sm:max-w-[660px] rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Selesaikan Pesanan & Set Harga Stok
            </DialogTitle>
            <DialogDescription>
              Pesanan <strong className="text-foreground">{completingPO?.poNumber}</strong> telah tiba.
              Pilih supplier final dan masukkan total harga faktur untuk memasukkan barang ke stok bahan baku.
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
                      className="w-full justify-between h-9 text-xs"
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

              <div className="rounded-xl border border-border overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm text-left">
                  <thead className="bg-muted/40 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Bahan Baku</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 w-[170px] text-right">Total Faktur (Rp)</th>
                      <th className="py-2.5 px-3 w-[150px] text-right">Harga Satuan (Kalkulasi)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {completingPO.items.map((it) => {
                      const total = Number(itemTotalPrices[it.id]) || 0
                      const unitPrice = it.quantity > 0 ? total / it.quantity : 0
                      return (
                        <tr key={it.id}>
                          <td className="align-middle py-2.5 px-3 font-medium text-sm text-foreground">
                            {it.stockName}
                          </td>
                          <td className="align-middle py-2.5 px-3 text-right font-mono text-sm text-muted-foreground whitespace-nowrap">
                            {it.quantity} {it.baseUnit}
                          </td>
                          <td className="align-middle py-2.5 px-3">
                            <Input
                              type="number"
                              min="0"
                              value={itemTotalPrices[it.id] ?? ""}
                              onChange={(e) =>
                                setItemTotalPrices({
                                  ...itemTotalPrices,
                                  [it.id]: Number(e.target.value),
                                })
                              }
                              placeholder="e.g. 150000"
                              className="h-8 text-right font-mono text-sm"
                              required
                            />
                          </td>
                          <td className="align-middle py-2.5 px-3 text-right font-mono text-xs text-muted-foreground whitespace-nowrap font-medium">
                            {unitPrice > 0 ? `${formatCurrency(Math.round(unitPrice))} / ${it.baseUnit}` : "-"}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Total Summary */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">Total Nilai Pembelian:</span>
                <span className="text-base font-bold font-mono text-primary">
                  <CurrencyText value={calculatedDialogTotal} />
                </span>
              </div>

              <DialogFooter className="pt-2 gap-2 sm:gap-0 sm:space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCompletingPO(null)}
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
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
