import * as React from "react"
import { ChevronDown, Loader2, Plus, ShoppingBag } from "lucide-react"
import { getQuantityInBaseUnit } from "@/lib/units"
import { Button } from "@/components/ui/button"
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
import { FormattedNumberInput } from "@/components/ui/formatted-number-input"
import { Label } from "@/components/ui/label"
import { CurrencyText } from "@/components/ui/currency-text"
import { usePurchaseStock } from "../hooks/use-purchase-stock"
import { StockChangePreview, StockMaterialField } from "./stock-form-fields"
import { stockSelectClass } from "./stock-form-utils"
import { PurchaseUnitFields } from "./purchase-unit-fields"

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

interface RecordPurchaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialStockId?: string
  initialSupplierId?: string
  onSuccess?: () => void
}

export function RecordPurchaseDialog({
  open,
  onOpenChange,
  initialStockId,
  initialSupplierId,
  onSuccess,
}: RecordPurchaseDialogProps) {
  const {
    stocks,
    suppliers,
    loading,
    isSubmitting,
    error: hookError,
    handleCreateStock,
    handleRecordPurchase,
  } = usePurchaseStock({ enabled: open })

  const [selectedMaterialId, setSelectedMaterialId] = React.useState("")
  const [selectedSupplierId, setSelectedSupplierId] = React.useState<string | null>(null)
  const [quantity, setQuantity] = React.useState("")
  const [totalPrice, setTotalPrice] = React.useState("")
  const [expiredAt, setExpiredAt] = React.useState("")
  const [submitError, setSubmitError] = React.useState("")
  const [purchaseUnit, setPurchaseUnit] = React.useState("")
  const [packageSize, setPackageSize] = React.useState("")

  // Quick Create Material Modal state
  const [isCreateMatOpen, setIsCreateMatOpen] = React.useState(false)
  const [newMatName, setNewMatName] = React.useState("")
  const [newMatUnit, setNewMatUnit] = React.useState("kg")
  const [newMatMethod, setNewMatMethod] = React.useState<"FIFO" | "FEFO">("FIFO")
  const [isCreatingMat, setIsCreatingMat] = React.useState(false)
  const [createMatError, setCreateMatError] = React.useState("")

  const submissionLock = React.useRef(false)

  const materialId = initialStockId || selectedMaterialId
  const supplierId = selectedSupplierId ?? initialSupplierId ?? ""
  const material = stocks.find((stock) => stock.id === materialId)
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

  function resetAndClose() {
    setSelectedMaterialId("")
    setSelectedSupplierId(null)
    setQuantity("")
    setTotalPrice("")
    setExpiredAt("")
    setSubmitError("")
    setPurchaseUnit("")
    setPackageSize("")
    setIsCreateMatOpen(false)
    setCreateMatError("")
    onOpenChange(false)
  }

  function handleDialogChange(next: boolean) {
    if (submissionLock.current || isCreatingMat) return
    if (!next) {
      resetAndClose()
    } else {
      onOpenChange(true)
    }
  }

  function selectMaterial(id: string) {
    setSelectedMaterialId(id)
    setPurchaseUnit("")
    setPackageSize("")
    setQuantity("")
    setTotalPrice("")
    setExpiredAt("")
    setSubmitError("")
  }

  async function handleQuickCreateMaterial(event: React.FormEvent) {
    event.preventDefault()
    if (isCreatingMat) return

    if (!newMatName.trim()) {
      setCreateMatError("Nama bahan baku wajib diisi.")
      return
    }

    setIsCreatingMat(true)
    setCreateMatError("")

    try {
      const created = await handleCreateStock({
        name: newMatName.trim(),
        base_unit: newMatUnit,
        inventory_method: newMatMethod,
      })
      selectMaterial(created.id)
      setIsCreateMatOpen(false)
      setNewMatName("")
      setNewMatMethod("FIFO")
    } catch (error: unknown) {
      setCreateMatError(
        error instanceof Error ? error.message : "Bahan baku belum berhasil ditambahkan."
      )
    } finally {
      setIsCreatingMat(false)
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (submissionLock.current) return

    if (!valid) {
      if (isFefo && !expiredAt) {
        setSubmitError("Tanggal kedaluwarsa wajib diisi untuk bahan baku FEFO.")
      } else {
        setSubmitError("Periksa bahan, jumlah, total harga, dan tanggal kedaluwarsa sebelum menyimpan.")
      }
      return
    }

    submissionLock.current = true
    setSubmitError("")

    try {
      await handleRecordPurchase({
        stock_id: materialId,
        supplier_id: supplierId || undefined,
        quantity: qty,
        unit,
        package_size: unit === "kemasan" ? pkgSizeNum : undefined,
        total_price: total,
        expired_at: expiredAt ? new Date(expiredAt).toISOString() : undefined,
      })
      resetAndClose()
      onSuccess?.()
    } catch (error: unknown) {
      setSubmitError(
        error instanceof Error ? error.message : "Pembelian belum berhasil disimpan. Silakan coba lagi."
      )
    } finally {
      submissionLock.current = false
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogChange}>
        <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl sm:p-0">
          <DialogHeader className="shrink-0 border-b px-5 py-5 pr-12 text-left sm:px-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShoppingBag className="size-5" />
              </span>
              <div>
                <DialogTitle>Catat Pembelian Bahan</DialogTitle>
                <DialogDescription className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Catat bahan yang sudah diterima. Stok dan valuasi biaya bahan akan otomatis diperbarui.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {loading ? (
            <div
              role="status"
              className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground"
            >
              <Loader2 className="size-4 animate-spin text-primary" />
              Memuat data pembelian…
            </div>
          ) : (
            <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
                <fieldset disabled={isSubmitting} className="min-w-0 space-y-5">
                  {(submitError || hookError) && (
                    <p
                      role="alert"
                      className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
                    >
                      {submitError || hookError}
                    </p>
                  )}

                  {/* Bahan Baku & Supplier */}
                  <section className="space-y-3" aria-label="Bahan baku dan supplier">
                    <StockMaterialField
                      id="purchase-material"
                      stocks={stocks}
                      value={materialId}
                      locked={Boolean(initialStockId)}
                      onChange={selectMaterial}
                    />

                    {!initialStockId && (
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
                    )}

                    <div className="space-y-2">
                      <label htmlFor="purchase-supplier" className="text-sm font-medium text-foreground">
                        Supplier <span className="font-normal text-muted-foreground">(opsional)</span>
                      </label>
                      <select
                        id="purchase-supplier"
                        className={stockSelectClass}
                        value={supplierId}
                        onChange={(event) => setSelectedSupplierId(event.target.value)}
                      >
                        <option value="">Tanpa supplier / belanja langsung</option>
                        {suppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground">
                        Pilih supplier jika pembelian berasal dari rekanan terdaftar.
                      </p>
                    </div>
                  </section>

                  {/* Jumlah & Biaya Pembelian */}
                  <section className="space-y-4 border-t border-border/60 pt-5" aria-labelledby="purchase-detail-heading">
                    <h3 id="purchase-detail-heading" className="text-sm font-semibold text-foreground">
                      Jumlah & Biaya Pembelian
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="min-w-0 space-y-2">
                        <label htmlFor="purchase-qty" className="text-sm font-medium text-foreground">
                          Jumlah Beli <span className="text-destructive">*</span>
                        </label>
                        <FormattedNumberInput
                          id="purchase-qty"
                          value={quantity}
                          onChange={(value) => setQuantity(String(value))}
                          allowDecimal
                          maxDecimals={4}
                          placeholder="Contoh: 10"
                          required
                          disabled={!material}
                          className="h-11 rounded-xl"
                        />
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
                          idPrefix="dialog-purchase"
                        />
                      </div>
                    </div>

                    {precisionInvalid && (
                      <p role="alert" className="text-xs text-destructive">
                        Hasil konversi terlalu rinci. Gunakan jumlah dengan maksimal 4 angka desimal dalam {material?.base_unit}.
                      </p>
                    )}

                    <div className="space-y-2">
                      <label htmlFor="purchase-price" className="text-sm font-medium text-foreground">
                        Total Harga Pembelian (Faktur) <span className="text-destructive">*</span>
                      </label>
                      <FormattedNumberInput
                        id="purchase-price"
                        value={totalPrice}
                        onChange={(value) => setTotalPrice(String(value))}
                        prefix="Rp"
                        placeholder="Contoh: 250.000"
                        required
                        disabled={!material}
                        className="h-11 rounded-xl"
                      />
                      <p className="text-xs text-muted-foreground">
                        Isi seluruh biaya nota/faktur yang dibayarkan untuk bahan ini, bukan harga satuan.
                      </p>
                    </div>

                    {/* Tanggal Kedaluwarsa */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label htmlFor="purchase-expired" className="text-sm font-medium text-foreground">
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
                        id="purchase-expired"
                        type="date"
                        value={expiredAt}
                        onChange={(event) => setExpiredAt(event.target.value)}
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
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className="text-muted-foreground">Total Pembelian:</span>
                            <span className="text-base font-bold text-foreground">
                              <CurrencyText value={total} />
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-2 text-xs">
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
                </fieldset>
              </div>

              <DialogFooter className="shrink-0 border-t bg-muted/20 px-5 py-4 sm:px-6">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => handleDialogChange(false)}
                  className="h-11 rounded-xl"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={!valid || isSubmitting}
                  className="h-11 rounded-xl"
                >
                  {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {isSubmitting ? "Menyimpan…" : "Simpan Pembelian"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

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
              <Label htmlFor="quick-mat-name">Nama Bahan Baku</Label>
              <Input
                id="quick-mat-name"
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
    </>
  )
}
