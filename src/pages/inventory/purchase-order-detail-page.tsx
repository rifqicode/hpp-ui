import { POCategoryBadge } from '@/features/purchase-orders/components/po-category-badge'
import { POAttachmentUpload } from '@/features/purchase-orders/components/po-attachment-upload'
import type { POAttachment } from '@/features/purchase-orders/lib/attachment'
import * as React from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  Package,
  DollarSign,
  Loader2,
  Check,
  Ban,
  FileText,
  Edit3,
  User,
  History,
  ChevronDown,
  ExternalLink,
  Truck,
  CreditCard,
  AlertCircle,
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
import { CurrencyText, formatCurrency } from "@/components/ui/currency-text"
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
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { purchaseOrderService } from "@/features/purchase-orders/services/po-service"
import { supplierService } from "@/features/suppliers/services/supplier-service"
import type {
  PurchaseOrder,
  PurchaseOrderStatus,
  PurchaseOrderPaymentMethod,
  CompletePOPriceItem,
} from "@/features/purchase-orders/types"
import type { Supplier } from "@/features/suppliers/types"
import { useAuthStore } from "@/store/use-auth-store"
import { usePermission } from "@/hooks/use-permission"

export default function PurchaseOrderDetailPage() {
  const { poId } = useParams<{ poId: string }>()
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.user)
  const { can } = usePermission()

  const [order, setOrder] = React.useState<PurchaseOrder | null>(null)
  const [loading, setLoading] = React.useState<boolean>(true)
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([])
  const [submitting, setSubmitting] = React.useState<boolean>(false)

  // Approve modal
  const [isApproveOpen, setIsApproveOpen] = React.useState<boolean>(false)
  const [approveSupplierId, setApproveSupplierId] = React.useState<string>("")
  const [approveNotes, setApproveNotes] = React.useState<string>("")

  // Reject modal
  const [isRejectOpen, setIsRejectOpen] = React.useState<boolean>(false)
  const [rejectReason, setRejectReason] = React.useState<string>("")

  // Complete modal
  const [isCompleteOpen, setIsCompleteOpen] = React.useState<boolean>(false)
  const [completeSupplierId, setCompleteSupplierId] = React.useState<string>("")
  const [completeError, setCompleteError] = React.useState("")
  const [completionAttachments, setCompletionAttachments] = React.useState<POAttachment[]>([])
  const [uploadingCompletionAttachments, setUploadingCompletionAttachments] = React.useState(false)
  const [itemTotalPrices, setItemTotalPrices] = React.useState<Record<string, number>>({})

  // Receive modal
  const [isReceiveOpen, setIsReceiveOpen] = React.useState<boolean>(false)
  const [receiveNotes, setReceiveNotes] = React.useState<string>("")
  const [receivePrices, setReceivePrices] = React.useState<Record<string, number>>({})
  const [receiveExpiredAt, setReceiveExpiredAt] = React.useState<Record<string, string>>({})
  const [receiveError, setReceiveError] = React.useState<string>("")

  // Pay modal
  const [isPayOpen, setIsPayOpen] = React.useState<boolean>(false)
  const [payMethod, setPayMethod] = React.useState<PurchaseOrderPaymentMethod>("TRANSFER")
  const [payNotes, setPayNotes] = React.useState<string>("")

  // Cancel modal
  const [isCancelOpen, setIsCancelOpen] = React.useState<boolean>(false)
  const [cancelReason, setCancelReason] = React.useState<string>("")

  const canProcess = can("purchases:process")
  const canRequest = can("purchases:request")

  const canEdit =
    order?.status === "PURCHASE_REQUEST" &&
    canRequest &&
    Boolean(currentUser?.id) &&
    order?.createdByUserId === currentUser?.id

  const loadData = React.useCallback(async () => {
    if (!poId) return
    setLoading(true)
    try {
      const [data, supData] = await Promise.all([
        purchaseOrderService.getPurchaseOrderById(poId),
        supplierService.getAllSuppliers().catch(() => [] as Supplier[]),
      ])
      setOrder(data)
      setSuppliers(supData)
      setApproveSupplierId(data.supplierId || "")
      setCompleteSupplierId(data.supplierId || "")

      const initialTotalPrices: Record<string, number> = {}
      data.items.forEach((it) => {
        initialTotalPrices[it.id] = it.totalPrice || (it.unitPrice ? it.unitPrice * it.quantity : 0)
      })
      setItemTotalPrices(initialTotalPrices)
    } catch (err) {
      console.error("Failed to load PO detail:", err)
    } finally {
      setLoading(false)
    }
  }, [poId])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  async function handleConfirmApprove(e: React.FormEvent) {
    e.preventDefault()
    if (!order) return

    setSubmitting(true)
    try {
      const updated = await purchaseOrderService.approvePurchaseOrder(order.id, {
        supplier_id: approveSupplierId || undefined,
        notes: approveNotes || undefined,
      })
      setOrder(updated)
      setIsApproveOpen(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyetujui request"
      alert(msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleConfirmReject(e: React.FormEvent) {
    e.preventDefault()
    if (!order) return
    if (!rejectReason.trim()) {
      alert("Alasan penolakan wajib diisi")
      return
    }

    setSubmitting(true)
    try {
      const updated = await purchaseOrderService.rejectPurchaseOrder(order.id, {
        reason: rejectReason.trim(),
      })
      setOrder(updated)
      setIsRejectOpen(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menolak request"
      alert(msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleConfirmComplete(e: React.FormEvent) {
    e.preventDefault()
    if (!order || submitting || uploadingCompletionAttachments) return
    if (!completeSupplierId) {
      setCompleteError("Pilih vendor / supplier final terlebih dahulu")
      return
    }

    const invalidItem = order.items.find((item) => {
      const total = Number(itemTotalPrices[item.id])
      return !Number.isFinite(total) || total <= 0 || item.quantity <= 0 || Number((total / item.quantity).toFixed(4)) <= 0
    })
    if (invalidItem) {
      setCompleteError(`Harga faktur untuk "${invalidItem.stockName}" wajib lebih dari 0 dan menghasilkan harga satuan positif.`)
      return
    }
    setCompleteError("")
    setSubmitting(true)
    try {
      const prices = order.items.map((it) => {
        const total = Number(itemTotalPrices[it.id]) || 0
        const unit_price = it.quantity > 0 ? Number((total / it.quantity).toFixed(4)) : 0
        return {
          item_id: it.id,
          unit_price,
          total_price: total,
        }
      })
      const updated = await purchaseOrderService.completePurchaseOrder(order.id, {
        supplier_id: completeSupplierId,
        prices,
        completion_attachments: completionAttachments,
      })
      setOrder(updated)
      setIsCompleteOpen(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyelesaikan PO"
      setCompleteError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleConfirmReceive(e: React.FormEvent) {
    e.preventDefault()
    if (!order) return

    // Validation: Check FEFO items have expired_at
    const missingFefo = order.items.find((it) => it.inventoryMethod === "FEFO" && !receiveExpiredAt[it.id])
    if (missingFefo) {
      setReceiveError(`Tanggal kadaluarsa wajib diisi untuk bahan FEFO '${missingFefo.stockName}'`)
      return
    }

    const hasFefo = order.items.some((it) => it.inventoryMethod === "FEFO")
    const hasExpired = Object.values(receiveExpiredAt).some(Boolean)
    const hasCustomPrices = Object.values(receivePrices).some((p) => p > 0)

    let pricesPayload: CompletePOPriceItem[] | undefined
    if (hasFefo || hasExpired || hasCustomPrices) {
      for (const it of order.items) {
        const p = receivePrices[it.id] ?? it.unitPrice
        if (!p || p <= 0) {
          setReceiveError(`Harga satuan untuk '${it.stockName}' harus lebih besar dari 0`)
          return
        }
      }
      pricesPayload = order.items.map((it) => ({
        item_id: it.id,
        unit_price: receivePrices[it.id] ?? it.unitPrice,
        expired_at: receiveExpiredAt[it.id] ? new Date(receiveExpiredAt[it.id]).toISOString() : undefined,
      }))
    }

    setSubmitting(true)
    setReceiveError("")
    try {
      const updated = await purchaseOrderService.receivePurchaseOrder(order.id, {
        notes: receiveNotes.trim() || undefined,
        prices: pricesPayload,
      })
      setOrder(updated)
      setIsReceiveOpen(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mencatat penerimaan barang"
      setReceiveError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleConfirmPay(e: React.FormEvent) {
    e.preventDefault()
    if (!order) return
    setSubmitting(true)
    try {
      const updated = await purchaseOrderService.payPurchaseOrder(order.id, {
        payment_method: payMethod,
        notes: payNotes.trim() || undefined,
      })
      setOrder(updated)
      setIsPayOpen(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memproses pembayaran"
      alert(msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleConfirmCancel(e: React.FormEvent) {
    e.preventDefault()
    if (!order) return
    if (!cancelReason.trim()) {
      alert("Alasan pembatalan wajib diisi")
      return
    }
    setSubmitting(true)
    try {
      const updated = await purchaseOrderService.cancelPurchaseOrder(order.id, {
        reason: cancelReason.trim(),
      })
      setOrder(updated)
      setIsCancelOpen(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membatalkan pesanan"
      alert(msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCancel() {
    setCancelReason("")
    setIsCancelOpen(true)
  }

  function formatDate(dateStr?: string) {
    if (!dateStr) return "-"
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr))
  }

  function getStatusBadge(status: PurchaseOrderStatus) {
    switch (status) {
      case "PURCHASE_REQUEST":
        return (
          <Badge variant="outline" className="border-blue-500/40 text-blue-600 bg-blue-500/10 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Purchase Request
          </Badge>
        )
      case "PURCHASE_ORDER":
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <ReceiptIcon className="h-3 w-3" /> Purchase Order
          </Badge>
        )
      case "COMPLETED":
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Selesai / Diterima
          </Badge>
        )
      case "REJECTED":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" /> Ditolak
          </Badge>
        )
      case "CANCELLED":
        return (
          <Badge variant="outline" className="text-muted-foreground flex items-center gap-1">
            <Ban className="h-3 w-3" /> Dibatalkan
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  function ReceiptIcon(props: React.SVGProps<SVGSVGElement>) {
    return <FileText {...props} />
  }

  function getLogActionBadge(action: string) {
    switch (action) {
      case "CREATED":
        return (
          <Badge variant="outline" className="border-blue-500/40 text-blue-600 bg-blue-500/10 text-[11px]">
            Diajukan
          </Badge>
        )
      case "UPDATED":
        return (
          <Badge variant="outline" className="border-purple-500/40 text-purple-600 bg-purple-500/10 text-[11px]">
            Diperbarui
          </Badge>
        )
      case "APPROVED":
        return (
          <Badge variant="warning" className="text-[11px]">
            Disetujui (PO)
          </Badge>
        )
      case "REJECTED":
        return (
          <Badge variant="destructive" className="text-[11px]">
            Ditolak
          </Badge>
        )
      case "COMPLETED":
        return (
          <Badge variant="success" className="text-[11px]">
            Selesai
          </Badge>
        )
      case "CANCELLED":
        return (
          <Badge variant="outline" className="text-muted-foreground text-[11px]">
            Dibatalkan
          </Badge>
        )
      default:
        return <Badge variant="outline" className="text-[11px]">{action}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Memuat detail Purchase Order...</span>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <FileText className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Purchase Order tidak ditemukan</h2>
        <Button variant="outline" onClick={() => navigate("/inventory/purchase-orders")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar PO
        </Button>
      </div>
    )
  }

  const calculatedTotal = order.items.reduce((acc, it) => {
    const total = Number(itemTotalPrices[it.id]) || 0
    return acc + total
  }, 0)

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in fade-in duration-500 w-full">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm" className="rounded-xl">
          <Link to="/inventory/purchase-orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar PO
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="shrink-0 rounded-xl bg-primary/10 p-3 text-primary">
            <Package className="size-6" />
          </div>
          <div className="min-w-0">
            <h1 className="break-words text-xl font-bold tracking-tight font-mono text-foreground sm:text-2xl">
              {order.poNumber}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-muted-foreground">
              <POCategoryBadge category={order.category} />
              <span>{order.category === "DIRECT_ORDER" ? "Dibeli pada" : "Diajukan pada"} {formatDate(order.orderDate)}</span>
              {order.createdByName && <span>Oleh: <strong>{order.createdByName}</strong></span>}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-card p-3 shadow-2xs lg:items-end">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {order.status === "PURCHASE_REQUEST" || order.status === "REJECTED" ? "Status pengajuan:" : "Status dokumen:"}
            </span>
            {getStatusBadge(order.status)}
          </div>

          {(order.status === "PURCHASE_ORDER" || order.status === "COMPLETED") && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-1 border-t border-border/60 text-xs">
              {/* Receipt Status Badge */}
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold ${
                    order.receiptStatus === "RECEIVED"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  }`}
                >
                  <Truck className="h-3 w-3" />
                  {order.receiptStatus === "RECEIVED" ? "Sudah Diterima" : "Belum Diterima"}
                </span>
                {order.receiptStatus === "RECEIVED" && order.receivedAt && (
                  <span className="text-[11px] text-muted-foreground">
                    ({formatDate(order.receivedAt)}{order.receivedByName ? ` oleh ${order.receivedByName}` : ""})
                  </span>
                )}
              </div>

              {/* Payment Status Badge */}
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold ${
                    order.paymentStatus === "PAID"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                  }`}
                >
                  <CreditCard className="h-3 w-3" />
                  {order.paymentStatus === "PAID" ? "Sudah Dibayar" : "Belum Dibayar"}
                </span>
                {order.paymentStatus === "PAID" && (
                  <span className="text-[11px] text-muted-foreground">
                    ({order.paymentMethod || "Transfer"}{order.paidAt ? ` - ${formatDate(order.paidAt)}` : ""}{order.paidByName ? ` oleh ${order.paidByName}` : ""})
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancellation Reason Alert */}
      {order.status === "CANCELLED" && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs space-y-1">
          <div className="flex items-center gap-2 font-semibold text-destructive">
            <Ban className="h-4 w-4" />
            Pesanan ini telah dibatalkan
          </div>
          <p className="text-destructive/90 pl-6">
            Alasan pembatalan: <strong className="text-foreground">{order.cancellationReason || "Tidak ada rincian alasan."}</strong>
          </p>
        </div>
      )}

      {order.status === "PURCHASE_REQUEST" && (canEdit || canProcess) && (
        <section
          aria-labelledby="purchase-request-actions"
          className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="min-w-0">
            <h2 id="purchase-request-actions" className="text-sm font-semibold text-foreground">
              {canProcess ? "Tinjau pengajuan" : "Perbarui pengajuan"}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {canProcess
                ? "Periksa rincian pengajuan sebelum menyetujui dan menerbitkan PO."
                : "Request masih dapat diedit sebelum diproses."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center lg:shrink-0">
            {canEdit && (
              <Button asChild variant="outline" className={`h-11 rounded-lg px-4 ${!canProcess ? "col-span-2" : ""}`}>
                <Link to={`/inventory/purchase-orders/${order.id}/edit`}>
                  <Edit3 className="size-4" />
                  Edit Request
                </Link>
              </Button>
            )}
            {canProcess && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className={`h-11 rounded-lg border-destructive/30 px-4 text-destructive hover:bg-destructive/10 hover:text-destructive focus-visible:ring-destructive/30 ${!canEdit ? "col-span-2" : ""}`}
                  disabled={submitting}
                  onClick={() => setIsRejectOpen(true)}
                >
                  <XCircle className="size-4" />
                  Tolak Request
                </Button>
                <Button
                  type="button"
                  className="col-span-2 h-11 rounded-lg bg-primary px-4 font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
                  disabled={submitting}
                  onClick={() => {
                    setApproveSupplierId(order.supplierId || "")
                    setIsApproveOpen(true)
                  }}
                >
                  <Check className="size-4" />
                  Setujui & Terbitkan PO
                </Button>
              </>
            )}
          </div>
        </section>
      )}

      {order.status === "PURCHASE_ORDER" && canProcess && (
        <section
          aria-labelledby="purchase-order-actions"
          className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <h2 id="purchase-order-actions" className="text-sm font-semibold text-foreground">
              Aksi Pembelian
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Perbarui status penerimaan barang fisik atau status pelunasan faktur vendor.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {order.receiptStatus !== "RECEIVED" && (
              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/40"
                disabled={submitting}
                onClick={() => {
                  setReceiveNotes("")
                  const initialPrices: Record<string, number> = {}
                  const initialExpired: Record<string, string> = {}
                  order.items.forEach((it) => {
                    initialPrices[it.id] = it.unitPrice || 0
                    initialExpired[it.id] = ""
                  })
                  setReceivePrices(initialPrices)
                  setReceiveExpiredAt(initialExpired)
                  setReceiveError("")
                  setIsReceiveOpen(true)
                }}
              >
                <Truck className="mr-2 h-4 w-4" />
                Terima Barang
              </Button>
            )}

            {order.paymentStatus !== "PAID" && (
              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                disabled={submitting}
                onClick={() => {
                  setPayMethod("TRANSFER")
                  setPayNotes("")
                  setIsPayOpen(true)
                }}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Tandai Lunas
              </Button>
            )}

            {order.receiptStatus !== "RECEIVED" && (
              <Button
                className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                disabled={submitting}
                onClick={() => {
                  setCompleteSupplierId(order.supplierId || "")
                  setCompletionAttachments([])
                  setCompleteError("")
                  const initialTotalPrices: Record<string, number> = {}
                  order.items.forEach((it) => {
                    initialTotalPrices[it.id] = it.totalPrice || (it.unitPrice ? it.unitPrice * it.quantity : 0)
                  })
                  setItemTotalPrices(initialTotalPrices)
                  setIsCompleteOpen(true)
                }}
              >
                <Check className="mr-2 h-4 w-4" />
                Set Harga & Selesaikan PO
              </Button>
            )}

            <Button
              variant="outline"
              className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
              disabled={submitting}
              onClick={handleCancel}
            >
              <Ban className="mr-2 h-4 w-4" />
              Batalkan PO
            </Button>
          </div>
        </section>
      )}

      {/* Info Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        {/* Vendor Card */}
        <Card className="rounded-xl shadow-sm border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-primary" /> Vendor Rekanan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="font-semibold text-base text-foreground">
              {order.supplierName && order.supplierName !== "-" ? (
                order.supplierName
              ) : (
                <span className="text-muted-foreground font-normal italic text-sm">
                  Belum ditentukan (Tim Finance)
                </span>
              )}
            </div>
            {order.supplierId ? (
              <Link
                to={`/inventory/suppliers/${order.supplierId}`}
                className="text-xs text-primary hover:underline block"
              >
                Lihat profil supplier &rarr;
              </Link>
            ) : (
              <span className="text-xs text-muted-foreground block">
                Kandidat supplier dapat ditentukan saat approval
              </span>
            )}
          </CardContent>
        </Card>

        {/* Tanggal & Timeline Card */}
        <Card className="rounded-xl shadow-sm border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" /> Timeline Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order Diajukan:</span>
              <span className="font-medium text-foreground">{formatDate(order.orderDate)}</span>
            </div>
            {order.completedDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Diselesaikan:</span>
                <span className="font-medium text-emerald-600">{formatDate(order.completedDate)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Finansial Card */}
        <Card className="rounded-xl shadow-sm border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-primary" /> Total Nilai Pembelian
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="font-bold text-xl font-mono text-primary">
              {order.status === "PURCHASE_REQUEST" || order.totalAmount === 0 ? (
                <span className="text-sm font-normal text-amber-600 italic">Menunggu penetapan harga</span>
              ) : (
                <CurrencyText value={order.totalAmount} />
              )}
            </div>
            <p className="text-xs text-muted-foreground">{order.items.length} macam item bahan baku</p>
          </CardContent>
        </Card>
      </div>

      {[
        { title: "Dokumen Lampiran", documents: order.attachments },
        { title: "Lampiran Penyelesaian", documents: order.completionAttachments },
      ].filter((group) => group.documents.length > 0).map((group) => (
        <Card key={group.title} className="rounded-xl border-primary/20 bg-primary/5 shadow-sm">
          <CardHeader className="px-4 pb-2 pt-4 sm:px-5"><CardTitle className="text-sm">{group.title}</CardTitle></CardHeader>
          <CardContent className="space-y-3 p-4 pt-0 sm:px-5 sm:pb-5">
            {group.documents.map((document) => (
              <div key={document.url} className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="size-4 shrink-0 text-primary" />
                  <p className="truncate text-sm text-muted-foreground" title={document.name}>{document.name}</p>
                </div>
                <Button asChild variant="outline" size="sm" className="shrink-0">
                  <a href={document.url} target="_blank" rel="noopener noreferrer" aria-label={`Buka / Unduh ${document.name}`}><ExternalLink className="size-4" />Buka / Unduh dokumen</a>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Item Table Card */}
      <Card className="rounded-xl shadow-sm border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Rincian Item Bahan Baku</CardTitle>
          <CardDescription>
            Bahan baku yang dipesan beserta kuantitas dan harga perolehan stok.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border overflow-hidden">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-[50px] text-center">#</TableHead>
                  <TableHead>Nama Bahan Baku</TableHead>
                  <TableHead className="text-right">Kuantitas</TableHead>
                  <TableHead className="text-right">Harga Satuan</TableHead>
                  <TableHead className="text-right">Total Biaya</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((it, idx) => (
                  <TableRow key={it.id} className="hover:bg-muted/30">
                    <TableCell className="text-center font-mono text-xs text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {it.stockName}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {it.quantity} {it.baseUnit}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {it.unitPrice > 0 ? (
                        <CurrencyText value={it.unitPrice} />
                      ) : (
                        <span className="text-xs text-amber-600 italic">Belum diset</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-foreground">
                      {it.totalPrice > 0 ? (
                        <CurrencyText value={it.totalPrice} />
                      ) : (
                        <span className="text-xs text-amber-600 italic">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="mt-4 p-3.5 rounded-xl bg-muted/30 border border-border text-xs text-muted-foreground">
              <strong className="text-foreground block mb-0.5">Catatan Pesanan:</strong>
              {order.notes}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Trail / Riwayat Log Aktivitas */}
      <Card className="rounded-xl shadow-sm border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Riwayat Aktivitas & Approval
          </CardTitle>
          <CardDescription>
            Jejak audit alur pengajuan, perubahan, persetujuan, dan realisasi pesanan ini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!order.logs || order.logs.length === 0 ? (
            <div className="p-4 rounded-xl bg-muted/20 border border-border text-xs text-muted-foreground text-center">
              Belum ada riwayat aktivitas yang tercatat.
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {order.logs.map((log) => (
                <div key={log.id} className="relative flex flex-col gap-1 text-sm">
                  <div className="absolute -left-6 top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                  <div className="flex flex-wrap items-center gap-2">
                    {getLogActionBadge(log.action)}
                    <span className="font-semibold text-foreground flex items-center gap-1 text-xs">
                      <User className="h-3 w-3 text-muted-foreground" />
                      {log.userName || "Sistem"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      &bull; {formatDate(log.createdAt)}
                    </span>
                  </div>
                  {log.notes && (
                    <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border mt-1">
                      {log.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal 1: Approve PR -> PO */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              Setujui Purchase Request
            </DialogTitle>
            <DialogDescription>
              Ubah status <strong className="text-foreground">{order.poNumber}</strong> menjadi{" "}
              <strong>Purchase Order</strong>. Anda dapat menetapkan supplier kandidat sekarang atau nanti.
            </DialogDescription>
          </DialogHeader>

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
              <Label htmlFor="approve-notes-detail" className="text-sm font-semibold">
                Catatan Persetujuan (Opsional)
              </Label>
              <Textarea
                id="approve-notes-detail"
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                placeholder="e.g. Disetujui untuk PO, vendor sudah dikonfirmasi ketersediaannya."
                className="rounded-xl min-h-[80px]"
              />
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0 sm:space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsApproveOpen(false)}
                className="rounded-xl"
                disabled={submitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="h-11 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={submitting}
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Setujui & Terbitkan PO
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Reject PR */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Tolak Purchase Request
            </DialogTitle>
            <DialogDescription>
              Pengajuan <strong className="text-foreground">{order.poNumber}</strong> akan ditolak. Masukkan alasan penolakan untuk catatan riwayat.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmReject} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="reject-reason-detail" className="text-sm font-semibold">
                Alasan Penolakan <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reject-reason-detail"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Anggaran belanja bahan baku bulan ini sudah melebihi kuota."
                className="rounded-xl min-h-[90px]"
                required
              />
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0 sm:space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRejectOpen(false)}
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
        </DialogContent>
      </Dialog>

      {/* Modal 3: Set Harga & Selesaikan */}
      <Dialog open={isCompleteOpen} onOpenChange={(open) => { if (!submitting && !uploadingCompletionAttachments) { setIsCompleteOpen(open); setCompleteError("") } }}>
        <DialogContent className="sm:max-w-[660px] rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Selesaikan Pesanan & Set Harga Stok
            </DialogTitle>
            <DialogDescription>
              Pesanan <strong className="text-foreground">{order.poNumber}</strong> telah tiba.
              Pilih supplier final dan masukkan total harga faktur untuk memasukkan barang ke stok bahan baku.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmComplete} className="space-y-4 py-2">
            {completeError && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{completeError}</p>}
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
              <Table className="min-w-[520px]">
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="py-2.5 px-3 text-left">Bahan Baku</TableHead>
                    <TableHead className="py-2.5 px-3 text-right">Qty</TableHead>
                    <TableHead className="py-2.5 px-3 w-[170px] text-right">Total Faktur (Rp)</TableHead>
                    <TableHead className="py-2.5 px-3 w-[150px] text-right">Harga Satuan (Kalkulasi)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((it) => {
                    const total = Number(itemTotalPrices[it.id]) || 0
                    const unitPrice = it.quantity > 0 ? total / it.quantity : 0
                    return (
                      <TableRow key={it.id}>
                        <TableCell className="align-middle py-2.5 px-3 font-medium text-sm text-foreground">
                          {it.stockName}
                        </TableCell>
                        <TableCell className="align-middle py-2.5 px-3 text-right font-mono text-sm text-muted-foreground whitespace-nowrap">
                          {it.quantity} {it.baseUnit}
                        </TableCell>
                        <TableCell className="align-middle py-2.5 px-3">
                          <Input
                            type="number"
                            min="0.0001"
                            step="any"
                            aria-label={`Total faktur ${it.stockName}`}
                            value={itemTotalPrices[it.id] || ""}
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
                        </TableCell>
                        <TableCell className="align-middle py-2.5 px-3 text-right font-mono text-xs text-muted-foreground whitespace-nowrap font-medium">
                          {unitPrice > 0 ? `${formatCurrency(Math.round(unitPrice))} / ${it.baseUnit}` : "-"}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-foreground">Total Nilai Pembelian:</span>
              <span className="text-base font-bold font-mono text-primary">
                <CurrencyText value={calculatedTotal} />
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Lampiran penyelesaian <span className="font-normal text-muted-foreground">(Opsional)</span></h3>
              <p className="text-xs text-muted-foreground">Tambahkan faktur, nota, atau bukti penerimaan. Lampiran awal tetap tersimpan.</p>
              <POAttachmentUpload value={completionAttachments} onChange={setCompletionAttachments} onUploadingChange={setUploadingCompletionAttachments} purpose="completion" disabled={submitting} />
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0 sm:space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCompleteOpen(false)}
                className="rounded-xl"
                disabled={submitting || uploadingCompletionAttachments}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={submitting || uploadingCompletionAttachments}
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Konfirmasi & Masukkan ke Stok
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 4: Terima Barang */}
      {order && (
        <Dialog
          open={isReceiveOpen}
          onOpenChange={(open) => !open && !submitting && setIsReceiveOpen(false)}
        >
          <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto rounded-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-amber-600" />
                Terima Barang Fisik
              </DialogTitle>
              <DialogDescription>
                Catat kedatangan barang fisik untuk PO{" "}
                <strong className="text-foreground">{order.poNumber}</strong>. Status penerimaan akan ditandai{" "}
                <strong>Sudah Diterima</strong>.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleConfirmReceive} className="space-y-4 py-2">
              {receiveError && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{receiveError}</span>
                </div>
              )}

              <div className="rounded-lg border border-border p-3 bg-muted/30 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Supplier:</span>
                  <span className="font-semibold text-foreground">
                    {order.supplierName || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Item:</span>
                  <span className="font-semibold text-foreground">
                    {order.items.length} macam item
                  </span>
                </div>
              </div>

              {/* Items detail: Price & Expiry */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground">
                  Daftar Bahan & Informasi Penerimaan
                </Label>
                <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {order.items.map((it) => {
                    const isFefo = it.inventoryMethod === "FEFO"
                    return (
                      <div
                        key={it.id}
                        className="rounded-lg border border-border p-3 bg-card space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">{it.stockName}</span>
                          <div className="flex items-center gap-1.5">
                            {isFefo && (
                              <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                                FEFO
                              </Badge>
                            )}
                            <span className="text-muted-foreground font-mono">
                              {it.quantity} {it.baseUnit}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor={`price-${it.id}`} className="text-[11px] text-muted-foreground">
                              Harga Satuan (Rp)
                            </Label>
                            <Input
                              id={`price-${it.id}`}
                              type="number"
                              min="0"
                              step="any"
                              value={receivePrices[it.id] ?? (it.unitPrice || "")}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0
                                setReceivePrices((prev) => ({ ...prev, [it.id]: val }))
                              }}
                              placeholder="Harga per unit"
                              className="h-8 text-xs font-mono mt-1"
                            />
                          </div>

                          <div>
                            <Label htmlFor={`expired-${it.id}`} className="text-[11px] text-muted-foreground flex items-center gap-1">
                              Tanggal Kadaluarsa {isFefo && <span className="text-destructive font-bold">*</span>}
                            </Label>
                            <Input
                              id={`expired-${it.id}`}
                              type="date"
                              required={isFefo}
                              value={receiveExpiredAt[it.id] || ""}
                              onChange={(e) => {
                                const val = e.target.value
                                setReceiveExpiredAt((prev) => ({ ...prev, [it.id]: val }))
                              }}
                              className="h-8 text-xs mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="detail-receive-notes" className="text-sm font-semibold">
                  Catatan Penerimaan (Opsional)
                </Label>
                <Textarea
                  id="detail-receive-notes"
                  value={receiveNotes}
                  onChange={(e) => setReceiveNotes(e.target.value)}
                  placeholder="e.g. Kondisi barang baik, diterima oleh staf gudang."
                  className="min-h-[70px]"
                />
              </div>

              <DialogFooter className="pt-2 gap-2 sm:gap-0 sm:space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsReceiveOpen(false)}
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
          </DialogContent>
        </Dialog>
      )}

      {/* Modal 5: Tandai Lunas */}
      {order && (
        <Dialog
          open={isPayOpen}
          onOpenChange={(open) => !open && !submitting && setIsPayOpen(false)}
        >
          <DialogContent className="sm:max-w-[480px] rounded-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                Tandai Lunas Pembayaran
              </DialogTitle>
              <DialogDescription>
                Catat penyelesaian pembayaran untuk PO{" "}
                <strong className="text-foreground">{order.poNumber}</strong>. Status pembayaran akan ditandai{" "}
                <strong>Lunas</strong>.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleConfirmPay} className="space-y-4 py-2">
              <div className="rounded-lg border border-border p-3 bg-muted/30 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Tagihan:</span>
                  <span className="font-mono font-bold text-foreground">
                    <CurrencyText value={order.totalAmount} />
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Supplier:</span>
                  <span className="font-semibold text-foreground">
                    {order.supplierName || "-"}
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
                <Label htmlFor="detail-pay-notes" className="text-sm font-semibold">
                  Catatan Pembayaran (Opsional)
                </Label>
                <Textarea
                  id="detail-pay-notes"
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
                  onClick={() => setIsPayOpen(false)}
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
          </DialogContent>
        </Dialog>
      )}

      {/* Modal 6: Batalkan PO */}
      {order && (
        <Dialog
          open={isCancelOpen}
          onOpenChange={(open) => !open && !submitting && setIsCancelOpen(false)}
        >
          <DialogContent className="sm:max-w-[480px] rounded-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Ban className="h-5 w-5" />
                Batalkan Purchase Order
              </DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin membatalkan pesanan{" "}
                <strong className="text-foreground">{order.poNumber}</strong>? Alasan pembatalan wajib dicatat.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleConfirmCancel} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="detail-cancel-reason" className="text-sm font-semibold">
                  Alasan Pembatalan <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="detail-cancel-reason"
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
                  onClick={() => setIsCancelOpen(false)}
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
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
