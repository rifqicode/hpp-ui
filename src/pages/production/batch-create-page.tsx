import * as React from "react"
import { useNavigate, Link } from "react-router-dom"
import {
  ArrowLeft,
  Factory,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Plus,
  Minus,
  Scale,
  Boxes,
  FileText,
  ChevronRight,
  Info,
  ShieldAlert,
  Loader2,
  Check,
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

import { productionService } from "@/features/production/services/production-service"
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

export default function BatchCreatePage() {
  const navigate = useNavigate()

  const [products, setProducts] = React.useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = React.useState<boolean>(true)
  const [submitting, setSubmitting] = React.useState<boolean>(false)
  const [error, setError] = React.useState<string>("")

  // Form State
  const [selectedProductId, setSelectedProductId] = React.useState<string>("")
  const [targetQuantity, setTargetQuantity] = React.useState<number>(50)
  const [chefName, setChefName] = React.useState<string>("Baker Utama")
  const [notes, setNotes] = React.useState<string>("")

  // Load products with recipes
  React.useEffect(() => {
    let mounted = true
    setLoadingProducts(true)
    recipeService
      .getProducts()
      .then((res) => {
        if (mounted) {
          setProducts(res)
          if (res.length > 0) {
            setSelectedProductId(res[0].id)
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load products:", err)
        if (mounted) setError("Gagal memuat resep produk")
      })
      .finally(() => {
        if (mounted) setLoadingProducts(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  // Selected Product
  const selectedProduct = React.useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || null
  }, [products, selectedProductId])

  // Ingredient audit & readiness calculations
  const ingredientAudit = React.useMemo(() => {
    if (!selectedProduct) return []
    const qty = Math.max(1, targetQuantity || 0)

    return selectedProduct.ingredients.map((ing) => {
      const neededQty = ing.quantity * qty
      const availableStock = ing.availableStock || 0
      const isSufficient = availableStock >= neededQty
      const shortage = isSufficient ? 0 : neededQty - availableStock
      const estimatedCost = ing.subtotalCost * qty

      return {
        ...ing,
        neededQty,
        availableStock,
        isSufficient,
        shortage,
        estimatedCost,
      }
    })
  }, [selectedProduct, targetQuantity])

  const allIngredientsAvailable = React.useMemo(() => {
    return ingredientAudit.length > 0 && ingredientAudit.every((i) => i.isSufficient)
  }, [ingredientAudit])

  const totalEstimatedRawCost = React.useMemo(() => {
    return ingredientAudit.reduce((acc, curr) => acc + curr.estimatedCost, 0)
  }, [ingredientAudit])

  const estimatedHppPerUnit = React.useMemo(() => {
    const qty = Math.max(1, targetQuantity || 0)
    return Math.round(totalEstimatedRawCost / qty)
  }, [totalEstimatedRawCost, targetQuantity])

  const sellingPrice = selectedProduct?.sellingPrice || 0
  const projectedRevenue = sellingPrice * (targetQuantity || 0)
  const projectedGrossProfit = projectedRevenue - totalEstimatedRawCost
  const projectedMargin =
    projectedRevenue > 0
      ? Math.round((projectedGrossProfit / projectedRevenue) * 1000) / 10
      : 0

  // Adjust quantity helpers
  function handleQuantityChange(delta: number) {
    setTargetQuantity((prev) => Math.max(1, (prev || 0) + delta))
  }

  // Handle Submit Form
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProduct) {
      setError("Pilih produk resep terlebih dahulu")
      return
    }
    if (targetQuantity <= 0) {
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
        productId: selectedProduct.id,
        targetQuantity,
        notes: combinedNotes,
      })

      // Redirect immediately to the newly created batch detail page for live audit!
      navigate(`/production/batches/${newBatch.id}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memulai batch produksi"
      setError(msg)
      setSubmitting(false)
    }
  }

  if (loadingProducts) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Memuat data resep & katalog produk...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-20 animate-in fade-in duration-300">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
            variant="outline"
            size="icon"
            onClick={() => navigate("/production/batches")}
            className="h-10 w-10 rounded-xl shrink-0"
            title="Kembali ke Daftar Batch"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Mulai Batch Produksi Baru
              </h1>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold">
                Dapur & Alokasi FIFO
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Pilih produk dari resep standar, tentukan kuantitas target, dan verifikasi ketersediaan stok bahan baku gudang.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => navigate("/production/batches")}
            className="rounded-xl h-10 text-xs font-semibold"
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !selectedProduct || targetQuantity <= 0}
            className="rounded-xl shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center gap-2 h-10 px-5"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Factory className="h-4 w-4" />
            )}
            <span>Mulai Masak di Dapur</span>
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Perhatian</p>
            <p className="text-xs">{error}</p>
          </div>
        </div>
      )}

      {/* Main Grid Content */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Input Configuration & Live FIFO Audit (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* 1. SELEKSI PRODUK / RESEP */}
          <Card className="rounded-2xl border-border shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-primary" />
                    1. Pilih Produk & Resep Acuan
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Hanya produk yang memiliki formulasi resep aktif yang dapat diproduksi di dapur.
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs font-mono">
                  {products.length} Resep Tersedia
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {products.map((prod) => {
                  const isSelected = prod.id === selectedProductId
                  return (
                    <div
                      key={prod.id}
                      onClick={() => setSelectedProductId(prod.id)}
                      className={`
                        p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-3 text-left relative
                        ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                            : "border-border hover:border-primary/40 hover:bg-muted/40"
                        }
                      `}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Badge variant="outline" className="text-[10px] py-0 px-2 font-medium mb-1">
                            {prod.category}
                          </Badge>
                          <h4 className="font-bold text-sm text-foreground truncate">{prod.name}</h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Stok Jadi: <strong className="text-foreground">{prod.currentStock} {prod.unit}</strong>
                          </p>
                        </div>
                        <div className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-border'}`}>
                          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground text-[11px]">HPP Resep:</span>
                        <span className="font-mono font-bold text-foreground">
                          {formatCurrencyIdr(prod.latestHpp)}
                          <span className="text-[10px] text-muted-foreground font-normal"> / {prod.unit}</span>
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {selectedProduct && (
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        Resep Terpilih: {selectedProduct.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Mengandung {selectedProduct.ingredients.length} jenis bahan baku acuan standar.
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`/production/recipes/${selectedProduct.id}`}
                    target="_blank"
                    className="text-primary hover:underline font-semibold flex items-center gap-1 shrink-0"
                  >
                    Buka Resep <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. PARAMETER PRODUKSI (TARGET & METADATA OPERASIONAL) */}
          <Card className="rounded-2xl border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Scale className="h-4 w-4 text-primary" />
                2. Parameter & Target Batch Dapur
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Tentukan seberapa banyak unit yang akan dimasak serta informasi stasiun kerja dapur.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Target Quantity Input with Quick Stepper */}
              <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Target Jumlah Unit Produk ({selectedProduct?.unit || "pcs"}) <span className="text-destructive">*</span>
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    Skala Resep: <strong className="text-primary font-mono font-bold">{targetQuantity}x</strong>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(-10)}
                    disabled={targetQuantity <= 10}
                    className="h-11 w-11 rounded-xl shrink-0"
                    title="-10 unit"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>

                  <div className="relative flex-1">
                    <Input
                      type="number"
                      min="1"
                      value={targetQuantity}
                      onChange={(e) => setTargetQuantity(Math.max(1, Number(e.target.value) || 0))}
                      className="rounded-xl h-11 text-center font-mono font-bold text-xl text-primary"
                      required
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none">
                      {selectedProduct?.unit || "pcs"}
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(10)}
                    className="h-11 w-11 rounded-xl shrink-0"
                    title="+10 unit"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-muted-foreground mr-1">Preset cepat:</span>
                  {[20, 30, 50, 75, 100].map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      variant={targetQuantity === preset ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTargetQuantity(preset)}
                      className="h-7 text-xs rounded-lg px-2.5 font-mono"
                    >
                      {preset}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Chef / Baker & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Penanggung Jawab / Baker (Opsional)</Label>
                  <Input
                    placeholder="Contoh: Chef Budi, Baker Utama"
                    value={chefName}
                    onChange={(e) => setChefName(e.target.value)}
                    className="rounded-xl h-10 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Catatan Batch Produksi (Opsional)</Label>
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

          {/* 3. AUDIT KEBUTUHAN BAHAN BAKU & KESIAPAN FIFO GUDANG */}
          <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    3. Kebutuhan Bahan Baku & Kesiapan Stok FIFO
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Kalkulasi otomatis jumlah gramatur bahan yang akan dikonsumsi dari stok gudang terlama (FIFO).
                  </CardDescription>
                </div>

                {allIngredientsAvailable ? (
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs font-semibold flex items-center gap-1.5 px-3 py-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Stok Gudang Siap 100%</span>
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs font-semibold flex items-center gap-1.5 px-3 py-1">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>Sebagian Stok Kurang</span>
                  </Badge>
                )}
              </div>
            </CardHeader>

            {/* Warning if stock is insufficient */}
            {!allIngredientsAvailable && (
              <div className="mx-6 mb-3 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-700 text-xs flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-800">Perhatian: Stok Gudang Kurang</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed">
                    Beberapa bahan baku tidak mencukupi untuk target {targetQuantity} {selectedProduct?.unit}. Anda dapat mengurangi kuantitas target produksi atau membuat Purchase Order ke supplier terlebih dahulu.
                  </p>
                </div>
              </div>
            )}

            <div className="border-t border-border">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Bahan Baku</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Kebutuhan / Unit</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Total Kebutuhan</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Stok Gudang</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Est. Biaya (FIFO)</TableHead>
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
                        <span className={ing.isSufficient ? "text-muted-foreground" : "text-destructive font-bold"}>
                          {ing.availableStock.toLocaleString("id-ID")} {ing.baseUnit}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {ing.isSufficient ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-semibold py-0.5">
                            ✓ Cukup
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px] font-semibold py-0.5">
                            Kurang {ing.shortage.toLocaleString("id-ID")} {ing.baseUnit}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold text-foreground">
                        {formatCurrencyIdr(ing.estimatedCost)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">
                Total Estimasi Konsumsi Biaya Bahan Baku:
              </span>
              <span className="font-mono font-bold text-base text-foreground">
                {formatCurrencyIdr(totalEstimatedRawCost)}
              </span>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Financial Projection & Kitchen Instructions (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6 sticky top-6">
          {/* Card: Proyeksi Finansial Batch (Soft Off-White Highlighted Card) */}
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
                <Badge variant="outline" className="bg-white text-slate-600 border-slate-300/80 text-[10px] font-mono tracking-wider uppercase font-semibold">
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
                  {formatCurrencyIdr(estimatedHppPerUnit)}
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
                    {targetQuantity} {selectedProduct?.unit || "pcs"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-600">Harga Jual / Unit:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrencyIdr(sellingPrice)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-600">Est. Total Biaya Bahan:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrencyIdr(totalEstimatedRawCost)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-600">Est. Nilai Penjualan Kotor:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrencyIdr(projectedRevenue)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 bg-emerald-50 border border-emerald-200/70 px-3 rounded-xl text-emerald-800">
                  <span className="font-semibold text-xs text-emerald-900">Proyeksi Margin Bahan:</span>
                  <span className="font-mono font-black text-base text-emerald-700">
                    {projectedMargin}%
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-1" />

              {/* Submit CTA Button */}
              <Button
                type="submit"
                disabled={submitting || !selectedProduct || targetQuantity <= 0}
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
                onClick={() => navigate("/production/batches")}
                className="w-full h-9 rounded-xl text-xs font-semibold bg-white border border-slate-300/80 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              >
                Batal & Kembali
              </Button>
            </CardContent>
          </Card>

          {/* Card: Alur Kerja Dapur */}
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
      </form>
    </div>
  )
}
