import * as React from "react"
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FormattedNumberInput } from "@/components/ui/formatted-number-input"
import { Textarea } from "@/components/ui/textarea"
import { CurrencyText } from "@/components/ui/currency-text"
import { cn } from "@/lib/utils"
import { useMovementStock } from "../hooks/use-movement-stock"
import { StockChangePreview, StockMaterialField } from "./stock-form-fields"
import { stockNumber } from "./stock-form-utils"

type MovementType = "ADJUSTMENT_IN" | "ADJUSTMENT_OUT"

interface RecordMovementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialStockId?: string
  onSuccess?: () => void
}

export function RecordMovementDialog({
  open,
  onOpenChange,
  initialStockId,
  onSuccess,
}: RecordMovementDialogProps) {
  const { stocks, loading, isSubmitting, error: hookError, handleRecordAdjustment } = useMovementStock({
    enabled: open,
  })

  const [selectedMaterialId, setSelectedMaterialId] = React.useState("")
  const [movementType, setMovementType] = React.useState<MovementType>("ADJUSTMENT_IN")
  const [quantity, setQuantity] = React.useState("")
  const [pricePerUnit, setPricePerUnit] = React.useState("")
  const [reason, setReason] = React.useState("")
  const [submitError, setSubmitError] = React.useState("")
  const submissionLock = React.useRef(false)

  const materialId = initialStockId || selectedMaterialId
  const material = stocks.find((stock) => stock.id === materialId)
  const isIncoming = movementType === "ADJUSTMENT_IN"

  const qty = Number(quantity)
  const price = Number(pricePerUnit)
  const current = Number(material?.current_stock || 0)
  const insufficient = !isIncoming && qty > current
  const valid =
    Boolean(material) &&
    Number.isFinite(qty) &&
    qty > 0 &&
    !insufficient &&
    (!isIncoming || (Number.isFinite(price) && price > 0))

  function resetAndClose() {
    setSelectedMaterialId("")
    setMovementType("ADJUSTMENT_IN")
    setQuantity("")
    setPricePerUnit("")
    setReason("")
    setSubmitError("")
    onOpenChange(false)
  }

  function handleDialogChange(next: boolean) {
    if (submissionLock.current) return
    if (!next) {
      resetAndClose()
    } else {
      onOpenChange(true)
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (submissionLock.current) return

    if (!valid) {
      if (insufficient) {
        setSubmitError("Jumlah pengurangan melebihi stok yang tersedia.")
      } else {
        setSubmitError("Pilih bahan baku dan lengkapi jumlah serta harga yang valid.")
      }
      return
    }

    submissionLock.current = true
    setSubmitError("")

    try {
      await handleRecordAdjustment({
        stock_id: materialId,
        type: movementType,
        quantity: qty,
        reason: reason.trim() || undefined,
        price_per_unit: isIncoming ? price : undefined,
      })
      resetAndClose()
      onSuccess?.()
    } catch (error: unknown) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Mutasi stok belum berhasil disimpan. Silakan coba lagi."
      )
    } finally {
      submissionLock.current = false
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl sm:p-0">
        <DialogHeader className="shrink-0 border-b px-5 py-5 pr-12 text-left sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ArrowLeftRight className="size-5" />
            </span>
            <div>
              <DialogTitle>Catat Mutasi Stok</DialogTitle>
              <DialogDescription className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Sesuaikan stok karena selisih hitungan opname fisik, kerusakan, atau kebutuhan koreksi.
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
            Memuat data bahan baku…
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

                {/* Jenis Mutasi - Visual Radio Cards */}
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
                        name="movement-type"
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
                        name="movement-type"
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
                  {isIncoming && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      💡 Untuk stok dari belanja/faktur pembelian supplier, gunakan form Catat Pembelian.
                    </p>
                  )}
                </fieldset>

                {/* Material Selection */}
                <StockMaterialField
                  id="movement-material"
                  stocks={stocks}
                  value={materialId}
                  locked={Boolean(initialStockId)}
                  onChange={(value) => {
                    setSelectedMaterialId(value)
                    setQuantity("")
                    setPricePerUnit("")
                    setSubmitError("")
                  }}
                />

                {/* Quantity & Price per Unit */}
                <div className={cn("grid gap-4", isIncoming ? "sm:grid-cols-2" : "grid-cols-1")}>
                  <div className="min-w-0 space-y-2">
                    <label htmlFor="movement-qty" className="text-sm font-medium text-foreground">
                      Jumlah yang {isIncoming ? "Ditambahkan" : "Dikurangi"}{" "}
                      <span className="text-destructive">*</span>
                    </label>
                    <FormattedNumberInput
                      id="movement-qty"
                      value={quantity}
                      onChange={(value) => setQuantity(String(value))}
                      allowDecimal
                      maxDecimals={4}
                      suffix={material?.base_unit || "satuan"}
                      placeholder="Contoh: 2,5"
                      required
                      disabled={!material}
                      className="h-11 rounded-xl"
                      aria-invalid={insufficient}
                      aria-describedby="movement-qty-help"
                    />
                    <p id="movement-qty-help" className="text-xs text-muted-foreground">
                      Isi selisih fisik yang disesuaikan, bukan jumlah stok akhir.
                    </p>
                  </div>

                  {isIncoming && (
                    <div className="min-w-0 space-y-2">
                      <label htmlFor="movement-price" className="text-sm font-medium text-foreground">
                        Harga per {material?.base_unit || "Satuan"}{" "}
                        <span className="text-destructive">*</span>
                      </label>
                      <FormattedNumberInput
                        id="movement-price"
                        value={pricePerUnit}
                        onChange={(value) => setPricePerUnit(String(value))}
                        prefix="Rp"
                        allowDecimal
                        maxDecimals={4}
                        placeholder="Contoh: 15.000"
                        required
                        disabled={!material}
                        className="h-11 rounded-xl"
                      />
                      <p className="text-xs text-muted-foreground">
                        Wajib untuk menghitung valuasi aset stok dan HPP batch baru.
                      </p>
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

                {/* Catatan / Alasan */}
                <div className="space-y-2">
                  <label htmlFor="movement-reason" className="text-sm font-medium text-foreground">
                    Catatan / Alasan Penyesuaian{" "}
                    <span className="font-normal text-muted-foreground">(opsional)</span>
                  </label>
                  <Textarea
                    id="movement-reason"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
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
                    {isIncoming && price > 0 && (
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/40 px-3.5 py-2.5 text-xs text-muted-foreground border border-border/50">
                        <span>Total nilai penyesuaian masuk:</span>
                        <strong className="text-sm font-semibold text-foreground">
                          <CurrencyText value={qty * price} />
                        </strong>
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
                {isSubmitting ? "Menyimpan…" : "Simpan Mutasi"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
