import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Factory,
  Plus,
  Search,
  LayoutGrid,
  List,
  TrendingUp,
  Package,
  Layers,
  ArrowRight,
  MoreVertical,
  Pencil,
  Trash2,
  AlertTriangle,
  Info,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useQueryClient } from "@tanstack/react-query"
import { TablePagination } from "@/components/ui/table-pagination"

import { recipeService } from "@/features/recipes/services/recipe-service"
import {
  useProductsQuery,
  useProductSummaryQuery,
  recipeKeys,
} from "@/features/recipes/hooks/use-recipes-query"
import type { Product } from "@/features/recipes/types"
import { QuotaBadge, useSubscriptionGuards } from "@/features/subscription"

function formatCurrencyIdr(val: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val)
}

function calculateGrossMargin(sellingPrice: number, cost: number): number {
  if (!sellingPrice || sellingPrice <= 0) return 0
  const margin = ((sellingPrice - cost) / sellingPrice) * 100
  return Math.round(margin * 10) / 10
}

function calculateTotalBOM(product: Product): number {
  return product.ingredients.reduce((acc, curr) => acc + curr.subtotalCost, 0)
}

export default function RecipeListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Filters & Views
  const [search, setSearch] = React.useState<string>("")
  const [selectedCategory, setSelectedCategory] = React.useState<string>("All")
  const [viewMode, setViewMode] = React.useState<"grid" | "table">("grid")
  const [sortBy, setSortBy] = React.useState<string>("name-asc")

  // Pagination
  const [page, setPage] = React.useState(1)
  const pageSize = 12

  // Modal Dialogs
  const [isDeleteOpen, setIsDeleteOpen] = React.useState<boolean>(false)
  const [productToDelete, setProductToDelete] = React.useState<Product | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false)

  // React Queries
  const {
    data: products = [],
    isLoading: loading,
    refetch: refetchProducts,
  } = useProductsQuery()

  const {
    data: summaryData,
    refetch: refetchSummary,
  } = useProductSummaryQuery()

  const { isQuotaReached } = useSubscriptionGuards()

  // Extract categories dynamically
  const categories = React.useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => {
      if (p.category) set.add(p.category)
    })
    return ["All", ...Array.from(set)]
  }, [products])

  // Filter and sort products
  const filteredProducts = React.useMemo(() => {
    const result = products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase()) ||
        p.ingredients.some((ing) => ing.stockName.toLowerCase().includes(search.toLowerCase()))

      const matchCategory = selectedCategory === "All" || p.category === selectedCategory
      return matchSearch && matchCategory
    })

    result.sort((a, b) => {
      const marginA = calculateGrossMargin(a.sellingPrice, a.latestHpp || calculateTotalBOM(a))
      const marginB = calculateGrossMargin(b.sellingPrice, b.latestHpp || calculateTotalBOM(b))

      switch (sortBy) {
        case "margin-desc":
          return marginB - marginA
        case "margin-asc":
          return marginA - marginB
        case "price-desc":
          return b.sellingPrice - a.sellingPrice
        case "price-asc":
          return a.sellingPrice - b.sellingPrice
        case "stock-asc":
          return a.currentStock - b.currentStock
        case "name-desc":
          return b.name.localeCompare(a.name)
        case "name-asc":
        default:
          return a.name.localeCompare(b.name)
      }
    })

    return result
  }, [products, search, selectedCategory, sortBy])

  // Paginated items
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1
  const paginatedProducts = React.useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredProducts.slice(start, start + pageSize)
  }, [filteredProducts, page, pageSize])

  // Aggregate stats
  const stats = React.useMemo(() => {
    const total = summaryData ? summaryData.total_products : products.length
    const totalStock = products.reduce((acc, p) => acc + p.currentStock, 0)

    let totalMargin = 0
    let countWithPrice = 0
    let calculatedLowStock = 0

    products.forEach((p) => {
      const cost = p.latestHpp || calculateTotalBOM(p)
      if (p.sellingPrice > 0) {
        totalMargin += calculateGrossMargin(p.sellingPrice, cost)
        countWithPrice++
      }
      if (p.currentStock <= (p.minStock || 5)) {
        calculatedLowStock++
      }
    })

    const avgMargin = countWithPrice > 0 ? Math.round((totalMargin / countWithPrice) * 10) / 10 : 0
    const lowStockCount = summaryData ? summaryData.low_stock_count : calculatedLowStock

    return { total, avgMargin, totalStock, lowStockCount }
  }, [products, summaryData])

  async function handleDeleteProduct() {
    if (!productToDelete) return
    setIsSubmitting(true)
    try {
      await recipeService.deleteProduct(productToDelete.id)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: recipeKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['subscription-usage'] }),
      ])
      setIsDeleteOpen(false)
      setProductToDelete(null)
    } catch (err) {
      console.error("Failed to delete product:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRefresh = async () => {
    await Promise.all([refetchProducts(), refetchSummary()])
  }

  const handleNavigateNewProduct = () => {
    if (isQuotaReached("products")) {
      window.dispatchEvent(
        new CustomEvent("open-upgrade-modal", {
          detail: {
            message: "Batas kuota produk resep Anda telah tercapai. Tingkatkan paket untuk membuat lebih banyak produk resep.",
          },
        })
      )
      return
    }
    navigate("/production/products/new")
  }

  return (
    <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Factory className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Katalog Produk & Formula Resep
              </h1>
              <QuotaBadge
                resource="products"
                label="Kapasitas Produk"
                onUpgradeClick={() => {
                  window.dispatchEvent(
                    new CustomEvent("open-upgrade-modal", {
                      detail: {
                        message: "Tingkatkan paket Anda untuk menambah kapasitas produk dan resep.",
                      },
                    })
                  )
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Kelola formula bahan baku, kalkulasi HPP otomatis, dan simulasi margin keuntungan produk jadi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 shadow-2xs hover:bg-muted"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </Button>
          <Button
            onClick={handleNavigateNewProduct}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-2xs"
          >
            <Plus className="h-4 w-4" />
            Tambah Produk
          </Button>
        </div>
      </div>

      {/* KPI / Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Produk */}
        <Card className="py-3 px-4 shadow-2xs border-border/80 bg-card">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Total Produk Aktif</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  {stats.total}
                </span>
                <span className="text-xs text-muted-foreground">formula</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Factory className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Rata-rata Margin */}
        <Card className="py-3 px-4 shadow-2xs border-border/80 bg-card">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Rata-rata Margin</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  +{stats.avgMargin}%
                </span>
                <span className="text-xs text-muted-foreground">di atas HPP</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Total Stok Unit */}
        <Card className="py-3 px-4 shadow-2xs border-border/80 bg-card">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Stok Barang Jadi</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  {stats.totalStock}
                </span>
                <span className="text-xs text-muted-foreground">unit siap jual</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Package className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Perlu Restock */}
        <Card className="py-3 px-4 shadow-2xs border-border/80 bg-card">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Perlu Restock</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                  {stats.lowStockCount}
                </span>
                <span className="text-xs text-muted-foreground">produk menipis</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Standalone Search & Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-card p-3 rounded-xl border border-border shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama produk, kategori, atau bahan baku..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9 bg-background/50 h-9 text-xs"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("")
                setPage(1)
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Pills */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/50 text-xs overflow-x-auto max-w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat)
                  setPage(1)
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors shrink-0 ${
                  selectedCategory === cat
                    ? "bg-background text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat === "All" ? "Semua Kategori" : cat}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg border-border shadow-2xs">
                Urutkan:{" "}
                <span className="font-semibold ml-1">
                  {sortBy === "name-asc" && "Nama A-Z"}
                  {sortBy === "name-desc" && "Nama Z-A"}
                  {sortBy === "margin-desc" && "Margin Tertinggi"}
                  {sortBy === "margin-asc" && "Margin Terendah"}
                  {sortBy === "price-desc" && "Harga Tertinggi"}
                  {sortBy === "stock-asc" && "Stok Menipis"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-border">
              <DropdownMenuLabel className="text-xs uppercase text-muted-foreground">Kriteria Urut</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortBy("name-asc")}>Nama (A ke Z)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("name-desc")}>Nama (Z ke A)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("margin-desc")}>Margin Tertinggi</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("margin-asc")}>Margin Terendah</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("price-desc")}>Harga Tertinggi</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("stock-asc")}>Stok Terkecil</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-border/80 rounded-lg p-0.5 bg-muted/40">
            <Button
              type="button"
              size="icon"
              variant={viewMode === "grid" ? "default" : "ghost"}
              onClick={() => setViewMode("grid")}
              className="h-7 w-7 rounded-md"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant={viewMode === "table" ? "default" : "ghost"}
              onClick={() => setViewMode("table")}
              className="h-7 w-7 rounded-md"
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Memuat katalog resep & HPP...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 sm:p-16 text-center rounded-2xl border-2 border-dashed border-border bg-card/60 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-inner">
            <Factory className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Tidak Ada Produk Ditemukan</h2>
          <p className="text-sm text-muted-foreground max-w-md mt-1 mb-6">
            {search || selectedCategory !== "All"
              ? "Coba ubah kata kunci pencarian atau reset filter kategori."
              : "Belum ada produk yang dibuat. Mulai buat produk Anda sekarang untuk menghitung HPP otomatis!"}
          </p>
          <Button
            onClick={handleNavigateNewProduct}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Tambah Produk Pertama
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedProducts.map((product) => {
              const bomCost = calculateTotalBOM(product)
              const activeCost = product.latestHpp || bomCost
              const margin = calculateGrossMargin(product.sellingPrice, activeCost)

              return (
                <Card
                  key={product.id}
                  onClick={() => navigate(`/production/products/${product.id}`)}
                  className="rounded-xl border-border/80 shadow-2xs hover:shadow-md hover:border-primary/40 transition-all duration-200 flex flex-col justify-between overflow-hidden group bg-card cursor-pointer"
                >
                  {/* Card Top */}
                  <div>
                    {product.imageUrl && (
                      <div className="h-36 w-full overflow-hidden bg-muted/40 relative">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <Badge
                          variant="outline"
                          className={`absolute top-3 left-3 text-[10px] font-bold shadow-sm backdrop-blur-md ${
                            product.mode === "MAKE_TO_ORDER"
                              ? "bg-purple-100/90 text-purple-700 border-purple-200 dark:bg-purple-950/70 dark:text-purple-300"
                              : "bg-blue-100/90 text-blue-700 border-blue-200 dark:bg-blue-950/70 dark:text-blue-300"
                          }`}
                        >
                          {product.mode === "MAKE_TO_ORDER" ? "MTO" : "MTS"}
                        </Badge>
                      </div>
                    )}

                    <div className="p-4 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                            {product.category || "Tanpa Kategori"}
                          </span>
                          <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {product.name}
                          </h3>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl border-border">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/production/products/${product.id}`)
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5 mr-2" /> Ubah / Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                setProductToDelete(product)
                                setIsDeleteOpen(true)
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" /> Hapus Resep
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {product.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
                          {product.description}
                        </p>
                      )}
                    </div>

                    {/* Pricing and HPP Block */}
                    <div className="px-4 py-3 bg-muted/30 border-y border-border/70 grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                          Harga Jual
                        </span>
                        <div className="text-base font-bold font-mono text-foreground mt-0.5">
                          {formatCurrencyIdr(product.sellingPrice)}
                          <span className="text-[11px] font-normal text-muted-foreground ml-1">/{product.unit}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                            HPP Unit
                          </span>
                          <Info className="h-3 w-3 text-muted-foreground/60" />
                        </div>
                        <div className="text-base font-bold font-mono text-foreground mt-0.5">
                          {formatCurrencyIdr(activeCost)}
                        </div>
                      </div>
                    </div>

                    {/* Margin & Stock Bar */}
                    <div className="p-4 py-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium">Gross Margin:</span>
                        <Badge
                          className={`font-mono text-xs font-bold px-2 py-0.5 ${
                            margin >= 50
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300"
                              : margin >= 25
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300"
                              : "bg-red-500/10 text-red-700 dark:text-red-300 border-red-300"
                          }`}
                          variant="outline"
                        >
                          +{margin}%
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium">Stok Jadi Siap Jual:</span>
                        <span className="font-mono font-bold text-foreground">
                          {product.currentStock} {product.unit}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-border/70">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Layers className="h-3 w-3 text-primary" /> Komposisi:
                        </span>
                        <span className="text-xs font-semibold text-foreground">
                          {product.ingredients.length} Bahan Baku
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="p-4 pt-0">
                    <Button
                      asChild
                      variant="outline"
                      className="w-full justify-between rounded-xl h-9 hover:bg-primary/5 hover:text-primary hover:border-primary/40 font-semibold group-hover:border-primary/30 transition-all text-xs"
                    >
                      <Link to={`/production/products/${product.id}`}>
                        <span>Buka Detail & BOM</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>

          <TablePagination
            total={filteredProducts.length}
            displayedCount={paginatedProducts.length}
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={loading}
            label="produk"
          />
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
                  <tr>
                    <th className="px-5 py-3.5 w-14 text-center">Foto</th>
                    <th className="px-5 py-3.5">Produk & Kategori</th>
                    <th className="px-5 py-3.5">Mode</th>
                    <th className="px-5 py-3.5">Harga Jual</th>
                    <th className="px-5 py-3.5">HPP per Unit</th>
                    <th className="px-5 py-3.5">Biaya Bahan (BOM)</th>
                    <th className="px-5 py-3.5">Gross Margin</th>
                    <th className="px-5 py-3.5">Stok Jadi</th>
                    <th className="px-5 py-3.5">Bahan Baku</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {paginatedProducts.map((product) => {
                    const bomCost = calculateTotalBOM(product)
                    const activeCost = product.latestHpp || bomCost
                    const margin = calculateGrossMargin(product.sellingPrice, activeCost)

                    return (
                      <tr
                        key={product.id}
                        className="hover:bg-muted/30 transition-colors group cursor-pointer"
                        onClick={() => navigate(`/production/products/${product.id}`)}
                      >
                        <td className="px-5 py-3.5 text-center">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="h-10 w-10 rounded-lg object-cover border border-border mx-auto"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground mx-auto">
                              <Package className="h-5 w-5" />
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                              {product.name}
                            </span>
                            <span className="text-xs text-muted-foreground">{product.category || "Tanpa Kategori"} • Satuan: {product.unit}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold ${
                              product.mode === "MAKE_TO_ORDER"
                                ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300"
                                : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300"
                            }`}
                          >
                            {product.mode === "MAKE_TO_ORDER" ? "MTO" : "MTS"}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 font-mono font-bold text-sm text-foreground">
                          {formatCurrencyIdr(product.sellingPrice)}
                        </td>
                        <td className="px-5 py-3.5 font-mono font-bold text-sm text-foreground">
                          {formatCurrencyIdr(activeCost)}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-sm text-muted-foreground">
                          {formatCurrencyIdr(bomCost)}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge
                            variant="outline"
                            className={`font-mono text-xs font-bold ${
                              margin >= 50
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300"
                                : margin >= 25
                                ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300"
                                : "bg-red-500/10 text-red-700 dark:text-red-300 border-red-300"
                            }`}
                          >
                            +{margin}%
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-mono font-semibold text-sm">
                            {product.currentStock} {product.unit}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-muted-foreground">
                          {product.ingredients.length} item
                        </td>
                        <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/production/products/${product.id}`)}
                            className="rounded-lg text-xs h-8 hover:bg-primary hover:text-primary-foreground transition-colors shadow-2xs"
                          >
                            Detail Resep
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <TablePagination
            total={filteredProducts.length}
            displayedCount={paginatedProducts.length}
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={loading}
            label="produk"
          />
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus Resep */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl p-6">
          <DialogHeader>
            <div className="h-10 w-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-2">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle className="text-lg font-bold">Hapus Formula Resep Ini?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Resep <strong className="text-foreground">{productToDelete?.name}</strong> akan dihapus. Riwayat produksi masa lalu tetap tersimpan di database audit FIFO.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              className="rounded-xl"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isSubmitting}
              onClick={handleDeleteProduct}
              className="rounded-xl"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Hapus Resep
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
