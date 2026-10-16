import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, ChevronDown, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useMovementStock } from "@/features/inventory/hooks/use-movement-stock"

type MovementType = "ADJUSTMENT_IN" | "ADJUSTMENT_OUT"

const MOVEMENT_TYPES: { value: MovementType; label: string; desc: string }[] = [
  { value: "ADJUSTMENT_IN", label: "Adjustment In (+)", desc: "Add stock correction (requires cost basis)" },
  { value: "ADJUSTMENT_OUT", label: "Adjustment Out (-)", desc: "Deducts stock starting from the oldest available batch (Strict FIFO)" },
]

export default function MovementStockPage() {
  const navigate = useNavigate()
  const { stocks, loading, isSubmitting, error: hookError, handleRecordAdjustment } = useMovementStock()

  const [movementType, setMovementType] = React.useState<MovementType>("ADJUSTMENT_IN")
  const [quantity, setQuantity] = React.useState<string>("")
  const [pricePerUnit, setPricePerUnit] = React.useState<string>("")
  const [reason, setReason] = React.useState<string>("")
  const [submitError, setSubmitError] = React.useState<string>("")

  const [userSelectedMaterialId, setUserSelectedMaterialId] = React.useState<string>("")
  const materialId = userSelectedMaterialId || stocks[0]?.id || ""
  const selectedMaterial = stocks.find((m) => m.id === materialId)
  const selectedType = MOVEMENT_TYPES.find((t) => t.value === movementType)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError("")

    if (!materialId) {
      setSubmitError("Pilih bahan baku terlebih dahulu")
      return
    }

    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty <= 0) {
      setSubmitError("Quantity must be greater than 0")
      return
    }

    const price = parseFloat(pricePerUnit)
    if (movementType === "ADJUSTMENT_IN" && (isNaN(price) || price <= 0)) {
      setSubmitError("Price per unit is required and must be greater than 0 for Adjustment In")
      return
    }

    try {
      await handleRecordAdjustment({
        stock_id: materialId,
        type: movementType,
        quantity: qty,
        reason: reason.trim() || undefined,
        price_per_unit: movementType === "ADJUSTMENT_IN" ? price : undefined,
      })
      navigate("/inventory/stocks")
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Failed to record adjustment")
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-3 text-primary" />
        <p className="text-sm">Memuat data bahan baku...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" className="rounded-xl">
          <Link to="/inventory/stocks">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Record Inventory Movement</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Record stock adjustments (In/Out) to correct inventory levels.
        </p>
      </div>

      {(hookError || submitError) && (
        <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-xl border border-destructive/20 max-w-2xl">
          {submitError || hookError}
        </div>
      )}

      <Card className="max-w-2xl min-w-0">
        <CardHeader>
          <CardTitle>Movement Form</CardTitle>
          <CardDescription>Pilih bahan baku, jenis pergerakan stok, dan kuantitas penyesuaian.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-5 min-w-0">
            <div className="grid gap-5 sm:grid-cols-2 min-w-0">
              <div className="grid gap-2 min-w-0">
                <Label>Bahan Baku</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" className="w-full justify-between rounded-xl min-w-0">
                      <span className={cn("truncate", !selectedMaterial && "text-muted-foreground")}>
                        {selectedMaterial ? selectedMaterial.name : "Pilih bahan baku"}
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]" align="start">
                    <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground/70">
                      Bahan Baku
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {stocks.map((m) => (
                      <DropdownMenuItem key={m.id} onClick={() => setUserSelectedMaterialId(m.id)} className="cursor-pointer">
                        {m.name} ({m.base_unit})
                      </DropdownMenuItem>
                    ))}
                    {stocks.length === 0 && (
                      <div className="p-3 text-xs text-muted-foreground text-center">
                        Tidak ada bahan baku yang tersedia.
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                {selectedMaterial && (
                  <p className="text-xs text-muted-foreground">
                    Base unit: {selectedMaterial.base_unit} • Current stock: {selectedMaterial.current_stock} {selectedMaterial.base_unit}
                  </p>
                )}
              </div>

              <div className="grid gap-2 min-w-0">
                <Label>Type</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" className="w-full justify-between rounded-xl min-w-0">
                      <span className="truncate">{selectedType?.label ?? "Select type"}</span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]" align="start">
                    <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground/70">
                      Movement Type
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {MOVEMENT_TYPES.map((t) => (
                      <DropdownMenuItem key={t.value} onClick={() => setMovementType(t.value)} className="cursor-pointer">
                        {t.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <p className="text-xs text-muted-foreground">{selectedType?.desc}</p>
              </div>
            </div>

            {movementType === "ADJUSTMENT_OUT" && (
              <div className="bg-primary/5 border border-primary/20 text-xs p-3 rounded-xl text-foreground">
                <p className="leading-relaxed">
                  <span className="font-semibold text-primary">Strict FIFO: </span>
                  Pengurangan stok selalu memotong kuantitas dari batch yang <strong>paling lama</strong> (tertua) terlebih dahulu hingga habis, bukan stok terbaru.
                </p>
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2 min-w-0">
              <div className="grid gap-2 min-w-0">
                <Label htmlFor="qty">Quantity {selectedMaterial ? `(${selectedMaterial.base_unit})` : ""}</Label>
                <Input
                  id="qty"
                  type="number"
                  step="any"
                  min="0.0001"
                  placeholder={selectedMaterial ? `e.g. 1.5 (${selectedMaterial.base_unit})` : "e.g. 1.5"}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="rounded-xl font-mono"
                  required
                />
              </div>

              {movementType === "ADJUSTMENT_IN" && (
                <div className="grid gap-2 min-w-0">
                  <Label htmlFor="price-unit">Price / Unit (IDR)</Label>
                  <Input
                    id="price-unit"
                    type="number"
                    step="any"
                    min="1"
                    placeholder="e.g. 25000"
                    value={pricePerUnit}
                    onChange={(e) => setPricePerUnit(e.target.value)}
                    className="rounded-xl font-mono"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Required for calculating FIFO batch cost.</p>
                </div>
              )}
            </div>

            <div className="grid gap-2 min-w-0">
              <Label htmlFor="reason">Reason / Note</Label>
              <Input
                id="reason"
                placeholder="e.g. Stock damage, counting correction, expired item"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2 mt-2">
              <Button type="button" variant="outline" className="rounded-xl flex-1 sm:flex-initial" onClick={() => navigate("/inventory/stocks")}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl flex-1 sm:flex-initial">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Movement
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
