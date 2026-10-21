import * as React from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import {
  ArrowLeft,
  ChevronDown,
  Loader2,
  Plus,
  ShoppingBag,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Input } from "@/components/ui/input"
import { FormattedNumberInput } from "@/components/ui/formatted-number-input"
import { CurrencyText } from "@/components/ui/currency-text"
import { Label } from "@/components/ui/label"
import { getQuantityInBaseUnit } from "@/lib/units"
import { usePurchaseStock } from "@/features/inventory/hooks/use-purchase-stock"
import {
  StockChangePreview,
  StockMaterialField,
} from "@/features/inventory/components/stock-form-fields"
import { stockSelectClass } from "@/features/inventory/components/stock-form-utils"
import { PurchaseUnitFields } from "@/features/inventory/components/purchase-unit-fields"

const BASE_UNITS = [
  { value: "kg", label: "Kilogram (kg)" },
  { value: "g", label: "Gram (g)" },
  { value: "mg", label: "Miligram (mg)" },
  { value: "L", label: "Liter (L)" },
  { value: "ml", label: "Mililiter (ml)" },
  { value: "pcs", label: "Buah (pcs)" },
  { value: "pack", label: "Pak (pack)" },
  { value: "box", label: "Kotak (box)" },
  { value: "bottle", label: "Botol (bottle)" },
  { value: "can", label: "Kaleng (can)" },
] as const

export default function PurchaseStockPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const {
    stocks,
    suppliers,
    loading,
    isSubmitting,
    error: hookError,
    handleCreateStock,
    handleRecordPurchase,
  } = usePurchaseStock()

  const materialFromQuery = searchParams.get("materialId")
  const supplierFromQuery = searchParams.get("supplierId")

  const [userSelectedMaterialId, setUserSelectedMaterialId] = React.useState<string>("")
  const [userSelectedSupplierId, setUserSelectedSupplierId] = React.useState<string>("")
  const [quantity, setQuantity] = React.useState<string>("")
  const [totalPrice, setTotalPrice] = React.useState<string>("")
  const [expiredAt, setExpiredAt] = React.useState<string>("")
  const [purchaseUnit, setPurchaseUnit] = React.useState<string>("")
  const [packageSize, setPackageSize] = React.useState<string>("")
  const [submitError, setSubmitError] = React.useState<string>("")

  // Quick Create Material Modal state
  const [isCreateMatOpen, setIsCreateMatOpen] = React.useState(false)
  const [newMatName, setNewMatName] = React.useState("")
  const [newMatUnit, setNewMatUnit] = React.useState("kg")
  const [newMatMethod, setNewMatMethod] = React.useState<"FIFO" | "FEFO">("FIFO")
  const [isCreatingMat, setIsCreatingMat] = React.useState(false)
  const [createMatError, setCreateMatError] = React.useState("")

  const materialId =
    userSelectedMaterialId ||
    (materialFromQuery && stocks.some((s) => s.id === materialFromQuery) ? materialFromQuery : "") ||
    stocks[0]?.id ||
    ""

  const supplierId =
    userSelectedSupplierId ||
    (supplierFromQuery && suppliers.some((s) => s.id === supplierFromQuery) ? supplierFromQuery : "") ||
    ""

  const material = stocks.find((m) => m.id === materialId)
  const unit = purchaseUnit || material?.base_unit || ""
  const isFefo = material?.inventory_method === "FEFO"

  const qty = Number(quantity)
  const total = Number(totalPrice)
  const pkgSizeNum = Number(packageSize) || 0
  const baseQuantity = getQuantityInBaseUnit(qty, unit, material?.base_unit || "", pkgSizeNum)
  const precisionInvalid =
    baseQuantity > 0 && Math.abs(baseQuantity - Math.round(baseQuantity * 10000) / 10000) > 1e-9

  const valid =
    Boolean(material) &&
    Number.isFinite(qty) &&
    qty > 0 &&
    Number.isFinite(total) &&
    total > 0 &&
    Number.isFinite(baseQuantity) &&
    baseQuantity > 0 &&
    !precisionInvalid &&
    (!isFefo || Boolean(expiredAt))

  const pricePerUnit = baseQuantity > 0 ? total / baseQuantity : 0

  function selectMaterial(id: string) {
    setUserSelectedMaterialId(id)
    setPurchaseUnit("")
    setPackageSize("")
    setQuantity("")
    setTotalPrice("")
    setExpiredAt("")
    setSubmitError("")
  }

  const handleQuickCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMatName.trim()) {
      setCreateMatError("Nama bahan baku wajib diisi.")
      return
    }
    setIsCreatingMat(true)
    setCreateMatError("")
    try {
      const created = await handleCreateStock({
        name: newMatName.trim(),
        base_unit: newMatUnit.trim(),
        inventory_method: newMatMethod,
      })
      selectMaterial(created.id)
      setIsCreateMatOpen(false)
      setNewMatName("")
      setNewMatMethod("FIFO")
    } catch (err: unknown) {
      setCreateMatError(
        err instanceof Error ? err.message : "Gagal menambahkan bahan baku baru."
      )
    } finally {
      setIsCreatingMat(false)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError("")

    if (!material) {
      setSubmitError("Pilih bahan baku terlebih dahulu.")
      return
    }

    if (!valid) {
      if (isFefo && !expiredAt) {
        setSubmitError("Tanggal kedaluwarsa wajib diisi untuk bahan baku FEFO.")
      } else {
        setSubmitError("Periksa bahan, jumlah, total harga, dan tanggal kedaluwarsa sebelum menyimpan.")
      }
      return
    }

    try {
      await handleRecordPurchase({
        stock_id: material.id,
        supplier_id: supplierId || undefined,
        quantity: qty,
        unit,
        package_size: unit === "kemasan" ? pkgSizeNum : undefined,
        total_price: total,
        expired_at: expiredAt ? new Date(expiredAt).toISOString() : undefined,
      })
      navigate("/inventory/stocks")
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Gagal mencatat pembelian bahan. Silakan coba kembali."
      )
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-3 text-primary" />
        <p className="text-sm">Memuat data pembelian...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in fade-in duration-500 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" className="rounded-xl">
          <Link to="/inventory/stocks">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ShoppingBag className="size-6" />
        </span>
        <div className="flex flex-col gap-0.5 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Catat Pembelian Bahan
          </h1>
          <p className="text-sm text-muted-foreground">
            Tambah stok inventaris dengan mencatat nota/faktur pembelian dari supplier atau belanja langsung.
          </p>
        </div>
      </div>

      {(hookError || submitError) && (
        <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-xl border border-destructive/20">
          {submitError || hookError}
        </div>
      )}

      <Card className="min-w-0 rounded-2xl shadow-sm border-border">
        <CardHeader>
          <CardTitle>Detail Pembelian</CardTitle>
          <CardDescription>
            Pilih bahan baku, supplier, jumlah pembelian, dan total biaya faktur.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="purchase-form" onSubmit={onSubmit} className="grid gap-5 min-w-0">
            {/* Bahan Baku & Supplier */}
            <section className="space-y-4" aria-label="Bahan baku dan supplier">
              <StockMaterialField
                id="page-purchase-material"
                stocks={stocks}
                value={materialId}
                onChange={selectMaterial}
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCreateMatError("")
                    setIsCreateMatOpen(true)
                  }}
                  className="-ml-2 h-9 gap-1 text-primary hover:text-primary"
                >
                  <Plus className="size-3.5" />
                  Tambah Bahan Baku Baru
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <label htmlFor="page-purchase-supplier" className="text-sm font-medium text-foreground">
                    Supplier <span className="font-normal text-muted-foreground">(opsional)</span>
                  </label>
                  <Link
                    to="/inventory/suppliers"
                    className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="size-3" /> Tambah Supplier
                  </Link>
                </div>
                <select
                  id="page-purchase-supplier"
                  className={stockSelectClass}
                  value={supplierId}
                  onChange={(e) => setUserSelectedSupplierId(e.target.value)}
                >
                  <option value="">Tanpa supplier / belanja langsung</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Pilih supplier jika pembelian berasal dari rekanan terdaftar.
                </p>
              </div>
            </section>

            {/* Jumlah & Biaya Pembelian */}
            <section className="space-y-4 border-t border-border/60 pt-5" aria-labelledby="page-purchase-detail-heading">
              <h3 id="page-purchase-detail-heading" className="text-sm font-semibold text-foreground">
                Jumlah & Biaya Pembelian
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="min-w-0 space-y-2">
                  <label htmlFor="page-purchase-qty" className="text-sm font-medium text-foreground">
                    Jumlah Beli <span className="text-destructive">*</span>
                  </label>
                  <FormattedNumberInput
                    id="page-purchase-qty"
                    value={quantity}
                    onChange={(val) => setQuantity(String(val))}
                    allowDecimal
                    maxDecimals={4}
                    placeholder="Contoh: 10"
                    required
                    disabled={!material}
                    className="h-11 rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground">
                    Jumlah barang fisik yang dibeli.
                  </p>
                </div>

                <div className="min-w-0">
                  <PurchaseUnitFields
                    baseUnit={material?.base_unit || ""}
                    unit={purchaseUnit || material?.base_unit || ""}
                    packageSize={pkgSizeNum}
                    quantity={qty}
                    onUnitChange={(newUnit) => {
                      setPurchaseUnit(newUnit)
                      setPackageSize("")
                    }}
                    onPackageSizeChange={(newSize) => setPackageSize(String(newSize))}
                    disabled={!material}
                    idPrefix="page-purchase"
                  />
                </div>
              </div>

              {precisionInvalid && (
                <p role="alert" className="text-xs text-destructive">
                  Hasil konversi terlalu rinci. Gunakan jumlah dengan maksimal 4 angka desimal dalam {material?.base_unit}.
                </p>
              )}

              <div className="space-y-2">
                <label htmlFor="page-purchase-price" className="text-sm font-medium text-foreground">
                  Total Harga Pembelian (Faktur) <span className="text-destructive">*</span>
                </label>
                <FormattedNumberInput
                  id="page-purchase-price"
                  value={totalPrice}
                  onChange={(val) => setTotalPrice(String(val))}
                  prefix="Rp"
                  placeholder="Contoh: 250.000"
                  required
                  disabled={!material}
                  className="h-11 rounded-xl"
                />
                <p className="text-xs text-muted-foreground">
                  Isi seluruh total biaya nota faktur pembelian, bukan harga per satuan.
                </p>
              </div>

              {/* Tanggal Kedaluwarsa */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="page-purchase-expired" className="text-sm font-medium text-foreground">
                    Tanggal Kedaluwarsa{" "}
                    {isFefo ? (
                      <span className="text-destructive">*</span>
                    ) : (
                      <span className="font-normal text-muted-foreground">(opsional)</span>
                    )}
                  </label>
                  {isFefo && (
                    <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      FEFO (Wajib diisi)
                    </span>
                  )}
                </div>
                <Input
                  id="page-purchase-expired"
                  type="date"
                  value={expiredAt}
                  onChange={(e) => setExpiredAt(e.target.value)}
                  required={isFefo}
                  disabled={!material}
                  className="h-11 min-w-0 rounded-xl"
                />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {isFefo
                    ? "⚠️ Bahan ini menggunakan metode FEFO. Tanggal kedaluwarsa wajib dicatat agar batch yang kedaluwarsa lebih dulu dipotong pertama saat produksi/penjualan."
                    : "Kosongkan jika bahan tidak memiliki batas tanggal kedaluwarsa."}
                </p>
              </div>
            </section>

            {/* Live Calculation Card */}
            {material && baseQuantity > 0 && Number.isFinite(baseQuantity) && !precisionInvalid && (
              <div className="space-y-3" aria-live="polite">
                <StockChangePreview
                  current={Number(material.current_stock || 0)}
                  change={baseQuantity}
                  unit={material.base_unit}
                />

                {total > 0 && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-muted-foreground">Total Pembelian:</span>
                      <span className="text-base font-bold text-foreground">
                        <CurrencyText value={total} />
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-2.5 text-xs">
                      <span className="text-muted-foreground">
                        Estimasi Harga per Satuan Dasar ({material.base_unit}):
                      </span>
                      <span className="text-sm font-semibold text-primary">
                        <CurrencyText value={pricePerUnit} suffix={` / ${material.base_unit}`} />
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 pt-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl flex-1 sm:flex-initial h-11"
                onClick={() => navigate("/inventory/stocks")}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={!valid || isSubmitting}
                className="rounded-xl flex-1 sm:flex-initial h-11"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Menyimpan…" : "Simpan Pembelian"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Quick Add Material Modal */}
      <Dialog
        open={isCreateMatOpen}
        onOpenChange={(next) => {
          if (!isCreatingMat) setIsCreateMatOpen(next)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Bahan Baku Baru</DialogTitle>
            <DialogDescription>
              Masukkan nama bahan baku, satuan dasar, dan metode inventaris.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleQuickCreateMaterial} className="space-y-4 py-2">
            {createMatError && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/20">
                {createMatError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="page-quick-mat-name">Nama Bahan Baku</Label>
              <Input
                id="page-quick-mat-name"
                placeholder="Contoh: Biji Kopi Arabika"
                value={newMatName}
                onChange={(e) => setNewMatName(e.target.value)}
                className="h-11 rounded-xl"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Satuan Dasar</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between rounded-xl h-11"
                  >
                    <span>
                      {BASE_UNITS.find((u) => u.value === newMatUnit)?.label ?? newMatUnit}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]" align="start">
                  <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground/70">
                    Daftar Satuan Dasar
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {BASE_UNITS.map((u) => (
                    <DropdownMenuItem
                      key={u.value}
                      onClick={() => setNewMatUnit(u.value)}
                      className="cursor-pointer"
                    >
                      {u.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2">
              <Label>Metode Pengelolaan Stok</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between rounded-xl h-11"
                  >
                    <span>
                      {newMatMethod === "FEFO"
                        ? "Kedaluwarsa Terdekat Lebih Dulu (FEFO)"
                        : "Stok Masuk Lebih Dulu (FIFO)"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]" align="start">
                  <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground/70">
                    Metode Inventaris
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setNewMatMethod("FIFO")}
                    className="cursor-pointer flex flex-col items-start gap-0.5 py-2"
                  >
                    <span className="font-semibold text-foreground">Stok Masuk Lebih Dulu (FIFO)</span>
                    <span className="text-[11px] text-muted-foreground">
                      Cocok untuk bahan umum/kering (tanggal kedaluwarsa opsional).
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setNewMatMethod("FEFO")}
                    className="cursor-pointer flex flex-col items-start gap-0.5 py-2"
                  >
                    <span className="font-semibold text-foreground">Kedaluwarsa Terdekat Lebih Dulu (FEFO)</span>
                    <span className="text-[11px] text-muted-foreground">
                      Cocok untuk bahan mudah basi/segar (wajib isi tanggal kedaluwarsa).
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isCreatingMat}
                onClick={() => setIsCreateMatOpen(false)}
                className="rounded-xl h-10"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isCreatingMat}
                className="rounded-xl h-10"
              >
                {isCreatingMat && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Tambah Bahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
