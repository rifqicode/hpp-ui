import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
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

type Material = { id: string; name: string; baseUnit: string }
type MovementType = "ADJUSTMENT_IN" | "ADJUSTMENT_OUT"

const MOCK_MATERIALS: Material[] = [
  { id: "mat-1", name: "Tepung Terigu", baseUnit: "kg" },
  { id: "mat-2", name: "Minyak Goreng", baseUnit: "L" },
]

const MOVEMENT_TYPES: { value: MovementType; label: string }[] = [
  { value: "ADJUSTMENT_IN", label: "Adjustment In" },
  { value: "ADJUSTMENT_OUT", label: "Adjustment Out" },
]

export default function MovementStockPage() {
  const navigate = useNavigate()

  const [materialId, setMaterialId] = React.useState<string>(MOCK_MATERIALS[0]?.id ?? "")
  const [movementType, setMovementType] = React.useState<MovementType>("ADJUSTMENT_IN")
  const [quantity, setQuantity] = React.useState<string>("")
  const [reason, setReason] = React.useState<string>("")

  const selectedMaterial = MOCK_MATERIALS.find((m) => m.id === materialId)
  const selectedType = MOVEMENT_TYPES.find((t) => t.value === movementType)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Placeholder for API call: POST /inventory/adjust
    navigate("/inventory/stocks")
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
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Record Inventory Movement</h1>
        <p className="text-sm text-muted-foreground">
          Record stock adjustments (In/Out) to correct inventory levels.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Movement Form</CardTitle>
          <CardDescription>Select material, type, and quantity to adjust stock.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-5 max-w-2xl">
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
                      <DropdownMenuItem key={m.id} onClick={() => setMaterialId(m.id)} className="cursor-pointer">
                        {m.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                  </DropdownMenu>
                  {selectedMaterial && (
                  <p className="text-xs text-muted-foreground">Base unit: {selectedMaterial.baseUnit}</p>
                  )}
                  </div>

                  <div className="grid gap-2">
                  <Label>Type</Label>
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
                    <DropdownMenuItem key={t.value} onClick={() => setMovementType(t.value)} className="cursor-pointer">
                      {t.label}
                    </DropdownMenuItem>
                  ))}
                  </DropdownMenuContent>
                  </DropdownMenu>
                  </div>
                  </div>

                  <div className="grid gap-2">
                  <Label htmlFor="qty">Quantity ({selectedMaterial?.baseUnit ?? "-"})</Label>
                  <Input
                  id="qty"
                  type="number"
                  step="0.0001"
                  placeholder={selectedMaterial ? `e.g. 1.5 (${selectedMaterial.baseUnit})` : "e.g. 1.5"}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="rounded-xl"
                  required
                  />
                  </div>
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                placeholder="e.g. Stock damage, counting error"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2 mt-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => navigate("/inventory/stocks")}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl">
                Save Movement
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
