import * as React from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, Package, Layers, RotateCcw, Plus, ArrowLeftRight, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { useStockDetail } from "@/features/inventory/hooks/use-stock-detail"
import { usePermission } from "@/hooks/use-permission"
import { RecordPurchaseDialog } from "@/features/inventory/components/record-purchase-dialog"
import { RecordMovementDialog } from "@/features/inventory/components/record-movement-dialog"
import { cn } from "@/lib/utils"
import type { StockMovementType } from "@/features/inventory/types"

function formatQty(value: string | number, unit: string) {
  const num = typeof value === "number" ? value : parseFloat(value) || 0
  const fixed = Number.isInteger(num) ? num.toString() : num.toFixed(2)
  return `${fixed} ${unit}`
}

function formatCurrencyIdr(value: string | number) {
  const num = typeof value === "number" ? value : parseFloat(value) || 0
  const formatted = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(num)
  return `Rp ${formatted}`
}

function formatDateTime(dateStr?: string) {
  if (!dateStr) return "—"
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return date.toLocaleString("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

function formatDateOnly(dateStr?: string) {
  if (!dateStr) return "—"
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

function getBatchExpiredStatus(expiredAt?: string) {
  if (!expiredAt) return null
  const expiry = new Date(expiredAt).getTime()
  if (isNaN(expiry)) return null
  const now = new Date().getTime()
  const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) {
    return { status: "expired" as const, label: "Expired", variant: "destructive" as const }
  }
  if (diffDays <= 7) {
    return { status: "near" as const, label: `${diffDays} hari lagi`, variant: "warning" as const }
  }
  return { status: "fresh" as const, label: "Fresh", variant: "success" as const }
}

function movementLabel(type: StockMovementType) {
  switch (type) {
    case "PURCHASE":
      return "Purchase (In)"
    case "ADJUSTMENT_IN":
      return "Adjustment (+)"
    case "ADJUSTMENT_OUT":
      return "Adjustment (-)"
    case "PRODUCTION_CONSUMPTION":
      return "Production (Out)"
    case "PRODUCTION_REVERSAL":
      return "Reversal (In)"
    default:
      return type
  }
}

function movementVariant(type: StockMovementType) {
  switch (type) {
    case "PURCHASE":
      return "success" as const
    case "ADJUSTMENT_IN":
    case "PRODUCTION_REVERSAL":
      return "warning" as const
    case "ADJUSTMENT_OUT":
    case "PRODUCTION_CONSUMPTION":
      return "destructive" as const
    default:
      return "secondary" as const
  }
}

export default function StockDetailPage() {
  const { materialId } = useParams<{ materialId: string }>()
  const { detail, loading, error, loadDetail } = useStockDetail(materialId)

  const [isPurchaseOpen, setIsPurchaseOpen] = React.useState(false)
  const [isMovementOpen, setIsMovementOpen] = React.useState(false)

  const { can } = usePermission()
  const canCreate = can("stocks:create")
  const canAdjust = can("stocks:adjust")

  const stock = detail?.stock
  const batches = detail?.active_batches ?? []
  const movements = detail?.movements ?? []
  const lastMovement = movements.length > 0 ? movements[movements.length - 1] : undefined

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !stock) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-destructive font-medium">{error || "Stock not found"}</p>
        <Button asChild variant="outline" className="rounded-xl">
          <Link to="/inventory/stocks">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Bahan Baku
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/inventory/stocks">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>

          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{stock.name}</h1>
              <Badge variant={stock.inventory_method === "FEFO" ? "warning" : "info"} className="font-mono text-xs">
                {stock.inventory_method || "FIFO"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Base unit: {stock.base_unit} • Metode: {stock.inventory_method === "FEFO" ? "FEFO (First Expired, First Out)" : "FIFO (First In, First Out)"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canCreate && (
            <Button
              onClick={() => setIsPurchaseOpen(true)}
              className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Record Purchase
            </Button>
          )}
          {canAdjust && (
            <Button
              onClick={() => setIsMovementOpen(true)}
              variant="outline"
              className="rounded-xl"
            >
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              Record Movement
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-info bg-info/10">
          <CardHeader className="pb-2">
            <CardDescription className="text-info flex items-center gap-2">
              <Package className="h-4 w-4" />
              Stok Tersedia (Available)
            </CardDescription>
            <CardTitle className="text-2xl font-mono">
              {formatQty(stock.available_stock !== undefined ? stock.available_stock : stock.current_stock, stock.base_unit)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className={cn(
          "border-l-4",
          Number(stock.expired_stock) > 0 ? "border-l-destructive bg-destructive/10" : "border-l-muted bg-muted/20"
        )}>
          <CardHeader className="pb-2">
            <CardDescription className={cn(
              "flex items-center gap-2",
              Number(stock.expired_stock) > 0 ? "text-destructive" : "text-muted-foreground"
            )}>
              <Package className="h-4 w-4" />
              Stok Kadaluwarsa
            </CardDescription>
            <CardTitle className={cn(
              "text-2xl font-mono",
              Number(stock.expired_stock) > 0 && "text-destructive"
            )}>
              {formatQty(stock.expired_stock || 0, stock.base_unit)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-success bg-success/10">
          <CardHeader className="pb-2">
            <CardDescription className="text-success flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Active Batches
            </CardDescription>
            <CardTitle className="text-2xl font-mono">{batches.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-warning bg-warning/10">
          <CardHeader className="pb-2">
            <CardDescription className="text-warning flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Last Movement
            </CardDescription>
            <CardTitle className="text-base font-medium">
              {lastMovement ? `${movementLabel(lastMovement.type)} • ${formatDateTime(lastMovement.created_at)}` : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Details</CardTitle>
          <CardDescription>Active batches (FIFO) and stock movement history.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="batches" className="w-full">
            <TabsList>
              <TabsTrigger value="batches">Active Batches</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="batches" className="mt-4">
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20">
                      <TableHead>Batch ID</TableHead>
                      <TableHead>Initial</TableHead>
                      <TableHead>Remaining</TableHead>
                      <TableHead className="text-right">Cost Per Unit</TableHead>
                      <TableHead className="text-right">Kadaluwarsa (Expired At)</TableHead>
                      <TableHead className="text-right">Received Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.map((b) => {
                      const expInfo = getBatchExpiredStatus(b.expired_at)
                      const isExpired = expInfo?.status === "expired"

                      return (
                        <TableRow key={b.id} className={cn(isExpired && "bg-destructive/5 opacity-75")}>
                          <TableCell className="py-2 font-mono text-xs">{b.id}</TableCell>
                          <TableCell className="py-2 font-mono text-sm">{formatQty(b.initial_quantity, stock.base_unit)}</TableCell>
                          <TableCell className="py-2 font-mono text-sm">
                            <span className={cn(isExpired && "line-through text-destructive")}>
                              {formatQty(b.remaining_quantity, stock.base_unit)}
                            </span>
                          </TableCell>
                          <TableCell className="py-2 text-right font-mono text-sm">{formatCurrencyIdr(b.price_per_unit)}</TableCell>
                          <TableCell className="py-2 text-right">
                            {b.expired_at ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <span className="font-mono text-xs">{formatDateOnly(b.expired_at)}</span>
                                {expInfo && (
                                  <Badge variant={expInfo.variant} className="text-[10px] px-1.5 py-0">
                                    {expInfo.label}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs italic">Tanpa Expired</span>
                            )}
                          </TableCell>
                          <TableCell className="py-2 text-right text-muted-foreground text-xs">{formatDateTime(b.created_at)}</TableCell>
                        </TableRow>
                      )
                    })}

                    {batches.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                          No active batches.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20">
                      <TableHead>Type</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>
                          <Badge variant={movementVariant(m.type)}>{movementLabel(m.type)}</Badge>
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatQty(m.quantity, stock.base_unit)}
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">{m.reference_id || "—"}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatDateTime(m.created_at)}</TableCell>
                      </TableRow>
                    ))}

                    {movements.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                          No history.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <RecordPurchaseDialog
        open={isPurchaseOpen}
        onOpenChange={setIsPurchaseOpen}
        initialStockId={stock.id}
        onSuccess={loadDetail}
      />

      <RecordMovementDialog
        open={isMovementOpen}
        onOpenChange={setIsMovementOpen}
        initialStockId={stock.id}
        onSuccess={loadDetail}
      />
    </div>
  )
}
