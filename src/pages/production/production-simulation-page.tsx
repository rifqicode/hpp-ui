import * as React from "react"
import { Link } from "react-router-dom"
import {
  Factory,
  Boxes,
  AlertTriangle,
  CheckCircle2,
  ShoppingCart,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  Package,
  Layers,
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
import { Badge } from "@/components/ui/badge"
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
import { productionService } from "@/features/production/services/production-service"
import type { ProductionPreviewResponse } from "@/features/production/types"
import { CurrencyText } from "@/components/ui/currency-text"

function formatNumber(val: number): string {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(val || 0)
}

export default function ProductionSimulationPage() {
  const [products, setProducts] = React.useState<Product[]>([])
  const [selectedProductId, setSelectedProductId] = React.useState<string>("")
  const [plannedQuantity, setPlannedQuantity] = React.useState<number>(100)
  const [isLoadingProducts, setIsLoadingProducts] = React.useState<boolean>(true)
  const [isPreviewLoading, setIsPreviewLoading] = React.useState<boolean>(false)
  const [previewData, setPreviewData] = React.useState<ProductionPreviewResponse | null>(null)
  const [previewError, setPreviewError] = React.useState<string | null>(null)

  // Fetch products
  React.useEffect(() => {
    let ignore = false
    setIsLoadingProducts(true)
    recipeService
      .getProducts()
      .then((data) => {
        if (!ignore) {
          setProducts(data)
          if (data.length > 0) {
            setSelectedProductId(data[0].id)
            if (data[0].yieldQty && data[0].yieldQty > 0) {
              setPlannedQuantity(data[0].yieldQty)
            }
          }
        }
      })
      .catch((err) => {
        console.error("Failed to fetch products for production simulation:", err)
      })
      .finally(() => {
        if (!ignore) setIsLoadingProducts(false)
      })

    return () => {
      ignore = true
    }
  }, [])

  // Selected product
  const selectedProduct = React.useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || null
  }, [products, selectedProductId])

  // When selected product changes, optionally update default batch size
  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId)
    const prod = products.find((p) => p.id === productId)
    if (prod && prod.yieldQty && prod.yieldQty > 0) {
      setPlannedQuantity(prod.yieldQty)
    }
  }

  // Load preview calculation from productionService
  const loadPreview = React.useCallback(async () => {
    if (!selectedProductId || plannedQuantity <= 0) return
    setIsPreviewLoading(true)
    setPreviewError(null)
    try {
      const data = await productionService.previewProduction({
        productId: selectedProductId,
        quantity: plannedQuantity,
      })
      setPreviewData(data)
    } catch (err: any) {
      console.error("Failed to load production preview:", err)
      setPreviewError(
        err?.response?.data?.message || err?.message || "Gagal memuat kalkulasi preview produksi."
      )
      setPreviewData(null)
    } finally {
      setIsPreviewLoading(false)
    }
  }, [selectedProductId, plannedQuantity])

  // Trigger preview when product or plannedQuantity changes (with debounce)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedProductId && plannedQuantity > 0) {
        loadPreview()
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [selectedProductId, plannedQuantity, loadPreview])

  // Deficit items (bahan yang kurang)
  const deficitItems = React.useMemo(() => {
    if (!previewData || !previewData.items) return []
    return previewData.items
      .filter((item) => !item.is_sufficient || item.available_qty < item.required_qty)
      .map((item) => {
        const deficit = Math.max(0, item.required_qty - item.available_qty)
        // Unit cost derived from estimated_cost / required_qty
        const unitPrice = item.required_qty > 0 ? item.estimated_cost / item.required_qty : 0
        const estimatedRestockCost = deficit * unitPrice
        return {
          ...item,
          deficit,
          unitPrice,
          estimatedRestockCost,
        }
      })
  }, [previewData])

  // Total shopping budget for deficit items
  const totalRestockBudget = React.useMemo(() => {
    return deficitItems.reduce((acc, curr) => acc + curr.estimatedRestockCost, 0)
  }, [deficitItems])

  return (
    <div className="flex flex-col gap-6 pb-20 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="border-b border-border pb-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Factory className="h-5 w-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Simulasi Produksi & Estimasi Restock
          </h1>
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs font-semibold">
            Real Inventory Sync
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Simulasikan rencana batch produksi dengan stok riil gudang. Cek kecukupan bahan baku dan hitung total anggaran belanja yang dibutuhkan bila stok defisit.
        </p>
      </div>

      {/* Product Selection & Batch Parameters */}
      <Card className="rounded-2xl border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Boxes className="h-4 w-4 text-primary" />
            1. Pilih Produk & Tentukan Jumlah Produksi
          </CardTitle>
          <CardDescription className="text-xs">
            Pilih produk yang sudah memiliki resep terdaftar, lalu atur target jumlah unit yang akan diproduksi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Product Picker */}
          {isLoadingProducts ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Memuat daftar produk...
            </div>
          ) : products.length === 0 ? (
            <div className="p-6 text-center rounded-xl border border-dashed border-border bg-muted/20">
              <Package className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm font-semibold text-foreground">Belum ada produk terdaftar</p>
              <p className="text-xs text-muted-foreground mt-1">
                Silakan buat produk beserta resep bahan bakunya terlebih dahulu.
              </p>
              <Button asChild size="sm" className="mt-3 rounded-xl text-xs font-semibold">
                <Link to="/production/products/new">Tambah Produk Baru</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-60 overflow-y-auto pr-1">
              {products.map((p) => {
                const isSelected = p.id === selectedProductId
                const hasRecipe = (p.ingredients && p.ingredients.length > 0)
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProduct(p.id)}
                    className={`
                      p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-2.5 text-left
                      ${isSelected ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm" : "border-border hover:border-primary/40 hover:bg-muted/30"}
                    `}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-medium">
                          {p.category || "Produk"}
                        </Badge>
                        {hasRecipe ? (
                          <span className="text-[10px] text-emerald-600 font-medium">
                            {p.ingredients?.length} Bahan
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-600 font-medium">
                            Tanpa Resep
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-xs text-foreground truncate">{p.name}</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Standar Yield: <strong className="text-foreground">{p.yieldQty || 1} {p.unit}</strong>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">HPP Saat Ini:</span>
                      <span className="font-mono font-bold text-primary">
                        <CurrencyText value={p.latestHpp || 0} />
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Planned Quantity Input & Controls */}
          {selectedProduct && (
            <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/20 p-4 rounded-xl">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">Target Produksi Rencana:</span>
                  <Badge variant="secondary" className="font-bold text-xs text-primary">
                    {selectedProduct.name}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Masukkan jumlah porsi/unit yang ingin Anda jadwalkan untuk batch produksi ini.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={plannedQuantity}
                    onChange={(e) => setPlannedQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="w-28 rounded-xl h-10 text-center font-mono font-bold text-base text-primary"
                  />
                  <span className="text-xs font-semibold text-muted-foreground">
                    {selectedProduct.unit || "unit"}
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={loadPreview}
                  disabled={isPreviewLoading}
                  className="rounded-xl h-10 px-3 text-xs font-semibold flex items-center gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isPreviewLoading ? "animate-spin" : ""}`} />
                  <span>Hitung Ulang</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Error Alert */}
      {previewError && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{previewError}</span>
        </div>
      )}

      {/* Simulation Results Section */}
      {previewData && (
        <div className="space-y-6">
          {/* Metric Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Kesiapan Produksi */}
            <Card className="rounded-2xl border-border shadow-xs">
              <CardContent className="p-4 flex flex-col justify-between h-full gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Status Kesiapan Gudang</span>
                  {previewData.is_all_sufficient ? (
                    <div className="h-6 w-6 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-bold text-sm">
                    {previewData.is_all_sufficient ? (
                      <span className="text-emerald-600 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        Siap Produksi
                      </span>
                    ) : (
                      <span className="text-amber-600 flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        Perlu Restock Bahan
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-1 block">
                    {previewData.is_all_sufficient
                      ? "Seluruh stok bahan baku mencukupi di gudang"
                      : `${deficitItems.length} bahan baku mengalami kekurangan stok`}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Metric 2: Estimasi Total Biaya BOM */}
            <Card className="rounded-2xl border-border shadow-xs">
              <CardContent className="p-4 flex flex-col justify-between h-full gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Total Biaya Bahan Baku</span>
                  <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Boxes className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div>
                  <div className="font-mono font-bold text-lg text-foreground">
                    <CurrencyText value={previewData.estimated_bom} />
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-1 block">
                    Untuk {plannedQuantity} {selectedProduct?.unit || "unit"} rencana
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Metric 3: Estimasi Overhead & Total */}
            <Card className="rounded-2xl border-border shadow-xs">
              <CardContent className="p-4 flex flex-col justify-between h-full gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Total Biaya Batch</span>
                  <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Layers className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div>
                  <div className="font-mono font-bold text-lg text-foreground">
                    <CurrencyText value={previewData.estimated_total} />
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-1 block">
                    Overhead: <CurrencyText value={previewData.estimated_overhead} />
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Metric 4: Estimasi HPP per Unit */}
            <Card className="rounded-2xl border-border bg-primary/5 shadow-xs">
              <CardContent className="p-4 flex flex-col justify-between h-full gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary">Estimasi HPP per Unit</span>
                  <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                    <TrendingUp className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div>
                  <div className="font-mono font-black text-xl text-primary">
                    <CurrencyText value={previewData.estimated_hpp} />
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-1 block">
                    per 1 {selectedProduct?.unit || "unit"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SECTION: Rincian Belanja Restock (Deficit Table) */}
          <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-border bg-muted/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                    <ShoppingCart className="h-4 w-4 text-primary" />
                    Rincian Belanja Restock (Bahan Baku Kurang)
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Daftar bahan yang defisit untuk memenuhi batch rencana, estimasi harga beli satuan, dan total anggaran belanja yang perlu disiapkan.
                  </CardDescription>
                </div>

                {deficitItems.length > 0 && (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-xs font-bold py-1 px-3 self-start sm:self-auto">
                    {deficitItems.length} Bahan Perlu Restock
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {deficitItems.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-sm text-foreground">
                    Semua bahan baku mencukupi di gudang!
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-md">
                    Stok bahan riil di gudang Anda cukup untuk memproduksi {plannedQuantity} {selectedProduct?.unit || "unit"} {previewData.product_name}. Anda dapat langsung memulai batch produksi di menu Batches.
                  </p>
                  <Button asChild size="sm" className="mt-2 rounded-xl text-xs font-semibold gap-1.5">
                    <Link to="/production/batches/new">
                      <span>Buat Batch Produksi Sekarang</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table className="min-w-[700px]">
                      <TableHeader className="bg-muted/40">
                        <TableRow>
                          <TableHead className="text-xs font-semibold">Nama Bahan Baku</TableHead>
                          <TableHead className="text-xs font-semibold text-right">Kebutuhan</TableHead>
                          <TableHead className="text-xs font-semibold text-right">Stok Gudang</TableHead>
                          <TableHead className="text-xs font-semibold text-right">Kekurangan (Defisit)</TableHead>
                          <TableHead className="text-xs font-semibold text-center">Satuan</TableHead>
                          <TableHead className="text-xs font-semibold text-right">Est. Harga Satuan</TableHead>
                          <TableHead className="text-xs font-semibold text-right">Est. Biaya Restock</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {deficitItems.map((item) => (
                          <TableRow key={item.stock_id} className="hover:bg-muted/20">
                            <TableCell className="font-semibold text-xs text-foreground">
                              {item.stock_name}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-right text-muted-foreground">
                              {formatNumber(item.required_qty)}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-right text-muted-foreground">
                              {formatNumber(item.available_qty)}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-right font-bold text-destructive">
                              {formatNumber(item.deficit)}
                            </TableCell>
                            <TableCell className="text-xs text-center text-muted-foreground">
                              {item.unit}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-right text-muted-foreground">
                              <CurrencyText value={item.unitPrice} />
                            </TableCell>
                            <TableCell className="font-mono text-xs text-right font-bold text-foreground">
                              <CurrencyText value={item.estimatedRestockCost} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Summary Footer for Restock Budget */}
                  <div className="p-4 bg-muted/30 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Info className="h-4 w-4 text-primary shrink-0" />
                      <span>
                        Estimasi biaya restock dihitung berdasarkan harga rata-rata bahan baku saat ini.
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-4 text-sm">
                      <span className="font-semibold text-foreground">Total Anggaran Belanja Restock:</span>
                      <span className="font-mono font-black text-lg text-primary">
                        <CurrencyText value={totalRestockBudget} />
                      </span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* SECTION: Tabel Lengkap Kebutuhan Seluruh Bahan Baku */}
          <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-border bg-muted/20">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Boxes className="h-4 w-4 text-primary" />
                Daftar Lengkap Kebutuhan Bahan Produksi ({previewData.items?.length || 0} Bahan)
              </CardTitle>
              <CardDescription className="text-xs">
                Perbandingan komprehensif antara jumlah kebutuhan produksi dan ketersediaan stok aktual di gudang untuk setiap komponen resep.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="min-w-[700px]">
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="text-xs font-semibold">Nama Bahan Baku</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Satuan</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Kebutuhan Produksi</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Stok Gudang</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Status Gudang</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Estimasi Biaya</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.items?.map((item) => {
                      const isSuff = item.is_sufficient && item.available_qty >= item.required_qty
                      return (
                        <TableRow key={item.stock_id} className="hover:bg-muted/20">
                          <TableCell className="font-semibold text-xs text-foreground">
                            {item.stock_name}
                          </TableCell>
                          <TableCell className="text-xs text-center text-muted-foreground">
                            {item.unit}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-right font-medium text-foreground">
                            {formatNumber(item.required_qty)}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-right text-muted-foreground">
                            {formatNumber(item.available_qty)}
                          </TableCell>
                          <TableCell className="text-xs text-center">
                            {isSuff ? (
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-semibold">
                                Cukup
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] font-semibold">
                                Kurang
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-right font-semibold text-foreground">
                            <CurrencyText value={item.estimated_cost} />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
