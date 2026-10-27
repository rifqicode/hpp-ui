import * as React from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Loader2,
  ArrowLeftRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FormattedNumberInput } from "@/components/ui/formatted-number-input"
import { Textarea } from "@/components/ui/textarea"
import { CurrencyText } from "@/components/ui/currency-text"
import { cn } from "@/lib/utils"
import { useMovementStock } from "@/features/inventory/hooks/use-movement-stock"
import {
  StockChangePreview,
  StockMaterialField,
} from "@/features/inventory/components/stock-form-fields"
import { stockNumber } from "@/features/inventory/components/stock-form-utils"

type MovementType = "ADJUSTMENT_IN" | "ADJUSTMENT_OUT"

export default function MovementStockPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const materialFromQuery = searchParams.get("materialId")

  const {
    stocks,
    loading,
    isSubmitting,
    error: hookError,
    handleRecordAdjustment,
  } = useMovementStock()

  const [movementType, setMovementType] = React.useState<MovementType>("ADJUSTMENT_IN")
  const [userSelectedMaterialId, setUserSelectedMaterialId] = React.useState<string>("")
  const [quantity, setQuantity] = React.useState<string>("")
  const [totalCost, setTotalCost] = React.useState<string>("")
  const [reason, setReason] = React.useState<string>("")
  const [submitError, setSubmitError] = React.useState<string>("")

  const materialId =
    userSelectedMaterialId ||
    (materialFromQuery && stocks.some((s) => s.id === materialFromQuery) ? materialFromQuery : "") ||
    stocks[0]?.id ||
    ""

  const material = stocks.find((m) => m.id === materialId)
  const isIncoming = movementType === "ADJUSTMENT_IN"
  const qty = Number(quantity)
  const numTotalCost = Number(totalCost)
  const current = Number(material?.current_stock || 0)
  const insufficient = !isIncoming && qty > current
  const valid =
    Boolean(material) &&
    Number.isFinite(qty) &&
    qty > 0 &&
    !insufficient &&
    (!isIncoming || (Number.isFinite(numTotalCost) && numTotalCost > 0))

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError("")

    if (!material) {
      setSubmitError("Pilih bahan baku terlebih dahulu.")
      return
    }

    if (!valid) {
      if (insufficient) {
        setSubmitError("Jumlah pengurangan melebihi stok yang tersedia saat ini.")
      } else {
        setSubmitError("Pastikan jumlah dan harga yang diisi sudah valid.")
      }
      return
    }

    const calculatedPricePerUnit = (isIncoming && qty > 0 && numTotalCost > 0) ? (numTotalCost / qty) : undefined

    try {
      await handleRecordAdjustment({
        stock_id: material.id,
        type: movementType,
        quantity: qty,
        reason: reason.trim() || undefined,
        price_per_unit: calculatedPricePerUnit,
      })
      navigate("/inventory/stocks")
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan mutasi stok. Silakan coba kembali."
      )
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-3 text-primary" />
        <p className="text-sm">Memuat data bahan baku...</p>
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
          <ArrowLeftRight className="size-6" />
        </span>
        <div className="flex flex-col gap-0.5 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Stock Adjustment
          </h1>
          <p className="text-sm text-muted-foreground">
            Sesuaikan stok karena selisih opname fisik, kerusakan bahan, atau koreksi inventaris.
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
          <CardTitle>Formulir Penyesuaian Stok</CardTitle>
          <CardDescription>
            Pilih jenis mutasi, bahan baku yang disesuaikan, serta jumlah selisih fisiknya.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-5 min-w-0">
            {/* Visual Radio Cards - Jenis Mutasi */}
            <fieldset className="min-w-0">
              <legend className="mb-2 text-sm font-medium text-foreground">Jenis Mutasi</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={cn(
                    "relative flex cursor-pointer flex-col gap-1.5 rounded-xl border p-3.5 transition-all",
                    movementType === "ADJUSTMENT_IN"
                      ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15 ring-1 ring-emerald-500"
                      : "border-border hover:bg-muted/40"
                  )}
                >
                  <input
                    type="radio"
                    name="page-movement-type"
                    value="ADJUSTMENT_IN"
                    checked={movementType === "ADJUSTMENT_IN"}
                    onChange={() => {
                      setMovementType("ADJUSTMENT_IN")
                      setSubmitError("")
                    }}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <ArrowDownLeft className="size-4" />
                    </span>
                    <span
                      className={cn(
                        "size-2.5 rounded-full",
                        movementType === "ADJUSTMENT_IN"
                          ? "bg-emerald-500 ring-2 ring-emerald-500/30"
                          : "border border-muted-foreground/30"
                      )}
                    />
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    Tambah Stok (Masuk)
                  </span>
                  <span className="text-xs leading-relaxed text-muted-foreground">
                    Stok fisik lebih banyak atau penyesuaian masuk
                  </span>
                </label>

                <label
                  className={cn(
                    "relative flex cursor-pointer flex-col gap-1.5 rounded-xl border p-3.5 transition-all",
                    movementType === "ADJUSTMENT_OUT"
                      ? "border-destructive bg-destructive/10 dark:bg-destructive/15 ring-1 ring-destructive"
                      : "border-border hover:bg-muted/40"
                  )}
                >
                  <input
                    type="radio"
                    name="page-movement-type"
                    value="ADJUSTMENT_OUT"
                    checked={movementType === "ADJUSTMENT_OUT"}
                    onChange={() => {
                      setMovementType("ADJUSTMENT_OUT")
                      setSubmitError("")
                    }}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
                      <ArrowUpRight className="size-4" />
                    </span>
                    <span
                      className={cn(
                        "size-2.5 rounded-full",
                        movementType === "ADJUSTMENT_OUT"
                          ? "bg-destructive ring-2 ring-destructive/30"
                          : "border border-muted-foreground/30"
                      )}
                    />
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    Kurangi Stok (Keluar)
                  </span>
                  <span className="text-xs leading-relaxed text-muted-foreground">
                    Barang rusak, susut, atau kedaluwarsa (Strict FIFO)
                  </span>
                </label>
              </div>

              {!isIncoming && (
                <div className="mt-2 bg-primary/5 border border-primary/20 text-xs p-3 rounded-xl text-foreground">
                  <p className="leading-relaxed">
                    <span className="font-semibold text-primary">Strict FIFO: </span>
                    Pengurangan stok selalu memotong kuantitas dari batch tertua terlebih dahulu.
                  </p>
                </div>
              )}
            </fieldset>

            {/* Material Selector */}
            <StockMaterialField
              id="page-movement-material"
              stocks={stocks}
              value={materialId}
              onChange={(val) => {
                setUserSelectedMaterialId(val)
                setQuantity("")
                setTotalCost("")
                setSubmitError("")
              }}
            />

            {/* Quantity and Total Cost */}
            <div className={cn("grid gap-4", isIncoming ? "sm:grid-cols-2" : "grid-cols-1")}>
              <div className="min-w-0 space-y-2">
                <label htmlFor="page-movement-qty" className="text-sm font-medium text-foreground">
                  Jumlah yang {isIncoming ? "Ditambahkan" : "Dikurangi"}{" "}
                  <span className="text-destructive">*</span>
                </label>
                <FormattedNumberInput
                  id="page-movement-qty"
                  value={quantity}
                  onChange={(val) => setQuantity(String(val))}
                  allowDecimal
                  maxDecimals={4}
                  suffix={material?.base_unit || "satuan"}
                  placeholder="Contoh: 2,5"
                  required
                  disabled={!material}
                  className="h-11 rounded-xl"
                  aria-invalid={insufficient}
                />
                <p className="text-xs text-muted-foreground">
                  Isi selisih fisik yang disesuaikan, bukan jumlah stok akhir.
                </p>
              </div>

              {isIncoming && (
                <div className="min-w-0 space-y-2">
                  <label htmlFor="page-movement-total-cost" className="text-sm font-medium text-foreground">
                    Total Harga Bahan{" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <FormattedNumberInput
                    id="page-movement-total-cost"
                    value={totalCost}
                    onChange={(val) => setTotalCost(String(val))}
                    prefix="Rp"
                    allowDecimal
                    maxDecimals={4}
                    placeholder="Contoh: 15.000"
                    required
                    disabled={!material}
                    className="h-11 rounded-xl"
                  />
                  {qty > 0 && numTotalCost > 0 ? (
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      Harga per {material?.base_unit || "satuan"}: <CurrencyText value={numTotalCost / qty} /> (dihitung otomatis)
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Sistem otomatis menghitung harga per {material?.base_unit || "satuan"} dari total harga dibagi jumlah.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Insufficient Stock Warning Alert */}
            {insufficient && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive"
              >
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Stok tidak mencukupi</p>
                  <p className="mt-0.5 leading-relaxed">
                    Jumlah pengurangan ({stockNumber(qty)} {material?.base_unit}) melebihi stok yang tercatat saat ini ({stockNumber(current)} {material?.base_unit}).
                  </p>
                </div>
              </div>
            )}

            {/* Reason Textarea */}
            <div className="space-y-2">
              <label htmlFor="page-movement-reason" className="text-sm font-medium text-foreground">
                Catatan / Alasan Penyesuaian{" "}
                <span className="font-normal text-muted-foreground">(opsional)</span>
              </label>
              <Textarea
                id="page-movement-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  isIncoming
                    ? "Contoh: selisih hitung stok setelah pengecekan fisik gudang"
                    : "Contoh: 2 kg tepung rusak karena kemasan bocor atau kedaluwarsa"
                }
                rows={2}
                className="min-h-20 resize-y rounded-xl"
              />
            </div>

            {/* Live Stock Change Preview */}
            {material && qty > 0 && Number.isFinite(qty) && (
              <div className="space-y-3" aria-live="polite">
                <StockChangePreview
                  current={current}
                  change={isIncoming ? qty : -qty}
                  unit={material.base_unit}
                  invalid={insufficient}
                />
                {isIncoming && numTotalCost > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/40 px-3.5 py-2.5 text-xs text-muted-foreground border border-border/50">
                    <span>Total nilai penyesuaian masuk:</span>
                    <strong className="text-sm font-semibold text-foreground">
                      <CurrencyText value={numTotalCost} />
                    </strong>
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
                {isSubmitting ? "Menyimpan…" : "Simpan Mutasi"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
