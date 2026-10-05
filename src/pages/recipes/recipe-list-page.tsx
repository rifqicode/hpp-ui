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
  const [products, setProducts] = React.useState<Product[]>([])
  const [loading, setLoading] = React.useState<boolean>(true)

  // Filters & Views
  const [search, setSearch] = React.useState<string>("")
  const [selectedCategory, setSelectedCategory] = React.useState<string>("All")
  const [viewMode, setViewMode] = React.useState<"grid" | "table">("grid")
  const [sortBy, setSortBy] = React.useState<string>("name-asc")

  // Modal Dialogs
  const [isDeleteOpen, setIsDeleteOpen] = React.useState<boolean>(false)
  const [productToDelete, setProductToDelete] = React.useState<Product | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false)

  React.useEffect(() => {
    let ignore = false
    recipeService.getProducts().then((data) => {
      if (!ignore) {
        setProducts(data)
        setLoading(false)
      }
    }).catch((err) => {
      console.error("Failed to load products:", err)
      if (!ignore) {
        setLoading(false)
      }
    })
    return () => {
      ignore = true
    }
  }, [])

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

  // Aggregate stats
  const stats = React.useMemo(() => {
    const total = products.length
    const totalStock = products.reduce((acc, p) => acc + p.currentStock, 0)

    let totalMargin = 0
    let countWithPrice = 0
    let lowStockCount = 0

    products.forEach((p) => {
      const cost = p.latestHpp || calculateTotalBOM(p)
      if (p.sellingPrice > 0) {
        totalMargin += calculateGrossMargin(p.sellingPrice, cost)
        countWithPrice++
      }
      if (p.currentStock <= (p.minStock || 5)) {
        lowStockCount++
      }
    })

    const avgMargin = countWithPrice > 0 ? Math.round((totalMargin / countWithPrice) * 10) / 10 : 0

    return { total, avgMargin, totalStock, lowStockCount }
  }, [products])

  async function handleDeleteProduct() {
    if (!productToDelete) return
    setIsSubmitting(true)
    try {
      await recipeService.deleteProduct(productToDelete.id)
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id))
      setIsDeleteOpen(false)
      setProductToDelete(null)
    } catch (err) {
      console.error("Failed to delete product:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Katalog Produk & Formula Resep
            </h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs font-semibold">
              Katalog Produk
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola formula bahan baku, kalkulasi HPP otomatis, dan simulasi margin keuntungan produk jadi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate("/production/recipes/new")}
            className="rounded-xl shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Produk Baru</span>
          </Button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Total Produk Aktif
              </CardDescription>
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Factory className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black font-mono mt-1">
              {stats.total}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <p className="text-xs text-muted-foreground">Siap diproduksi di dapur</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Rata-rata Margin
              </CardDescription>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black font-mono text-emerald-600 mt-1">
              +{stats.avgMargin}%
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <p className="text-xs text-muted-foreground">Gross margin di atas HPP</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Stok Barang Jadi
              </CardDescription>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                <Package className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black font-mono text-foreground mt-1">
              {stats.totalStock} <span className="text-sm font-normal text-muted-foreground">unit</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <p className="text-xs text-muted-foreground">Tersedia untuk dijual (POS)</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Perlu Restock
              </CardDescription>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black font-mono text-amber-600 mt-1">
              {stats.lowStockCount} <span className="text-sm font-normal text-muted-foreground">produk</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <p className="text-xs text-muted-foreground">Stok mendekati batas aman</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Control Bar */}
      <Card className="rounded-2xl border-slate-200/80 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari resep, produk, bahan baku..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl h-10 text-sm bg-muted/20 focus-visible:ring-primary/20"
            />
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <Button
                key={cat}
                type="button"
                size="sm"
                variant={selectedCategory === cat ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-xl text-xs font-medium h-8 transition-all shrink-0 ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-muted/50 border-slate-200"
                }`}
              >
                {cat === "All" ? "Semua Kategori" : cat}
              </Button>
            ))}
          </div>

          {/* Sort and View Toggle */}
          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl text-xs h-9 border-slate-200">
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
              <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-slate-200">
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

            <div className="flex items-center border border-slate-200 rounded-xl p-0.5 bg-muted/20">
              <Button
                type="button"
                size="icon"
                variant={viewMode === "grid" ? "default" : "ghost"}
                onClick={() => setViewMode("grid")}
                className="h-7 w-7 rounded-lg"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant={viewMode === "table" ? "default" : "ghost"}
                onClick={() => setViewMode("table")}
                className="h-7 w-7 rounded-lg"
              >
                <List className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Memuat katalog resep & HPP...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="rounded-2xl border-dashed border-2 p-12 text-center flex flex-col items-center justify-center bg-muted/10">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
            <Factory className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Tidak ada produk ditemukan</h3>
          <p className="text-sm text-muted-foreground max-w-md mt-1 mb-6">
            {search || selectedCategory !== "All"
               ? "Coba ubah kata kunci pencarian atau reset filter kategori."
               : "Belum ada produk yang dibuat. Mulai buat produk Anda sekarang untuk menghitung HPP otomatis!"}
          </p>
          <Button onClick={() => navigate("/production/recipes/new")} className="rounded-xl flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Tambah Produk Pertama</span>
          </Button>
        </Card>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product) => {
            const bomCost = calculateTotalBOM(product)
            const activeCost = product.latestHpp || bomCost
            const margin = calculateGrossMargin(product.sellingPrice, activeCost)
            const isLowStock = product.currentStock <= product.minStock

            return (
              <Card
                key={product.id}
                onClick={() => navigate(`/production/recipes/${product.id}`)}
                className="rounded-2xl border-slate-200/80 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 flex flex-col justify-between overflow-hidden group bg-card cursor-pointer"
              >
                {/* Card Top */}
                <div>
                  <div className="p-5 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[11px] font-semibold bg-muted/40 border-slate-200">
                            {product.category}
                          </Badge>
                          {isLowStock ? (
                            <Badge variant="warning" className="text-[10px] flex items-center gap-1 font-bold">
                              <AlertTriangle className="h-3 w-3" /> Stok Tipis
                            </Badge>
                          ) : (
                            <Badge variant="success" className="text-[10px] font-bold">
                              Stok Aman
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 mt-1">
                          {product.name}
                        </h3>
                      </div>

                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 rounded-xl">
                            <DropdownMenuItem onClick={() => navigate(`/production/recipes/${product.id}`)}>
                              <Pencil className="h-3.5 w-3.5 mr-2" /> Detail / Edit Resep
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => {
                                setProductToDelete(product)
                                setIsDeleteOpen(true)
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" /> Hapus Resep
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {product.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
                        {product.description}
                      </p>
                    )}
                  </div>

                  {/* Pricing and HPP Block */}
                  <div className="px-5 py-3.5 bg-slate-50/70 border-y border-slate-100 grid grid-cols-2 gap-3">
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
                      <div className="text-base font-bold font-mono text-slate-800 mt-0.5">
                        {formatCurrencyIdr(activeCost)}
                      </div>
                    </div>
                  </div>

                  {/* Margin & Stock Bar */}
                  <div className="p-5 py-3.5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Gross Margin:</span>
                      <Badge
                        className={`font-mono text-xs font-bold px-2 py-0.5 ${
                          margin >= 50
                            ? "bg-emerald-500/10 text-emerald-700 border-emerald-300"
                            : margin >= 25
                            ? "bg-amber-500/10 text-amber-700 border-amber-300"
                            : "bg-red-500/10 text-red-700 border-red-300"
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

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Layers className="h-3 w-3 text-primary" /> Komposisi:
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
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
                    className="w-full justify-between rounded-xl h-10 hover:bg-primary/5 hover:text-primary hover:border-primary/40 font-semibold group-hover:border-primary/30 transition-all text-xs"
                  >
                    <Link to={`/production/recipes/${product.id}`}>
                      <span>Buka Detail & BOM</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <Card className="rounded-2xl border-slate-200/80 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="font-bold text-xs uppercase text-muted-foreground">Produk & Kategori</TableHead>
                <TableHead className="font-bold text-xs uppercase text-muted-foreground">Harga Jual</TableHead>
                <TableHead className="font-bold text-xs uppercase text-muted-foreground">HPP per Unit</TableHead>
                <TableHead className="font-bold text-xs uppercase text-muted-foreground">Biaya Bahan (BOM)</TableHead>
                <TableHead className="font-bold text-xs uppercase text-muted-foreground">Gross Margin</TableHead>
                <TableHead className="font-bold text-xs uppercase text-muted-foreground">Stok Jadi</TableHead>
                <TableHead className="font-bold text-xs uppercase text-muted-foreground">Bahan Baku</TableHead>
                <TableHead className="text-right font-bold text-xs uppercase text-muted-foreground">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const bomCost = calculateTotalBOM(product)
                const activeCost = product.latestHpp || bomCost
                const margin = calculateGrossMargin(product.sellingPrice, activeCost)

                return (
                  <TableRow
                    key={product.id}
                    className="hover:bg-primary/5 cursor-pointer transition-colors"
                    onClick={() => navigate(`/production/recipes/${product.id}`)}
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground hover:text-primary">
                          {product.name}
                        </span>
                        <span className="text-xs text-muted-foreground">{product.category} • Satuan: {product.unit}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono font-bold text-sm text-foreground">
                      {formatCurrencyIdr(product.sellingPrice)}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-sm text-slate-800">
                      {formatCurrencyIdr(activeCost)}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {formatCurrencyIdr(bomCost)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`font-mono text-xs font-bold ${
                          margin >= 50
                            ? "bg-emerald-500/10 text-emerald-700 border-emerald-300"
                            : margin >= 25
                            ? "bg-amber-500/10 text-amber-700 border-amber-300"
                            : "bg-red-500/10 text-red-700 border-red-300"
                        }`}
                      >
                        +{margin}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono font-semibold text-sm">
                        {product.currentStock} {product.unit}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {product.ingredients.length} item
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/production/recipes/${product.id}`)
                        }}
                        className="rounded-xl text-xs h-8 hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        Detail Resep
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
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
