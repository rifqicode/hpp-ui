import * as React from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, ChevronDown, Loader2, Plus } from "lucide-react"

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { usePurchaseStock } from "@/features/inventory/hooks/use-purchase-stock"

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

export default function PurchaseStockPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const {
    stocks,
    suppliers,
    loading,
    isSubmitting,
    error: hookError,
    handleCreateStock,
    handleRecordPurchase,
  } = usePurchaseStock()

  const materialFromQuery = searchParams.get("materialId")
  const supplierFromQuery = searchParams.get("supplierId")

  const [quantity, setQuantity] = React.useState<string>("")
  const [totalPrice, setTotalPrice] = React.useState<string>("")
  const [submitError, setSubmitError] = React.useState<string>("")

  // Quick Create Material Modal state
  const [isCreateMatOpen, setIsCreateMatOpen] = React.useState(false)
  const [newMatName, setNewMatName] = React.useState("")
  const [newMatUnit, setNewMatUnit] = React.useState("kg")
  const [isCreatingMat, setIsCreatingMat] = React.useState(false)
  const [createMatError, setCreateMatError] = React.useState("")

  const [userSelectedMaterialId, setUserSelectedMaterialId] = React.useState<string>("")
  const [userSelectedSupplierId, setUserSelectedSupplierId] = React.useState<string>("")

  const materialId = userSelectedMaterialId || (materialFromQuery && stocks.some((s) => s.id === materialFromQuery) ? materialFromQuery : "") || stocks[0]?.id || ""
  const supplierId = userSelectedSupplierId || (supplierFromQuery && suppliers.some((s) => s.id === supplierFromQuery) ? supplierFromQuery : "") || suppliers[0]?.id || ""

  const selectedMaterial = stocks.find((m) => m.id === materialId)
  const selectedSupplier = suppliers.find((s) => s.id === supplierId)

  const qtyNum = parseFloat(quantity) || 0
  const totalNum = parseFloat(totalPrice) || 0
  const pricePerUnit = qtyNum > 0 ? totalNum / qtyNum : 0

  const handleQuickCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMatName.trim()) {
      setCreateMatError("Material name is required")
      return
    }
    setIsCreatingMat(true)
    setCreateMatError("")
    try {
      const created = await handleCreateStock({
        name: newMatName.trim(),
        base_unit: newMatUnit.trim(),
      })
      setUserSelectedMaterialId(created.id)
      setIsCreateMatOpen(false)
      setNewMatName("")
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
      setSubmitError("Please select a material or create a new one.")
      return
    }

    if (!supplierId) {
      setSubmitError("Supplier is required. Please select or add a supplier.")
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

    try {
      await handleRecordPurchase({
        stock_id: materialId,
        supplier_id: supplierId,
        quantity: qtyNum,
        total_price: totalNum,
      })
      navigate("/inventory/stocks")
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Failed to record purchase")
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-3 text-primary" />
        <p className="text-sm">Loading purchase form dependencies...</p>
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

      <div className="flex flex-col gap-0.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Record Stock Purchase</h1>
        <p className="text-sm text-muted-foreground">
          Increase material inventory by recording a purchase lot from a supplier.
        </p>
      </div>

      {(hookError || submitError) && (
        <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-xl border border-destructive/20 max-w-2xl">
          {submitError || hookError}
        </div>
      )}

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Purchase Details</CardTitle>
          <CardDescription>Enter quantity, total cost, and select the material & supplier.</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="purchase-form" onSubmit={onSubmit} className="grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Material Dropdown */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Material</Label>
                  <Dialog open={isCreateMatOpen} onOpenChange={setIsCreateMatOpen}>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" /> New Material
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add New Material</DialogTitle>
                        <DialogDescription>Define a new material name and base unit.</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleQuickCreateMaterial} className="space-y-4 py-2">
                        {createMatError && (
                          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                            {createMatError}
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label>Material Name</Label>
                          <Input
                            placeholder="e.g. Arabica Beans"
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
                                  {BASE_UNITS.find((u) => u.value === newMatUnit)?.label ?? newMatUnit ?? "Select base unit"}
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
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" className="w-full justify-between rounded-xl">
                      <span className={cn("truncate", !selectedMaterial && "text-muted-foreground")}>
                        {selectedMaterial ? selectedMaterial.name : "Select material"}
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]" align="start">
                    <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground/70">
                      Materials
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {stocks.map((m) => (
                      <DropdownMenuItem
                        key={m.id}
                        onClick={() => setUserSelectedMaterialId(m.id)}
                        className="cursor-pointer"
                      >
                        {m.name} ({m.base_unit})
                      </DropdownMenuItem>
                    ))}
                    {stocks.length === 0 && (
                      <div className="p-3 text-xs text-muted-foreground text-center">
                        No materials found. Create one first.
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

              {/* Supplier Dropdown */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Supplier</Label>
                  <Link to="/inventory/suppliers" className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1">
                    <Plus className="h-3 w-3" /> New Supplier
                  </Link>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" className="w-full justify-between rounded-xl">
                      <span className={cn("truncate", !selectedSupplier && "text-muted-foreground")}>
                        {selectedSupplier ? selectedSupplier.name : "Select supplier"}
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]" align="start">
                    <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground/70">
                      Suppliers
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {suppliers.map((s) => (
                      <DropdownMenuItem key={s.id} onClick={() => setUserSelectedSupplierId(s.id)} className="cursor-pointer">
                        {s.name}
                      </DropdownMenuItem>
                    ))}
                    {suppliers.length === 0 && (
                      <div className="p-3 text-xs text-muted-foreground text-center">
                        No suppliers found. Please add a supplier first.
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                {selectedSupplier && (
                  <p className="text-xs text-muted-foreground">Supplier: {selectedSupplier.name}</p>
                )}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="qty">
                  Quantity {selectedMaterial ? `(${selectedMaterial.base_unit})` : ""}
                </Label>
                <Input
                  id="qty"
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

              <div className="grid gap-2">
                <Label htmlFor="price">Total Purchase Price (IDR)</Label>
                <Input
                  id="price"
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

            {/* Calculated summary card */}
            {qtyNum > 0 && totalNum > 0 && (
              <div className="bg-muted/40 p-4 rounded-xl border border-border flex items-center justify-between text-sm">
                <div>
                  <span className="text-muted-foreground">Calculated Unit Cost:</span>
                  <div className="font-semibold text-foreground font-mono text-base">
                    Rp {formatCurrencyIdr(pricePerUnit)} / {selectedMaterial?.base_unit || "unit"}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground">Total Batch Value:</span>
                  <div className="font-semibold text-primary font-mono text-base">
                    Rp {formatCurrencyIdr(totalNum)}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => navigate("/inventory/stocks")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Record Purchase
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
