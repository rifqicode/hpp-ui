import * as React from "react"
import { Link } from "react-router-dom"
import { ChevronDown, Loader2, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { usePurchaseStock } from "../hooks/use-purchase-stock"

const BASE_UNITS = [
  { value: "kg", label: "Kilogram (kg)" },
  { value: "g", label: "Gram (g)" },
  { value: "mg", label: "Miligram (mg)" },
  { value: "L", label: "Liter (L)" },
  { value: "ml", label: "Mililiter (ml)" },
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "pack", label: "Pack" },
  { value: "box", label: "Box" },
  { value: "bottle", label: "Bottle" },
  { value: "can", label: "Can" },
] as const

function formatCurrencyIdr(value: number) {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value)
}

interface RecordPurchaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialStockId?: string
  initialSupplierId?: string
  onSuccess?: () => void
}

export function RecordPurchaseDialog({
  open,
  onOpenChange,
  initialStockId,
  initialSupplierId,
  onSuccess,
}: RecordPurchaseDialogProps) {
  const {
    stocks,
    suppliers,
    loading,
    isSubmitting,
    error: hookError,
    handleCreateStock,
    handleRecordPurchase,
  } = usePurchaseStock()

  const [selectedMaterialId, setSelectedMaterialId] = React.useState<string>("")
  const [selectedSupplierId, setSelectedSupplierId] = React.useState<string>("")
  const [quantity, setQuantity] = React.useState<string>("")
  const [totalPrice, setTotalPrice] = React.useState<string>("")
  const [expiredAt, setExpiredAt] = React.useState<string>("")
  const [submitError, setSubmitError] = React.useState<string>("")

  // Quick Create Material Modal state
  const [isCreateMatOpen, setIsCreateMatOpen] = React.useState(false)
  const [newMatName, setNewMatName] = React.useState("")
  const [newMatUnit, setNewMatUnit] = React.useState("kg")
  const [newMatMethod, setNewMatMethod] = React.useState<"FIFO" | "FEFO">("FIFO")
  const [isCreatingMat, setIsCreatingMat] = React.useState(false)
  const [createMatError, setCreateMatError] = React.useState("")

  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSubmitError("")
      setQuantity("")
      setTotalPrice("")
      setExpiredAt("")
      setSelectedMaterialId("")
      setSelectedSupplierId("")
    }
    onOpenChange(isOpen)
  }

  const materialId = selectedMaterialId || initialStockId || stocks[0]?.id || ""
  const supplierId = selectedSupplierId || initialSupplierId || suppliers[0]?.id || ""

  const selectedMaterial = stocks.find((m) => m.id === materialId)
  const selectedSupplier = suppliers.find((s) => s.id === supplierId)

  const isFefo = selectedMaterial?.inventory_method === "FEFO"

  const qtyNum = parseFloat(quantity) || 0
  const totalNum = parseFloat(totalPrice) || 0
  const pricePerUnit = qtyNum > 0 ? totalNum / qtyNum : 0

  const handleQuickCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMatName.trim()) {
      setCreateMatError("Nama bahan baku wajib diisi")
      return
    }
    setIsCreatingMat(true)
    setCreateMatError("")
    try {
      const created = await handleCreateStock({
        name: newMatName.trim(),
        base_unit: newMatUnit.trim(),
        inventory_method: newMatMethod,
      })
      setSelectedMaterialId(created.id)
      setIsCreateMatOpen(false)
      setNewMatName("")
      setNewMatMethod("FIFO")
    } catch (err: unknown) {
      setCreateMatError(err instanceof Error ? err.message : "Failed to create material")
    } finally {
      setIsCreatingMat(false)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError("")

    if (!materialId) {
      setSubmitError("Pilih bahan baku terlebih dahulu.")
      return
    }

    if (qtyNum <= 0) {
      setSubmitError("Quantity must be greater than 0.")
      return
    }

    if (totalNum <= 0) {
      setSubmitError("Total price must be greater than 0.")
      return
    }

    if (isFefo && !expiredAt) {
      setSubmitError("Tanggal kadaluwarsa wajib diisi untuk bahan baku metode FEFO.")
      return
    }

    try {
      await handleRecordPurchase({
        stock_id: materialId,
        supplier_id: supplierId || undefined,
        quantity: qtyNum,
        total_price: totalNum,
        expired_at: expiredAt ? new Date(expiredAt).toISOString() : undefined,
      })
      handleDialogChange(false)
      onSuccess?.()
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Failed to record purchase")
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Stock Purchase</DialogTitle>
            <DialogDescription>
              Increase material inventory by recording a purchase lot from a supplier.
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
              <p className="text-xs">Memuat data bahan baku dan supplier...</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="grid gap-4 py-1">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Material Dropdown */}
                <div className="grid gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label>Bahan Baku</Label>
                    {!initialStockId && (
                      <button
                        type="button"
                        onClick={() => setIsCreateMatOpen(true)}
                        className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-0.5"
                      >
                        <Plus className="h-3 w-3" /> Tambah Baru
                      </button>
                    )}
                  </div>

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
                          Tidak ada bahan baku yang ditemukan.
                        </div>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {selectedMaterial && (
                    <p className="text-xs text-muted-foreground">
                      Unit: {selectedMaterial.base_unit} • Current: {selectedMaterial.current_stock}
                    </p>
                  )}
                </div>

                {/* Supplier Dropdown */}
                <div className="grid gap-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Label>Supplier</Label>
                      <span className="text-[11px] text-muted-foreground">(Optional)</span>
                    </div>
                    <Link
                      to="/inventory/suppliers"
                      onClick={() => onOpenChange(false)}
                      className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-0.5"
                    >
                      <Plus className="h-3 w-3" /> Add
                    </Link>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="outline" className="w-full justify-between rounded-xl">
                        <span className={cn("truncate", !selectedSupplier && "text-muted-foreground")}>
                          {selectedSupplier ? selectedSupplier.name : "None / Direct Purchase"}
                        </span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]" align="start">
                      <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground/70">
                        Suppliers
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setSelectedSupplierId("")}
                        className="cursor-pointer text-muted-foreground italic"
                      >
                        None / Direct Purchase (Tanpa Supplier)
                      </DropdownMenuItem>
                      {suppliers.map((s) => (
                        <DropdownMenuItem
                          key={s.id}
                          onClick={() => setSelectedSupplierId(s.id)}
                          className="cursor-pointer"
                        >
                          {s.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="purchase-qty">
                    Quantity {selectedMaterial ? `(${selectedMaterial.base_unit})` : ""}
                  </Label>
                  <Input
                    id="purchase-qty"
                    type="number"
                    step="any"
                    min="0.0001"
                    placeholder="e.g. 10"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="rounded-xl font-mono"
                    required
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="purchase-price">Total Price (IDR)</Label>
                  <Input
                    id="purchase-price"
                    type="number"
                    step="any"
                    min="1"
                    placeholder="e.g. 250000"
                    value={totalPrice}
                    onChange={(e) => setTotalPrice(e.target.value)}
                    className="rounded-xl font-mono"
                    required
                  />
                </div>
              </div>

              {/* Expired Date Input */}
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="purchase-expired">Tanggal Kadaluwarsa</Label>
                    <span className={cn("text-[11px]", isFefo ? "text-destructive font-semibold" : "text-muted-foreground")}>
                      {isFefo ? "* (Wajib untuk FEFO)" : "(Opsional untuk FIFO)"}
                    </span>
                  </div>
                  {selectedMaterial && (
                    <Badge variant={isFefo ? "warning" : "secondary"} className="text-[10px] font-mono">
                      Metode: {selectedMaterial.inventory_method || "FIFO"}
                    </Badge>
                  )}
                </div>
                <Input
                  id="purchase-expired"
                  type="date"
                  value={expiredAt}
                  onChange={(e) => setExpiredAt(e.target.value)}
                  className="rounded-xl font-mono"
                  required={isFefo}
                />
                <p className="text-xs text-muted-foreground">
                  {isFefo
                    ? "Bahan baku FEFO akan dikonsumsi berdasarkan urutan tanggal kedaluwarsa terdekat."
                    : "Kosongkan jika bahan baku tidak memiliki tanggal kedaluwarsa."}
                </p>
              </div>

              {qtyNum > 0 && totalNum > 0 && (
                <div className="bg-muted/40 p-3 rounded-xl border border-border flex items-center justify-between text-xs sm:text-sm">
                  <div>
                    <span className="text-muted-foreground">Unit Cost:</span>
                    <div className="font-semibold text-foreground font-mono">
                      Rp {formatCurrencyIdr(pricePerUnit)} / {selectedMaterial?.base_unit || "unit"}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-muted-foreground">Batch Total:</span>
                    <div className="font-semibold text-primary font-mono">
                      Rp {formatCurrencyIdr(totalNum)}
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter className="pt-2 gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Purchase
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Nested Quick Add Material Modal */}
      <Dialog open={isCreateMatOpen} onOpenChange={setIsCreateMatOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Bahan Baku Baru</DialogTitle>
            <DialogDescription>Masukkan nama bahan baku dan satuan dasar.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleQuickCreateMaterial} className="space-y-4 py-2">
            {createMatError && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                {createMatError}
              </div>
            )}
            <div className="space-y-2">
              <Label>Nama Bahan Baku</Label>
              <Input
                placeholder="Contoh: Biji Kopi Arabika"
                value={newMatName}
                onChange={(e) => setNewMatName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Base Unit</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between rounded-xl"
                  >
                    <span>
                      {BASE_UNITS.find((u) => u.value === newMatUnit)?.label ?? newMatUnit}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]" align="start">
                  <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground/70">
                    Base Units
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {BASE_UNITS.map((u) => (
                    <DropdownMenuItem
                      key={u.value}
                      onClick={() => setNewMatUnit(u.value)}
                      className="cursor-pointer"
                    >
                      {u.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="space-y-2">
              <Label>Metode Pengelolaan Stok</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between rounded-xl"
                  >
                    <span>
                      {newMatMethod === "FEFO"
                        ? "FEFO (First Expired, First Out)"
                        : "FIFO (First In, First Out)"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]" align="start">
                  <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground/70">
                    Metode Inventaris
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setNewMatMethod("FIFO")}
                    className="cursor-pointer flex flex-col items-start gap-0.5"
                  >
                    <span className="font-semibold">FIFO (First In, First Out)</span>
                    <span className="text-[11px] text-muted-foreground">Untuk bahan umum/kering (tgl kadaluwarsa opsional)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setNewMatMethod("FEFO")}
                    className="cursor-pointer flex flex-col items-start gap-0.5"
                  >
                    <span className="font-semibold">FEFO (First Expired, First Out)</span>
                    <span className="text-[11px] text-muted-foreground">Untuk bahan mudah basi/segar (wajib isi tgl kadaluwarsa)</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateMatOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreatingMat}>
                {isCreatingMat && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
