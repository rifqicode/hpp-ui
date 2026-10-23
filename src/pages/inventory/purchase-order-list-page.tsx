import { PurchaseOrderListFilters } from '@/features/purchase-orders/components/purchase-order-list-filters'
import { hasPurchaseOrderFilters } from '@/features/purchase-orders/lib/list-filters'
import { POCategoryBadge } from '@/features/purchase-orders/components/po-category-badge'
import { PurchaseOrderKanban } from '@/features/purchase-orders/components/purchase-order-kanban'
import { PurchaseOrderSummary } from '@/features/purchase-orders/components/purchase-order-summary'
import '@/features/purchase-orders/components/purchase-order-table.css'
import * as React from "react"
import { Link } from "react-router-dom"
import {
  ClipboardList,
  Plus,
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
  Truck,
  CreditCard,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  PurchaseOrderPaymentMethod,
} from "@/features/purchase-orders/types"
import { supplierService } from "@/features/suppliers/services/supplier-service"
import type { Supplier } from "@/features/suppliers/types"

export default function PurchaseOrderListPage() {
  const [viewMode, setViewMode] = React.useState<"table" | "kanban">('kanban')
  const list = usePurchaseOrders(viewMode)
  const {
    orders,
    loading,
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
    canProcess,
    canRequest,
    canEditPO,
    formatDate,
  } = list
  const hasFilters = hasPurchaseOrderFilters(list)

  const [suppliers, setSuppliers] = React.useState<Supplier[]>([])

  const handleViewChange = (mode: "table" | "kanban") => {
    setViewMode(mode)
  }

  // Receive modal state
  const [receivingPO, setReceivingPO] = React.useState<PurchaseOrder | null>(null)
  const [receiveNotes, setReceiveNotes] = React.useState<string>("")

  // Pay modal state
  const [payingPO, setPayingPO] = React.useState<PurchaseOrder | null>(null)
  const [payMethod, setPayMethod] = React.useState<PurchaseOrderPaymentMethod>("TRANSFER")
  const [payNotes, setPayNotes] = React.useState<string>("")

  // Cancel modal state
  const [cancellingPO, setCancellingPO] = React.useState<PurchaseOrder | null>(null)
  const [cancelReason, setCancelReason] = React.useState<string>("")

  async function handleConfirmReceive(e: React.FormEvent) {
    e.preventDefault()
    if (!receivingPO) return
    try {
      await list.handleReceive(receivingPO.id, {
        notes: receiveNotes.trim() || undefined,
      })
      setReceivingPO(null)
    } catch {
      // Error handled by hook
    }
  }

  async function handleConfirmPay(e: React.FormEvent) {
    e.preventDefault()
    if (!payingPO) return
    try {
      await list.handlePay(payingPO.id, {
        payment_method: payMethod,
        notes: payNotes.trim() || undefined,
      })
      setPayingPO(null)
    } catch {
      // Error handled by hook
    }
  }

  async function handleConfirmCancel(e: React.FormEvent) {
    e.preventDefault()
    if (!cancellingPO) return
    if (!cancelReason.trim()) {
      alert("Alasan pembatalan wajib diisi")
      return
    }
    try {
      await list.handleCancel(cancellingPO.id, cancelReason.trim())
      setCancellingPO(null)
    } catch {
      // Error handled by hook
    }
  }

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
    <div className="min-w-0 space-y-5 pb-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Purchase
                </h1>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Kelola pembelian ke vendor dan pantau alur barang hingga masuk ke stok inventaris
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto sm:shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadSupplierList()
              void list.loadOrders()
            }}
            disabled={list.isFetching}
            aria-label="Refresh pembelian"
            className="h-11 flex items-center gap-1.5 hover:bg-muted flex-1 sm:flex-initial"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${list.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {canRequest && (
            <Button
              asChild
              className="h-11 w-full gap-2 font-medium sm:w-auto"
            >
              <Link to="/inventory/purchase-orders/new">
                <Plus className="h-4 w-4" />
                Buat Purchase Request
              </Link>
            </Button>
          )}
        </div>
      </div>

      <PurchaseOrderSummary list={list} />
      {list.summaryError && <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-2 text-sm">
        <p>Ringkasan pembelian gagal dimuat.</p>
        <Button variant="ghost" className="h-11" onClick={() => void list.loadOrders()} disabled={list.isFetching}>Muat ulang ringkasan</Button>
      </div>}

      <PurchaseOrderListFilters list={list} />

      <Tabs value={viewMode} onValueChange={(value) => handleViewChange(value === "table" ? "table" : "kanban")}>
        <TabsList aria-label="Tampilan pembelian" className="mb-4 grid w-full max-w-xs grid-flow-col auto-cols-fr">
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="table">List</TabsTrigger>
        </TabsList>
        <TabsContent value={viewMode}>

      {/* Main Content Area */}
      {list.error ? (
        <div role="alert" className="space-y-3 rounded-xl border border-destructive/30 bg-card p-6">
          <div>
            <h2 className="font-semibold">Gagal memuat pembelian</h2>
            <p className="mt-1 text-sm text-muted-foreground">{list.error}</p>
          </div>
          <Button variant="outline" onClick={() => void list.loadOrders()} disabled={list.isFetching}>
            Coba lagi
          </Button>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center p-16 border rounded-2xl bg-card shadow-2xs">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Memuat data Purchase...</p>
        </div>
      ) : total === 0 && !hasFilters && !(viewMode === 'kanban' && list.kanban.some((column) => column.error)) ? (
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
      ) : orders.length === 0 && !(viewMode === 'kanban' && list.kanban.some((column) => column.error)) ? (
        <div className="space-y-2 rounded-xl border bg-card p-8 text-center">
          <h2 className="font-semibold">Tidak ada pesanan yang cocok</h2>
          <p className="text-sm text-muted-foreground">Sesuaikan pencarian atau reset filter untuk melihat pembelian lainnya.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {viewMode === "kanban" ? (
            <PurchaseOrderKanban
              orders={orders}
              columns={list.kanban}
              canProcess={canProcess}
              onApprove={handleOpenApprove}
              onReceive={(po) => {
                setReceivingPO(po)
                setReceiveNotes("")
              }}
              onPay={(po) => {
                setPayingPO(po)
                setPayMethod("TRANSFER")
                setPayNotes("")
              }}
            />
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table aria-label="Daftar pembelian" className="purchase-order-table">
                  <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
                    <tr>
                      <th className="px-5 py-3.5">No. Pengajuan</th>
                      <th className="px-5 py-3.5">Kategori</th>
                      <th className="px-5 py-3.5">Vendor / Supplier</th>
                      <th className="px-5 py-3.5">Tanggal Pesan</th>
                      <th className="px-5 py-3.5">Item Bahan Baku</th>
                      <th className="px-5 py-3.5 text-center">Status</th>
                      <th className="px-5 py-3.5 text-right">Total Nilai</th>
                      <th className="px-5 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {orders.map((po: PurchaseOrder) => (
                        <tr
                          key={po.id}
                          className="hover:bg-muted/30 transition-colors group"
                        >
                          <td className="px-5 py-3.5 font-medium text-foreground">
                            <Link
                              to={`/inventory/purchase-orders/${po.id}`}
                              className="break-words font-semibold text-primary hover:underline focus-visible:underline underline-offset-4"
                            >
                              {po.poNumber}
                            </Link>
                          </td>

                          <td data-label="Kategori" className="whitespace-nowrap px-5 py-3.5">
                            <POCategoryBadge category={po.category} />
                          </td>

                          <td data-label="Supplier" className="px-5 py-3.5 text-xs">
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

                          <td data-label="Tanggal pesan" className="px-5 py-3.5 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 shrink-0" />
                              <time dateTime={po.orderDate} className="whitespace-nowrap">{formatDate(po.orderDate)}</time>
                            </div>
                          </td>

                          <td data-label="Bahan baku" className="px-5 py-3.5">
                            <div className="flex flex-col gap-0.5 text-xs">
                              <span className="font-medium text-foreground">{po.items.length} jenis item</span>
                              <span className="text-muted-foreground xl:max-w-[200px] xl:truncate" title={po.items.map((it: PurchaseOrderItem) => `${it.stockName} (${it.quantity}${it.baseUnit})`).join(", ")}>
                                {po.items.map((it: PurchaseOrderItem) => `${it.stockName} (${it.quantity}${it.baseUnit})`).join(", ")}
                              </span>
                            </div>
                          </td>

                          <td data-label="Status" className="px-5 py-3.5 text-center">
                            <div className="flex flex-col items-center gap-1">
                              {getStatusBadge(po.status)}
                              {po.status === "PURCHASE_ORDER" && (
                                <div className="flex flex-wrap items-center justify-center gap-1 mt-0.5">
                                  <span
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                      po.receiptStatus === "RECEIVED"
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                                    }`}
                                  >
                                    <Truck className="h-2.5 w-2.5" />
                                    {po.receiptStatus === "RECEIVED" ? "Diterima" : "Belum Tiba"}
                                  </span>
                                  <span
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                      po.paymentStatus === "PAID"
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                    }`}
                                  >
                                    <CreditCard className="h-2.5 w-2.5" />
                                    {po.paymentStatus === "PAID" ? "Sudah Dibayar" : "Belum Dibayar"}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>

                          <td data-label="Total nilai" className="px-5 py-3.5 text-right tabular-nums text-xs font-semibold text-foreground">
                            {po.status === "PURCHASE_REQUEST" || po.totalAmount === 0 ? (
                              <span className="text-xs text-muted-foreground italic font-normal">Menunggu harga</span>
                            ) : (
                              <CurrencyText value={po.totalAmount} />
                            )}
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label={`Aksi untuk ${po.poNumber}`} className="h-11 w-11 text-muted-foreground hover:text-foreground">
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
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setCancellingPO(po)
                                            setCancelReason("")
                                          }}
                                          className="text-destructive cursor-pointer focus:text-destructive focus:bg-destructive/10"
                                        >
                                          <Ban className="mr-2 h-3.5 w-3.5" />
                                          Batalkan Request
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </>
                                )}

                                {po.status === "PURCHASE_ORDER" && canProcess && (
                                  <>
                                    {po.receiptStatus !== "RECEIVED" && (
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setReceivingPO(po)
                                          setReceiveNotes("")
                                        }}
                                        className="cursor-pointer text-amber-600 font-medium"
                                      >
                                        <Truck className="mr-2 h-3.5 w-3.5" />
                                        Terima Barang
                                      </DropdownMenuItem>
                                    )}

                                    {po.paymentStatus !== "PAID" && (
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setPayingPO(po)
                                          setPayMethod("TRANSFER")
                                          setPayNotes("")
                                        }}
                                        className="cursor-pointer text-emerald-600 font-medium"
                                      >
                                        <CreditCard className="mr-2 h-3.5 w-3.5" />
                                        Tandai Lunas
                                      </DropdownMenuItem>
                                    )}

                                    <DropdownMenuItem
                                      onClick={() => handleOpenComplete(po)}
                                      className="cursor-pointer text-blue-600 font-medium"
                                    >
                                      <Check className="mr-2 h-3.5 w-3.5" />
                                      Set Harga & Selesaikan
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setCancellingPO(po)
                                        setCancelReason("")
                                      }}
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Table Pagination */}
          {viewMode === 'table' && <TablePagination
            total={total}
            displayedCount={orders.length}
            page={page}
            totalPages={totalPages}
            onPrev={handlePrevPage}
            onNext={handleNextPage}
            disabled={loading}
            label="pesanan"
          />}
        </div>
      )}

        </TabsContent>
      </Tabs>

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

      {/* Modal 4: Terima Barang */}
      <Dialog
        open={!!receivingPO}
        onOpenChange={(open) => !open && !submitting && setReceivingPO(null)}
      >
        <DialogContent className="sm:max-w-[480px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-amber-600" />
              Terima Barang Fisik
            </DialogTitle>
            <DialogDescription>
              Catat kedatangan barang fisik untuk PO{" "}
              <strong className="text-foreground">{receivingPO?.poNumber}</strong>. Status penerimaan akan ditandai{" "}
              <strong>Sudah Diterima</strong>.
            </DialogDescription>
          </DialogHeader>

          {receivingPO && (
            <form onSubmit={handleConfirmReceive} className="space-y-4 py-2">
              <div className="rounded-lg border border-border p-3 bg-muted/30 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Supplier:</span>
                  <span className="font-semibold text-foreground">
                    {receivingPO.supplierName || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Item:</span>
                  <span className="font-semibold text-foreground">
                    {receivingPO.items.length} macam item
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="receive-notes" className="text-sm font-semibold">
                  Catatan Penerimaan (Opsional)
                </Label>
                <Textarea
                  id="receive-notes"
                  value={receiveNotes}
                  onChange={(e) => setReceiveNotes(e.target.value)}
                  placeholder="e.g. Kondisi barang baik, diterima oleh staf gudang."
                  className="min-h-[80px]"
                />
              </div>

              <DialogFooter className="pt-2 gap-2 sm:gap-0 sm:space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReceivingPO(null)}
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Konfirmasi Terima Barang
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal 5: Tandai Lunas */}
      <Dialog
        open={!!payingPO}
        onOpenChange={(open) => !open && !submitting && setPayingPO(null)}
      >
        <DialogContent className="sm:max-w-[480px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-600" />
              Tandai Lunas Pembayaran
            </DialogTitle>
            <DialogDescription>
              Catat penyelesaian pembayaran untuk PO{" "}
              <strong className="text-foreground">{payingPO?.poNumber}</strong>. Status pembayaran akan ditandai{" "}
              <strong>Lunas</strong>.
            </DialogDescription>
          </DialogHeader>

          {payingPO && (
            <form onSubmit={handleConfirmPay} className="space-y-4 py-2">
              <div className="rounded-lg border border-border p-3 bg-muted/30 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Tagihan:</span>
                  <span className="font-mono font-bold text-foreground">
                    <CurrencyText value={payingPO.totalAmount} />
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Supplier:</span>
                  <span className="font-semibold text-foreground">
                    {payingPO.supplierName || "-"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Metode Pembayaran</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["TRANSFER", "CASH", "TEMPO"] as const).map((method) => (
                    <Button
                      key={method}
                      type="button"
                      variant={payMethod === method ? "default" : "outline"}
                      size="sm"
                      className="text-xs font-semibold"
                      onClick={() => setPayMethod(method)}
                    >
                      {method === "TRANSFER"
                        ? "Transfer Bank"
                        : method === "CASH"
                        ? "Tunai"
                        : "Tempo"}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pay-notes" className="text-sm font-semibold">
                  Catatan Pembayaran (Opsional)
                </Label>
                <Textarea
                  id="pay-notes"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. Bukti transfer BCA #TRX-123456"
                  className="min-h-[80px]"
                />
              </div>

              <DialogFooter className="pt-2 gap-2 sm:gap-0 sm:space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPayingPO(null)}
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
                  Konfirmasi Lunas
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal 6: Batalkan PO / Request */}
      <Dialog
        open={!!cancellingPO}
        onOpenChange={(open) => !open && !submitting && setCancellingPO(null)}
      >
        <DialogContent className="sm:max-w-[480px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Ban className="h-5 w-5" />
              Batalkan Pesanan
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin membatalkan pesanan{" "}
              <strong className="text-foreground">{cancellingPO?.poNumber}</strong>? Alasan pembatalan wajib dicatat.
            </DialogDescription>
          </DialogHeader>

          {cancellingPO && (
            <form onSubmit={handleConfirmCancel} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="cancel-reason" className="text-sm font-semibold">
                  Alasan Pembatalan <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="cancel-reason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Stok supplier habis / spesifikasi bahan diubah"
                  className="min-h-[90px]"
                  required
                />
              </div>

              <DialogFooter className="pt-2 gap-2 sm:gap-0 sm:space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCancellingPO(null)}
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={submitting || !cancelReason.trim()}
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Konfirmasi Batalkan
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
