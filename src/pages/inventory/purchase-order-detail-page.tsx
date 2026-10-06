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
import type { PurchaseOrder, PurchaseOrderStatus } from "@/features/purchase-orders/types"
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
  const [itemPrices, setItemPrices] = React.useState<Record<string, number>>({})

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

      const initialPrices: Record<string, number> = {}
      data.items.forEach((it) => {
        initialPrices[it.id] = it.unitPrice || 0
      })
      setItemPrices(initialPrices)
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
    if (!order) return
    if (!completeSupplierId) {
      alert("Pilih vendor / supplier final terlebih dahulu")
      return
    }

    setSubmitting(true)
    try {
      const prices = order.items.map((it) => ({
        item_id: it.id,
        unit_price: Number(itemPrices[it.id]) || 0,
      }))
      const updated = await purchaseOrderService.completePurchaseOrder(order.id, {
        supplier_id: completeSupplierId,
        prices,
      })
      setOrder(updated)
      setIsCompleteOpen(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyelesaikan PO"
      alert(msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCancel() {
    if (!order) return
    if (!confirm("Apakah Anda yakin ingin membatalkan Purchase Order ini?")) return
    try {
      const updated = await purchaseOrderService.cancelPurchaseOrder(order.id)
      setOrder(updated)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membatalkan PO"
      alert(msg)
    }
  }

  function formatRupiah(amount: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount)
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
    const p = Number(itemPrices[it.id]) || 0
    return acc + p * it.quantity
  }, 0)

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm" className="rounded-xl">
          <Link to="/inventory/purchase-orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar PO
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight font-mono text-foreground">
                {order.poNumber}
              </h1>
              {getStatusBadge(order.status)}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
              <span>Diajukan pada {formatDate(order.orderDate)}</span>
              {order.createdByName && (
                <span>&bull; Oleh: <strong>{order.createdByName}</strong></span>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {order.status === "PURCHASE_REQUEST" && (
            <>
              {canEdit && (
                <Button asChild variant="outline" className="rounded-xl border-blue-500/30 text-blue-600">
                  <Link to={`/inventory/purchase-orders/${order.id}/edit`}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit Request
                  </Link>
                </Button>
              )}
              {canProcess && (
                <>
                  <Button
                    variant="outline"
                    className="rounded-xl text-destructive hover:text-destructive"
                    onClick={() => setIsRejectOpen(true)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Tolak Request
                  </Button>
                  <Button
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    onClick={() => {
                      setApproveSupplierId(order.supplierId || "")
                      setIsApproveOpen(true)
                    }}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Setujui (Jadikan PO)
                  </Button>
                </>
              )}
            </>
          )}

          {order.status === "PURCHASE_ORDER" && canProcess && (
            <>
              <Button
                variant="outline"
                className="rounded-xl text-destructive hover:text-destructive"
                onClick={handleCancel}
              >
                <Ban className="mr-2 h-4 w-4" />
                Batalkan PO
              </Button>
              <Button
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                onClick={() => {
                  setCompleteSupplierId(order.supplierId || "")
                  setIsCompleteOpen(true)
                }}
              >
                <Check className="mr-2 h-4 w-4" />
                Set Harga & Selesaikan PO
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
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
                formatRupiah(order.totalAmount)
              )}
            </div>
            <p className="text-xs text-muted-foreground">{order.items.length} macam item bahan baku</p>
          </CardContent>
        </Card>
      </div>

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
            <Table>
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
                        formatRupiah(it.unitPrice)
                      ) : (
                        <span className="text-xs text-amber-600 italic">Belum diset</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-foreground">
                      {it.totalPrice > 0 ? (
                        formatRupiah(it.totalPrice)
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
              <Check className="h-5 w-5 text-emerald-600" />
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

            <DialogFooter className="pt-2 sm:space-x-2">
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
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
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

            <DialogFooter className="pt-2 sm:space-x-2">
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
      <Dialog open={isCompleteOpen} onOpenChange={setIsCompleteOpen}>
        <DialogContent className="sm:max-w-[580px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Selesaikan Pesanan & Set Harga Stok
            </DialogTitle>
            <DialogDescription>
              Pesanan <strong className="text-foreground">{order.poNumber}</strong> telah tiba.
              Pilih supplier final dan masukkan harga satuan faktur untuk memasukkan barang ke stok bahan baku.
            </DialogDescription>
          </DialogHeader>

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
                  {order.items.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell className="font-medium text-sm">
                        {it.stockName}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {it.quantity} {it.baseUnit}
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Total Nilai Pembelian:</span>
              <span className="text-base font-bold font-mono text-primary">
                {formatRupiah(calculatedTotal)}
              </span>
            </div>

            <DialogFooter className="pt-2 sm:space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCompleteOpen(false)}
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
        </DialogContent>
      </Dialog>
    </div>
  )
}
