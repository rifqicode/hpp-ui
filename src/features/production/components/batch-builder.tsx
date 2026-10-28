import * as React from "react"
import { useNavigate, Link } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  Boxes,
  Scale,
  FileText,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  TrendingUp,
  Plus,
  Minus,
  Search,
  X,
  Loader2,
  Factory,
  Check,
  ChevronRight,
  Info,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CurrencyText } from "@/components/ui/currency-text"
import { useInitialLoading } from "@/hooks/use-initial-loading"
import { useAuthStore } from "@/store/use-auth-store"
import { cn } from "@/lib/utils"
import { productionService } from "@/features/production/services/production-service"
import { recipeService } from "@/features/recipes/services/recipe-service"
import type { ProductVariantView } from "@/features/recipes/types"
import type { ProductionBatch, ProductionPreviewResponse } from "@/features/production/types"

const STEPS = [
  "Pilih Produk",
  "Target & Audit Stok",
  "Review & Konfirmasi",
] as const

const QUANTITY_PRESETS = [10, 20, 50, 75, 100] as const

export interface BatchBuilderProps {
  onSaved?: (batch: ProductionBatch) => void
  onCancel?: () => void
  initialStep?: number
}

export function BatchBuilder({
  onSaved,
  onCancel,
  initialStep = 0,
}: BatchBuilderProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const storeId = useAuthStore((s) => s.activeStoreId)
  const topRef = React.useRef<HTMLDivElement>(null)

  // Stepper State
  const [step, setStep] = React.useState<number>(initialStep)
  const [visited, setVisited] = React.useState<number>(initialStep)
  const [confirmLeave, setConfirmLeave] = React.useState<boolean>(false)

  // Form State
  const [selectedProductId, setSelectedProductId] = React.useState<string>("")
  const [targetQuantity, setTargetQuantity] = React.useState<number | "">(1)
  const [chefName, setChefName] = React.useState<string>("Baker Utama")
  const [notes, setNotes] = React.useState<string>("")
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all")

  // Request States
  const [submitting, setSubmitting] = React.useState<boolean>(false)
  const [error, setError] = React.useState<string>("")
  const [preview, setPreview] = React.useState<ProductionPreviewResponse | null>(null)
  const [loadingPreview, setLoadingPreview] = React.useState<boolean>(false)

  // Fetch MAKE_TO_STOCK product variants
  const {
    data: products = [],
    isLoading: loadingProducts,
    isError: isProductsError,
  } = useQuery({
    queryKey: ["production-recipe-variants", storeId],
    queryFn: async () => {
      const variants = await recipeService.getVariants()
      return variants.filter((v) => v.mode === "MAKE_TO_STOCK")
    },
    enabled: Boolean(storeId),
  })

  // Set default selected product once products are loaded
  React.useEffect(() => {
    if (!selectedProductId && products.length > 0) {
      setSelectedProductId(products[0].id)
    }
  }, [products, selectedProductId])

  const selectedProduct = React.useMemo<ProductVariantView | null>(() => {
    return products.find((p) => p.id === selectedProductId) || null
  }, [products, selectedProductId])

  const effectiveQty =
    typeof targetQuantity === "number"
      ? targetQuantity
      : Number(targetQuantity) || 0

  // Live Backend Preview Hook
  React.useEffect(() => {
    if (!selectedProductId || effectiveQty <= 0) {
      setPreview(null)
      return
    }
    let ignore = false
    setLoadingPreview(true)
    productionService
      .previewProduction({ variantId: selectedProductId, quantity: effectiveQty })
      .then((res) => {
        if (!ignore) {
          setPreview(res)
        }
      })
      .catch((err) => {
        console.warn("Backend preview calculation warning:", err)
      })
      .finally(() => {
        if (!ignore) setLoadingPreview(false)
      })

    return () => {
      ignore = true
    }
  }, [selectedProductId, effectiveQty])

  // Ingredient audit & readiness calculations
  const ingredientAudit = React.useMemo(() => {
    const qty = effectiveQty
    if (preview && preview.items && preview.items.length > 0) {
      return preview.items.map((i) => {
        const shortage = i.is_sufficient ? 0 : Math.max(0, i.required_qty - i.available_qty)
        const baseQty = qty > 0 ? i.required_qty / qty : i.required_qty
        return {
          id: i.stock_id,
          stockId: i.stock_id,
          stockName: i.stock_name,
          baseUnit: i.unit,
          quantity: baseQty,
          neededQty: i.required_qty,
          availableStock: i.available_qty,
          isSufficient: i.is_sufficient,
          shortage,
          estimatedCost: i.estimated_cost,
        }
      })
    }

    if (!selectedProduct) return []
    const scaleQty = Math.max(1, qty)

    return (selectedProduct.ingredients || []).map((ing) => {
      const neededQty = (ing.quantity || 0) * scaleQty
      const availableStock = ing.availableStock || 0
      const isSufficient = availableStock >= neededQty
      const shortage = isSufficient ? 0 : neededQty - availableStock
      const estimatedCost = (ing.subtotalCost || 0) * scaleQty

      return {
        id: ing.id || ing.stockId,
        stockId: ing.stockId,
        stockName: ing.stockName,
        baseUnit: ing.baseUnit,
        quantity: ing.quantity || 0,
        neededQty,
        availableStock,
        isSufficient,
        shortage,
        estimatedCost,
      }
    })
  }, [preview, selectedProduct, effectiveQty])

  const allIngredientsAvailable = React.useMemo(() => {
    if (preview) return preview.is_all_sufficient
    return ingredientAudit.length > 0 && ingredientAudit.every((i) => i.isSufficient)
  }, [preview, ingredientAudit])

  const totalEstimatedRawCost = React.useMemo(() => {
    if (preview) return preview.estimated_bom
    return ingredientAudit.reduce((acc, curr) => acc + curr.estimatedCost, 0)
  }, [preview, ingredientAudit])

  const estimatedHppPerUnit = React.useMemo(() => {
    if (preview) return preview.estimated_hpp
    const qty = Math.max(1, effectiveQty)
    return Math.round(totalEstimatedRawCost / qty)
  }, [preview, totalEstimatedRawCost, effectiveQty])

  const sellingPrice = selectedProduct?.sellingPrice || 0
  const projectedRevenue = sellingPrice * effectiveQty
  const projectedGrossProfit = projectedRevenue - totalEstimatedRawCost
  const projectedMargin =
    projectedRevenue > 0
      ? Math.round((projectedGrossProfit / projectedRevenue) * 1000) / 10
      : 0

  // Category list for filter
  const categories = React.useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => {
      if (p.category) set.add(p.category)
    })
    return Array.from(set)
  }, [products])

  // Filtered recipes
  const filteredProducts = React.useMemo(() => {
    return products.filter((p) => {
      const query = searchQuery.trim().toLowerCase()
      const matchesSearch =
        query === "" ||
        p.name.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query)
      const matchesCategory =
        selectedCategory === "all" || p.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [products, searchQuery, selectedCategory])

  // Stepper navigation helpers
  function goTo(nextStep: number) {
    setError("")
    setStep(nextStep)
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  function validate(stepIndex: number): string | null {
    if (stepIndex === 0) {
      if (!selectedProductId || !selectedProduct) {
        return "Pilih produk terlebih dahulu sebelum melanjutkan."
      }
    }
    if (stepIndex === 1) {
      if (effectiveQty <= 0) {
        return "Target kuantitas produksi harus lebih dari 0."
      }
    }
    return null
  }

  function next() {
    const validationError = validate(step)
    if (validationError) {
      setError(validationError)
      return
    }
    setError("")
    setVisited((prev) => Math.max(prev, step + 1))
    goTo(step + 1)
  }

  function handleStepClick(targetStep: number) {
    if (targetStep > step) {
      for (let s = step; s < targetStep; s++) {
        const validationError = validate(s)
        if (validationError) {
          setError(validationError)
          return
        }
      }
    }
    goTo(targetStep)
  }

  function handleQuantityChange(delta: number) {
    setTargetQuantity((prev) => {
      const current = Number(prev) || 0
      if (delta < 0 && current <= 1) return 1
      if (delta < 0 && current <= 10) return Math.max(1, current - 1)
      return Math.max(1, current + delta)
    })
    setError("")
  }

  const dirty = Boolean(
    (selectedProduct && products.length > 0 && selectedProductId !== products[0]?.id) ||
      effectiveQty !== 1 ||
      chefName !== "Baker Utama" ||
      notes !== ""
  )

  function leave() {
    if (onCancel) onCancel()
    else navigate("/production/batches")
  }

  function cancel() {
    if (dirty) {
      setConfirmLeave(true)
    } else {
      leave()
    }
  }

  // Submit batch
  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    for (let s = 0; s <= 1; s++) {
      const validationError = validate(s)
      if (validationError) {
        goTo(s)
        setError(validationError)
        return
      }
    }

    if (!selectedProduct) {
      setError("Pilih produk terlebih dahulu")
      return
    }
    if (effectiveQty <= 0) {
      setError("Target kuantitas produksi harus lebih dari 0")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const combinedNotes = [
        chefName.trim() ? `Penanggung Jawab: ${chefName.trim()}` : "",
        notes.trim() ? `Catatan: ${notes.trim()}` : "",
      ]
        .filter(Boolean)
        .join(" | ")

      const newBatch = await productionService.startProduction({
        variantId: selectedProduct.id,
        targetQuantity: effectiveQty,
        notes: combinedNotes,
      })

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["production"] }),
        queryClient.invalidateQueries({ queryKey: ["subscription-usage"] }),
      ])

      window.dispatchEvent(
        new CustomEvent("guidance-task-success", { detail: { feature: "production" } })
      )

      if (onSaved) {
        onSaved(newBatch)
      } else {
        navigate(`/production/batches/${newBatch.id}`)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memulai batch produksi"
      setError(msg)
      setSubmitting(false)
    }
  }

  const isInitialLoading = useInitialLoading(loadingProducts)
  if (isInitialLoading) {
    return <div className="min-h-[60vh]" />
  }

  return (
    <div ref={topRef} className="flex flex-col gap-6 pb-24 animate-in fade-in duration-300">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Link to="/production/batches" className="hover:text-foreground transition-colors">
          Dapur Produksi
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/production/batches" className="hover:text-foreground transition-colors">
          Batches
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-foreground">Mulai Batch Baru</span>
      </div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={cancel}
            className="h-10 w-10 rounded-xl shrink-0"
            title="Kembali ke Daftar Batch"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Mulai Batch Produksi Baru
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Alur bertahap: pilih produk acuan, atur target & verifikasi stok FIFO, lalu konfirmasi.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="ghost"
            onClick={cancel}
            className="rounded-xl h-10 text-xs font-semibold flex-1 sm:flex-initial"
          >
            Batal
          </Button>
          {step === 2 && (
            <Button
              type="button"
              onClick={() => handleSubmit()}
              disabled={submitting || !selectedProduct || effectiveQty <= 0}
              className="rounded-xl shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center justify-center gap-2 h-10 px-5 flex-1 sm:flex-initial"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Factory className="h-4 w-4" />
              )}
              <span>Mulai Masak di Dapur</span>
            </Button>
          )}
        </div>
      </div>

      {/* Stepper Header (Identical pattern to ProductBuilder) */}
      <nav aria-label="Tahapan Pembuatan Batch">
        <ol className="flex flex-wrap gap-x-4 gap-y-2 border-b border-border pb-4">
          {STEPS.map((label, i) => {
            const isActive = step === i
            const isCompleted = i < step
            const isAccessible = i <= visited
            return (
              <li key={label}>
                <button
                  type="button"
                  aria-current={isActive ? "step" : undefined}
                  disabled={submitting || !isAccessible}
                  onClick={() => handleStepClick(i)}
                  className={cn(
                    "flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
                    isActive
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : isCompleted
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700"
                        : "border-muted-foreground/30 text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="size-3.5 stroke-[3]" aria-hidden />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span>{label}</span>
                </button>
              </li>
            )
          })}
        </ol>
      </nav>

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3 animate-in fade-in"
        >
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-xs sm:text-sm">Periksa Isian Sebelum Melanjutkan</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setError("")}
            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Main Step Content */}
      <div className="space-y-6">
        {/* STEP 0: PILIH PRODUK */}
        {step === 0 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <Card className="rounded-2xl border-border shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Boxes className="h-4 w-4 text-primary" />
                      Langkah 1: Pilih Produk Acuan
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Hanya produk dengan metode <em>Siapkan stok dulu</em> dan formulasi bahan baku aktif yang dapat diproduksi di dapur.
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-xs font-mono shrink-0 self-start sm:self-auto">
                    {products.length} Produk Siap Produksi
                  </Badge>
                </div>

                {/* Search & Category Filter Toolbar */}
                <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="text"
                      placeholder="Cari produk atau kategori..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-8 h-10 rounded-xl text-xs"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {categories.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
                      <Button
                        type="button"
                        size="sm"
                        variant={selectedCategory === "all" ? "default" : "outline"}
                        onClick={() => setSelectedCategory("all")}
                        className="h-8 text-xs rounded-lg px-3 shrink-0"
                      >
                        Semua Kategori
                      </Button>
                      {categories.map((cat) => (
                        <Button
                          key={cat}
                          type="button"
                          size="sm"
                          variant={selectedCategory === cat ? "default" : "outline"}
                          onClick={() => setSelectedCategory(cat)}
                          className="h-8 text-xs rounded-lg px-3 shrink-0"
                        >
                          {cat}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {isProductsError && (
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                    Gagal memuat data produk. Silakan muat ulang halaman.
                  </div>
                )}

                {filteredProducts.length === 0 && (
                  <div className="py-12 px-4 text-center border border-dashed rounded-xl space-y-2">
                    <Boxes className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-sm font-semibold text-foreground">
                      Tidak ada product yang sesuai
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {searchQuery
                        ? "Coba gunakan kata kunci pencarian lain atau ubah filter kategori."
                        : 'Belum ada produk dengan metode "Siapkan stok dulu" dan bahan baku aktif di toko ini.'}
                    </p>
                  </div>
                )}

                {filteredProducts.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {filteredProducts.map((prod) => {
                      const isSelected = prod.id === selectedProductId
                      return (
                        <div
                          key={prod.id}
                          role="radio"
                          aria-checked={isSelected}
                          tabIndex={0}
                          onClick={() => {
                            setSelectedProductId(prod.id)
                            setError("")
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              setSelectedProductId(prod.id)
                              setError("")
                            }
                          }}
                          className={cn(
                            "p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-3 text-left relative focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            isSelected
                              ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                              : "border-border hover:border-primary/40 hover:bg-muted/40"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <Badge
                                variant="outline"
                                className="text-[10px] py-0 px-2 font-medium mb-1.5"
                              >
                                {prod.category || "Umum"}
                              </Badge>
                              <h4 className="font-bold text-sm text-foreground truncate">
                                {prod.name}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Stok Jadi:{" "}
                                <strong className="text-foreground font-semibold">
                                  {prod.currentStock} {prod.unit}
                                </strong>
                              </p>
                            </div>

                            <div
                              className={cn(
                                "h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                                isSelected
                                  ? "bg-primary border-primary text-primary-foreground"
                                  : "border-border"
                              )}
                            >
                              {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                            <span>Harga Jual:</span>
                            <span className="font-mono font-semibold text-foreground">
                              <CurrencyText value={prod.sellingPrice} />
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* STEP 1: TARGET & AUDIT STOK */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Selected Recipe Banner Reminder */}
            {selectedProduct && (
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <Badge variant="outline" className="text-[10px] py-0 px-2 font-medium">
                    {selectedProduct.category}
                  </Badge>
                  <span className="font-bold text-foreground text-sm">
                    {selectedProduct.name}
                  </span>
                  <span className="text-muted-foreground">
                    ({selectedProduct.unit})
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => goTo(0)}
                  className="h-8 text-xs font-semibold text-primary hover:text-primary"
                >
                  Ganti Produk
                </Button>
              </div>
            )}

            <Card className="rounded-2xl border-border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Scale className="h-4 w-4 text-primary" />
                  Parameter & Target Batch Dapur
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Tentukan kuantitas unit yang akan dimasak serta personil penanggung jawab produksi.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Target Quantity Input with Stepper */}
                <div className="p-4 sm:p-5 rounded-xl bg-card border border-border space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Target Jumlah Unit Produksi ({selectedProduct?.unit || "pcs"}){" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Kuantitas unit produk jadi yang direncanakan selesai dalam batch ini.
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs font-mono font-bold">
                      Skala Produksi: {effectiveQty}x
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(-10)}
                      disabled={effectiveQty <= 1}
                      className="h-12 w-12 rounded-xl shrink-0"
                      title="-10 unit (atau -1 jika di bawah 10)"
                    >
                      <Minus className="h-5 w-5" />
                    </Button>

                    <div className="relative flex-1">
                      <Input
                        type="number"
                        min="1"
                        placeholder="1"
                        value={targetQuantity}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === "") {
                            setTargetQuantity("")
                          } else {
                            const parsed = parseInt(val, 10)
                            setTargetQuantity(isNaN(parsed) ? "" : parsed)
                          }
                          setError("")
                        }}
                        onBlur={() => {
                          if (targetQuantity === "" || targetQuantity <= 0) {
                            setTargetQuantity(1)
                          }
                        }}
                        className="rounded-xl h-12 text-center font-mono font-bold text-2xl text-primary"
                        required
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none">
                        {selectedProduct?.unit || "pcs"}
                      </span>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(10)}
                      className="h-12 w-12 rounded-xl shrink-0"
                      title="+10 unit"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Quick Presets (10, 20, 50, 75, 100) */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/60">
                    <span className="text-xs text-muted-foreground mr-1">Preset cepat:</span>
                    {QUANTITY_PRESETS.map((preset) => (
                      <Button
                        key={preset}
                        type="button"
                        variant={effectiveQty === preset ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setTargetQuantity(preset)
                          setError("")
                        }}
                        className="h-8 text-xs rounded-lg px-3 font-mono font-semibold"
                      >
                        {preset} {selectedProduct?.unit || "unit"}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Chef / Baker & Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Penanggung Jawab / Baker (Opsional)
                    </Label>
                    <Input
                      placeholder="Contoh: Chef Budi, Baker Utama"
                      onChange={(e) => setChefName(e.target.value)}
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Catatan Batch Produksi (Opsional)
                    </Label>
                    <Input
                      placeholder="Contoh: Pesanan katering acara 50 box, display etalase sore..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Kebutuhan Bahan Baku & Kesiapan Stok FIFO */}
            <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Kebutuhan Bahan Baku & Kesiapan Stok FIFO
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Kalkulasi otomatis jumlah gramatur bahan yang akan dikonsumsi dari stok gudang terlama (FIFO) untuk target {effectiveQty} {selectedProduct?.unit}.
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {loadingPreview && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {allIngredientsAvailable ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs font-semibold flex items-center gap-1.5 px-3 py-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Stok Gudang Siap 100%</span>
                      </Badge>
                    ) : (
                      <Badge
                        variant="destructive"
                        className="text-xs font-semibold flex items-center gap-1.5 px-3 py-1"
                      >
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span>Sebagian Stok Kurang</span>
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Warning if stock is insufficient */}
              {!allIngredientsAvailable && (
                <div className="mx-4 sm:mx-6 mb-3 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-700 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-800">Perhatian: Stok Gudang Kurang</p>
                    <p className="mt-0.5 text-xs leading-relaxed">
                      Beberapa bahan baku tidak mencukupi untuk target {effectiveQty}{" "}
                      {selectedProduct?.unit}. Anda dapat mengurangi kuantitas target produksi atau membuat Purchase Order ke supplier terlebih dahulu.
                    </p>
                  </div>
                </div>
              )}

              <div className="border-t border-border overflow-x-auto">
                <Table className="min-w-[650px]">
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="text-xs font-semibold">Bahan Baku</TableHead>
                      <TableHead className="text-xs font-semibold text-right">
                        Kebutuhan / Unit
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-right">
                        Total Kebutuhan
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-right">
                        Stok Gudang
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-center">
                        Status
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-right">
                        Est. Biaya (FIFO)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ingredientAudit.map((ing) => (
                      <TableRow key={ing.id} className="hover:bg-muted/30">
                        <TableCell className="font-semibold text-xs text-foreground">
                          {ing.stockName}
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono text-muted-foreground">
                          {ing.quantity.toLocaleString("id-ID")} {ing.baseUnit}
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono font-bold text-foreground">
                          {ing.neededQty.toLocaleString("id-ID")} {ing.baseUnit}
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono">
                          <span
                            className={
                              ing.isSufficient
                                ? "text-muted-foreground"
                                : "text-destructive font-bold"
                            }
                          >
                            {ing.availableStock.toLocaleString("id-ID")} {ing.baseUnit}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {ing.isSufficient ? (
                            <Badge
                              variant="outline"
                              className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-semibold py-0.5"
                            >
                              ✓ Cukup
                            </Badge>
                          ) : (
                            <Badge
                              variant="destructive"
                              className="text-[10px] font-semibold py-0.5"
                            >
                              Kurang {ing.shortage.toLocaleString("id-ID")} {ing.baseUnit}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-semibold text-foreground">
                          <CurrencyText value={ing.estimatedCost} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="px-4 sm:px-6 py-4 bg-muted/20 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <span className="text-muted-foreground font-medium">
                  Total Estimasi Konsumsi Biaya Bahan Baku:
                </span>
                <span className="font-mono font-bold text-base text-foreground">
                  <CurrencyText value={totalEstimatedRawCost} />
                </span>
              </div>
            </Card>
          </div>
        )}

        {/* STEP 2: REVIEW & KONFIRMASI */}
        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
            {/* Left 7 cols: Summary & Operational Guidance */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Summary Card */}
              <Card className="rounded-2xl border-border shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Rangkuman Parameter Batch
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      Langkah 3 / 3
                    </Badge>
                  </div>
                  <CardDescription className="text-xs mt-0.5">
                    Tinjau kembali parameter batch sebelum dapur memulai proses memasak dan memotong stok persediaan.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/70 space-y-1">
                      <dt className="text-muted-foreground">Produk Acuan:</dt>
                      <dd className="font-bold text-foreground text-sm">
                        {selectedProduct?.name}
                      </dd>
                      <dd className="text-muted-foreground text-[11px]">
                        Kategori: {selectedProduct?.category || "Umum"}
                      </dd>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/30 border border-border/70 space-y-1">
                      <dt className="text-muted-foreground">Target Produksi:</dt>
                      <dd className="font-bold text-foreground text-sm font-mono">
                        {effectiveQty} {selectedProduct?.unit || "pcs"}
                      </dd>
                      <dd className="text-muted-foreground text-[11px]">
                        Skala: {effectiveQty}x formula standar
                      </dd>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/30 border border-border/70 space-y-1">
                      <dt className="text-muted-foreground">Penanggung Jawab:</dt>
                      <dd className="font-semibold text-foreground">
                        {chefName.trim() || "-"}
                      </dd>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/30 border border-border/70 space-y-1">
                      <dt className="text-muted-foreground">Kesiapan Stok FIFO:</dt>
                      <dd>
                        {allIngredientsAvailable ? (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Stok Siap 100%
                          </span>
                        ) : (
                          <span className="text-destructive font-semibold flex items-center gap-1">
                            <ShieldAlert className="h-3.5 w-3.5" /> Sebagian Stok Kurang
                          </span>
                        )}
                      </dd>
                    </div>

                    <div className="sm:col-span-2 p-3 rounded-xl bg-muted/30 border border-border/70 space-y-1">
                      <dt className="text-muted-foreground">Catatan Batch:</dt>
                      <dd className="text-foreground">
                        {notes.trim() || "Tidak ada catatan tambahan."}
                      </dd>
                    </div>
                  </dl>

                  {/* Quick Edit Links */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground mr-1">Ingin mengubah?</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => goTo(0)}
                      className="h-8 text-xs rounded-lg"
                    >
                      Ubah Produk
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => goTo(1)}
                      className="h-8 text-xs rounded-lg"
                    >
                      Ubah Target
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => goTo(1)}
                      className="h-8 text-xs rounded-lg"
                    >
                      Audit Stok Bahan
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Kitchen Workflow Info Card */}
              <Card className="rounded-2xl border-border shadow-sm p-4 bg-muted/30 text-xs text-muted-foreground space-y-3">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <Info className="h-4 w-4 text-primary" />
                  <span>Bagaimana Batch Diproses?</span>
                </div>

                <ol className="space-y-2 list-decimal list-inside leading-relaxed text-[11px]">
                  <li>
                    <strong className="text-foreground">Pemotongan FIFO Otomatis:</strong> Stok bahan baku langsung dikurangi dari lot persediaan tertua di gudang.
                  </li>
                  <li>
                    <strong className="text-foreground">Live Cooking Timer:</strong> Batch masuk ke status <em>IN PROGRESS</em> dan timer durasi memasak mulai berjalan.
                  </li>
                  <li>
                    <strong className="text-foreground">Pencatatan Yield & Overhead:</strong> Saat selesai memanggang, input unit bagus aktual dan biaya listrik/tenaga kerja untuk menghasilkan HPP riil per unit.
                  </li>
                </ol>
              </Card>
            </div>

            {/* Right 5 cols: Financial Projection Hero Card */}
            <div className="lg:col-span-5 flex flex-col gap-6 sticky top-6">
              <Card className="rounded-2xl border border-slate-300/80 bg-slate-100/70 shadow-sm overflow-hidden">
                <CardHeader className="p-5 pb-3.5 border-b border-slate-200/90 bg-slate-200/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-sm font-bold text-slate-800 tracking-tight">
                        Proyeksi Finansial Dapur
                      </CardTitle>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-white text-slate-600 border-slate-300/80 text-[10px] font-mono tracking-wider uppercase font-semibold"
                    >
                      Live Preview
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  {/* Main Projected HPP / Unit Hero Box */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                      Proyeksi HPP Bahan / Unit
                    </span>
                    <span className="text-3xl font-black font-mono tracking-tight text-primary mt-1">
                      <CurrencyText value={estimatedHppPerUnit} />
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">
                      per 1 {selectedProduct?.unit || "pcs"} (HPP Bahan Baku FIFO)
                    </span>
                  </div>

                  {/* Financial Metric Rows */}
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                      <span className="text-slate-600">Target Produksi:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {effectiveQty} {selectedProduct?.unit || "pcs"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                      <span className="text-slate-600">Harga Jual / Unit:</span>
                      <span className="font-mono font-bold text-slate-900">
                        <CurrencyText value={sellingPrice} />
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                      <span className="text-slate-600">Est. Total Biaya Bahan:</span>
                      <span className="font-mono font-bold text-slate-900">
                        <CurrencyText value={totalEstimatedRawCost} />
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                      <span className="text-slate-600">Est. Nilai Penjualan Kotor:</span>
                      <span className="font-mono font-bold text-slate-900">
                        <CurrencyText value={projectedRevenue} />
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2 bg-emerald-50 border border-emerald-200/70 px-3 rounded-xl text-emerald-800">
                      <span className="font-semibold text-xs text-emerald-900">
                        Proyeksi Margin Bahan:
                      </span>
                      <span className="font-mono font-black text-base text-emerald-700">
                        {projectedMargin}%
                      </span>
                    </div>
                  </div>

                  {sellingPrice > 0 && estimatedHppPerUnit > sellingPrice && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs">
                      Harga jual saat ini lebih rendah dari proyeksi HPP bahan baku.
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-1" />

                  {/* Submit CTA Button */}
                  <Button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={submitting || !selectedProduct || effectiveQty <= 0}
                    className="w-full h-11 rounded-xl shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground font-bold flex items-center justify-center gap-2 text-sm transition-all"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Factory className="h-4 w-4" />
                    )}
                    <span>Mulai Batch Produksi Sekarang</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={cancel}
                    className="w-full h-9 rounded-xl text-xs font-semibold bg-white border border-slate-300/80 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  >
                    Batal & Kembali
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 backdrop-blur-sm p-4 sticky bottom-4 shadow-lg">
        <p className="text-xs text-muted-foreground font-medium">
          Langkah {step + 1} dari {STEPS.length}
          {dirty && " · Parameter belum dimulai"}
        </p>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Button
            type="button"
            variant="ghost"
            className="h-10 text-xs font-semibold flex-1 sm:flex-none"
            disabled={submitting}
            onClick={cancel}
          >
            Batal
          </Button>

          {step > 0 && (
            <Button
              type="button"
              variant="outline"
              className="h-10 text-xs font-semibold flex-1 sm:flex-none"
              disabled={submitting}
              onClick={() => goTo(step - 1)}
            >
              Kembali
            </Button>
          )}

          {step < 2 ? (
            <Button
              type="button"
              className="h-10 text-xs font-semibold flex-1 sm:flex-none"
              disabled={submitting}
              onClick={next}
            >
              <span>Lanjut</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              className="h-10 text-xs font-semibold flex-1 sm:flex-none"
              disabled={submitting || !selectedProduct || effectiveQty <= 0}
              onClick={() => handleSubmit()}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Memulai...</span>
                </>
              ) : (
                <>
                  <Factory className="mr-2 h-4 w-4" />
                  <span>Mulai Masak di Dapur</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Confirm Leave Dialog */}
      <Dialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Keluar dari Form Produksi?</DialogTitle>
            <DialogDescription>
              Batch belum dimulai. Keluar sekarang akan membatalkan pengaturan batch yang sudah Anda isi.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 text-xs font-semibold"
              onClick={() => setConfirmLeave(false)}
            >
              Lanjut Mengisi
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-10 text-xs font-semibold"
              onClick={leave}
            >
              Keluar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
