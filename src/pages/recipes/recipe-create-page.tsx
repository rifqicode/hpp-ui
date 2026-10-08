import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Factory,
  Plus,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  Info,
  Loader2,
  CheckCircle2,
  Layers,
  DollarSign,
  Percent,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { recipeService } from "@/features/recipes/services/recipe-service"
import type { RawMaterialStock, CreateProductInput } from "@/features/recipes/types"

function formatCurrencyIdr(val: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val)
}

interface IngredientRow {
  stockId: string
  quantity: number
}

const COMMON_UNITS = ["pcs", "box", "loaf", "roll", "cup", "porsi", "pack"]

export default function RecipeCreatePage() {
  const navigate = useNavigate()

  const [availableMaterials, setAvailableMaterials] = React.useState<RawMaterialStock[]>([])
  const [loadingMaterials, setLoadingMaterials] = React.useState<boolean>(true)
  const [submitting, setSubmitting] = React.useState<boolean>(false)
  const [error, setError] = React.useState<string>("")

  // Form State
  const [name, setName] = React.useState<string>("")
  const [categoriesList, setCategoriesList] = React.useState<string[]>([])
  const [category, setCategory] = React.useState<string>("")
  const [customCategory, setCustomCategory] = React.useState<string>("")
  const [unit, setUnit] = React.useState<string>("pcs")

  // Target Margin (%) Input by User - Selling Price is derived automatically!
  const [targetMargin, setTargetMargin] = React.useState<number>(50)
  const [roundMode, setRoundMode] = React.useState<number>(500) // Default round up to nearest Rp 500

  const [minStock, setMinStock] = React.useState<number>(10)
  const [description, setDescription] = React.useState<string>("")

  // Ingredient Rows
  const [ingredients, setIngredients] = React.useState<IngredientRow[]>([
    { stockId: "mat-1", quantity: 50 }, // Default flour
    { stockId: "mat-3", quantity: 15 }, // Default sugar
  ])

  // Overhead percentage option (15% standard)
  const [overheadPercent, setOverheadPercent] = React.useState<number>(15)

  React.useEffect(() => {
    let ignore = false
    recipeService
      .getAvailableMaterials()
      .then((mats) => {
        if (!ignore) {
          setAvailableMaterials(mats)
          setLoadingMaterials(false)
        }
      })
      .catch((err) => {
        console.error("Failed to load materials:", err)
        if (!ignore) setLoadingMaterials(false)
      })

    recipeService
      .getCategories()
      .then((cats) => {
        if (!ignore && cats.length > 0) {
          const names = cats.map((c) => c.name)
          setCategoriesList(names)
          setCategory((prev) => (prev ? prev : names[0]))
        }
      })
      .catch((err) => {
        console.error("Failed to load categories:", err)
      })

    return () => {
      ignore = true
    }
  }, [])

  function addIngredientRow() {
    const unusedMaterial = availableMaterials.find(
      (m) => !ingredients.some((row) => row.stockId === m.id)
    )
    const stockId = unusedMaterial ? unusedMaterial.id : (availableMaterials[0]?.id || "")
    setIngredients([...ingredients, { stockId, quantity: 10 }])
  }

  function updateIngredientRow(index: number, stockId: string, quantity: number) {
    const updated = [...ingredients]
    updated[index] = { stockId, quantity }
    setIngredients(updated)
  }

  function removeIngredientRow(index: number) {
    if (ingredients.length <= 1) {
      alert("Resep minimal membutuhkan 1 bahan baku utama.")
      return
    }
    setIngredients(ingredients.filter((_, idx) => idx !== index))
  }

  // Live Calculations (Automatic Price Derivation from HPP and Margin %)
  const calculations = React.useMemo(() => {
    let totalBOM = 0
    const items = ingredients.map((row) => {
      const mat = availableMaterials.find((m) => m.id === row.stockId)
      const unitCost = mat ? mat.avgCostPerUnit : 0
      const subtotal = row.quantity * unitCost
      totalBOM += subtotal
      return {
        ...row,
        material: mat,
        unitCost,
        subtotal,
      }
    })

    const overheadCost = (totalBOM * overheadPercent) / 100
    const estimatedHPP = totalBOM + overheadCost

    // Margin Pricing Formula:
    // Selling Price = HPP / (1 - Margin% / 100)
    const safeMargin = Math.min(95, Math.max(1, targetMargin))
    const rawPrice = estimatedHPP > 0 ? estimatedHPP / (1 - safeMargin / 100) : 0

    // Rounding to standard retail denomination (Rp 500, Rp 100, or Exact)
    const calculatedPrice = roundMode > 1
      ? Math.ceil(rawPrice / roundMode) * roundMode
      : Math.round(rawPrice)

    const grossProfit = calculatedPrice - estimatedHPP
    const actualMarginPercent = calculatedPrice > 0
      ? (grossProfit / calculatedPrice) * 100
      : safeMargin

    return {
      items,
      totalBOM,
      overheadCost,
      estimatedHPP,
      rawPrice,
      calculatedPrice,
      grossProfit,
      actualMarginPercent: Math.round(actualMarginPercent * 10) / 10,
    }
  }, [ingredients, availableMaterials, overheadPercent, targetMargin, roundMode])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError("Nama produk / resep wajib diisi")
      return
    }

    if (targetMargin <= 0 || targetMargin >= 100) {
      setError("Target margin harus di antara 1% sampai 95%")
      return
    }

    // Validate ingredients
    const validIngredients = ingredients.filter(
      (ing) => ing.stockId && ing.quantity > 0
    )
    if (validIngredients.length === 0) {
      setError("Tambahkan minimal 1 bahan baku dengan takaran lebih dari 0")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const activeCategory = (category === "Custom" || categoriesList.length === 0)
        ? (customCategory.trim() || "Umum")
        : (category || customCategory.trim() || "Umum")
      const payload: CreateProductInput = {
        name: name.trim(),
        category: activeCategory,
        unit: unit.trim() || "pcs",
        sellingPrice: calculations.calculatedPrice,
        targetMargin: Number(targetMargin),
        minStock: Number(minStock) || 10,
        description: description.trim(),
        initialIngredients: validIngredients.map((ing) => ({
          stockId: ing.stockId,
          quantity: Number(ing.quantity),
        })),
      }

      const created = await recipeService.createProduct(payload)
      // Navigate to created product recipe detail page
      navigate(`/production/recipes/${created.id}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menambahkan produk baru"
      setError(msg)
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-20 animate-in fade-in duration-300 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => navigate("/production/recipes")}
            className="rounded-xl h-10 w-10 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Tambah Produk & Resep Baru
              </h1>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs font-semibold">
                Margin-Driven Pricing
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Rancang komposisi bahan (BOM), tentukan target persentase margin keuntungan, dan sistem akan menghitung harga jual optimal secara otomatis.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/production/recipes")}
            className="rounded-xl"
            disabled={submitting}
          >
            Batal
          </Button>
          <Button
            type="submit"
            form="recipe-create-form"
            disabled={submitting}
            className="rounded-xl font-semibold shadow-sm bg-primary text-primary-foreground flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Simpan & Buat Produk</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 text-xs font-medium flex items-center gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form id="recipe-create-form" onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-6 w-full">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: IDENTITAS PRODUK & KOMPOSISI BAHAN (BOM)                     */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Section 1: Informasi Produk */}
          <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-card overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-border/50 bg-muted/20">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Factory className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">1. Identitas Produk</CardTitle>
                  <CardDescription className="text-xs">
                    Informasi produk, kategori, dan target margin keuntungan yang diinginkan.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {/* Product Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold">
                  Nama Produk / Resep <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Contoh: Roti Sobek Coklat Keju, Bolu Gulung Pandan..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl h-10 text-sm font-medium"
                  required
                />
              </div>

              {/* Category Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Kategori Produk</Label>
                {categoriesList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {categoriesList.map((cat) => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => {
                          setCategory(cat)
                          setCustomCategory("")
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                          category === cat
                            ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                            : "bg-muted/40 hover:bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setCategory("Custom")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                        category === "Custom"
                          ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                          : "bg-muted/40 hover:bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      + Tambah Kategori
                    </button>
                  </div>
                )}
                {(category === "Custom" || categoriesList.length === 0) && (
                  <Input
                    placeholder="Tulis nama kategori produk (misal: Roti, Minuman)..."
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="rounded-xl h-9 text-xs mt-2"
                  />
                )}
              </div>

              {/* Target Margin (%), Unit, Min Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* User Inputs ONLY the Margin % */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="targetMargin" className="text-xs font-semibold flex items-center gap-1">
                      Target Margin (%) <span className="text-red-500">*</span>
                    </Label>
                    <span className="text-[10px] text-primary font-mono font-semibold">Gross Profit</span>
                  </div>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="targetMargin"
                      type="number"
                      min="1"
                      max="95"
                      step="1"
                      value={targetMargin || ""}
                      onChange={(e) => setTargetMargin(Math.min(95, Math.max(1, Number(e.target.value))))}
                      className="pl-8 rounded-xl h-10 font-mono text-sm font-bold text-foreground"
                      placeholder="50"
                      required
                    />
                  </div>
                  {/* Quick percentage chips */}
                  <div className="flex items-center gap-1 pt-0.5">
                    {[35, 45, 50, 60, 70].map((pct) => (
                      <button
                        type="button"
                        key={pct}
                        onClick={() => setTargetMargin(pct)}
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md border transition-all ${
                          targetMargin === pct
                            ? "bg-primary text-primary-foreground border-primary font-bold"
                            : "bg-muted/60 text-muted-foreground border-border hover:bg-muted"
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="unit" className="text-xs font-semibold">
                    Satuan Jual
                  </Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between rounded-xl h-10 text-xs font-mono"
                      >
                        <span>{unit || "Pilih satuan"}</span>
                        <span className="text-muted-foreground text-[10px]">▼</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-36 rounded-xl">
                      <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase">
                        Pilihan Satuan
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {COMMON_UNITS.map((u) => (
                        <DropdownMenuItem
                          key={u}
                          onClick={() => setUnit(u)}
                          className="text-xs cursor-pointer"
                        >
                          {u}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="minStock" className="text-xs font-semibold">
                    Batas Minimum Stok
                  </Label>
                  <Input
                    id="minStock"
                    type="number"
                    min="0"
                    value={minStock || ""}
                    onChange={(e) => setMinStock(Number(e.target.value))}
                    className="rounded-xl h-10 font-mono text-sm"
                  />
                </div>
              </div>

              {/* Real-time Auto-Calculated Selling Price Banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-emerald-500/10 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-primary flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Harga Jual Otomatis Terhitung
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black font-mono text-foreground">
                      {formatCurrencyIdr(calculations.calculatedPrice)}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      /{unit}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 border-emerald-500/30 bg-emerald-500/10 ml-1 font-bold"
                    >
                      +{calculations.actualMarginPercent}% Margin
                    </Badge>
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground sm:text-right leading-tight">
                  <div>HPP per Unit: <strong className="text-foreground">{formatCurrencyIdr(calculations.estimatedHPP)}</strong></div>
                  <div>Target Margin: <strong className="text-primary font-bold">{targetMargin}%</strong></div>
                  <div className="text-[10px] text-muted-foreground/80 mt-0.5">
                    (Harga dihitung otomatis tanpa perlu ketik manual)
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5 pt-1">
                <Label htmlFor="description" className="text-xs font-semibold">
                  Deskripsi / Catatan Resep
                </Label>
                <Input
                  id="description"
                  placeholder="Karakteristik tekstur, suhu oven ideal, durasi proofing, porsi loyang..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-xl h-10 text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Komposisi Bahan Baku (BOM) */}
          <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-card overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-border/50 bg-muted/20 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">
                    2. Formula Bahan Baku (BOM)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Tentukan takaran bahan yang dibutuhkan untuk menghasilkan <strong>1 {unit}</strong> produk.
                  </CardDescription>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addIngredientRow}
                className="rounded-xl text-xs flex items-center gap-1.5 border-dashed border-primary/40 text-primary hover:bg-primary/5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Bahan</span>
              </Button>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {loadingMaterials ? (
                <div className="flex items-center justify-center p-8 text-xs text-muted-foreground gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memuat daftar bahan baku dari gudang...</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {ingredients.map((row, idx) => {
                    const selectedMat = availableMaterials.find((m) => m.id === row.stockId)
                    const unitCost = selectedMat?.avgCostPerUnit || 0
                    const subtotal = row.quantity * unitCost

                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-muted/30 border border-border/70 flex flex-col sm:flex-row items-start sm:items-center gap-3 transition-all hover:bg-muted/50"
                      >
                        {/* Number Index */}
                        <span className="h-6 w-6 rounded-lg bg-muted text-muted-foreground text-[11px] font-mono font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>

                        {/* Material Selector */}
                        <div className="flex-1 min-w-[200px] w-full sm:w-auto">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full justify-between rounded-xl h-10 text-xs bg-background"
                              >
                                <span className="font-semibold truncate">
                                  {selectedMat?.name || "Pilih Bahan Baku..."}
                                </span>
                                <span className="text-[10px] text-muted-foreground ml-1">
                                  ({selectedMat ? formatCurrencyIdr(selectedMat.avgCostPerUnit) + "/" + selectedMat.baseUnit : ""}) ▼
                                </span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-72 max-h-64 overflow-y-auto rounded-xl">
                              <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase">
                                Bahan Baku Tersedia di Gudang
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {availableMaterials.map((m) => (
                                <DropdownMenuItem
                                  key={m.id}
                                  onClick={() => updateIngredientRow(idx, m.id, row.quantity)}
                                  className="cursor-pointer text-xs flex items-center justify-between"
                                >
                                  <div>
                                    <div className="font-medium">{m.name}</div>
                                    <div className="text-[10px] text-muted-foreground">
                                      Stok: {m.currentStock} {m.baseUnit}
                                    </div>
                                  </div>
                                  <span className="font-mono text-[11px] font-semibold text-primary">
                                    {formatCurrencyIdr(m.avgCostPerUnit)}/{m.baseUnit}
                                  </span>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Quantity & Unit */}
                        <div className="flex items-center gap-1.5 w-full sm:w-36">
                          <Input
                            type="number"
                            min="0.1"
                            step="any"
                            value={row.quantity || ""}
                            onChange={(e) => updateIngredientRow(idx, row.stockId, Number(e.target.value))}
                            placeholder="Takaran"
                            className="rounded-xl h-10 text-xs font-mono font-bold bg-background text-right"
                            required
                          />
                          <span className="text-xs font-mono font-medium text-muted-foreground shrink-0 w-8">
                            {selectedMat?.baseUnit || "unit"}
                          </span>
                        </div>

                        {/* Subtotal Cost */}
                        <div className="w-full sm:w-32 text-right">
                          <span className="text-[10px] text-muted-foreground block sm:hidden">
                            Subtotal:
                          </span>
                          <span className="font-mono text-xs font-bold text-foreground">
                            {formatCurrencyIdr(subtotal)}
                          </span>
                        </div>

                        {/* Delete Button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeIngredientRow(idx)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0 self-end sm:self-auto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/50">
                <span>Total item bahan: {ingredients.length}</span>
                <span className="font-medium text-foreground">
                  Subtotal Bahan Baku:{" "}
                  <strong className="text-primary font-mono text-sm">
                    {formatCurrencyIdr(calculations.totalBOM)}
                  </strong>
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: SIMULASI HPP & PROYEKSI MARGIN KEUNTUNGAN                   */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* Card: Kalkulator & Simulasi Margin */}
          <Card className="rounded-2xl border-slate-200/80 shadow-md bg-card overflow-hidden sticky top-20">
            <CardHeader className="p-5 pb-3 border-b border-border/50 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary text-primary-foreground">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold">Simulasi HPP & Laba</CardTitle>
                    <CardDescription className="text-xs">
                      Perhitungan real-time per 1 {unit} produk.
                    </CardDescription>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`font-mono text-xs font-bold ${
                    calculations.actualMarginPercent >= 50
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                      : calculations.actualMarginPercent >= 30
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                      : "bg-red-500/10 text-red-600 border-red-500/30"
                  }`}
                >
                  +{calculations.actualMarginPercent}% Margin
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {/* Calculated Price Header Display */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider block">
                    Harga Jual Otomatis (Margin {targetMargin}%)
                  </span>
                  <span className="text-2xl font-black font-mono text-foreground">
                    {formatCurrencyIdr(calculations.calculatedPrice)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-slate-400" />
                    Biaya Bahan Baku (BOM):
                  </span>
                  <span className="font-mono font-bold text-foreground">
                    {formatCurrencyIdr(calculations.totalBOM)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    Estimasi Overhead (+{overheadPercent}%):
                  </span>
                  <span className="font-mono font-bold text-amber-600">
                    +{formatCurrencyIdr(calculations.overheadCost)}
                  </span>
                </div>

                {/* Overhead percentage buttons */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-muted-foreground">Opsi Overhead:</span>
                  {[10, 15, 20].map((pct) => (
                    <button
                      type="button"
                      key={pct}
                      onClick={() => setOverheadPercent(pct)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md border transition-all ${
                        overheadPercent === pct
                          ? "bg-amber-500 text-white border-amber-600 font-bold"
                          : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>

                <div className="h-[1px] bg-border my-2" />

                <div className="flex items-center justify-between text-sm pt-0.5">
                  <span className="font-bold text-foreground">
                    Estimasi Total HPP:
                  </span>
                  <span className="font-mono font-black text-base text-primary">
                    {formatCurrencyIdr(calculations.estimatedHPP)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Target Margin:</span>
                  <span className="font-mono font-bold text-primary">
                    {targetMargin}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-foreground">
                    Estimasi Laba Kotor:
                  </span>
                  <span
                    className={`font-mono font-black text-base ${
                      calculations.grossProfit > 0 ? "text-emerald-600" : "text-destructive"
                    }`}
                  >
                    +{formatCurrencyIdr(calculations.grossProfit)} / {unit}
                  </span>
                </div>

                {/* Rounding option toggle */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-[10px] text-muted-foreground">Pembulatan Harga:</span>
                  <div className="flex items-center gap-1">
                    {[
                      { label: "Rp 500", val: 500 },
                      { label: "Rp 100", val: 100 },
                      { label: "Eksak", val: 1 },
                    ].map((r) => (
                      <button
                        type="button"
                        key={r.label}
                        onClick={() => setRoundMode(r.val)}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md border transition-all ${
                          roundMode === r.val
                            ? "bg-primary text-primary-foreground border-primary font-bold"
                            : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Profitability Health Callout */}
              <div
                className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                  calculations.actualMarginPercent >= 50
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : calculations.actualMarginPercent >= 30
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-red-50 text-red-800 border-red-200"
                }`}
              >
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    {calculations.actualMarginPercent >= 50 ? (
                      <span>
                        <strong>Margin Sangat Sehat (+{calculations.actualMarginPercent}%).</strong> Harga jual otomatis memberikan ruang keuntungan yang sangat aman untuk menyerap fluktuasi harga bahan baku.
                      </span>
                    ) : calculations.actualMarginPercent >= 30 ? (
                      <span>
                        <strong>Margin Standar (+{calculations.actualMarginPercent}%).</strong> Cocok untuk volume produksi retail harian. Pantau pemborosan adonan (*scrap*) saat memasak.
                      </span>
                    ) : (
                      <span>
                        <strong>Margin Tipis ({calculations.actualMarginPercent}%).</strong> Pertimbangkan untuk menaikkan target margin agar tidak berisiko merugi akibat biaya operasional.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Simulation Batch Preview */}
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 space-y-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Proyeksi 1 Batch Produksi (50 {unit})
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground text-[10px] block">Total Biaya Bahan:</span>
                    <span className="font-mono font-semibold">
                      {formatCurrencyIdr(calculations.totalBOM * 50)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] block">Potensi Omzet:</span>
                    <span className="font-mono font-semibold text-foreground">
                      {formatCurrencyIdr(calculations.calculatedPrice * 50)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] block">Estimasi HPP Total:</span>
                    <span className="font-mono font-semibold text-primary">
                      {formatCurrencyIdr(calculations.estimatedHPP * 50)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] block">Estimasi Laba Kotor:</span>
                    <span className="font-mono font-semibold text-emerald-600 font-bold">
                      +{formatCurrencyIdr(calculations.grossProfit * 50)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Buttons */}
              <div className="pt-2 space-y-2">
                <Button
                  type="submit"
                  form="recipe-create-form"
                  disabled={submitting}
                  className="w-full rounded-xl h-11 font-semibold shadow-sm bg-primary text-primary-foreground flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Menyimpan Produk...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Simpan Produk</span>
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/production/recipes")}
                  className="w-full rounded-xl h-10 text-xs"
                  disabled={submitting}
                >
                  Batal & Kembali ke Katalog
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
