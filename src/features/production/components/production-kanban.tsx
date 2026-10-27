import * as React from "react"
import { Link } from "react-router-dom"
import {
  Clock,
  Flame,
  CheckCircle2,
  Package,
  Loader2,
  ArrowRight,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { ProductionBatch } from "../types"

export interface ProductionKanbanProps {
  batches: ProductionBatch[]
  onPickup: (batchId: string) => Promise<void> | void
  onComplete: (batch: ProductionBatch) => void
  isPickingUp?: string | null
}

interface ColumnDef {
  id: "QUEUED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  title: string
  subtitle: string
  dotColor: string
  badgeBg: string
  filter: (b: ProductionBatch) => boolean
}

function formatElapsed(dateStr?: string): string {
  if (!dateStr) return "-"
  const diff = Date.now() - new Date(dateStr).getTime()
  if (diff < 0) return "Baru saja"
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "Baru saja"
  if (mins < 60) return `${mins} mnt lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  return `${days} hr lalu`
}

function formatTimeOnly(dateStr?: string): string {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function ProductionKanban({
  batches,
  onPickup,
  onComplete,
  isPickingUp,
}: ProductionKanbanProps) {
  const [, setTick] = React.useState(0)

  // Auto-refresh relative time labels every 30 seconds
  React.useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => clearInterval(timer)
  }, [])

  const columns: ColumnDef[] = [
    {
      id: "QUEUED",
      title: "Antrean",
      subtitle: "Menunggu Diproses",
      dotColor: "bg-amber-500",
      badgeBg:
        "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      filter: (b) => b.status === "QUEUED",
    },
    {
      id: "IN_PROGRESS",
      title: "Sedang Diproduksi",
      subtitle: "Dalam Proses Produksi",
      dotColor: "bg-blue-500",
      badgeBg:
        "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      filter: (b) => b.status === "IN_PROGRESS",
    },
    {
      id: "COMPLETED",
      title: "Selesai",
      subtitle: "Siap Disajikan / Stok Jadi",
      dotColor: "bg-emerald-500",
      badgeBg:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      filter: (b) => b.status === "COMPLETED",
    },
  ]

  const hasCancelled = batches.some(
    (b) => b.status === "CANCELLED" || b.status === "VOID"
  )
  if (hasCancelled) {
    columns.push({
      id: "CANCELLED",
      title: "Batal / Void",
      subtitle: "Produksi Dibatalkan",
      dotColor: "bg-zinc-500",
      badgeBg: "bg-muted text-muted-foreground border-border",
      filter: (b) => b.status === "CANCELLED" || b.status === "VOID",
    })
  }

  const gridColsClass =
    columns.length === 4
      ? "grid min-w-0 grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start"
      : "grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start"

  return (
    <div className={gridColsClass} aria-label="Papan Kanban Dapur Produksi">
      {columns.map((col) => {
        const colBatches = batches.filter(col.filter)

        return (
          <div
            key={col.id}
            className="flex min-w-0 flex-col rounded-xl border border-border bg-card/60 shadow-2xs"
          >
            {/* Header Kolom */}
            <div className="p-3.5 border-b border-border bg-muted/40 flex items-center justify-between rounded-t-xl">
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
                {colBatches.length}
              </Badge>
            </div>

            {/* List Kartu Kolom */}
            <div className="p-2.5 flex flex-col gap-2.5 min-h-24 md:min-h-[380px] md:max-h-[720px] md:overflow-y-auto">
              {colBatches.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-24 md:min-h-48 text-center p-4 border border-dashed border-border/80 rounded-lg bg-background/50">
                  <Package className="h-6 w-6 text-muted-foreground/40 mb-1.5" />
                  <p className="text-xs font-medium text-muted-foreground">
                    Tidak ada batch {col.title.toLowerCase()}
                  </p>
                </div>
              ) : (
                colBatches.map((b) => {
                  const variantName = b.recipeSnapshot?.variant_name || ""
                  const showVariant =
                    variantName &&
                    variantName !== "Default" &&
                    variantName.toLowerCase() !== b.productName.toLowerCase()
                  const modifiers = b.recipeSnapshot?.modifiers || []
                  const isCurrentPickingUp = isPickingUp === b.id

                  return (
                    <div
                      key={b.id}
                      className="group relative flex flex-col justify-between rounded-lg border border-border bg-card p-3.5 shadow-2xs transition-all hover:border-primary/50 hover:shadow-xs"
                    >
                      <div className="space-y-2">
                        {/* Baris Atas: Nomor Batch & Elapsed Time */}
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <Link
                            to={`/production/batches/${b.id}`}
                            className="font-mono text-[11px] font-semibold text-muted-foreground hover:text-primary hover:underline transition-colors"
                          >
                            {b.batchNumber}
                          </Link>
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            {col.id === "COMPLETED" ? (
                              <span title={`Selesai jam ${formatTimeOnly(b.completedAt)}`}>
                                Selesai {formatTimeOnly(b.completedAt)}
                              </span>
                            ) : (
                              <>
                                <Clock className="h-3 w-3" />
                                <span>{formatElapsed(b.startedAt)}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Nama Produk & Varian */}
                        <div>
                          <Link
                            to={`/production/batches/${b.id}`}
                            className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors block line-clamp-2"
                          >
                            {b.productName}
                          </Link>
                          {showVariant && (
                            <span className="inline-block mt-0.5 text-xs text-muted-foreground font-medium">
                              Varian: {variantName}
                            </span>
                          )}
                        </div>

                        {/* Modifiers / Add-ons */}
                        {modifiers.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {modifiers.map((m, idx) => (
                              <span
                                key={m.id || idx}
                                className="inline-flex items-center rounded-md bg-secondary/80 px-1.5 py-0.5 text-[11px] font-medium text-secondary-foreground border border-border/50"
                              >
                                + {m.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Notes / Order Invoice Callout */}
                        {b.notes && (
                          <div className="rounded-md border border-amber-200/80 bg-amber-50/80 p-2 text-xs text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
                            <span className="font-semibold block text-[10px] uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-0.5">
                              Catatan / Pesanan:
                            </span>
                            <span className="line-clamp-2 leading-relaxed font-medium">
                              {b.notes}
                            </span>
                          </div>
                        )}

                        {/* Kuantitas & Info */}
                        <div className="rounded-md bg-muted/40 p-2 text-xs flex items-center justify-between">
                          <span className="text-muted-foreground">
                            {col.id === "COMPLETED"
                              ? "Hasil / Target"
                              : "Target Dapur"}
                          </span>
                          <span className="font-semibold tabular-nums text-foreground">
                            {col.id === "COMPLETED" ? (
                              <>
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  {b.goodQuantity ?? 0}
                                </span>
                                {" / "}
                                {b.targetQuantity} {b.productUnit}
                                {Boolean(b.wasteQuantity && b.wasteQuantity > 0) && (
                                  <span className="text-destructive text-[11px] ml-1.5 font-normal">
                                    (Afkir: {b.wasteQuantity})
                                  </span>
                                )}
                              </>
                            ) : (
                              `${b.targetQuantity} ${b.productUnit}`
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Tombol Aksi */}
                      <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between gap-2">
                        <Link
                          to={`/production/batches/${b.id}`}
                          className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 transition-colors"
                        >
                          Detail
                          <ArrowRight className="h-3 w-3" />
                        </Link>

                        {col.id === "QUEUED" && (
                          <Button
                            size="sm"
                            disabled={isCurrentPickingUp}
                            onClick={() => onPickup(b.id)}
                            className="h-8 gap-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-2xs"
                          >
                            {isCurrentPickingUp ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Flame className="h-3.5 w-3.5" />
                            )}
                            Mulai Produksi
                          </Button>
                        )}

                        {col.id === "IN_PROGRESS" && (
                          <Button
                            size="sm"
                            onClick={() => onComplete(b)}
                            className="h-8 gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xs"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Selesai Produksi
                          </Button>
                        )}

                        {col.id === "COMPLETED" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            <Check className="h-3.5 w-3.5" />
                            Tersimpan
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
