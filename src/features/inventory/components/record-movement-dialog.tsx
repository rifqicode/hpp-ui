import * as React from "react"
import { ChevronDown, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { useMovementStock } from "../hooks/use-movement-stock"

type MovementType = "ADJUSTMENT_IN" | "ADJUSTMENT_OUT"

const MOVEMENT_TYPES: { value: MovementType; label: string; desc: string }[] = [
  { value: "ADJUSTMENT_IN", label: "Adjustment In (+)", desc: "Add stock correction (requires cost basis)" },
  { value: "ADJUSTMENT_OUT", label: "Adjustment Out (-)", desc: "Deducts stock starting from the oldest available batch (Strict FIFO)" },
]

interface RecordMovementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialStockId?: string
  onSuccess?: () => void
}

export function RecordMovementDialog({
  open,
  onOpenChange,
  initialStockId,
  onSuccess,
}: RecordMovementDialogProps) {
  const {
    stocks,
    loading,
    isSubmitting,
    error: hookError,
    handleRecordAdjustment,
  } = useMovementStock()

  const [selectedMaterialId, setSelectedMaterialId] = React.useState<string>("")
  const [movementType, setMovementType] = React.useState<MovementType>("ADJUSTMENT_IN")
  const [quantity, setQuantity] = React.useState<string>("")
  const [pricePerUnit, setPricePerUnit] = React.useState<string>("")
  const [reason, setReason] = React.useState<string>("")
  const [submitError, setSubmitError] = React.useState<string>("")

  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSubmitError("")
      setQuantity("")
      setPricePerUnit("")
      setReason("")
      setSelectedMaterialId("")
    }
    onOpenChange(isOpen)
  }

  const materialId = selectedMaterialId || initialStockId || stocks[0]?.id || ""
  const selectedMaterial = stocks.find((m) => m.id === materialId)
  const selectedType = MOVEMENT_TYPES.find((t) => t.value === movementType)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError("")

    if (!materialId) {
      setSubmitError("Please select a material")
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
      handleDialogChange(false)
      onSuccess?.()
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Failed to record adjustment")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Inventory Movement</DialogTitle>
          <DialogDescription>
            Record stock adjustments (In/Out) to correct inventory levels.
          </DialogDescription>
        </DialogHeader>

        {(hookError || submitError) && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-xl border border-destructive/20">
            {submitError || hookError}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mb-2 text-primary" />
            <p className="text-xs">Memuat data bahan baku...</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="grid gap-4 py-1">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Bahan Baku</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={Boolean(initialStockId)}>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between rounded-xl"
                    >
                      <span className={cn("truncate", !selectedMaterial && "text-muted-foreground")}>
                        {selectedMaterial ? selectedMaterial.name : "Pilih bahan baku"}
                      </span>
                      {!initialStockId && <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]" align="start">
                    <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground/70">
                      Bahan Baku
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {stocks.map((m) => (
                      <DropdownMenuItem
                        key={m.id}
                        onClick={() => setSelectedMaterialId(m.id)}
                        className="cursor-pointer"
                      >
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
                    Current: {selectedMaterial.current_stock} {selectedMaterial.base_unit}
                  </p>
                )}
              </div>

              <div className="grid gap-1.5">
                <Label>Movement Type</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" className="w-full justify-between rounded-xl">
                      <span className="truncate">{selectedType?.label ?? "Select type"}</span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]" align="start">
                    <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground/70">
                      Movement Type
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {MOVEMENT_TYPES.map((t) => (
                      <DropdownMenuItem
                        key={t.value}
                        onClick={() => setMovementType(t.value)}
                        className="cursor-pointer"
                      >
                        {t.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {movementType === "ADJUSTMENT_OUT" && (
              <div className="bg-primary/5 border border-primary/20 text-xs p-3 rounded-xl text-foreground">
                <span className="font-semibold text-primary">Strict FIFO:</span> Pengurangan stok selalu memotong kuantitas dari batch yang <strong>paling lama</strong> terlebih dahulu hingga habis.
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="movement-qty">
                  Quantity {selectedMaterial ? `(${selectedMaterial.base_unit})` : ""}
                </Label>
                <Input
                  id="movement-qty"
                  type="number"
                  step="any"
                  min="0.0001"
                  placeholder="e.g. 1.5"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="rounded-xl font-mono"
                  required
                />
              </div>

              {movementType === "ADJUSTMENT_IN" && (
                <div className="grid gap-1.5">
                  <Label htmlFor="movement-price">Price / Unit (IDR)</Label>
                  <Input
                    id="movement-price"
                    type="number"
                    step="any"
                    min="1"
                    placeholder="e.g. 25000"
                    value={pricePerUnit}
                    onChange={(e) => setPricePerUnit(e.target.value)}
                    className="rounded-xl font-mono"
                    required
                  />
                </div>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="movement-reason">Reason / Note</Label>
              <Input
                id="movement-reason"
                placeholder="e.g. Stock damage, counting correction, expired item"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Movement
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
