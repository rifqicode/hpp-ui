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
  ShoppingBag,
  Percent,
  Boxes,
  FileText,
  Info,
  Scale,
  PieChart,
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

interface QuickTemplate {
  name: string
  category: string
  yieldUnits: number
  unitName: string
  ingredients: CustomIngredient[]
  packagingCost: number
  laborCost: number
  utilityCost: number
  otherOverheadCost: number
  targetMargin: number
}

const TEMPLATES: QuickTemplate[] = [
  {
    name: "Roti Manis Coklat",
    category: "Bakery",
    yieldUnits: 30,
    unitName: "pcs",
    packagingCost: 400, // plastik OPP + stiker per pcs
    laborCost: 20000,
    utilityCost: 15000,
    otherOverheadCost: 5000,
    targetMargin: 60,
    ingredients: [
      { id: "ing-1", name: "Tepung Terigu Protein Tinggi", packagePrice: 13000, packageSize: 1000, packageUnit: "g", usedQuantity: 1000, wastePercentage: 2 },
      { id: "ing-2", name: "Gula Pasir", packagePrice: 16000, packageSize: 1000, packageUnit: "g", usedQuantity: 200, wastePercentage: 0 },
      { id: "ing-3", name: "Mentega / Margarin", packagePrice: 38000, packageSize: 1000, packageUnit: "g", usedQuantity: 150, wastePercentage: 0 },
      { id: "ing-4", name: "Ragi Instan", packagePrice: 15000, packageSize: 100, packageUnit: "g", usedQuantity: 15, wastePercentage: 0 },
      { id: "ing-5", name: "Susu Bubuk", packagePrice: 65000, packageSize: 1000, packageUnit: "g", usedQuantity: 60, wastePercentage: 0 },
      { id: "ing-6", name: "Telur Ayam", packagePrice: 28000, packageSize: 1000, packageUnit: "g", usedQuantity: 120, wastePercentage: 0 },
      { id: "ing-7", name: "Isian Coklat Pasta", packagePrice: 45000, packageSize: 1000, packageUnit: "g", usedQuantity: 450, wastePercentage: 3 },
    ],
  },
  {
    name: "Donat Kentang Klasik",
    category: "Donut",
    yieldUnits: 24,
    unitName: "pcs",
    packagingCost: 500,
    laborCost: 18000,
    utilityCost: 12000,
    otherOverheadCost: 4000,
    targetMargin: 65,
    ingredients: [
      { id: "ing-11", name: "Tepung Terigu Protein Tinggi", packagePrice: 13000, packageSize: 1000, packageUnit: "g", usedQuantity: 500, wastePercentage: 2 },
      { id: "ing-12", name: "Kentang Kukus Halus", packagePrice: 18000, packageSize: 1000, packageUnit: "g", usedQuantity: 200, wastePercentage: 5 },
      { id: "ing-13", name: "Gula Pasir", packagePrice: 16000, packageSize: 1000, packageUnit: "g", usedQuantity: 80, wastePercentage: 0 },
      { id: "ing-14", name: "Minyak Goreng Padat", packagePrice: 32000, packageSize: 1000, packageUnit: "g", usedQuantity: 300, wastePercentage: 10 },
      { id: "ing-15", name: "Gula Donat Dingin", packagePrice: 22000, packageSize: 1000, packageUnit: "g", usedQuantity: 100, wastePercentage: 5 },
    ],
  },
  {
    name: "Kopi Susu Gula Aren",
    category: "Minuman",
    yieldUnits: 10,
    unitName: "cup",
    packagingCost: 1200, // Cup + Sealer + Sedotan
    laborCost: 10000,
    utilityCost: 5000,
    otherOverheadCost: 2000,
    targetMargin: 70,
    ingredients: [
      { id: "ing-21", name: "Biji Kopi Espresso Blend", packagePrice: 95000, packageSize: 1000, packageUnit: "g", usedQuantity: 180, wastePercentage: 3 },
      { id: "ing-22", name: "Susu Fresh Milk UHT", packagePrice: 20000, packageSize: 1000, packageUnit: "ml", usedQuantity: 1200, wastePercentage: 2 },
      { id: "ing-23", name: "Sirup Gula Aren Asli", packagePrice: 35000, packageSize: 1000, packageUnit: "ml", usedQuantity: 250, wastePercentage: 0 },
      { id: "ing-24", name: "Es Batu Kristal Higienis", packagePrice: 10000, packageSize: 5000, packageUnit: "g", usedQuantity: 1500, wastePercentage: 5 },
    ],
  },
]

export default function HppCalculatorPage() {
  const [activeTab, setActiveTab] = React.useState<string>("sandbox")

  // Sandbox Mode State
  const [productName, setProductName] = React.useState<string>("Roti Manis Coklat")
  const [yieldUnits, setYieldUnits] = React.useState<number>(30)
  const [unitName, setUnitName] = React.useState<string>("pcs")
  const [ingredients, setIngredients] = React.useState<CustomIngredient[]>(TEMPLATES[0].ingredients)

  // Overhead Costs
  const [packagingCostPerUnit, setPackagingCostPerUnit] = React.useState<number>(400) // per unit
  const [laborCostBatch, setLaborCostBatch] = React.useState<number>(20000) // per batch
  const [utilityCostBatch, setUtilityCostBatch] = React.useState<number>(15000) // gas, listrik, air per batch
  const [otherOverheadBatch, setOtherOverheadBatch] = React.useState<number>(5000) // per batch

  // Pricing Strategy State
  const [pricingMode, setPricingMode] = React.useState<"margin" | "markup" | "manual">("margin")
  const [targetMargin, setTargetMargin] = React.useState<number>(60) // %
  const [targetMarkup, setTargetMarkup] = React.useState<number>(150) // %
  const [manualPrice, setManualPrice] = React.useState<number>(8500)

  // Break Even Fixed Cost
  const [monthlyFixedCost, setMonthlyFixedCost] = React.useState<number>(3500000)

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

  const totalPackagingCost = React.useMemo(() => {
    return packagingCostPerUnit * Math.max(1, yieldUnits)
  }, [packagingCostPerUnit, yieldUnits])

  const totalBatchOverhead = React.useMemo(() => {
    return (laborCostBatch || 0) + (utilityCostBatch || 0) + (otherOverheadBatch || 0) + totalPackagingCost
  }, [laborCostBatch, utilityCostBatch, otherOverheadBatch, totalPackagingCost])

  const totalProductionCost = totalRawMaterialCost + totalBatchOverhead

  const safeYield = Math.max(1, yieldUnits || 1)
  const hppRawMaterialPerUnit = Math.round(totalRawMaterialCost / safeYield)
  const hppPackagingPerUnit = packagingCostPerUnit
  const hppLaborPerUnit = Math.round((laborCostBatch || 0) / safeYield)
  const hppUtilityPerUnit = Math.round((utilityCostBatch || 0) / safeYield)
  const hppOtherPerUnit = Math.round((otherOverheadBatch || 0) / safeYield)
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

  // Channels Matrix
  // 1. Offline / Store Direct (0% fee)
  const offlinePrice = calculatedSellingPrice
  const offlineNetRev = offlinePrice
  const offlineProfit = offlineNetRev - hppTotalPerUnit

  // 2. Online Food Delivery (GoFood / GrabFood / ShopeeFood ~ 20% commission)
  // Recommended price to KEEP same margin: OnlinePrice = calculatedSellingPrice / (1 - 0.20)
  const deliveryRecommendedPrice = Math.ceil((calculatedSellingPrice / 0.8) / 500) * 500
  const deliveryFee = Math.round(deliveryRecommendedPrice * 0.2)
  const deliveryNetRev = deliveryRecommendedPrice - deliveryFee
  const deliveryProfit = deliveryNetRev - hppTotalPerUnit

  // 3. E-Commerce / Marketplace (~ 6.5% admin fee)
  const marketplaceRecommendedPrice = Math.ceil((calculatedSellingPrice / (1 - 0.065)) / 500) * 500
  const marketplaceFee = Math.round(marketplaceRecommendedPrice * 0.065)
  const marketplaceNetRev = marketplaceRecommendedPrice - marketplaceFee
  const marketplaceProfit = marketplaceNetRev - hppTotalPerUnit

  // Break-Even Point (BEP)
  const bepUnitsPerMonth =
    grossProfitPerUnit > 0 ? Math.ceil(monthlyFixedCost / grossProfitPerUnit) : 0
  const bepRevenuePerMonth = bepUnitsPerMonth * calculatedSellingPrice

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
      name: "Bahan Baru",
      packagePrice: 20000,
      packageSize: 1000,
      packageUnit: "g",
      usedQuantity: 100,
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

  function handleApplyTemplate(tpl: QuickTemplate) {
    setProductName(tpl.name)
    setYieldUnits(tpl.yieldUnits)
    setUnitName(tpl.unitName)
    setIngredients(tpl.ingredients)
    setPackagingCostPerUnit(tpl.packagingCost)
    setLaborCostBatch(tpl.laborCost)
    setUtilityCostBatch(tpl.utilityCost)
    setOtherOverheadBatch(tpl.otherOverheadCost)
    setTargetMargin(tpl.targetMargin)
    setPricingMode("margin")
  }

  function handleReset() {
    handleApplyTemplate(TEMPLATES[0])
  }

  function handleCopySummary() {
    const text = `
=== RINGKASAN KALKULASI HPP & PRICING ===
Produk: ${productName}
Hasil Jadi (Yield): ${yieldUnits} ${unitName}

BIAYA PRODUKSI PER BATCH:
- Bahan Baku: ${formatCurrencyIdr(totalRawMaterialCost)}
- Kemasan: ${formatCurrencyIdr(totalPackagingCost)}
- Tenaga Kerja: ${formatCurrencyIdr(laborCostBatch)}
- Listrik & Gas: ${formatCurrencyIdr(utilityCostBatch)}
- Overhead Lainnya: ${formatCurrencyIdr(otherOverheadBatch)}
Total Biaya Batch: ${formatCurrencyIdr(totalProductionCost)}

HPP PER UNIT: ${formatCurrencyIdr(hppTotalPerUnit)} / ${unitName}
- HPP Bahan: ${formatCurrencyIdr(hppRawMaterialPerUnit)}
- HPP Kemasan: ${formatCurrencyIdr(hppPackagingPerUnit)}
- HPP Operasional: ${formatCurrencyIdr(hppLaborPerUnit + hppUtilityPerUnit + hppOtherPerUnit)}

REKOMENDASI HARGA JUAL:
- Offline / Dine-in: ${formatCurrencyIdr(offlinePrice)} (Margin: ${actualMarginPercent}%)
- Online Delivery (Ojol 20%): ${formatCurrencyIdr(deliveryRecommendedPrice)}
- E-Commerce (6.5%): ${formatCurrencyIdr(marketplaceRecommendedPrice)}

BEP (Titik Impas): ${bepUnitsPerMonth} ${unitName} / bulan (Omzet minimal ${formatCurrencyIdr(bepRevenuePerMonth)})
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
            HPP Calculator & Pricing Simulator
          </h1>
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs font-semibold">
            Kalkulator Pintar
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Hitung HPP per unit secara akurat, alokasikan biaya bahan & overhead, serta simulasikan harga jual multi-channel (Offline vs Ojol).
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
          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-muted-foreground font-semibold flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Template Cepat:
            </span>
            {TEMPLATES.map((tpl) => (
              <Button
                key={tpl.name}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleApplyTemplate(tpl)}
                className="h-7 text-xs rounded-lg px-2.5 hover:border-primary/50"
              >
                {tpl.name} ({tpl.yieldUnits} {tpl.unitName})
              </Button>
            ))}
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
                          value={yieldUnits}
                          onChange={(e) => setYieldUnits(Math.max(1, Number(e.target.value) || 1))}
                          className="rounded-xl h-10 text-xs font-mono font-bold text-center text-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Satuan</Label>
                        <Input
                          value={unitName}
                          onChange={(e) => setUnitName(e.target.value)}
                          placeholder="pcs / cup"
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
                              placeholder="Nama bahan baku..."
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
                                className="w-16 rounded-lg h-8 text-xs font-mono text-center"
                              />
                              <Input
                                value={ing.packageUnit}
                                onChange={(e) => handleUpdateIngredient(ing.id, { packageUnit: e.target.value })}
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
                                className="w-20 rounded-lg h-8 text-xs font-mono font-semibold"
                              />
                              <span className="text-[11px] text-muted-foreground font-mono">{ing.packageUnit}</span>
                            </div>
                          </TableCell>

                          <TableCell className="p-2.5 text-center">
                            <Input
                              type="number"
                              min="0"
                              max="50"
                              value={ing.wastePercentage || 0}
                              onChange={(e) => handleUpdateIngredient(ing.id, { wastePercentage: Number(e.target.value) || 0 })}
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

              {/* Card 3: Biaya Overhead Operasional & Kemasan */}
              <Card className="rounded-2xl border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Scale className="h-4 w-4 text-primary" />
                    3. Alokasi Biaya Overhead & Kemasan
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Masukkan biaya kemasan per pcs serta alokasi upah baker, gas, dan listrik per batch untuk mendapatkan HPP akurat.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1.5 p-3 rounded-xl border border-border bg-card">
                      <Label className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                        <span>Kemasan / Unit</span>
                        <Badge variant="outline" className="text-[9px] py-0">per pcs</Badge>
                      </Label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">Rp</span>
                        <Input
                          type="number"
                          min="0"
                          step="100"
                          value={packagingCostPerUnit || ""}
                          onChange={(e) => setPackagingCostPerUnit(Number(e.target.value) || 0)}
                          className="pl-8 rounded-xl h-9 text-xs font-mono font-semibold"
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground block">
                        Total batch: {formatCurrencyIdr(totalPackagingCost)}
                      </span>
                    </div>

                    <div className="space-y-1.5 p-3 rounded-xl border border-border bg-card">
                      <Label className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                        <span>Tenaga Kerja</span>
                        <Badge variant="outline" className="text-[9px] py-0">per batch</Badge>
                      </Label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">Rp</span>
                        <Input
                          type="number"
                          min="0"
                          step="1000"
                          value={laborCostBatch || ""}
                          onChange={(e) => setLaborCostBatch(Number(e.target.value) || 0)}
                          className="pl-8 rounded-xl h-9 text-xs font-mono font-semibold"
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground block">
                        = {formatCurrencyIdr(hppLaborPerUnit)} / unit
                      </span>
                    </div>

                    <div className="space-y-1.5 p-3 rounded-xl border border-border bg-card">
                      <Label className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                        <span>Gas & Listrik Oven</span>
                        <Badge variant="outline" className="text-[9px] py-0">per batch</Badge>
                      </Label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">Rp</span>
                        <Input
                          type="number"
                          min="0"
                          step="1000"
                          value={utilityCostBatch || ""}
                          onChange={(e) => setUtilityCostBatch(Number(e.target.value) || 0)}
                          className="pl-8 rounded-xl h-9 text-xs font-mono font-semibold"
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground block">
                        = {formatCurrencyIdr(hppUtilityPerUnit)} / unit
                      </span>
                    </div>

                    <div className="space-y-1.5 p-3 rounded-xl border border-border bg-card">
                      <Label className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                        <span>Overhead Lainnya</span>
                        <Badge variant="outline" className="text-[9px] py-0">per batch</Badge>
                      </Label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">Rp</span>
                        <Input
                          type="number"
                          min="0"
                          step="500"
                          value={otherOverheadBatch || ""}
                          onChange={(e) => setOtherOverheadBatch(Number(e.target.value) || 0)}
                          className="pl-8 rounded-xl h-9 text-xs font-mono font-semibold"
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground block">
                        = {formatCurrencyIdr(hppOtherPerUnit)} / unit
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 4: Simulasi Multi-Channel Delivery (Ojol vs Offline) */}
              <Card className="rounded-2xl border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-primary" />
                    4. Matriks Harga Multi-Channel (Offline vs GoFood / GrabFood / Marketplace)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Platform ojek online memotong komisi 20%. Gunakan harga markup rekomendasi agar margin bersih toko Anda tidak tergerus.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Channel 1: Dine-in / Offline */}
                    <div className="p-4 rounded-xl border border-border bg-card flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-foreground">Toko Offline / POS</span>
                          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                            0% Fee
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Penjualan langsung di kasir toko</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground">Harga Jual:</span>
                        <p className="font-mono font-bold text-lg text-foreground">
                          {formatCurrencyIdr(offlinePrice)}
                        </p>
                        <div className="pt-2 border-t border-border/80 flex items-center justify-between text-xs">
                          <span className="text-muted-foreground text-[11px]">Laba Bersih:</span>
                          <span className="font-mono font-bold text-emerald-600">+{formatCurrencyIdr(offlineProfit)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Channel 2: Online Delivery (GoFood/GrabFood 20%) */}
                    <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex flex-col justify-between gap-3 relative">
                      <div className="absolute -top-2.5 right-3">
                        <Badge className="bg-primary text-primary-foreground text-[9px] font-bold uppercase tracking-wider py-0.5 shadow-sm">
                          Rekomendasi
                        </Badge>
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-foreground">Online Delivery</span>
                          <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 border-amber-500/20">
                            20% Komisi
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">GoFood, GrabFood, ShopeeFood</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground">Harga Menu Aplikasi:</span>
                        <p className="font-mono font-bold text-lg text-primary">
                          {formatCurrencyIdr(deliveryRecommendedPrice)}
                        </p>
                        <div className="pt-2 border-t border-primary/20 flex flex-col gap-1 text-[11px]">
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span>Potongan Komisi (20%):</span>
                            <span className="font-mono text-destructive">-{formatCurrencyIdr(deliveryFee)}</span>
                          </div>
                          <div className="flex items-center justify-between font-semibold">
                            <span className="text-foreground">Laba Bersih:</span>
                            <span className="font-mono text-emerald-600">+{formatCurrencyIdr(deliveryProfit)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Channel 3: Marketplace */}
                    <div className="p-4 rounded-xl border border-border bg-card flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-foreground">Marketplace</span>
                          <Badge variant="outline" className="text-[10px] bg-slate-500/10 text-slate-700 border-slate-500/20">
                            6.5% Fee
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Tokopedia, Shopee, TikTok Shop</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground">Harga Rekomendasi:</span>
                        <p className="font-mono font-bold text-lg text-foreground">
                          {formatCurrencyIdr(marketplaceRecommendedPrice)}
                        </p>
                        <div className="pt-2 border-t border-border/80 flex flex-col gap-1 text-[11px]">
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span>Biaya Layanan (6.5%):</span>
                            <span className="font-mono text-destructive">-{formatCurrencyIdr(marketplaceFee)}</span>
                          </div>
                          <div className="flex items-center justify-between font-semibold">
                            <span className="text-foreground">Laba Bersih:</span>
                            <span className="font-mono text-emerald-600">+{formatCurrencyIdr(marketplaceProfit)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
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

                  {/* Break Even Point Card */}
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                        <PieChart className="h-3.5 w-3.5 text-primary" />
                        Analisis Titik Impas (BEP)
                      </span>
                      <span className="font-mono font-bold text-primary text-xs">
                        {bepUnitsPerMonth} {unitName}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] text-slate-500 font-medium">Beban Tetap Toko / Bulan</Label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400">Rp</span>
                        <Input
                          type="number"
                          step="100000"
                          value={monthlyFixedCost}
                          onChange={(e) => setMonthlyFixedCost(Number(e.target.value) || 0)}
                          className="pl-7 rounded-lg h-7 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Butuh menjual minimal <strong className="text-slate-800">{bepUnitsPerMonth} {unitName}</strong> (omzet <strong>{formatCurrencyIdr(bepRevenuePerMonth)}</strong>) per bulan untuk impas.
                    </p>
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
