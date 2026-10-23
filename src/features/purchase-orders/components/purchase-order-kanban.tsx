import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  Clock,
  Truck,
  CreditCard,
  Calendar,
  Building2,
  AlertCircle,
  Package,
  Check,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CurrencyText } from "@/components/ui/currency-text"
import { POCategoryBadge } from "./po-category-badge"
import type { PurchaseOrder } from "../types"
import type { PurchaseOrderKanbanState } from '../hooks/use-purchase-order-kanban-query'

interface PurchaseOrderKanbanProps {
  orders: PurchaseOrder[]
  columns?: PurchaseOrderKanbanState[]
  canProcess: boolean
  onApprove?: (po: PurchaseOrder) => void
  onReceive?: (po: PurchaseOrder) => void
  onPay?: (po: PurchaseOrder) => void
}

interface ColumnDef {
  id: "pengajuan" | "dipesan" | "diterima" | "selesai" | "ditutup"
  title: string
  subtitle: string
  dotColor: string
  badgeBg: string
  filter: (po: PurchaseOrder) => boolean
}

export function PurchaseOrderKanban({
  orders,
  columns: columnStates,
  canProcess,
  onApprove,
  onReceive,
  onPay,
}: PurchaseOrderKanbanProps) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(timer)
  }, [])

  const columns: ColumnDef[] = [
    {
      id: "pengajuan",
      title: "Purchase Request",
      subtitle: "Menunggu Persetujuan",
      dotColor: "bg-blue-500",
      badgeBg: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      filter: (po) => po.status === "PURCHASE_REQUEST",
    },
    {
      id: "dipesan",
      title: "Purchase Order",
      subtitle: "Menunggu Barang Tiba",
      dotColor: "bg-amber-500",
      badgeBg: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      filter: (po) =>
        po.status === "PURCHASE_ORDER" && po.receiptStatus !== "RECEIVED",
    },
    {
      id: "diterima",
      title: "Barang Diterima",
      subtitle: "Menunggu Pembayaran",
      dotColor: "bg-purple-500",
      badgeBg: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
      filter: (po) =>
        po.status === "PURCHASE_ORDER" && po.receiptStatus === "RECEIVED" &&
        po.paymentStatus !== "PAID",
    },
    {
      id: "selesai",
      title: "Selesai",
      subtitle: "Barang Masuk & Lunas",
      dotColor: "bg-emerald-500",
      badgeBg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      filter: (po) =>
        po.status === "COMPLETED" ||
        (po.status === "PURCHASE_ORDER" && po.receiptStatus === "RECEIVED" && po.paymentStatus === "PAID"),
    },
  ]
  if (orders.some((po) => po.status === "REJECTED" || po.status === "CANCELLED") || columnStates?.some((column) => column.id === 'ditutup' && (column.total > 0 || column.error))) {
    columns.push({
      id: "ditutup", title: "Ditolak / Dibatalkan", subtitle: "Pengajuan ditutup",
      dotColor: "bg-zinc-500",
      badgeBg: "bg-muted text-muted-foreground border-border",
      filter: (po) => po.status === "REJECTED" || po.status === "CANCELLED",
    })
  }

  function formatShortDate(dateStr?: string) {
    if (!dateStr) return "-"
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(dateStr))
  }

  function isOverdue(dueDateStr?: string, isPaid?: boolean) {
    if (!dueDateStr || isPaid) return false
    return new Date(dueDateStr).getTime() < now
  }

  return (
    <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4 items-start">
      {columns.map((col) => {
        const state = columnStates?.find((column) => column.id === col.id)
        const columnOrders = state ? state.orders.filter(col.filter) : orders.filter(col.filter)

        return (
          <div
            key={col.id}
            className="flex min-w-0 flex-col rounded-xl border border-border bg-card/60"
          >
            {/* Column Header */}
            <div className="p-3.5 border-b border-border bg-muted/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {col.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground leading-none">
                    {col.subtitle}
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full border ${col.badgeBg}`}
              >
                {state?.total ?? columnOrders.length}
              </Badge>
            </div>

            {/* Column Cards */}
            <div className="p-2.5 flex flex-col gap-2.5 min-h-24 md:min-h-[380px] md:max-h-[720px] md:overflow-y-auto">
              {columnOrders.length === 0 && !state?.error ? (
                <div className="flex flex-col items-center justify-center min-h-24 md:min-h-48 text-center p-4 border border-dashed border-border/80 rounded-lg bg-background/50">
                  <Package className="h-6 w-6 text-muted-foreground/40 mb-1.5" />
                  <p className="text-xs font-medium text-muted-foreground">
                    Tidak tersedia
                  </p>
                </div>
              ) : (
                columnOrders.map((po) => {
                  const overdue = isOverdue(
                    po.paymentDueDate,
                    po.paymentStatus === "PAID"
                  )

                  return (
                    <div
                      key={po.id}
                      className="group relative rounded-lg border border-border bg-card p-3.5 shadow-2xs hover:border-primary/50 hover:shadow-xs transition-all space-y-2.5"
                    >
                      {/* Top Row: PO Number & Category */}
                      <div className="flex items-center justify-between gap-1.5">
                        <Link
                          to={`/inventory/purchase-orders/${po.id}`}
                          className="min-w-0 break-words text-xs font-bold text-primary hover:underline focus-visible:underline flex items-center gap-1"
                        >
                          {po.poNumber}
                          <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        <POCategoryBadge category={po.category} />
                      </div>

                      {/* Supplier */}
                      <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">
                          {po.supplierName || (
                            <span className="text-muted-foreground italic font-normal">
                              Belum ditentukan
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Dates */}
                      <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Pesan:
                          </span>
                          <span>{formatShortDate(po.orderDate)}</span>
                        </div>

                        {po.paymentDueDate && (
                          <div
                            className={`flex items-center justify-between font-medium ${
                              overdue
                                ? "text-rose-600 dark:text-rose-400 font-semibold"
                                : "text-muted-foreground"
                            }`}
                          >
                            <span className="flex items-center gap-1">
                              {overdue ? (
                                <AlertCircle className="h-3 w-3 text-rose-500" />
                              ) : (
                                <Clock className="h-3 w-3" />
                              )}
                              Jatuh Tempo:
                            </span>
                            <span>{formatShortDate(po.paymentDueDate)}</span>
                          </div>
                        )}
                      </div>

                      {/* Dual Status Mini Indicators */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/60">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                            po.receiptStatus === "RECEIVED"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                          }`}
                        >
                          <Truck className="h-2.5 w-2.5" />
                          {po.receiptStatus === "RECEIVED"
                            ? "Diterima"
                            : "Belum Diterima"}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                            po.paymentStatus === "PAID"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : overdue
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          <CreditCard className="h-2.5 w-2.5" />
                          {po.paymentStatus === "PAID"
                            ? "Sudah Dibayar"
                            : overdue
                            ? "Tempo Lewat"
                            : "Belum Dibayar"}
                        </span>
                      </div>

                      {/* Amount & Items */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-[11px] text-muted-foreground">
                          {po.items.length} item
                        </span>
                        <span className="font-mono font-bold text-foreground">
                          {po.status === "PURCHASE_REQUEST" ||
                          po.totalAmount === 0 ? (
                            <span className="text-[11px] text-muted-foreground italic font-normal">
                              Menunggu harga
                            </span>
                          ) : (
                            <CurrencyText value={po.totalAmount} />
                          )}
                        </span>
                      </div>

                      {/* Quick Action Buttons */}
                      {canProcess && ((col.id === "pengajuan" && onApprove) || (col.id === "dipesan" && onReceive) || (col.id === "diterima" && onPay)) && (
                        <div className="pt-1.5 border-t border-border/60">
                          {col.id === "pengajuan" && onApprove && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onApprove(po)}
                              className="w-full h-8 text-xs font-semibold gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 border-blue-200 dark:border-blue-800"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Setujui (PO)
                            </Button>
                          )}

                          {col.id === "dipesan" && onReceive && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onReceive(po)}
                              className="w-full h-8 text-xs font-semibold gap-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 border-amber-200 dark:border-amber-800"
                            >
                              <Truck className="h-3.5 w-3.5" />
                              Terima Barang
                            </Button>
                          )}

                          {col.id === "diterima" && onPay && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onPay(po)}
                              className="w-full h-8 text-xs font-semibold gap-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                              Tandai Lunas
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
              {state?.error && <div role="alert" className="space-y-2 rounded-lg border border-destructive/30 p-3 text-xs">
                <p>{state.error}</p>
                <Button variant="outline" size="sm" className="w-full" disabled={state.isFetching} onClick={() => void state.retry()}>Coba lagi {col.title}</Button>
              </div>}
              {state?.hasMore && !state.error && <Button
                variant="outline" className="w-full shrink-0 text-xs"
                aria-label={`Muat lebih banyak ${col.title}`}
                disabled={state.isFetching}
                onClick={() => void state.loadMore()}
              >{state.loadingMore ? 'Memuat...' : 'Muat lebih banyak'}</Button>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
