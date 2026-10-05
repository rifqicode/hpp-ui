import * as React from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, ChevronDown } from "lucide-react"

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

import { supplierService } from "@/features/suppliers/services/supplier-service"
import type { Supplier as SupplierType } from "@/features/suppliers/types"

type Material = { id: string; name: string; baseUnit: string }

const MOCK_MATERIALS: Material[] = [
  { id: "mat-1", name: "Tepung Terigu", baseUnit: "kg" },
  { id: "mat-2", name: "Minyak Goreng", baseUnit: "L" },
  { id: "mat-3", name: "Gula Pasir", baseUnit: "kg" },
  { id: "mat-4", name: "Ragi", baseUnit: "g" },
]

const BASE_UNIT_OPTIONS = ["kg", "g", "L", "ml", "pcs"] as const

export default function PurchaseStockPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [suppliersList, setSuppliersList] = React.useState<SupplierType[]>([])

  React.useEffect(() => {
    supplierService.getSuppliers().then((data) => {
      setSuppliersList(data)
    })
  }, [])

  const materialFromQuery = searchParams.get("materialId")
  const supplierFromQuery = searchParams.get("supplierId")

  const initialMaterialId =
    (materialFromQuery && MOCK_MATERIALS.some((m) => m.id === materialFromQuery)
      ? materialFromQuery
      : undefined) ?? (MOCK_MATERIALS[0]?.id ?? "")

  const [materialId, setMaterialId] = React.useState<string>(initialMaterialId)
  const [supplierId, setSupplierId] = React.useState<string | null>(supplierFromQuery || null)
  const [baseUnit, setBaseUnit] = React.useState<string>(() => {
    const mat = MOCK_MATERIALS.find((m) => m.id === initialMaterialId)
    return mat?.baseUnit ?? ""
  })
  const [quantity, setQuantity] = React.useState<string>("")
  const [totalPrice, setTotalPrice] = React.useState<string>("")

  const selectedMaterial = MOCK_MATERIALS.find((m) => m.id === materialId)
  const selectedSupplier = supplierId ? suppliersList.find((s) => s.id === supplierId) : undefined

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Placeholder until API wiring exists.
    // Next step: call POST /inventory/purchase and then navigate back.
    navigate("/inventory/stocks")
  }

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in fade-in duration-500">
      {/* Header: keep back button separate from title */}
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" className="rounded-xl">
          <Link to="/inventory/stocks">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-0.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Add New Material</h1>
        <p className="text-sm text-muted-foreground">
          Increase stock by adding a new purchase lot. Supplier is optional.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Material Form</CardTitle>
          <CardDescription>Quantity and total price are required. Supplier is optional.</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="purchase-form" onSubmit={onSubmit} className="grid gap-5 max-w-2xl">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Material</Label>
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
                    {MOCK_MATERIALS.map((m) => (
                      <DropdownMenuItem
                        key={m.id}
                        onClick={() => {
                          setMaterialId(m.id)
                          setBaseUnit(m.baseUnit)
                        }}
                        className="cursor-pointer"
                      >
                        {m.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {selectedMaterial && (
                  <p className="text-xs text-muted-foreground">Default base unit: {selectedMaterial.baseUnit}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label>Base Unit</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" className="w-full justify-between rounded-xl">
                      <span className={cn("truncate", !baseUnit && "text-muted-foreground")}>
                        {baseUnit || "Select unit"}
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]" align="start">
                    <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground/70">
                      Units
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {BASE_UNIT_OPTIONS.map((u) => (
                      <DropdownMenuItem key={u} onClick={() => setBaseUnit(u)} className="cursor-pointer">
                        {u}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <p className="text-xs text-muted-foreground">Use the unit you are entering in the quantity field.</p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="qty">Quantity</Label>
                <Input
                  id="qty"
                  inputMode="decimal"
                  placeholder={baseUnit ? `e.g. 10 (${baseUnit})` : "e.g. 10"}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="price">Total Price</Label>
                <Input
                  id="price"
                  inputMode="numeric"
                  placeholder="e.g. 250000"
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Supplier (Optional)</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-between rounded-xl">
                    <span className={cn("truncate", !selectedSupplier && "text-muted-foreground")}>
                      {selectedSupplier ? selectedSupplier.name : "No supplier"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]" align="start">
                  <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground/70">
                    Supplier
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSupplierId(null)} className="cursor-pointer">
                    No supplier
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {suppliersList.map((s) => (
                    <DropdownMenuItem key={s.id} onClick={() => setSupplierId(s.id)} className="cursor-pointer">
                      {s.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer text-primary font-medium">
                    <Link to="/inventory/suppliers">+ Tambah Supplier Baru</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <p className="text-xs text-muted-foreground">Pilih supplier atau kosongkan jika dibeli dari pasar/toko umum.</p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => navigate("/inventory/stocks")}
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl">
                Save Material
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
