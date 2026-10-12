import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeft,
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
  Package,
  Calculator,
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
import { FormattedNumberInput } from "@/components/ui/formatted-number-input"
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
import type { RawMaterialStock, CreateProductInput, ProductMode, ProductCategory } from "@/features/recipes/types"
import { ImageUploadDropzone } from "@/features/recipes/components/image-upload-dropzone"

function formatCurrencyIdr(val: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val)
}

interface IngredientRow {
  stockId: string
  quantity: number | ""
  recipeUnit?: string
}

function getCompatibleUnits(baseUnit?: string): string[] {
  if (!baseUnit) return ["satuan"]
  const bu = baseUnit.toLowerCase()
  if (bu === "kg" || bu === "g") return ["g", "kg"]
  if (bu === "l" || bu === "ml") return ["ml", "L"]
  return [baseUnit]
}

function getQuantityInBaseUnit(qty: number, recipeUnit?: string, baseUnit?: string): number {
  if (!baseUnit || !recipeUnit || recipeUnit.toLowerCase() === baseUnit.toLowerCase()) {
    return qty
  }
  const ru = recipeUnit.toLowerCase()
  const bu = baseUnit.toLowerCase()
  if (bu === "kg" && ru === "g") return qty / 1000
  if (bu === "g" && ru === "kg") return qty * 1000
  if (bu === "l" && ru === "ml") return qty / 1000
  if (bu === "ml" && ru === "l") return qty * 1000
  return qty
}

function getCostPerRecipeUnit(baseCost: number, recipeUnit?: string, baseUnit?: string): number {
  if (!baseUnit || !recipeUnit || recipeUnit.toLowerCase() === baseUnit.toLowerCase()) {
    return baseCost
  }
  const ru = recipeUnit.toLowerCase()
  const bu = baseUnit.toLowerCase()
  if (bu === "kg" && ru === "g") return baseCost / 1000
  if (bu === "g" && ru === "kg") return baseCost * 1000
  if (bu === "l" && ru === "ml") return baseCost / 1000
  if (bu === "ml" && ru === "l") return baseCost * 1000
  return baseCost
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
  const [categories, setCategories] = React.useState<ProductCategory[]>([])
  const [categoryId, setCategoryId] = React.useState<string>("")
  const [customCategory, setCustomCategory] = React.useState<string>("")
  const [unit, setUnit] = React.useState<string>("pcs")

  // Phase 2 New Fields
  const [mode, setMode] = React.useState<ProductMode>("MAKE_TO_STOCK")
  const yieldQty = 1
  const wastePct = 0
  const [imageUrl, setImageUrl] = React.useState<string | null>(null)

  // Target Margin (%) Input by User - Selling Price is derived automatically!
  const [targetMargin, setTargetMargin] = React.useState<number | "">(50)
  const [roundMode, setRoundMode] = React.useState<number>(500) // Default round up to nearest Rp 500

  const [minStock, setMinStock] = React.useState<number | "">(10)
  const [description, setDescription] = React.useState<string>("")

  // Ingredient Rows - starts empty from 0
  const [ingredients, setIngredients] = React.useState<IngredientRow[]>([])

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
          setCategories(cats)
          setCategoryId(cats[0].id)
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
    const selectedMat = unusedMaterial || availableMaterials[0]
    const stockId = selectedMat?.id || ""
    const bu = selectedMat?.baseUnit?.toLowerCase()
    const defaultUnit = bu === "kg" ? "g" : (bu === "l" ? "ml" : (selectedMat?.baseUnit || "satuan"))
    setIngredients([...ingredients, { stockId, quantity: 10, recipeUnit: defaultUnit }])
  }

  function updateIngredientRow(index: number, stockId: string, quantity: number | "", recipeUnit?: string) {
    const updated = [...ingredients]
    const mat = availableMaterials.find((m) => m.id === stockId)
    const bu = mat?.baseUnit?.toLowerCase()
    const fallbackUnit = bu === "kg" ? "g" : (bu === "l" ? "ml" : (mat?.baseUnit || "satuan"))
    const unit = recipeUnit || updated[index]?.recipeUnit || fallbackUnit
    updated[index] = { stockId, quantity, recipeUnit: unit }
    setIngredients(updated)
  }

  function removeIngredientRow(index: number) {
    setIngredients(ingredients.filter((_, idx) => idx !== index))
  }

  // Live Calculations (Automatic Price Derivation from Yield, Waste%, Overheads, and Margin %)
  const calculations = React.useMemo(() => {
    let totalRawMaterials = 0
    const items = ingredients.map((row) => {
      const mat = availableMaterials.find((m) => m.id === row.stockId)
      const baseCost = mat ? mat.avgCostPerUnit : 0
      const bu = mat?.baseUnit?.toLowerCase()
      const fallbackUnit = bu === "kg" ? "g" : (bu === "l" ? "ml" : (mat?.baseUnit || "satuan"))
      const activeUnit = row.recipeUnit || fallbackUnit
      const unitCost = getCostPerRecipeUnit(baseCost, activeUnit, mat?.baseUnit)
      const subtotal = (Number(row.quantity) || 0) * unitCost
      totalRawMaterials += subtotal
      return {
        ...row,
        material: mat,
        activeUnit,
        unitCost,
        subtotal,
      }
    })

    const safeYield = yieldQty > 0 ? yieldQty : 1
    const safeWaste = wastePct >= 0 ? wastePct : 0

    // BOM cost per unit = (totalRawMaterials / safeYield) * (1 + safeWaste / 100)
    const bomCostPerUnit = (totalRawMaterials / safeYield) * (1 + safeWaste / 100)
    const estimatedHPP = bomCostPerUnit

    // Margin Pricing Formula: Selling Price = HPP / (1 - Margin% / 100)
    const safeMargin = Math.min(95, Math.max(1, Number(targetMargin) || 1))
    const rawPrice = estimatedHPP > 0 ? estimatedHPP / (1 - safeMargin / 100) : 0

    // Rounding
    const calculatedPrice = roundMode > 1
      ? Math.ceil(rawPrice / roundMode) * roundMode
      : Math.round(rawPrice)

    const grossProfit = calculatedPrice - estimatedHPP
    const actualMarginPercent = calculatedPrice > 0
      ? (grossProfit / calculatedPrice) * 100
      : safeMargin
    const actualMarkupPercent = estimatedHPP > 0
      ? (grossProfit / estimatedHPP) * 100
      : 0

    return {
      items,
      totalRawMaterials,
      bomCostPerUnit,
      overheadCostPerUnit: 0,
      estimatedHPP,
      rawPrice,
      calculatedPrice,
      grossProfit,
      actualMarginPercent: Math.round(actualMarginPercent * 10) / 10,
      actualMarkupPercent: Math.round(actualMarkupPercent * 10) / 10,
    }
  }, [name, ingredients, availableMaterials, yieldQty, wastePct, targetMargin, roundMode])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError("Nama produk wajib diisi")
      return
    }

    if (Number(targetMargin) <= 0 || Number(targetMargin) >= 100) {
      setError("Target margin harus di antara 1% sampai 95%")
      return
    }

    // Validate ingredients
    const validIngredients = ingredients.filter(
      (ing) => ing.stockId && Number(ing.quantity) > 0
    )
    if (validIngredients.length === 0) {
      setError("Tambahkan minimal 1 bahan baku dengan takaran lebih dari 0")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const selectedCat = categories.find((c) => c.id === categoryId)
      const activeCategoryName = categoryId === "Custom"
        ? (customCategory.trim() || "Umum")
        : (selectedCat?.name || customCategory.trim() || "Umum")

      const payload: CreateProductInput = {
        name: name.trim(),
        category: activeCategoryName,
        categoryId: categoryId !== "Custom" ? categoryId : undefined,
        unit: unit.trim() || "pcs",
        mode,
        yieldQty: Number(yieldQty) || 1,
        wastePct: Number(wastePct) || 0,
        imageUrl,
        sellingPrice: calculations.calculatedPrice,
        targetMargin: Number(targetMargin) || 50,
        minStock: minStock === "" ? 0 : (Number(minStock) || 0),
        description: description.trim(),
        initialIngredients: validIngredients.map((ing) => {
          const mat = availableMaterials.find((m) => m.id === ing.stockId)
          const baseQty = getQuantityInBaseUnit(Number(ing.quantity), ing.recipeUnit, mat?.baseUnit)
          return {
            stockId: ing.stockId,
            quantity: Number(baseQty),
          }
        }),
      }

      const created = await recipeService.createProduct(payload)
      // Navigate to created product recipe detail page
      navigate(`/production/products/${created.id}`)
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
            onClick={() => navigate("/production/products")}
            className="rounded-xl h-10 w-10 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Buat Produk & Resep Baru
              </h1>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs font-semibold">
                Margin-Driven Pricing
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Tentukan identitas produk, susun kebutuhan bahan baku (resep), dan tentukan margin keuntungan untuk menghitung harga jual optimal.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/production/products")}
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
                <span>Simpan Produk & Resep</span>
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
        {/* LEFT COLUMN: IDENTITAS PRODUK, RESEP BAHAN & PERHITUNGAN MARGIN           */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Section 1: Informasi Produk */}
          <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-card overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-border/50 bg-muted/20">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">1. Informasi Produk yang Dibuat</CardTitle>
                  <CardDescription className="text-xs">
                    Nama produk, kategori, satuan penjualan, dan batas minimum stok persediaan.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {/* Product Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold">
                  Nama Produk <span className="text-red-500">*</span>
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
              <div className="space-y-1.5 pt-1">
                <Label className="text-xs font-semibold">Kategori Produk</Label>
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {categories.map((cat) => (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => {
                          setCategoryId(cat.id)
                          setCustomCategory("")
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                          categoryId === cat.id
                            ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                            : "bg-muted/40 hover:bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setCategoryId("Custom")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                        categoryId === "Custom"
                          ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                          : "bg-muted/40 hover:bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      + Tambah Kategori
                    </button>
                  </div>
                )}
                {(categoryId === "Custom" || categories.length === 0) && (
                  <Input
                    placeholder="Tulis nama kategori produk (misal: Roti, Minuman)..."
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="rounded-xl h-9 text-xs mt-2"
                  />
                )}
              </div>

              {/* Product Photo Upload */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Foto Produk</Label>
                <ImageUploadDropzone
                  value={imageUrl}
                  onChange={(url) => setImageUrl(url)}
                  disabled={submitting}
                />
              </div>

              {/* Product Mode Toggle */}
              <div className="space-y-1.5 pt-1">
                <Label className="text-xs font-semibold">Model Produksi (Product Mode)</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMode("MAKE_TO_STOCK")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      mode === "MAKE_TO_STOCK"
                        ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-foreground">Make to Stock (MTS)</span>
                      <Badge variant="outline" className="text-[10px] font-mono">MTS</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                      Diproduksi massal untuk stok etalase/rak sebelum ada pesanan pelanggan.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode("MAKE_TO_ORDER")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      mode === "MAKE_TO_ORDER"
                        ? "border-purple-600 bg-purple-50 ring-1 ring-purple-600 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-foreground">Make to Order (MTO)</span>
                      <Badge variant="outline" className="text-[10px] font-mono text-purple-700 border-purple-200">MTO</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                      Dibuat berdasarkan pesanan (custom cake, katering, pre-order).
                    </p>
                  </button>
                </div>
              </div>

              {/* Metode Pengurangan Stok (FIFO) */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <div className="font-semibold text-blue-950 flex items-center gap-1.5">
                    Metode Pengurangan Stok: <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 font-mono text-[10px] px-1.5 py-0">FIFO</Badge>
                  </div>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    Pengurangan stok bahan baku dan batch produk otomatis menggunakan sistem <strong>First In, First Out (FIFO)</strong> berdasarkan tanggal penerimaan/produksi terlama.
                  </p>
                </div>
              </div>

              {/* Satuan Jual & Batas Minimum Stok */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="unit" className="text-xs font-semibold">
                    Satuan Hasil / Penjualan
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
                    Batas Minimum Stok ({unit})
                  </Label>
                  <FormattedNumberInput
                    id="minStock"
                    min={0}
                    value={minStock}
                    onChange={(val) => setMinStock(val === "" ? "" : Number(val))}
                    className="rounded-xl h-10 font-mono text-sm"
                    placeholder="Contoh: 10"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5 pt-1">
                <Label htmlFor="description" className="text-xs font-semibold">
                  Deskripsi / Catatan Produk
                </Label>
                <Input
                  id="description"
                  placeholder="Karakteristik tekstur, saran penyimpanan, porsi sajian..."
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
                    2. Resep & Komposisi Bahan Baku (BOM)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Tentukan takaran bahan baku yang dibutuhkan untuk menghasilkan <strong>1 {unit}</strong> produk.
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
              ) : ingredients.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-border/70 rounded-2xl flex flex-col items-center justify-center gap-3 bg-muted/10">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-foreground">Mulai Racik Resep Bahan Baku</h4>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      Daftar bahan masih kosong. Klik tombol <strong>"Tambah Bahan"</strong> untuk memilih bahan baku dan menentukan takarannya.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addIngredientRow}
                    className="rounded-xl text-xs flex items-center gap-1.5 border-dashed border-primary/40 text-primary hover:bg-primary/5 mt-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah Bahan Baku</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {ingredients.map((row, idx) => {
                    const selectedMat = availableMaterials.find((m) => m.id === row.stockId)
                    const baseCost = selectedMat ? selectedMat.avgCostPerUnit : 0
                    const bu = selectedMat?.baseUnit?.toLowerCase()
                    const fallbackUnit = bu === "kg" ? "g" : (bu === "l" ? "ml" : (selectedMat?.baseUnit || "satuan"))
                    const activeUnit = row.recipeUnit || fallbackUnit
                    const unitCost = getCostPerRecipeUnit(baseCost, activeUnit, selectedMat?.baseUnit)
                    const subtotal = (Number(row.quantity) || 0) * unitCost
                    const compatibleUnits = getCompatibleUnits(selectedMat?.baseUnit)

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
                                  ({selectedMat ? (
                                    selectedMat.baseUnit.toLowerCase() === "kg"
                                      ? `${formatCurrencyIdr(selectedMat.avgCostPerUnit)}/kg (${formatCurrencyIdr(selectedMat.avgCostPerUnit / 1000)}/g)`
                                      : `${formatCurrencyIdr(selectedMat.avgCostPerUnit)}/${selectedMat.baseUnit}`
                                  ) : ""}) ▼
                                </span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-80 max-h-64 overflow-y-auto rounded-xl">
                              <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase">
                                Bahan Baku Tersedia di Gudang
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {availableMaterials.map((m) => {
                                const isKg = m.baseUnit.toLowerCase() === "kg"
                                return (
                                  <DropdownMenuItem
                                    key={m.id}
                                    onClick={() => updateIngredientRow(idx, m.id, row.quantity)}
                                    className="cursor-pointer text-xs flex items-center justify-between py-2"
                                  >
                                    <div>
                                      <div className="font-semibold text-foreground">{m.name}</div>
                                      <div className="text-[10px] text-muted-foreground">
                                        Stok: {m.currentStock} {m.baseUnit}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <span className="font-mono text-[11px] font-bold text-primary block">
                                        {formatCurrencyIdr(m.avgCostPerUnit)}/{m.baseUnit}
                                      </span>
                                      {isKg && (
                                        <span className="text-[9px] font-mono text-muted-foreground block">
                                          ({formatCurrencyIdr(m.avgCostPerUnit / 1000)}/g)
                                        </span>
                                      )}
                                    </div>
                                  </DropdownMenuItem>
                                )
                              })}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Quantity & Unit Selector */}
                        <div className="flex items-center gap-1.5 w-full sm:w-44">
                          <FormattedNumberInput
                            allowDecimal
                            maxDecimals={4}
                            min={0.001}
                            value={row.quantity}
                            onChange={(val) => updateIngredientRow(idx, row.stockId, val === "" ? "" : Number(val), activeUnit)}
                            placeholder="Takaran"
                            className="rounded-xl h-10 text-xs font-mono font-bold bg-background text-right"
                            required
                          />

                          {compatibleUnits.length > 1 ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-10 px-2 rounded-xl font-mono text-xs font-semibold shrink-0"
                                >
                                  <span>{activeUnit}</span>
                                  <span className="text-[9px] text-muted-foreground ml-1">▼</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-20 rounded-xl">
                                {compatibleUnits.map((u) => (
                                  <DropdownMenuItem
                                    key={u}
                                    onClick={() => updateIngredientRow(idx, row.stockId, row.quantity, u)}
                                    className="font-mono text-xs font-semibold cursor-pointer"
                                  >
                                    {u}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <span className="text-xs font-mono font-medium text-muted-foreground shrink-0 w-8 text-center">
                              {selectedMat?.baseUnit || "unit"}
                            </span>
                          )}
                        </div>

                        {/* Subtotal Cost */}
                        <div className="w-full sm:w-36 text-right">
                          <span className="text-[10px] text-muted-foreground block sm:hidden">
                            Subtotal:
                          </span>
                          <span className="font-mono text-xs font-bold text-foreground block">
                            {formatCurrencyIdr(subtotal)}
                          </span>
                          <span className="text-[9px] font-mono text-muted-foreground block">
                            @{formatCurrencyIdr(unitCost)}/{activeUnit}
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
                  Subtotal Bahan per Batch:{" "}
                  <strong className="text-primary font-mono text-sm">
                    {formatCurrencyIdr(calculations.totalRawMaterials)}
                  </strong>
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Perhitungan HPP & Penetapan Margin Keuntungan */}
          <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-card overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-border/50 bg-muted/20">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
                  <Calculator className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">
                    3. Perhitungan HPP & Penetapan Margin
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Setelah bahan baku diatur, tetapkan target margin untuk menghasilkan harga jual optimal per 1 {unit}. Biaya overhead dihitung dinamis saat batch produksi.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {calculations.totalRawMaterials === 0 ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2.5">
                  <Info className="h-4 w-4 shrink-0" />
                  <span>
                    Tambahkan bahan baku di <strong>Bagian 2 (Resep)</strong> di atas untuk mulai melihat kalkulasi HPP dan menentukan margin keuntungan.
                  </span>
                </div>
              ) : null}

              {/* Ringkasan Biaya Dasar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                    Bahan Baku (BOM / Unit)
                  </span>
                  <span className="text-lg font-mono font-bold text-foreground block mt-0.5">
                    {formatCurrencyIdr(calculations.bomCostPerUnit)}
                  </span>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                    Metode Stok: FIFO
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20">
                  <span className="text-[10px] text-primary uppercase font-bold tracking-wider block">
                    Estimasi HPP per {unit}
                  </span>
                  <span className="text-lg font-mono font-black text-primary block mt-0.5">
                    {formatCurrencyIdr(calculations.estimatedHPP)}
                  </span>
                  <span className="text-[10px] text-primary/80 block mt-0.5">
                    HPP Bahan Baku (BOM)
                  </span>
                </div>
              </div>

              {/* Target Margin (%) Input */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="targetMargin" className="text-xs font-semibold flex items-center gap-1">
                    Target Margin Keuntungan (%) <span className="text-red-500">*</span>
                  </Label>
                  <span className="text-[10px] text-primary font-mono font-semibold">
                    Gross Profit Margin berbasis HPP
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <FormattedNumberInput
                      id="targetMargin"
                      min={1}
                      max={95}
                      value={targetMargin}
                      onChange={(val) => setTargetMargin(val === "" ? "" : Math.min(95, Math.max(1, Number(val))))}
                      className="pl-8 rounded-xl h-10 font-mono text-sm font-bold text-foreground"
                      placeholder="50"
                      required
                    />
                  </div>

                  {/* Quick percentage chips */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">Pilihan Cepat:</span>
                    {[35, 45, 50, 60, 70].map((pct) => (
                      <button
                        type="button"
                        key={pct}
                        onClick={() => setTargetMargin(pct)}
                        className={`text-xs font-mono px-2 py-1 rounded-lg border transition-all ${
                          targetMargin === pct
                            ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                            : "bg-muted/60 text-muted-foreground border-border hover:bg-muted"
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Real-time Auto-Calculated Selling Price Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-emerald-500/10 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-primary flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Harga Jual Rekomendasi (Otomatis)
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-foreground">
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

                <div className="text-xs text-muted-foreground sm:text-right space-y-0.5">
                  <div>Modal HPP: <strong className="text-foreground font-mono">{formatCurrencyIdr(calculations.estimatedHPP)}</strong></div>
                  <div>Potensi Laba Kotor: <strong className="text-emerald-600 font-mono font-bold">+{formatCurrencyIdr(calculations.grossProfit)}</strong></div>
                  <div className="text-[10px] text-muted-foreground/80 pt-0.5">
                    Formula: HPP / (1 - {targetMargin}%)
                  </div>
                </div>
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
                    <CardTitle className="text-base font-bold">Ringkasan Finansial Produk</CardTitle>
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
                      {formatCurrencyIdr(calculations.bomCostPerUnit * 50)}
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
                      <span>Simpan Produk & Resep</span>
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/production/products")}
                  className="w-full rounded-xl h-10 text-xs"
                  disabled={submitting}
                >
                  Batal & Kembali ke Daftar Produk
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
