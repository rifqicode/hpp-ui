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

import { purchaseOrderService } from "@/features/purchase-orders/services/po-service"
import type { PurchaseOrder } from "@/features/purchase-orders/types"

export default function PurchaseOrderDetailPage() {
  const { poId } = useParams<{ poId: string }>()
  const navigate = useNavigate()

  const [order, setOrder] = React.useState<PurchaseOrder | null>(null)
  const [loading, setLoading] = React.useState<boolean>(true)

  // Complete price modal
  const [isCompleteOpen, setIsCompleteOpen] = React.useState<boolean>(false)
  const [itemPrices, setItemPrices] = React.useState<Record<string, number>>({})
  const [submitting, setSubmitting] = React.useState<boolean>(false)

  const loadData = React.useCallback(async () => {
    if (!poId) return
    setLoading(true)
    try {
      const data = await purchaseOrderService.getPurchaseOrderById(poId)
      setOrder(data)
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

  async function handleConfirmComplete(e: React.FormEvent) {
    e.preventDefault()
    if (!order) return

    setSubmitting(true)
    try {
      const prices = order.items.map((it) => ({
        itemId: it.id,
        unitPrice: Number(itemPrices[it.id]) || 0,
      }))
      const updated = await purchaseOrderService.completePurchaseOrder(order.id, prices)
      setOrder(updated)
      setIsCompleteOpen(false)
    } catch (err) {
      console.error("Failed to complete PO:", err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCancel() {
    if (!order) return
    try {
      const updated = await purchaseOrderService.cancelPurchaseOrder(order.id)
      setOrder(updated)
    } catch (err) {
      console.error("Failed to cancel PO:", err)
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
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr))
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
              {order.status === "IN_PROGRESS" && (
                <Badge variant="warning" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Dalam Proses
                </Badge>
              )}
              {order.status === "COMPLETED" && (
                <Badge variant="success" className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Selesai / Diterima
                </Badge>
              )}
              {order.status === "CANCELLED" && (
                <Badge variant="outline" className="text-muted-foreground flex items-center gap-1">
                  <XCircle className="h-3 w-3" /> Dibatalkan
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Diajukan pada {formatDate(order.orderDate)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {order.status === "IN_PROGRESS" && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-xl text-destructive hover:text-destructive"
              onClick={handleCancel}
            >
              <Ban className="mr-2 h-4 w-4" />
              Batalkan
            </Button>
            <Button
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              onClick={() => setIsCompleteOpen(true)}
            >
              <Check className="mr-2 h-4 w-4" />
              Set Harga & Selesaikan PO
            </Button>
          </div>
        )}
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
            <div className="font-semibold text-base text-foreground">{order.supplierName}</div>
            <Link
              to={`/inventory/suppliers/${order.supplierId}`}
              className="text-xs text-primary hover:underline block"
            >
              Lihat profil supplier &rarr;
            </Link>
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
              {order.status === "IN_PROGRESS" && order.totalAmount === 0 ? (
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

      {/* Modal Dialog Set Harga & Selesaikan */}
      <Dialog open={isCompleteOpen} onOpenChange={setIsCompleteOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Set Harga & Selesaikan Purchase Order
            </DialogTitle>
            <DialogDescription>
              Tentukan harga satuan riil dari faktur vendor agar sistem dapat membentuk batch stok dan memperbarui HPP bahan.
            </DialogDescription>
          </DialogHeader>

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
