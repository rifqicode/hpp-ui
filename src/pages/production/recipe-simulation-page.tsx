import * as React from "react"
import { Link } from "react-router-dom"
import {
  Calculator,
  TrendingUp,
  Plus,
  Trash2,
  RotateCcw,
  Copy,
  Check,
  Sparkles,
  Percent,
  Boxes,
  FileText,
  Info,
  Scale,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { recipeService } from "@/features/recipes/services/recipe-service"
import type { Product } from "@/features/recipes/types"

function formatCurrencyIdr(val: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val)
}

interface CustomIngredient {
  id: string
  name: string
  packagePrice: number // Harga beli 1 bungkus/kemasan
  packageSize: number // Isi kemasan dalam gram/ml/pcs
  packageUnit: string // g, ml, pcs, butir
  usedQuantity: number // Jumlah dipakai per 1 batch
  wastePercentage: number // % susut / terbuang (0 - 20%)
}

interface CustomOverhead {
  id: string
  name: string
  amount: number // biaya per batch
}

const DEFAULT_INGREDIENT: CustomIngredient = {
  id: "ing-1",
  name: "",
  packagePrice: 0,
  packageSize: 1000,
  packageUnit: "g",
  usedQuantity: 0,
  wastePercentage: 0,
}

const DEFAULT_OVERHEADS: CustomOverhead[] = [
  { id: "oh-1", name: "Kemasan & Label", amount: 0 },
  { id: "oh-2", name: "Tenaga Kerja (Upah)", amount: 0 },
  { id: "oh-3", name: "Gas, Listrik & Air", amount: 0 },
]

export default function RecipeSimulationPage() {
  const [activeTab, setActiveTab] = React.useState<string>("sandbox")

  // Sandbox Mode State
  const [productName, setProductName] = React.useState<string>("")
  const [yieldUnits, setYieldUnits] = React.useState<number | "">("")
  const [unitName, setUnitName] = React.useState<string>("")
  const [ingredients, setIngredients] = React.useState<CustomIngredient[]>([{ ...DEFAULT_INGREDIENT }])

  // Dynamic Overhead Costs
  const [overheads, setOverheads] = React.useState<CustomOverhead[]>([...DEFAULT_OVERHEADS])

  // Pricing Strategy State
  const [pricingMode, setPricingMode] = React.useState<"margin" | "markup" | "manual">("margin")
  const [targetMargin, setTargetMargin] = React.useState<number>(50) // %
  const [targetMarkup, setTargetMarkup] = React.useState<number>(100) // %
  const [manualPrice, setManualPrice] = React.useState<number>(0)

  // Recipe Integration (Tab 2)
  const [savedProducts, setSavedProducts] = React.useState<Product[]>([])
  const [selectedProductId, setSelectedProductId] = React.useState<string>("")
  const [sensitivityMaterialPct, setSensitivityMaterialPct] = React.useState<number>(0) // -20% to +50%
  const [sensitivityYieldPct, setSensitivityYieldPct] = React.useState<number>(0) // -30% to +30%

  // Copy Feedback
  const [copied, setCopied] = React.useState<boolean>(false)

  // Load Saved Products from recipeService
  React.useEffect(() => {
    let ignore = false
    recipeService
      .getProducts()
      .then((data) => {
        if (!ignore) {
          setSavedProducts(data)
          if (data.length > 0) {
            setSelectedProductId(data[0].id)
          }
        }
      })
      .catch((err) => console.error("Failed to fetch recipes:", err))

    return () => {
      ignore = true
    }
  }, [])

  // Selected Saved Product
  const selectedSavedProduct = React.useMemo(() => {
    return savedProducts.find((p) => p.id === selectedProductId) || null
  }, [savedProducts, selectedProductId])

  // ===================== CALCULATIONS (SANDBOX) =====================
  const ingredientCalculations = React.useMemo(() => {
    return ingredients.map((ing) => {
      const unitCost = ing.packageSize > 0 ? ing.packagePrice / ing.packageSize : 0
      const baseCost = unitCost * ing.usedQuantity
      const wasteCost = baseCost * ((ing.wastePercentage || 0) / 100)
      const totalCost = baseCost + wasteCost

      return {
        ...ing,
        unitCost,
        baseCost,
        wasteCost,
        totalCost,
      }
    })
  }, [ingredients])

  const totalRawMaterialCost = React.useMemo(() => {
    return ingredientCalculations.reduce((acc, curr) => acc + curr.totalCost, 0)
  }, [ingredientCalculations])

  const totalBatchOverhead = React.useMemo(() => {
    return overheads.reduce((acc, curr) => acc + (curr.amount || 0), 0)
  }, [overheads])

  const totalProductionCost = totalRawMaterialCost + totalBatchOverhead

  const numericYield = typeof yieldUnits === "number" && yieldUnits > 0 ? yieldUnits : 1
  const safeYield = numericYield
  const hppRawMaterialPerUnit = Math.round(totalRawMaterialCost / safeYield)
  const hppOverheadPerUnit = Math.round(totalBatchOverhead / safeYield)
  const hppTotalPerUnit = Math.round(totalProductionCost / safeYield)

  // Pricing Calculations
  const calculatedSellingPrice = React.useMemo(() => {
    if (pricingMode === "manual") {
      return manualPrice
    }
    if (pricingMode === "markup") {
      return Math.round(hppTotalPerUnit * (1 + targetMarkup / 100))
    }
    // Target Margin Formula: Price = HPP / (1 - Margin%)
    const safeMargin = Math.min(95, Math.max(1, targetMargin))
    return Math.round(hppTotalPerUnit / (1 - safeMargin / 100))
  }, [pricingMode, manualPrice, targetMarkup, targetMargin, hppTotalPerUnit])

  const grossProfitPerUnit = calculatedSellingPrice - hppTotalPerUnit
  const actualMarginPercent =
    calculatedSellingPrice > 0
      ? Math.round((grossProfitPerUnit / calculatedSellingPrice) * 1000) / 10
      : 0

  // ===================== SAVED RECIPE SIMULATION (TAB 2) =====================
  const savedRecipeSimulation = React.useMemo(() => {
    if (!selectedSavedProduct) return null

    const baseHpp = selectedSavedProduct.latestHpp || 0
    const baseSellingPrice = selectedSavedProduct.sellingPrice || 0

    // Adjusted values
    const adjustedHpp = Math.round(baseHpp * (1 + sensitivityMaterialPct / 100))
    const simulatedYieldScale = 1 + sensitivityYieldPct / 100
    const finalSimulatedHpp = simulatedYieldScale > 0 ? Math.round(adjustedHpp / simulatedYieldScale) : adjustedHpp

    const baseProfit = baseSellingPrice - baseHpp
    const baseMargin = baseSellingPrice > 0 ? (baseProfit / baseSellingPrice) * 100 : 0

    const simulatedProfit = baseSellingPrice - finalSimulatedHpp
    const simulatedMargin = baseSellingPrice > 0 ? (simulatedProfit / baseSellingPrice) * 100 : 0
    const marginDrop = baseMargin - simulatedMargin

    return {
      baseHpp,
      baseSellingPrice,
      baseMargin: Math.round(baseMargin * 10) / 10,
      finalSimulatedHpp,
      simulatedProfit,
      simulatedMargin: Math.round(simulatedMargin * 10) / 10,
      marginDrop: Math.round(marginDrop * 10) / 10,
      hppDelta: finalSimulatedHpp - baseHpp,
    }
  }, [selectedSavedProduct, sensitivityMaterialPct, sensitivityYieldPct])

  // Handlers for Sandbox Ingredients
  function handleAddIngredient() {
    const newIng: CustomIngredient = {
      id: `custom-${Date.now()}`,
      name: "",
      packagePrice: 0,
      packageSize: 1000,
      packageUnit: "g",
      usedQuantity: 0,
      wastePercentage: 0,
    }
    setIngredients([...ingredients, newIng])
  }

  function handleUpdateIngredient(id: string, updates: Partial<CustomIngredient>) {
    setIngredients((prev) =>
      prev.map((ing) => (ing.id === id ? { ...ing, ...updates } : ing))
    )
  }

  function handleDeleteIngredient(id: string) {
    if (ingredients.length <= 1) return
    setIngredients((prev) => prev.filter((ing) => ing.id !== id))
  }

  // Handlers for Dynamic Overheads
  function handleAddOverhead() {
    const newOh: CustomOverhead = {
      id: `overhead-${Date.now()}`,
      name: "",
      amount: 0,
    }
    setOverheads([...overheads, newOh])
  }

  function handleUpdateOverhead(id: string, updates: Partial<CustomOverhead>) {
    setOverheads((prev) =>
      prev.map((oh) => (oh.id === id ? { ...oh, ...updates } : oh))
    )
  }

  function handleDeleteOverhead(id: string) {
    setOverheads((prev) => prev.filter((oh) => oh.id !== id))
  }

  function handleReset() {
    setProductName("")
    setYieldUnits("")
    setUnitName("")
    setIngredients([{ ...DEFAULT_INGREDIENT }])
    setOverheads([...DEFAULT_OVERHEADS])
    setPricingMode("margin")
    setTargetMargin(50)
    setTargetMarkup(100)
    setManualPrice(0)
  }

  function handleCopySummary() {
    const text = `
=== RINGKASAN KALKULASI HPP & PRICING ===
Produk: ${productName || "Produk Tanpa Nama"}
Hasil Jadi (Yield): ${yieldUnits || 1} ${unitName || "unit"}

BIAYA PRODUKSI PER BATCH:
- Bahan Baku: ${formatCurrencyIdr(totalRawMaterialCost)}
- Overhead: ${formatCurrencyIdr(totalBatchOverhead)}
Total Biaya Batch: ${formatCurrencyIdr(totalProductionCost)}

HPP PER UNIT: ${formatCurrencyIdr(hppTotalPerUnit)} / ${unitName || "unit"}
- HPP Bahan Baku: ${formatCurrencyIdr(hppRawMaterialPerUnit)}
- HPP Overhead: ${formatCurrencyIdr(hppOverheadPerUnit)}

REKOMENDASI HARGA JUAL:
- Rekomendasi Harga: ${formatCurrencyIdr(calculatedSellingPrice)} (Margin: ${actualMarginPercent}%)
- Laba Kotor per Unit: ${formatCurrencyIdr(grossProfitPerUnit)}

Dihitung otomatis dengan HPP Manager.
`.trim()

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="flex flex-col gap-6 pb-20 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="border-b border-border pb-5">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Calculator className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Simulasi Resep Baru (HPP Calculator)
          </h1>
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs font-semibold">
            Kalkulator Resep
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Hitung HPP per unit secara akurat, alokasikan biaya bahan baku & overhead fleksibel, serta simulasikan harga jual ideal.
        </p>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted/60 p-1 rounded-xl h-11 border border-border">
          <TabsTrigger
            value="sandbox"
            className="rounded-lg text-xs font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm flex items-center gap-2 h-9"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Simulasi Bebas & Resep Baru</span>
          </TabsTrigger>
          <TabsTrigger
            value="saved"
            className="rounded-lg text-xs font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm flex items-center gap-2 h-9"
          >
            <Boxes className="h-3.5 w-3.5" />
            <span>Simulasi What-If Resep Tersimpan</span>
          </TabsTrigger>
        </TabsList>

        {/* ========================================================= */}
        {/* TAB 1: SANDBOX / CUSTOM CALCULATOR                        */}
        {/* ========================================================= */}
        <TabsContent value="sandbox" className="mt-5 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN (8 cols): Inputs & Formulations */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Card 1: Informasi Produk & Target Batch */}
              <Card className="rounded-2xl border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-primary" />
                    1. Identitas Produk & Hasil Batch (Yield)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Tentukan nama produk dan berapa banyak porsi/unit jadi yang dihasilkan dari 1 kali memasak resep ini.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs font-semibold">Nama Produk / Varian</Label>
                      <Input
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="Contoh: Roti Manis Coklat Keju"
                        className="rounded-xl h-10 text-xs font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Hasil Jadi (Yield)</Label>
                        <Input
                          type="number"
                          min="1"
                          value={yieldUnits === "" ? "" : yieldUnits}
                          onChange={(e) => setYieldUnits(e.target.value === "" ? "" : Math.max(1, Number(e.target.value) || 1))}
                          placeholder="Contoh: 10"
                          className="rounded-xl h-10 text-xs font-mono font-bold text-center text-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Satuan</Label>
                        <Input
                          value={unitName}
                          onChange={(e) => setUnitName(e.target.value)}
                          placeholder="Contoh: pcs"
                          className="rounded-xl h-10 text-xs text-center"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Formulasi Bahan Baku (Bill of Materials) */}
              <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        2. Komposisi Bahan Baku (BOM) & Biaya Kemasan
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Masukkan harga kemasan saat dibeli di toko grosir dan jumlah pemakaian riil untuk 1 batch.
                      </CardDescription>
                    </div>

                    <Button
                      type="button"
                      onClick={handleAddIngredient}
                      size="sm"
                      className="rounded-xl text-xs h-8 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 font-semibold flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Tambah Bahan</span>
                    </Button>
                  </div>
                </CardHeader>

                <div className="border-t border-border overflow-x-auto">
                  <Table className="min-w-[650px]">
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="text-xs font-semibold w-[220px]">Nama Bahan</TableHead>
                        <TableHead className="text-xs font-semibold">Harga Beli Kemasan</TableHead>
                        <TableHead className="text-xs font-semibold">Isi Kemasan</TableHead>
                        <TableHead className="text-xs font-semibold">Pakai / Batch</TableHead>
                        <TableHead className="text-xs font-semibold text-center">Waste %</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Biaya / Batch</TableHead>
                        <TableHead className="w-[40px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ingredientCalculations.map((ing) => (
                        <TableRow key={ing.id} className="hover:bg-muted/20">
                          <TableCell className="p-2.5">
                            <Input
                              value={ing.name}
                              onChange={(e) => handleUpdateIngredient(ing.id, { name: e.target.value })}
                              placeholder="Contoh: Tepung Terigu"
                              className="rounded-lg h-8 text-xs font-medium"
                            />
                          </TableCell>

                          <TableCell className="p-2.5">
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">Rp</span>
                              <Input
                                type="number"
                                min="0"
                                step="500"
                                value={ing.packagePrice || ""}
                                onChange={(e) => handleUpdateIngredient(ing.id, { packagePrice: Number(e.target.value) || 0 })}
                                placeholder="0"
                                className="pl-7 rounded-lg h-8 text-xs font-mono"
                              />
                            </div>
                          </TableCell>

                          <TableCell className="p-2.5">
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min="1"
                                value={ing.packageSize || ""}
                                onChange={(e) => handleUpdateIngredient(ing.id, { packageSize: Number(e.target.value) || 1 })}
                                placeholder="1000"
                                className="w-16 rounded-lg h-8 text-xs font-mono text-center"
                              />
                              <Input
                                value={ing.packageUnit}
                                onChange={(e) => handleUpdateIngredient(ing.id, { packageUnit: e.target.value })}
                                placeholder="g"
                                className="w-12 rounded-lg h-8 text-[11px] text-center px-1"
                              />
                            </div>
                          </TableCell>

                          <TableCell className="p-2.5">
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                value={ing.usedQuantity || ""}
                                onChange={(e) => handleUpdateIngredient(ing.id, { usedQuantity: Number(e.target.value) || 0 })}
                                placeholder="0"
                                className="w-20 rounded-lg h-8 text-xs font-mono font-semibold"
                              />
                              <span className="text-[11px] text-muted-foreground font-mono">{ing.packageUnit || "satuan"}</span>
                            </div>
                          </TableCell>

                          <TableCell className="p-2.5 text-center">
                            <Input
                              type="number"
                              min="0"
                              max="50"
                              value={ing.wastePercentage || ""}
                              onChange={(e) => handleUpdateIngredient(ing.id, { wastePercentage: Number(e.target.value) || 0 })}
                              placeholder="0"
                              className="w-14 rounded-lg h-8 text-xs font-mono text-center mx-auto"
                            />
                          </TableCell>

                          <TableCell className="p-2.5 text-right font-mono font-bold text-xs text-foreground">
                            {formatCurrencyIdr(ing.totalCost)}
                          </TableCell>

                          <TableCell className="p-2.5 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteIngredient(ing.id)}
                              disabled={ingredients.length <= 1}
                              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="p-3.5 bg-muted/20 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Subtotal Biaya Bahan Baku:</span>
                  <span className="font-mono font-bold text-sm text-foreground">
                    {formatCurrencyIdr(totalRawMaterialCost)}
                  </span>
                </div>
              </Card>

              {/* Card 3: Biaya Overhead Operasional */}
              <Card className="rounded-2xl border-border shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Scale className="h-4 w-4 text-primary" />
                        3. Alokasi Biaya Overhead & Operasional
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Tambahkan biaya pendukung seperti kemasan, upah kerja, listrik, gas, atau biaya lainnya per batch.
                      </CardDescription>
                    </div>

                    <Button
                      type="button"
                      onClick={handleAddOverhead}
                      size="sm"
                      className="rounded-xl text-xs h-8 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 font-semibold flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Tambah Overhead</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {overheads.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                      Belum ada komponen overhead. Klik &quot;Tambah Overhead&quot; untuk menambahkan biaya.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {overheads.map((oh) => {
                        const costPerUnit = Math.round((oh.amount || 0) / safeYield)
                        return (
                          <div
                            key={oh.id}
                            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-xl border border-border bg-card hover:bg-muted/10 transition-colors"
                          >
                            <div className="flex-1">
                              <Input
                                value={oh.name}
                                onChange={(e) => handleUpdateOverhead(oh.id, { name: e.target.value })}
                                placeholder="Nama biaya overhead (misal: Kemasan / Listrik)..."
                                className="rounded-lg h-9 text-xs font-medium"
                              />
                            </div>
                            <div className="w-full sm:w-48 relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">
                                Rp
                              </span>
                              <Input
                                type="number"
                                min="0"
                                step="500"
                                value={oh.amount || ""}
                                onChange={(e) =>
                                  handleUpdateOverhead(oh.id, { amount: Number(e.target.value) || 0 })
                                }
                                placeholder="0"
                                className="pl-8 rounded-lg h-9 text-xs font-mono font-semibold"
                              />
                            </div>
                            <div className="w-full sm:w-36 px-2 py-1 flex items-center justify-between sm:justify-end gap-1 text-xs text-muted-foreground font-mono">
                              <span className="sm:hidden text-[11px]">Per unit:</span>
                              <span className="font-semibold text-foreground">
                                {formatCurrencyIdr(costPerUnit)}
                              </span>
                              <span className="text-[10px]">/ unit</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteOverhead(oh.id)}
                              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 self-end sm:self-center"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Subtotal Biaya Overhead (per Batch):</span>
                    <span className="font-mono font-bold text-sm text-foreground">
                      {formatCurrencyIdr(totalBatchOverhead)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT COLUMN (4 cols): Sticky Highlight Summary Card */}
            <div className="lg:col-span-4 flex flex-col gap-6 sticky top-6">
              {/* Card: Proyeksi Finansial HPP (Soft Off-White Highlight Card) */}
              <Card className="rounded-2xl border border-slate-300/80 bg-slate-100/70 shadow-sm overflow-hidden">
                <CardHeader className="p-5 pb-3.5 border-b border-slate-200/90 bg-slate-200/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-sm font-bold text-slate-800 tracking-tight">
                        Hasil Kalkulasi HPP
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="bg-white text-slate-600 border-slate-300/80 text-[10px] font-mono tracking-wider uppercase font-semibold">
                      Live Output
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  {/* Hero HPP Per Unit Display */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                      HPP Total per Unit
                    </span>
                    <span className="text-3xl font-black font-mono tracking-tight text-primary mt-1">
                      {formatCurrencyIdr(hppTotalPerUnit)}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">
                      per 1 {unitName} (Bahan + Overhead Lengkap)
                    </span>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 w-full flex items-center justify-around text-[10px] font-mono text-slate-600">
                      <div>
                        <span className="block text-slate-400">Bahan Baku:</span>
                        <strong className="text-slate-800">{formatCurrencyIdr(hppRawMaterialPerUnit)}</strong>
                      </div>
                      <div className="h-5 w-px bg-slate-200" />
                      <div>
                        <span className="block text-slate-400">Overhead:</span>
                        <strong className="text-slate-800">{formatCurrencyIdr(hppTotalPerUnit - hppRawMaterialPerUnit)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Strategy Selector */}
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Strategi Harga Jual
                      </Label>
                      <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px]">
                        <button
                          type="button"
                          onClick={() => setPricingMode("margin")}
                          className={`px-2 py-0.5 rounded font-semibold transition-all ${pricingMode === "margin" ? "bg-white text-primary shadow-xs" : "text-slate-600"}`}
                        >
                          Margin %
                        </button>
                        <button
                          type="button"
                          onClick={() => setPricingMode("markup")}
                          className={`px-2 py-0.5 rounded font-semibold transition-all ${pricingMode === "markup" ? "bg-white text-primary shadow-xs" : "text-slate-600"}`}
                        >
                          Markup
                        </button>
                        <button
                          type="button"
                          onClick={() => setPricingMode("manual")}
                          className={`px-2 py-0.5 rounded font-semibold transition-all ${pricingMode === "manual" ? "bg-white text-primary shadow-xs" : "text-slate-600"}`}
                        >
                          Manual
                        </button>
                      </div>
                    </div>

                    {pricingMode === "margin" && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 text-[11px]">Target Margin Keuntungan:</span>
                          <span className="font-mono font-bold text-primary">{targetMargin}%</span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="85"
                          step="1"
                          value={targetMargin}
                          onChange={(e) => setTargetMargin(Number(e.target.value))}
                          className="w-full accent-primary h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                        />
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>20% (Tipis)</span>
                          <span>50% (Standard)</span>
                          <span>85% (Premium)</span>
                        </div>
                      </div>
                    )}

                    {pricingMode === "markup" && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 text-[11px]">Kelipatan Markup (%):</span>
                          <span className="font-mono font-bold text-primary">+{targetMarkup}%</span>
                        </div>
                        <Input
                          type="number"
                          min="10"
                          step="10"
                          value={targetMarkup}
                          onChange={(e) => setTargetMarkup(Number(e.target.value) || 0)}
                          className="rounded-lg h-8 text-xs font-mono"
                        />
                      </div>
                    )}

                    {pricingMode === "manual" && (
                      <div className="space-y-1">
                        <Label className="text-[11px] text-slate-600">Input Harga Jual Rencana</Label>
                        <Input
                          type="number"
                          step="500"
                          value={manualPrice}
                          onChange={(e) => setManualPrice(Number(e.target.value) || 0)}
                          className="rounded-lg h-8 text-xs font-mono font-bold text-primary"
                        />
                      </div>
                    )}
                  </div>

                  {/* Summary Metric Rows */}
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">Rekomendasi Harga Jual:</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {formatCurrencyIdr(calculatedSellingPrice)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">Laba Kotor per Unit:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        +{formatCurrencyIdr(grossProfitPerUnit)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">Total Nilai Batch (Omzet):</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatCurrencyIdr(calculatedSellingPrice * safeYield)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2 bg-emerald-50 border border-emerald-200/70 px-3 rounded-xl text-emerald-800">
                      <span className="font-semibold text-xs text-emerald-900">Gross Profit Margin:</span>
                      <span className="font-mono font-black text-base text-emerald-700">
                        {actualMarginPercent}%
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2 border-t border-slate-200/80">
                    <Button
                      asChild
                      className="w-full h-10 rounded-xl shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground font-bold flex items-center justify-center gap-2 text-xs"
                    >
                      <Link to="/production/products/new">
                        <Plus className="h-4 w-4" />
                        <span>Buat Produk Baru</span>
                      </Link>
                    </Button>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCopySummary}
                        className="w-full h-9 rounded-xl bg-white border-slate-300/80 hover:bg-slate-50 text-slate-700 font-semibold flex items-center justify-center gap-1.5 text-xs shadow-2xs"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                        <span>{copied ? "Tersalin!" : "Salin Ringkasan"}</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleReset}
                        className="w-full h-9 rounded-xl bg-white border-slate-300/80 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 text-slate-600 font-semibold flex items-center justify-center gap-1.5 text-xs shadow-2xs"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Reset Formulasi</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ========================================================= */}
        {/* TAB 2: SIMULASI WHAT-IF DARI RESEP TERSIMPAN             */}
        {/* ========================================================= */}
        <TabsContent value="saved" className="mt-5 space-y-6">
          <Card className="rounded-2xl border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Boxes className="h-4 w-4 text-primary" />
                Pilih Resep Aktif untuk Simulasi Kenaikan Harga
              </CardTitle>
              <CardDescription className="text-xs">
                Uji sensitivitas bisnis Anda jika harga bahan baku pokok naik atau jika hasil panen dapur berkurang karena kegagalan proses.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Product Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {savedProducts.map((p) => {
                  const isSelected = p.id === selectedProductId
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProductId(p.id)}
                      className={`
                        p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-3 text-left
                        ${isSelected ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm" : "border-border hover:border-primary/40 hover:bg-muted/30"}
                      `}
                    >
                      <div>
                        <Badge variant="outline" className="text-[10px] py-0 px-2 font-medium mb-1">
                          {p.category}
                        </Badge>
                        <h4 className="font-bold text-xs text-foreground truncate">{p.name}</h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          HPP Saat Ini: <strong className="text-foreground">{formatCurrencyIdr(p.latestHpp)}</strong>
                        </p>
                      </div>

                      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground text-[10px]">Harga Jual:</span>
                        <span className="font-mono font-bold text-primary">{formatCurrencyIdr(p.sellingPrice)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {selectedSavedProduct && savedRecipeSimulation && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-border items-start">
                  {/* Slider Controls (7 cols) */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Slider 1: Fluktuasi Bahan Baku */}
                    <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-foreground flex items-center gap-2">
                          <Percent className="h-4 w-4 text-amber-500" />
                          Simulasi Kenaikan / Penurunan Biaya Bahan Baku (%)
                        </Label>
                        <Badge
                          variant="outline"
                          className={`font-mono text-xs font-bold ${
                            sensitivityMaterialPct > 0
                              ? "bg-red-500/10 text-red-600 border-red-500/20"
                              : sensitivityMaterialPct < 0
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {sensitivityMaterialPct > 0 ? `+${sensitivityMaterialPct}%` : `${sensitivityMaterialPct}%`}
                        </Badge>
                      </div>
                      <input
                        type="range"
                        min="-20"
                        max="50"
                        step="5"
                        value={sensitivityMaterialPct}
                        onChange={(e) => setSensitivityMaterialPct(Number(e.target.value))}
                        className="w-full accent-amber-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
                      />
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>-20% (Bahan Turun)</span>
                        <span>0% (Stabil Normal)</span>
                        <span>+50% (Inflasi Ekstrem)</span>
                      </div>
                    </div>

                    {/* Slider 2: Fluktuasi Hasil Panen (Yield) */}
                    <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-foreground flex items-center gap-2">
                          <Scale className="h-4 w-4 text-primary" />
                          Simulasi Efisiensi Panen Dapur (Yield / Scrap Afkir)
                        </Label>
                        <Badge
                          variant="outline"
                          className={`font-mono text-xs font-bold ${
                            sensitivityYieldPct < 0
                              ? "bg-red-500/10 text-red-600 border-red-500/20"
                              : sensitivityYieldPct > 0
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {sensitivityYieldPct > 0 ? `+${sensitivityYieldPct}%` : `${sensitivityYieldPct}%`}
                        </Badge>
                      </div>
                      <input
                        type="range"
                        min="-30"
                        max="20"
                        step="5"
                        value={sensitivityYieldPct}
                        onChange={(e) => setSensitivityYieldPct(Number(e.target.value))}
                        className="w-full accent-primary h-2 bg-slate-200 rounded-lg cursor-pointer"
                      />
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>-30% (Banyak Gosong / Afkir)</span>
                        <span>0% (Sesuai Resep)</span>
                        <span>+20% (Hasil Lebih Banyak)</span>
                      </div>
                    </div>

                    {/* Explanation Banner */}
                    <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground flex items-start gap-3">
                      <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">Dampak Langsung ke Bisnis Anda:</p>
                        <p className="text-[11px] leading-relaxed">
                          Jika harga bahan baku berubah sebesar <strong>{sensitivityMaterialPct}%</strong> dan efisiensi yield dapur berubah <strong>{sensitivityYieldPct}%</strong>, maka HPP per unit produk Anda akan berubah menjadi <strong>{formatCurrencyIdr(savedRecipeSimulation.finalSimulatedHpp)}</strong> (selisih {formatCurrencyIdr(savedRecipeSimulation.hppDelta)} per {selectedSavedProduct.unit}).
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Impact Summary Card (5 cols - Soft Off-White Theme) */}
                  <div className="lg:col-span-5">
                    <Card className="rounded-2xl border border-slate-300/80 bg-slate-100/70 shadow-sm overflow-hidden">
                      <CardHeader className="p-5 pb-3 border-b border-slate-200/90 bg-slate-200/50">
                        <CardTitle className="text-sm font-bold text-slate-800">
                          Dampak Terhadap Margin & HPP
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-600">
                          Resep: {selectedSavedProduct.name}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="p-5 space-y-4">
                        {/* Comparison Box */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-center shadow-xs">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">HPP Normal</span>
                            <span className="text-base font-bold font-mono text-slate-700 mt-0.5 block">
                              {formatCurrencyIdr(savedRecipeSimulation.baseHpp)}
                            </span>
                            <span className="text-[10px] text-slate-500">Margin: {savedRecipeSimulation.baseMargin}%</span>
                          </div>

                          <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-center shadow-xs">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">HPP Setelah Simulasi</span>
                            <span className="text-base font-bold font-mono text-primary mt-0.5 block">
                              {formatCurrencyIdr(savedRecipeSimulation.finalSimulatedHpp)}
                            </span>
                            <span className="text-[10px] text-slate-500">Margin: {savedRecipeSimulation.simulatedMargin}%</span>
                          </div>
                        </div>

                        {/* Impact Details */}
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-600">Perubahan HPP per Unit:</span>
                            <span className={`font-mono font-bold ${savedRecipeSimulation.hppDelta > 0 ? 'text-destructive' : 'text-emerald-700'}`}>
                              {savedRecipeSimulation.hppDelta > 0 ? `+${formatCurrencyIdr(savedRecipeSimulation.hppDelta)}` : formatCurrencyIdr(savedRecipeSimulation.hppDelta)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-600">Laba Bersih per Unit (Harga {formatCurrencyIdr(savedRecipeSimulation.baseSellingPrice)}):</span>
                            <span className="font-mono font-bold text-slate-900">
                              {formatCurrencyIdr(savedRecipeSimulation.simulatedProfit)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between py-2 bg-white px-3 rounded-xl border border-slate-200">
                            <span className="font-semibold text-xs text-slate-700">Dampak Penurunan Margin:</span>
                            <span className={`font-mono font-black text-sm ${savedRecipeSimulation.marginDrop > 0 ? 'text-destructive' : 'text-emerald-700'}`}>
                              {savedRecipeSimulation.marginDrop > 0 ? `-${savedRecipeSimulation.marginDrop}%` : `+${Math.abs(savedRecipeSimulation.marginDrop)}%`}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2">
                          <Button
                            asChild
                            variant="outline"
                            className="w-full h-9 rounded-xl text-xs font-semibold bg-white border-slate-300/80 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <Link to={`/production/products/${selectedSavedProduct.id}`}>
                              Buka Detail Produk Lengkap
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
