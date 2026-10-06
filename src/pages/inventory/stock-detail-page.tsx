import { Link, useParams } from "react-router-dom"
import { ArrowLeft, Package, Layers, RotateCcw } from "lucide-react"

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

type Material = {
  id: string
  name: string
  baseUnit: string
  current: number
}

type Batch = {
  id: string
  initial: number
  remaining: number
  pricePerUnit: number
}

type MovementType = "PURCHASE" | "ADJUSTMENT_IN" | "ADJUSTMENT_OUT" | "PRODUCTION_CONSUMPTION"

type Movement = {
  id: string
  type: MovementType
  quantity: number
  reason: string
  createdAt: string
}

const MOCK_MATERIALS: Material[] = []

const MOCK_BATCHES_BY_MATERIAL: Record<string, Batch[]> = {}

const MOCK_MOVEMENTS_BY_MATERIAL: Record<string, Movement[]> = {
  "mat-1": [
    { id: "m-1", type: "PURCHASE", quantity: 10, reason: "Purchase: PT Sumber Pangan", createdAt: "2026-05-12 10:05" },
    { id: "m-2", type: "PRODUCTION_CONSUMPTION", quantity: 13.8, reason: "Consumption: Batch Produksi #42", createdAt: "2026-05-12 13:20" },
    { id: "m-3", type: "ADJUSTMENT_IN", quantity: 5, reason: "Adjustment: Stock count correction", createdAt: "2026-05-12 16:45" },
  ],
  "mat-2": [
    { id: "m-4", type: "PURCHASE", quantity: 2, reason: "Purchase: CV Grosir Jaya", createdAt: "2026-05-11 09:10" },
    { id: "m-5", type: "ADJUSTMENT_OUT", quantity: 1.5, reason: "Adjustment: Spillage", createdAt: "2026-05-11 18:05" },
  ],
  "mat-3": [
    { id: "m-6", type: "PURCHASE", quantity: 10, reason: "Purchase: Toko Bahan Kue 88", createdAt: "2026-05-10 11:30" },
    { id: "m-7", type: "PRODUCTION_CONSUMPTION", quantity: 5, reason: "Consumption: Batch Produksi #41", createdAt: "2026-05-11 07:55" },
  ],
  "mat-4": [
    { id: "m-8", type: "ADJUSTMENT_OUT", quantity: 250, reason: "Adjustment: Expired", createdAt: "2026-05-09 15:40" },
  ],
}

function formatQty(value: number, unit: string) {
  const fixed = Number.isInteger(value) ? value.toString() : value.toFixed(2)
  return `${fixed} ${unit}`
}

function formatCurrencyIdr(value: number) {
  const formatted = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value)
  return `Rp ${formatted}`
}

function movementLabel(type: MovementType) {
  if (type === "PURCHASE") return "In"
  if (type === "ADJUSTMENT_IN") return "Adjustment (+)"
  if (type === "ADJUSTMENT_OUT") return "Adjustment (-)"
  return "Out"
}

function movementVariant(type: MovementType) {
  if (type === "PURCHASE") return "success" as const
  if (type === "ADJUSTMENT_IN") return "warning" as const
  if (type === "ADJUSTMENT_OUT") return "warning" as const
  return "destructive" as const
}

export default function StockDetailPage() {
  const { materialId } = useParams()

  const material = MOCK_MATERIALS.find((m) => m.id === materialId) ?? MOCK_MATERIALS[0]
  const batches = (material?.id ? MOCK_BATCHES_BY_MATERIAL[material.id] : undefined) ?? []
  const movements = (material?.id ? MOCK_MOVEMENTS_BY_MATERIAL[material.id] : undefined) ?? []

  const activeBatches = batches.filter((b) => b.remaining > 0)
  const lastMovement = movements[0]

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in fade-in duration-500">
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{material?.name ?? "Stock Detail"}</h1>
          <p className="text-sm text-muted-foreground">Base unit: {material?.baseUnit ?? "-"}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-info bg-info/10">
          <CardHeader className="pb-2">
            <CardDescription className="text-info flex items-center gap-2">
              <Package className="h-4 w-4" />
              Current Stock
            </CardDescription>
            <CardTitle className="text-2xl font-mono">
              {material ? formatQty(material.current, material.baseUnit) : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-success bg-success/10">
          <CardHeader className="pb-2">
            <CardDescription className="text-success flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Active Batches
            </CardDescription>
            <CardTitle className="text-2xl font-mono">{activeBatches.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-warning bg-warning/10">
          <CardHeader className="pb-2">
            <CardDescription className="text-warning flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Last Movement
            </CardDescription>
            <CardTitle className="text-base font-medium">
              {lastMovement ? `${movementLabel(lastMovement.type)} • ${lastMovement.createdAt}` : "—"}
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
                      <TableHead className="text-right">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeBatches.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="py-2 font-mono text-xs">{b.id}</TableCell>
                        <TableCell className="py-2 font-mono text-sm">{material ? formatQty(b.initial, material.baseUnit) : b.initial}</TableCell>
                        <TableCell className="py-2 font-mono text-sm">{material ? formatQty(b.remaining, material.baseUnit) : b.remaining}</TableCell>
                        <TableCell className="py-2 text-right font-mono text-sm">{formatCurrencyIdr(b.pricePerUnit)}</TableCell>
                      </TableRow>
                    ))}

                    {activeBatches.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
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
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>
                          <Badge variant={movementVariant(m.type)}>{movementLabel(m.type)}</Badge>
                        </TableCell>
                        <TableCell className="font-mono">
                          {material ? formatQty(m.quantity, material.baseUnit) : m.quantity}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{m.reason}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{m.createdAt}</TableCell>
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
    </div>
  )
}
