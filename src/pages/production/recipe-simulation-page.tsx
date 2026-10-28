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
  Boxes,
  FileText,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CurrencyText, formatCurrency } from "@/components/ui/currency-text"

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
  // Recipe Simulation State
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

  // Copy Feedback
  const [copied, setCopied] = React.useState<boolean>(false)

  // ===================== CALCULATIONS =====================
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

  // Handlers for Ingredients
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
- Bahan Baku: ${formatCurrency(totalRawMaterialCost)}
- Overhead: ${formatCurrency(totalBatchOverhead)}
Total Biaya Batch: ${formatCurrency(totalProductionCost)}

HPP PER UNIT: ${formatCurrency(hppTotalPerUnit)} / ${unitName || "unit"}
- HPP Bahan Baku: ${formatCurrency(hppRawMaterialPerUnit)}
- HPP Overhead: ${formatCurrency(hppOverheadPerUnit)}

REKOMENDASI HARGA JUAL:
- Rekomendasi Harga: ${formatCurrency(calculatedSellingPrice)} (Margin: ${actualMarginPercent}%)
- Laba Kotor per Unit: ${formatCurrency(grossProfitPerUnit)}

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
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Calculator className="h-5 w-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Simulasi Produk Baru
          </h1>
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs font-semibold">
            Kalkulator HPP Produk
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Hitung HPP per unit secara akurat, alokasikan biaya bahan baku & overhead fleksibel, serta simulasikan harga jual ideal.
        </p>
      </div>

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
                    Tentukan nama produk dan berapa banyak porsi/unit jadi yang dihasilkan dari 1 kali produksi produk ini.
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
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
                      className="rounded-xl text-xs h-8 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 font-semibold flex items-center gap-1 self-start sm:self-auto shrink-0"
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
                            <CurrencyText value={ing.totalCost} />
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
                    <CurrencyText value={totalRawMaterialCost} />
                  </span>
                </div>
              </Card>

              {/* Card 3: Biaya Overhead Operasional */}
              <Card className="rounded-2xl border-border shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
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
                      className="rounded-xl text-xs h-8 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 font-semibold flex items-center gap-1 self-start sm:self-auto shrink-0"
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
                                <CurrencyText value={costPerUnit} />
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
                      <CurrencyText value={totalBatchOverhead} />
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
                      <CurrencyText value={hppTotalPerUnit} />
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">
                      per 1 {unitName} (Bahan + Overhead Lengkap)
                    </span>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 w-full flex items-center justify-around text-[10px] font-mono text-slate-600">
                      <div>
                        <span className="block text-slate-400">Bahan Baku:</span>
                        <strong className="text-slate-800"><CurrencyText value={hppRawMaterialPerUnit} /></strong>
                      </div>
                      <div className="h-5 w-px bg-slate-200" />
                      <div>
                        <span className="block text-slate-400">Overhead:</span>
                        <strong className="text-slate-800"><CurrencyText value={hppTotalPerUnit - hppRawMaterialPerUnit} /></strong>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Strategy Selector */}
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
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
                        <CurrencyText value={calculatedSellingPrice} />
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">Laba Kotor per Unit:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        <CurrencyText value={grossProfitPerUnit} showPositiveSign />
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">Total Nilai Batch (Omzet):</span>
                      <span className="font-mono font-bold text-slate-900">
                        <CurrencyText value={calculatedSellingPrice * safeYield} />
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
        </div>
  )
}
