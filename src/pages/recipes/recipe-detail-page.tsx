import { getCompatibleUnits, getQuantityInBaseUnit } from '@/lib/units'
import * as React from "react"
import { useParams, Link, useNavigate, useLocation } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { recipeKeys } from "@/features/recipes/hooks"
import {
  ArrowLeft,
  Factory,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Calculator,
  History,
  Info,
  Scale,
  DollarSign,
  Loader2,
  ChevronDown,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"

import { recipeService } from "@/features/recipes/services/recipe-service"
import type {
  Product,
  RecipeIngredient,
  RawMaterialStock,
  UpdateProductInput,
} from "@/features/recipes/types"
import { ImageUploadDropzone } from "@/features/recipes/components/image-upload-dropzone"
import { overheadService } from "@/features/overheads/services/overhead-service"
import type { OverheadType } from "@/features/overheads/types"
import { CurrencyText, formatCurrency } from "@/components/ui/currency-text"

function calculateGrossMargin(sellingPrice: number, cost: number): number {
  if (!sellingPrice || sellingPrice <= 0) return 0
  const margin = ((sellingPrice - cost) / sellingPrice) * 100
  return Math.round(margin * 10) / 10
}

export default function RecipeDetailPage() {
  const location = useLocation()
  const returnToValue: unknown = location.state?.returnTo
  const returnTo = typeof returnToValue === "string" && /^\/production\/products(?:\?|$)/.test(returnToValue) ? returnToValue : "/production/products"
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [product, setProduct] = React.useState<Product | null>(null)
  const [availableMaterials, setAvailableMaterials] = React.useState<RawMaterialStock[]>([])
  const [loading, setLoading] = React.useState<boolean>(true)

  // Modals & Tabs
  const [activeTab, setActiveTab] = React.useState<string>("info")
  const [isAddIngredientOpen, setIsAddIngredientOpen] = React.useState<boolean>(false)
  const [isEditIngredientOpen, setIsEditIngredientOpen] = React.useState<boolean>(false)
  const [isDeleteProductOpen, setIsDeleteProductOpen] = React.useState<boolean>(false)
  const [submitting, setSubmitting] = React.useState<boolean>(false)

  // Ingredient Form State
  const [selectedStockId, setSelectedStockId] = React.useState<string>("")
  const [ingredientUnit, setIngredientUnit] = React.useState("")
  const [ingredientQty, setIngredientQty] = React.useState<string>("")
  const [editingIngredient, setEditingIngredient] = React.useState<RecipeIngredient | null>(null)
  const [ingredientError, setIngredientError] = React.useState<string>("")

  // Product Edit Form State
  const [editProductData, setEditProductData] = React.useState<UpdateProductInput>({})
  const [editMargin, setEditMargin] = React.useState<number>(50)
  const [editProductError, setEditProductError] = React.useState<string>("")

  // Phase 2 State: Active Store Master Overheads & Simulator
  const [masterOverheads, setMasterOverheads] = React.useState<OverheadType[]>([])

  // Production Simulator State
  const [simTargetUnits, setSimTargetUnits] = React.useState<number>(50)
  const [simOverheadRates, setSimOverheadRates] = React.useState<Record<string, number>>({})

  React.useEffect(() => {
    if (!productId) return
    let ignore = false

    Promise.all([
      recipeService.getProductById(productId),
      recipeService.getAvailableMaterials(),
      overheadService.getOverheads({ activeOnly: true }),
    ])
      .then(([prod, mats, masterOhs]) => {
        if (!ignore) {
          setProduct(prod)
          setAvailableMaterials(mats)
          setMasterOverheads(masterOhs)
          // Initialize simOverheadRates from store master overheads
          const initialRates: Record<string, number> = {}
          masterOhs.forEach((oh) => {
            initialRates[oh.id] = oh.defaultAmount ?? 0
          })
          setSimOverheadRates(initialRates)

          const computedMargin = prod.targetMargin || (prod.sellingPrice > 0 ? calculateGrossMargin(prod.sellingPrice, prod.latestHpp || 0) : 50)
          setEditMargin(Math.round(computedMargin))
          setEditProductData({
            name: prod.name,
            category: prod.category,
            categoryId: prod.categoryId,
            unit: prod.unit,
            mode: prod.mode,
            yieldQty: prod.yieldQty,
            wastePct: prod.wastePct,
            imageUrl: prod.imageUrl,
            sellingPrice: prod.sellingPrice,
            targetMargin: Math.round(computedMargin),
            minStock: prod.minStock,
            description: prod.description,
          })
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error("Failed to load product recipe detail:", err)
        if (!ignore) {
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [productId])

  // Total ingredient cost per unit
  const totalBOMCost = React.useMemo(() => {
    if (!product) return 0
    return product.ingredients.reduce((acc, curr) => acc + curr.subtotalCost, 0)
  }, [product])

  // Current active HPP (from latest batch or BOM)
  const activeHpp = product?.latestHpp || totalBOMCost
  const marginPercentage = product ? calculateGrossMargin(product.sellingPrice, activeHpp) : 0

  // Selected material info for modal
  const selectedMaterial = availableMaterials.find((m) => m.id === selectedStockId)
  const addedUnitCostPreview = selectedMaterial && Number(ingredientQty) > 0
    ? getQuantityInBaseUnit(Number(ingredientQty), ingredientUnit, selectedMaterial.baseUnit) * selectedMaterial.avgCostPerUnit
    : 0

  // Handle Add Ingredient Submit
  async function handleAddIngredient(e: React.FormEvent) {
    e.preventDefault()
    if (!productId || !selectedStockId) {
      setIngredientError("Silakan pilih bahan baku")
      return
    }
    const qty = getQuantityInBaseUnit(Number(ingredientQty), ingredientUnit, selectedMaterial?.baseUnit || "")
    if (isNaN(qty) || qty <= 0) {
      setIngredientError("Jumlah takaran harus lebih dari 0")
      return
    }

    setSubmitting(true)
    setIngredientError("")
    try {
      const updated = await recipeService.addIngredient(productId, {
        stockId: selectedStockId,
        quantity: qty,
      })
      setProduct(updated)
      setIsAddIngredientOpen(false)
      setSelectedStockId("")
      setIngredientQty(""); setIngredientUnit("")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menambahkan bahan baku"
      setIngredientError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Edit Ingredient Submit
  async function handleEditIngredient(e: React.FormEvent) {
    e.preventDefault()
    if (!productId || !editingIngredient) return
    const qty = getQuantityInBaseUnit(Number(ingredientQty), ingredientUnit, editingIngredient.baseUnit)
    if (isNaN(qty) || qty <= 0) {
      setIngredientError("Jumlah takaran harus lebih dari 0")
      return
    }

    setSubmitting(true)
    setIngredientError("")
    try {
      const updated = await recipeService.updateIngredientQuantity(productId, editingIngredient.id, qty)
      setProduct(updated)
      setIsEditIngredientOpen(false)
      setEditingIngredient(null)
      setIngredientQty(""); setIngredientUnit("")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengupdate takaran bahan"
      setIngredientError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Remove Ingredient
  async function handleRemoveIngredient(ingredientId: string) {
    if (!productId) return
    try {
      const updated = await recipeService.removeIngredient(productId, ingredientId)
      setProduct(updated)
    } catch (err) {
      console.error("Failed to remove ingredient:", err)
    }
  }

  // Handle Update Product Info
  async function handleUpdateProduct(e: React.FormEvent) {
    e.preventDefault()
    if (!productId) return
    if (!editProductData.name?.trim()) {
      setEditProductError("Nama produk tidak boleh kosong")
      return
    }
    if ((editProductData.sellingPrice ?? 0) <= 0) {
      setEditProductError("Harga jual harus lebih dari Rp 0")
      return
    }

    setSubmitting(true)
    setEditProductError("")
    try {
      const payload: UpdateProductInput = {
        ...editProductData,
      }
      const updated = await recipeService.updateProduct(productId, payload)
      setProduct(updated)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memperbarui info produk"
      setEditProductError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Delete Product
  async function handleDeleteProduct() {
    if (!productId) return
    setSubmitting(true)
    try {
      await recipeService.deleteProduct(productId)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: recipeKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['subscription-usage'] }),
      ])
      navigate(returnTo)
    } catch (err) {
      console.error("Failed to delete product:", err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Memuat detail resep...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <AlertTriangle className="h-10 w-10 text-amber-500" />
        <h2 className="text-xl font-bold">Resep Produk Tidak Ditemukan</h2>
        <Button asChild variant="outline" className="rounded-xl">
          <Link to={returnTo}>Kembali ke Daftar Produk</Link>
        </Button>
      </div>
    )
  }

  // Simulation Calculations
  const totalMaterialCostForBatch = totalBOMCost * simTargetUnits

  const simulatedOverheadItems = masterOverheads
    .filter((oh) => !oh.category || oh.category === "PRODUCTION")
    .map((oh) => {
      const amount = simOverheadRates[oh.id] !== undefined
        ? simOverheadRates[oh.id]
        : (oh.defaultAmount ?? 0)

      const batchCost = amount
      const costPerUnit = simTargetUnits > 0 ? batchCost / simTargetUnits : 0
      return { ...oh, amount, rate: amount, batchCost, costPerUnit }
    })

  const totalOverheadForBatch = simulatedOverheadItems.reduce((acc, it) => acc + it.batchCost, 0)
  const totalProductionCostForBatch = totalMaterialCostForBatch + totalOverheadForBatch
  const projectedHppPerUnit = simTargetUnits > 0 ? Math.round(totalProductionCostForBatch / simTargetUnits) : 0
  const projectedRevenue = product.sellingPrice * simTargetUnits
  const projectedGrossProfit = projectedRevenue - totalProductionCostForBatch
  const projectedMargin = projectedRevenue > 0 ? Math.round((projectedGrossProfit / projectedRevenue) * 1000) / 10 : 0

  return (
    <div className="flex flex-col gap-6 pb-16 animate-in fade-in duration-500">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Button asChild variant="outline" size="sm" className="rounded-xl text-xs shrink-0">
            <Link to={returnTo}>
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Daftar Produk
            </Link>
          </Button>
          <span className="text-xs text-muted-foreground shrink-0">/</span>
          <span className="text-xs font-semibold text-foreground truncate max-w-[200px] sm:max-w-md">
            {product.name}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab("info")}
            className="rounded-xl text-xs flex-1 sm:flex-initial"
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit Info
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsDeleteProductOpen(true)}
            className="rounded-xl text-xs flex-1 sm:flex-initial"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Hapus
          </Button>
        </div>
      </div>

      {/* Hero Header Card */}
      <Card className="rounded-3xl border-slate-200/80 shadow-sm overflow-hidden bg-card">
        <div className="p-4 sm:p-6 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-16 w-16 rounded-2xl object-cover border border-slate-200 shrink-0 shadow-sm"
                />
              ) : (
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Factory className="h-8 w-8" />
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground truncate">
                    {product.name}
                  </h1>
                  <Badge variant="outline" className="text-xs font-semibold bg-muted/40 shrink-0">
                    {product.category}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs font-bold shrink-0 ${
                      product.mode === "MAKE_TO_ORDER"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                  >
                    {product.mode === "MAKE_TO_ORDER" ? "Make to Order (MTO)" : "Make to Stock (MTS)"}
                  </Badge>
                  <Badge variant="outline" className="text-xs font-mono font-medium bg-blue-50 text-blue-700 border-blue-200 shrink-0">
                    Metode Stok: FIFO
                  </Badge>
                </div>
                {product.description ? (
                  <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                    {product.description}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground italic mt-1">
                    Belum ada catatan deskripsi resep.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button
                onClick={() => setActiveTab("simulator")}
                className="w-full md:w-auto rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center justify-center gap-2 text-xs shadow-sm h-10 px-4"
              >
                <Calculator className="h-4 w-4" />
                <span>Simulasi Produksi & HPP</span>
              </Button>
            </div>
          </div>
        </div>

        {/* 5-Column Financial Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border-t border-slate-200/60 bg-slate-200/60 dark:bg-slate-800 gap-px p-px">
          <div className="bg-slate-50/90 dark:bg-slate-900/90 p-3 px-4">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Harga Jual
            </span>
            <div className="text-base sm:text-lg font-black font-mono text-foreground mt-0.5 truncate">
              <CurrencyText value={product.sellingPrice} />
            </div>
            <span className="text-[10px] text-muted-foreground">per {product.unit}</span>
          </div>

          <div className="bg-slate-50/90 dark:bg-slate-900/90 p-3 px-4">
            <div className="flex items-center gap-1">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Biaya Bahan (BOM)
              </span>
            </div>
            <div className="text-base sm:text-lg font-black font-mono text-slate-800 dark:text-slate-200 mt-0.5 truncate">
              <CurrencyText value={totalBOMCost} />
            </div>
            <span className="text-[10px] text-muted-foreground">Komposisi {product.ingredients.length} bahan</span>
          </div>

          <div className="bg-slate-50/90 dark:bg-slate-900/90 p-3 px-4">
            <div className="flex items-center gap-1">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                HPP Batch Terakhir
              </span>
            </div>
            <div className="text-base sm:text-lg font-black font-mono text-primary mt-0.5 truncate">
              <CurrencyText value={activeHpp} />
            </div>
            <span className="text-[10px] text-muted-foreground">Bahan + Overhead riil</span>
          </div>

          <div className="bg-slate-50/90 dark:bg-slate-900/90 p-3 px-4">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Gross Margin
            </span>
            <div className="mt-1">
              <Badge
                variant="outline"
                className={`font-mono text-xs font-bold px-2 py-0.5 ${
                  marginPercentage >= 50
                    ? "bg-emerald-500/10 text-emerald-700 border-emerald-300"
                    : marginPercentage >= 25
                    ? "bg-amber-500/10 text-amber-700 border-amber-300"
                    : "bg-red-500/10 text-red-700 border-red-300"
                }`}
              >
                +{marginPercentage}%
              </Badge>
            </div>
            <span className="text-[10px] text-muted-foreground mt-0.5 block truncate">
              Profit <CurrencyText value={product.sellingPrice - activeHpp} suffix="/unit" />
            </span>
          </div>

          <div className="bg-slate-50/90 dark:bg-slate-900/90 p-3 px-4 col-span-2 sm:col-span-1">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Stok Jadi Saat Ini
            </span>
            <div className="text-base sm:text-lg font-black font-mono text-foreground mt-0.5 truncate">
              {product.currentStock}{" "}
              <span className="text-xs font-normal text-muted-foreground">{product.unit}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              Min: {product.minStock} {product.unit}
            </span>
          </div>
        </div>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full max-w-3xl bg-slate-100/90 dark:bg-muted/70 p-1.5 rounded-2xl border border-slate-200/90 shadow-sm gap-1.5 h-auto min-h-[50px]">
          <TabsTrigger
            value="info"
            className="rounded-xl py-2.5 px-3 text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:font-bold text-slate-600 hover:text-slate-950 hover:bg-white/60 cursor-pointer"
          >
            <Info className={`h-4 w-4 transition-colors ${activeTab === "info" ? "text-primary-foreground" : "text-slate-500"}`} />
            <span>Info & Harga</span>
          </TabsTrigger>

          <TabsTrigger
            value="bom"
            className="rounded-xl py-2.5 px-3 text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:font-bold text-slate-600 hover:text-slate-950 hover:bg-white/60 cursor-pointer"
          >
            <Layers className={`h-4 w-4 transition-colors ${activeTab === "bom" ? "text-primary-foreground" : "text-slate-500"}`} />
            <span>Resep & BOM</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md transition-colors ${
                activeTab === "bom"
                  ? "bg-white/20 text-white font-bold"
                  : "bg-slate-200/80 text-slate-700 font-semibold"
              }`}
            >
              {product.ingredients.length}
            </span>
          </TabsTrigger>

          <TabsTrigger
            value="simulator"
            data-value="simulator"
            className="rounded-xl py-2.5 px-3 text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:font-bold text-slate-600 hover:text-slate-950 hover:bg-white/60 cursor-pointer"
          >
            <Calculator className={`h-4 w-4 transition-colors ${activeTab === "simulator" ? "text-primary-foreground" : "text-slate-500"}`} />
            <span>Simulator Dapur</span>
            {activeTab === "simulator" && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </TabsTrigger>

          <TabsTrigger
            value="batches"
            className="rounded-xl py-2.5 px-3 text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:font-bold text-slate-600 hover:text-slate-950 hover:bg-white/60 cursor-pointer"
          >
            <History className={`h-4 w-4 transition-colors ${activeTab === "batches" ? "text-primary-foreground" : "text-slate-500"}`} />
            <span>Batch FIFO</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md transition-colors ${
                activeTab === "batches"
                  ? "bg-white/20 text-white font-bold"
                  : "bg-slate-200/80 text-slate-700 font-semibold"
              }`}
            >
              {product.batches?.length || 0}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: RESEP & BOM (BILL OF MATERIALS) */}
        <TabsContent value="bom" className="mt-5 space-y-5">
          <Card className="rounded-2xl border-slate-200/80 shadow-sm">
            <CardHeader className="p-5 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold">Komposisi Bahan Baku (Formula Resep)</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Daftar bahan yang digunakan untuk memproduksi <strong>1 {product.unit}</strong> produk. Biaya subtotal dihitung otomatis dari harga beli stok FIFO.
                </CardDescription>
              </div>

              <Button
                onClick={() => {
                  setSelectedStockId(availableMaterials[0]?.id || "")
                  setIngredientQty(""); setIngredientUnit("")
                  setIngredientError("")
                  setIsAddIngredientOpen(true)
                }}
                className="rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-2 h-9 self-start sm:self-center"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Bahan Baku</span>
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              {product.ingredients.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Layers className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold">Belum Ada Bahan Baku di Resep</h4>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    Tambahkan bahan baku yang diperlukan (misal tepung, gula, telur) untuk mulai menghitung estimasi HPP produk ini.
                  </p>
                  <Button
                    onClick={() => setIsAddIngredientOpen(true)}
                    size="sm"
                    className="rounded-xl mt-2 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Tambah Bahan Sekarang
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-[720px]">
                    <TableHeader className="bg-slate-50/70">
                      <TableRow>
                        <TableHead className="text-xs font-bold uppercase text-muted-foreground">Bahan Baku</TableHead>
                        <TableHead className="text-xs font-bold uppercase text-muted-foreground">Takaran per Unit</TableHead>
                        <TableHead className="text-xs font-bold uppercase text-muted-foreground">Harga Bahan Rata-rata</TableHead>
                        <TableHead className="text-xs font-bold uppercase text-muted-foreground">Subtotal Biaya</TableHead>
                        <TableHead className="text-xs font-bold uppercase text-muted-foreground">Porsi Biaya</TableHead>
                        <TableHead className="text-xs font-bold uppercase text-muted-foreground">Kesiapan Stok Gudang</TableHead>
                        <TableHead className="text-right text-xs font-bold uppercase text-muted-foreground">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {product.ingredients.map((ing) => {
                        const costShare = totalBOMCost > 0 ? Math.round((ing.subtotalCost / totalBOMCost) * 1000) / 10 : 0
                        const possibleUnitsFromStock = ing.quantity > 0 ? Math.floor(ing.availableStock / ing.quantity) : 0
                        const isStockLow = possibleUnitsFromStock < 20

                        return (
                          <TableRow key={ing.id} className="hover:bg-muted/20">
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-bold text-sm text-foreground">{ing.stockName}</span>
                                <span className="text-[11px] text-muted-foreground">Satuan dasar: {ing.baseUnit}</span>
                              </div>
                            </TableCell>

                            <TableCell className="font-mono font-bold text-sm">
                              {ing.quantity} {ing.baseUnit}
                            </TableCell>

                            <TableCell className="font-mono text-sm text-slate-700">
                              <CurrencyText value={ing.unitCost} suffix={` / ${ing.baseUnit}`} />
                            </TableCell>

                            <TableCell className="font-mono font-bold text-sm text-foreground">
                              <CurrencyText value={ing.subtotalCost} />
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-14 bg-slate-200 rounded-full h-2 overflow-hidden">
                                  <div
                                    className="bg-primary h-full rounded-full"
                                    style={{ width: `${Math.min(costShare, 100)}%` }}
                                  />
                                </div>
                                <span className="font-mono text-xs font-semibold text-slate-700">
                                  {costShare}%
                                </span>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-semibold">
                                  {ing.availableStock.toLocaleString("id-ID")} {ing.baseUnit}
                                </span>
                                <span className={`text-[11px] flex items-center gap-1 ${isStockLow ? "text-amber-600 font-bold" : "text-emerald-600 font-medium"}`}>
                                  {isStockLow ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                                  Cukup untuk ~{possibleUnitsFromStock} {product.unit}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                                  onClick={() => {
                                    setEditingIngredient(ing)
                                    setIngredientQty(ing.quantity.toString()); setIngredientUnit(ing.baseUnit)
                                    setIngredientError("")
                                    setIsEditIngredientOpen(true)
                                  }}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700"
                                  onClick={() => handleRemoveIngredient(ing.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Total Summary Footer */}
              {product.ingredients.length > 0 && (
                <div className="p-4 px-6 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Info className="h-4 w-4 text-primary" />
                    <span>
                      Harga bahan di atas adalah harga rata-rata purchase lot aktif saat ini.
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-4 w-full sm:w-auto">
                    <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                      Total Biaya Bahan Baku (BOM):
                    </span>
                    <span className="font-mono text-xl font-black text-primary">
                      <CurrencyText value={totalBOMCost} />
                      <span className="text-xs font-normal text-muted-foreground ml-1">/{product.unit}</span>
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </TabsContent>

        {/* TAB 2: SIMULATOR DAPUR & HPP (HPP CALCULATOR) */}
        <TabsContent value="simulator" className="mt-5 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Simulator Inputs Column */}
            <div className="lg:col-span-1 space-y-5">
              <Card className="rounded-2xl border-slate-200/80 shadow-sm">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <Calculator className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">Parameter Batch Produksi</CardTitle>
                      <CardDescription className="text-xs">Ubah target jumlah dan alokasi biaya operasional.</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-5 pt-2 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">
                      Target Jumlah Produksi ({product.unit})
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={simTargetUnits}
                      onChange={(e) => setSimTargetUnits(Math.max(1, Number(e.target.value)))}
                      className="rounded-xl h-10 font-mono text-base font-bold"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {[25, 50, 100, 200].map((qty) => (
                        <Button
                          key={qty}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSimTargetUnits(qty)}
                          className={`rounded-lg text-xs h-7 px-2.5 font-mono ${
                            simTargetUnits === qty ? "bg-primary text-primary-foreground border-primary" : ""
                          }`}
                        >
                          {qty}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                      Estimasi Biaya Overhead (Batch)
                    </span>

                    {masterOverheads.length === 0 ? (
                      <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2.5">
                        <div className="flex items-start gap-2 text-amber-800">
                          <Info className="h-4 w-4 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-medium leading-relaxed">
                              Belum ada master biaya overhead toko yang aktif.
                            </p>
                            <p className="text-[11px] text-amber-700/90 mt-1">
                              Biaya overhead dihitung dinamis saat batch produksi dibuat berdasarkan master overhead toko.
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          asChild
                          className="w-full rounded-lg text-xs font-semibold bg-white hover:bg-amber-100/60 border-amber-300 text-amber-900"
                        >
                          <Link to="/master-data/overhead">
                            Kelola Master Overhead Toko
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {simulatedOverheadItems.map((oh) => {
                          const dynamicSubtitle = `${formatCurrency(oh.batchCost)} per batch (${formatCurrency(oh.costPerUnit)}/unit)`

                          return (
                            <div key={oh.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <Label className="text-xs font-semibold text-slate-800 truncate" title={oh.name}>
                                  {oh.name}
                                </Label>
                                <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-medium shrink-0 bg-emerald-50 text-emerald-700 border-emerald-200">
                                  Produksi
                                </Badge>
                              </div>

                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 select-none">
                                  Rp
                                </span>
                                <Input
                                  type="number"
                                  min="0"
                                  step="1000"
                                  value={simOverheadRates[oh.id] !== undefined ? simOverheadRates[oh.id] : oh.rate}
                                  onChange={(e) => {
                                    const val = Math.max(0, Number(e.target.value) || 0)
                                    setSimOverheadRates((prev) => ({
                                      ...prev,
                                      [oh.id]: val,
                                    }))
                                  }}
                                  className="rounded-lg h-8 pl-8 text-xs font-mono bg-white"
                                />
                              </div>

                              <p className="text-[11px] text-muted-foreground font-mono">
                                {dynamicSubtitle}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Simulation Results Column */}
            <div className="lg:col-span-2 space-y-5">
              {/* Projection Card */}
              <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-gradient-to-br from-card to-slate-50 overflow-hidden">
                <CardHeader className="p-5 pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-bold">Hasil Proyeksi HPP & Keuntungan</CardTitle>
                      <CardDescription className="text-xs">
                        Estimasi simulasi untuk <strong>{simTargetUnits} {product.unit}</strong> {product.name}
                      </CardDescription>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-300 font-mono text-xs font-bold shrink-0">
                      +{projectedMargin}% Margin
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/70 shadow-sm">
                    <div>
                      <span className="text-[11px] text-muted-foreground uppercase font-bold">Proyeksi HPP/Unit</span>
                      <div className="text-base sm:text-lg font-black font-mono text-primary mt-1 truncate">
                        <CurrencyText value={projectedHppPerUnit} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">Termasuk overhead</span>
                    </div>

                    <div>
                      <span className="text-[11px] text-muted-foreground uppercase font-bold">Total Biaya Batch</span>
                      <div className="text-base sm:text-lg font-black font-mono text-foreground mt-1 truncate">
                        <CurrencyText value={totalProductionCostForBatch} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">Modal produksi</span>
                    </div>

                    <div>
                      <span className="text-[11px] text-muted-foreground uppercase font-bold">Proyeksi Omset</span>
                      <div className="text-base sm:text-lg font-black font-mono text-foreground mt-1 truncate">
                        <CurrencyText value={projectedRevenue} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">Jika terjual semua</span>
                    </div>

                    <div>
                      <span className="text-[11px] text-muted-foreground uppercase font-bold">Proyeksi Laba Kotor</span>
                      <div className="text-base sm:text-lg font-black font-mono text-emerald-600 mt-1 truncate">
                        <CurrencyText value={projectedGrossProfit} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">Laba kotor batch</span>
                    </div>
                  </div>

                  {/* Rincian Biaya Overhead Batch */}
                  {simulatedOverheadItems.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Rincian Biaya Overhead Batch
                        </h4>
                        <span className="text-xs font-mono font-bold text-slate-700">
                          Total: <CurrencyText value={totalOverheadForBatch} />
                        </span>
                      </div>

                      <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white">
                        <Table className="min-w-[520px]">
                          <TableHeader className="bg-slate-50">
                            <TableRow>
                              <TableHead className="text-[11px] font-bold">Nama Overhead</TableHead>
                              <TableHead className="text-[11px] font-bold">Tipe/Behavior</TableHead>
                              <TableHead className="text-[11px] font-bold">Tarif Simulasi</TableHead>
                              <TableHead className="text-[11px] font-bold text-right">Total Biaya Batch</TableHead>
                              <TableHead className="text-[11px] font-bold text-right">Biaya per Unit</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {simulatedOverheadItems.map((oh) => (
                              <TableRow key={oh.id} className="text-xs">
                                <TableCell className="font-semibold text-slate-800">
                                  {oh.name}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-medium bg-emerald-50 text-emerald-700 border-emerald-200">
                                    Produksi
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-muted-foreground">
                                  <CurrencyText value={oh.rate} />
                                </TableCell>
                                <TableCell className="font-mono font-bold text-right text-slate-900">
                                  <CurrencyText value={oh.batchCost} />
                                </TableCell>
                                <TableCell className="font-mono text-right text-muted-foreground">
                                  <CurrencyText value={oh.costPerUnit} />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Kebutuhan Bahan Baku untuk Batch ini */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Kebutuhan Bahan Baku Untuk Batch ({simTargetUnits} {product.unit})
                    </h4>

                    <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white">
                      <Table className="min-w-[520px]">
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            <TableHead className="text-[11px] font-bold">Bahan</TableHead>
                            <TableHead className="text-[11px] font-bold">Total Dibutuhkan</TableHead>
                            <TableHead className="text-[11px] font-bold">Sisa Stok Gudang</TableHead>
                            <TableHead className="text-[11px] font-bold">Status Ketersediaan</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {product.ingredients.map((ing) => {
                            const neededTotal = ing.quantity * simTargetUnits
                            const isEnough = ing.availableStock >= neededTotal

                            return (
                              <TableRow key={ing.id} className="text-xs">
                                <TableCell className="font-semibold">{ing.stockName}</TableCell>
                                <TableCell className="font-mono font-bold">
                                  {neededTotal.toLocaleString("id-ID")} {ing.baseUnit}
                                </TableCell>
                                <TableCell className="font-mono text-muted-foreground">
                                  {ing.availableStock.toLocaleString("id-ID")} {ing.baseUnit}
                                </TableCell>
                                <TableCell>
                                  {isEnough ? (
                                    <Badge variant="success" className="text-[10px] font-bold">
                                      Stok Cukup
                                    </Badge>
                                  ) : (
                                    <Badge variant="destructive" className="text-[10px] font-bold">
                                      Kurang {(neededTotal - ing.availableStock).toLocaleString("id-ID")} {ing.baseUnit}
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: RIWAYAT BATCH PRODUKSI (FIFO LOTS) */}
        <TabsContent value="batches" className="mt-5 space-y-5">
          <Card className="rounded-2xl border-slate-200/80 shadow-sm">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-lg font-bold">Riwayat Batch Produksi (FIFO Lots)</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Daftar lot produk jadi yang pernah selesai diproduksi. Penjualan di kasir (POS) akan memotong stok tertua terlebih dahulu secara otomatis.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              {(!product.batches || product.batches.length === 0) ? (
                <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
                  <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                    <History className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold">Belum Ada Riwayat Batch Produksi</h4>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    Batch akan otomatis terbuat ketika Anda menyelesaikan produksi dari menu Dapur Produksi.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-[640px]">
                  <TableHeader className="bg-slate-50/70">
                    <TableRow>
                      <TableHead className="text-xs font-bold uppercase text-muted-foreground">Nomor Batch</TableHead>
                      <TableHead className="text-xs font-bold uppercase text-muted-foreground">Tanggal Produksi</TableHead>
                      <TableHead className="text-xs font-bold uppercase text-muted-foreground">Jumlah Awal</TableHead>
                      <TableHead className="text-xs font-bold uppercase text-muted-foreground">Sisa Stok (FIFO)</TableHead>
                      <TableHead className="text-xs font-bold uppercase text-muted-foreground">HPP Hasil Produksi</TableHead>
                      <TableHead className="text-right text-xs font-bold uppercase text-muted-foreground">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.batches.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell className="font-mono font-bold text-xs text-foreground">
                          {batch.batchNumber}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(batch.productionDate).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {batch.initialQuantity} {product.unit}
                        </TableCell>
                        <TableCell className="font-mono font-bold text-sm text-foreground">
                          {batch.remainingQuantity} {product.unit}
                        </TableCell>
                        <TableCell className="font-mono font-bold text-sm text-primary">
                          <CurrencyText value={batch.hppAtProduction} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={batch.remainingQuantity > 0 ? "success" : "secondary"}
                            className="text-[10px] font-bold"
                          >
                            {batch.remainingQuantity > 0 ? "Tersedia" : "Habis Terjual"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: INFO & PENGATURAN PRODUK */}
        <TabsContent value="info" className="mt-5 space-y-5">
          <Card className="rounded-2xl border-slate-200/80 shadow-sm w-full bg-card">
            <CardHeader className="p-4 sm:p-6 pb-4 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-xl font-bold">Informasi & Pengaturan Produk</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Perbarui identitas formula resep, penetapan target harga jual, dan batas ambang stok aman.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs font-semibold bg-muted/40 self-start sm:self-center font-mono">
                  ID: {product.id}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6">
              <form onSubmit={handleUpdateProduct} className="space-y-6">
                {editProductError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{editProductError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Kolom Kiri & Tengah: Informasi Umum Produk */}
                  <div className="lg:col-span-2 space-y-5">
                    <div className="grid gap-2">
                      <Label className="text-xs font-semibold">
                        Nama Produk / Formula Resep <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={editProductData.name || ""}
                        onChange={(e) => setEditProductData({ ...editProductData, name: e.target.value })}
                        placeholder="Contoh: Roti Manis Coklat Lumer"
                        className="rounded-xl h-11 text-sm font-medium"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label className="text-xs font-semibold">Kategori Produk</Label>
                        <Input
                          value={editProductData.category || ""}
                          onChange={(e) => setEditProductData({ ...editProductData, category: e.target.value })}
                          placeholder="Roti, Pastry, Donat, dll."
                          className="rounded-xl h-10 text-sm"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label className="text-xs font-semibold">Satuan Penjualan</Label>
                        <Input
                          value={editProductData.unit || ""}
                          onChange={(e) => setEditProductData({ ...editProductData, unit: e.target.value })}
                          placeholder="pcs, box, loaf, roll, loyang"
                          className="rounded-xl h-10 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label className="text-xs font-semibold">Foto Produk</Label>
                      <ImageUploadDropzone
                        value={editProductData.imageUrl}
                        onChange={(url) => setEditProductData({ ...editProductData, imageUrl: url })}
                        disabled={submitting}
                      />
                    </div>

                    {/* Mode Produksi */}
                    <div className="grid gap-2">
                      <Label className="text-xs font-semibold">Model Produksi (Product Mode)</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setEditProductData({ ...editProductData, mode: "MAKE_TO_STOCK" })}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            editProductData.mode !== "MAKE_TO_ORDER"
                              ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-foreground">Make to Stock (MTS)</span>
                            <Badge variant="outline" className="text-[10px] font-mono">MTS</Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                            Produksi massal untuk stok etalase.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditProductData({ ...editProductData, mode: "MAKE_TO_ORDER" })}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            editProductData.mode === "MAKE_TO_ORDER"
                              ? "border-purple-600 bg-purple-50 ring-1 ring-purple-600 shadow-xs"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-foreground">Make to Order (MTO)</span>
                            <Badge variant="outline" className="text-[10px] font-mono text-purple-700 border-purple-200">MTO</Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                            Produksi sesuai pesanan / pre-order.
                          </p>
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label className="text-xs font-semibold">Deskripsi & Catatan Proses Pembuatan</Label>
                      <Textarea
                        rows={4}
                        value={editProductData.description || ""}
                        onChange={(e) => setEditProductData({ ...editProductData, description: e.target.value })}
                        placeholder="Tuliskan karakteristik resep, tips adonan/proofing, suhu pemanggangan oven, atau catatan khusus lainnya..."
                        className="rounded-xl text-sm leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Kolom Kanan: Parameter Harga & Kalkulasi Margin */}
                  <div className="space-y-4">
                    <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-primary" />
                        Parameter Harga & Margin
                      </h4>

                      <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold">
                            Target Margin (%) <span className="text-red-500">*</span>
                          </Label>
                          <span className="text-[10px] text-primary font-mono font-bold">Gross Margin</span>
                        </div>
                        <div className="relative">
                          <Input
                            type="number"
                            min="1"
                            max="95"
                            step="1"
                            value={editMargin}
                            onChange={(e) => {
                              const m = Math.min(95, Math.max(1, Number(e.target.value)))
                              setEditMargin(m)
                              const computed = activeHpp > 0 ? Math.ceil((activeHpp / (1 - m / 100)) / 500) * 500 : (editProductData.sellingPrice || 10000)
                              setEditProductData({ ...editProductData, sellingPrice: computed, targetMargin: m })
                            }}
                            className="rounded-xl h-11 text-base font-mono font-bold pr-8"
                            required
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono font-bold text-muted-foreground text-xs">%</span>
                        </div>

                        {/* Quick pills */}
                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                          {[35, 45, 50, 60, 70].map((pct) => (
                            <button
                              type="button"
                              key={pct}
                              onClick={() => {
                                setEditMargin(pct)
                                const computed = activeHpp > 0 ? Math.ceil((activeHpp / (1 - pct / 100)) / 500) * 500 : (editProductData.sellingPrice || 10000)
                                setEditProductData({ ...editProductData, sellingPrice: computed, targetMargin: pct })
                              }}
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-md border transition-all ${
                                editMargin === pct
                                  ? "bg-primary text-primary-foreground border-primary font-bold"
                                  : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                              }`}
                            >
                              {pct}%
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Display Auto Computed Price */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                          Harga Jual Terhitung Otomatis
                        </span>
                        <div className="text-xl font-black font-mono text-primary">
                          <CurrencyText value={editProductData.sellingPrice || 0} />
                        </div>
                        <span className="text-[10px] text-muted-foreground block">
                          Dihitung otomatis: HPP {formatCurrency(activeHpp)} + Margin {editMargin}% (Pembulatan Rp 500)
                        </span>
                      </div>

                      <div className="grid gap-2">
                        <Label className="text-xs font-semibold">Batas Minimum Stok (Peringatan)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={editProductData.minStock || ""}
                          onChange={(e) => setEditProductData({ ...editProductData, minStock: Number(e.target.value) })}
                          className="rounded-xl h-10 text-sm font-mono"
                        />
                        <span className="text-[11px] text-muted-foreground leading-tight">
                          Peringatan "Stok Tipis" muncul bila stok ≤ batas ini.
                        </span>
                      </div>

                      {/* Live Calculation Preview */}
                      <div className="pt-3 border-t border-slate-200/70 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-medium">HPP Acuan Saat Ini:</span>
                          <span className="font-mono font-bold text-foreground">
                            <CurrencyText value={activeHpp} />
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-medium">Laba Kotor per Unit:</span>
                          <span className="font-mono font-bold text-emerald-600">
                            <CurrencyText value={(editProductData.sellingPrice || 0) - activeHpp} showPositiveSign />
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-medium">Proyeksi Gross Margin:</span>
                          <Badge
                            variant="outline"
                            className={`font-mono text-xs font-bold px-2 py-0.5 ${
                              editMargin >= 50
                                ? "bg-emerald-500/10 text-emerald-700 border-emerald-300"
                                : editMargin >= 25
                                ? "bg-amber-500/10 text-amber-700 border-amber-300"
                                : "bg-red-500/10 text-red-700 border-red-300"
                            }`}
                          >
                            +{editMargin}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Save Button Bar */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">
                    Perubahan harga dan spesifikasi akan langsung mempengaruhi katalog resep dan kalkulasi HPP.
                  </span>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl px-7 h-10 font-semibold shadow-sm self-end sm:self-auto bg-primary text-primary-foreground"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Simpan Perubahan
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL: Tambah Bahan Baku ke Resep */}
      <Dialog open={isAddIngredientOpen} onOpenChange={setIsAddIngredientOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl p-6">
          <DialogHeader>
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-2">
              <Scale className="h-5 w-5" />
            </div>
            <DialogTitle className="text-lg font-bold">Tambah Bahan Baku ke Formula</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Pilih bahan baku dari inventori gudang dan tentukan takaran yang dibutuhkan untuk 1 {product.unit}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddIngredient} className="space-y-4 py-2">
            {ingredientError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{ingredientError}</span>
              </div>
            )}

            <div className="grid gap-2">
              <Label className="text-xs font-semibold">
                Pilih Bahan Baku <span className="text-red-500">*</span>
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between rounded-xl h-10 text-sm"
                  >
                    <span>{selectedMaterial?.name || "Pilih bahan dari gudang..."}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-60 overflow-y-auto rounded-xl">
                  <DropdownMenuLabel className="text-xs uppercase text-muted-foreground">Stok Gudang</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableMaterials.map((mat) => (
                    <DropdownMenuItem
                      key={mat.id}
                      onClick={() => { setSelectedStockId(mat.id); setIngredientUnit("") }}
                      className="cursor-pointer flex items-center justify-between text-xs"
                    >
                      <span className="font-medium">{mat.name}</span>
                      <span className="font-mono text-muted-foreground">
                        <CurrencyText value={mat.avgCostPerUnit} suffix={`/${mat.baseUnit}`} />
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {selectedMaterial && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs flex items-center justify-between">
                <div>
                  <span className="text-muted-foreground">Sisa Stok di Gudang:</span>
                  <div className="font-mono font-bold text-foreground">
                    {selectedMaterial.currentStock.toLocaleString("id-ID")} {selectedMaterial.baseUnit}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground">Biaya Bahan Satuan:</span>
                  <div className="font-mono font-bold text-primary">
                    <CurrencyText value={selectedMaterial.avgCostPerUnit} suffix={` / ${selectedMaterial.baseUnit}`} />
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="qty" className="text-xs font-semibold">
                Takaran yang Dibutuhkan ({ingredientUnit || selectedMaterial?.baseUnit || "unit"}) <span className="text-red-500">*</span>
              </Label>
              <label className="grid gap-1 text-xs">Satuan takaran<select className="h-10 rounded-md border bg-background px-3" value={ingredientUnit || selectedMaterial?.baseUnit || ''} onChange={e => setIngredientUnit(e.target.value)}>
 {[...new Set([selectedMaterial?.baseUnit || '', ...getCompatibleUnits(selectedMaterial?.baseUnit)])].filter(Boolean).map(u => <option key={u} value={u}>{u}</option>)}
 </select></label>
 <Input
                id="qty"
                type="number"
                step="any"
                min="0.001"
                placeholder={`Contoh: 50 ${selectedMaterial?.baseUnit || "g"}`}
                value={ingredientQty}
                onChange={(e) => setIngredientQty(e.target.value)}
                className="rounded-xl h-10 font-mono text-sm"
                required
              />
            </div>

            {addedUnitCostPreview > 0 && (
              <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 text-xs flex items-center justify-between">
                <span className="text-muted-foreground">Menambah biaya HPP per unit:</span>
                <span className="font-mono font-bold text-primary text-sm">
                  <CurrencyText value={addedUnitCostPreview} showPositiveSign />
                </span>
              </div>
            )}

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddIngredientOpen(false)}
                className="rounded-xl"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-primary text-primary-foreground font-semibold"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Tambahkan Bahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: Edit Takaran Bahan */}
      <Dialog open={isEditIngredientOpen} onOpenChange={setIsEditIngredientOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Ubah Takaran Bahan</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Sesuaikan takaran <strong>{editingIngredient?.stockName}</strong> untuk 1 {product.unit} produk.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditIngredient} className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label className="text-xs font-semibold">
                Takaran Baru ({ingredientUnit || editingIngredient?.baseUnit})
              </Label>
              <label className="grid gap-1 text-xs">Satuan takaran<select className="h-10 rounded-md border bg-background px-3" value={ingredientUnit || editingIngredient?.baseUnit || ''} onChange={e => setIngredientUnit(e.target.value)}>
 {[...new Set([editingIngredient?.baseUnit || '', ...getCompatibleUnits(editingIngredient?.baseUnit)])].filter(Boolean).map(u => <option key={u} value={u}>{u}</option>)}
 </select></label>
 <Input
                type="number"
                step="any"
                min="0.001"
                value={ingredientQty}
                onChange={(e) => setIngredientQty(e.target.value)}
                className="rounded-xl h-10 font-mono text-sm"
                required
              />
            </div>

            {editingIngredient && Number(ingredientQty) > 0 && (
              <div className="p-3 bg-slate-50 rounded-xl border text-xs flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal Biaya Bahan Baru:</span>
                <span className="font-mono font-bold text-primary">
                  <CurrencyText value={getQuantityInBaseUnit(Number(ingredientQty), ingredientUnit, editingIngredient.baseUnit) * editingIngredient.unitCost} />
                </span>
              </div>
            )}

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditIngredientOpen(false)}
                className="rounded-xl"
              >
                Batal
              </Button>
              <Button type="submit" disabled={submitting} className="rounded-xl">
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: Konfirmasi Hapus Produk */}
      <Dialog open={isDeleteProductOpen} onOpenChange={setIsDeleteProductOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl p-6">
          <DialogHeader>
            <div className="h-10 w-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-2">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle className="text-lg font-bold">Hapus Resep & Produk Ini?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Resep <strong>{product.name}</strong> akan dihapus dari katalog aktif. Riwayat transaksi masa lalu tetap tersimpan secara aman.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteProductOpen(false)}
              className="rounded-xl"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={submitting}
              onClick={handleDeleteProduct}
              className="rounded-xl"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Hapus Resep
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
