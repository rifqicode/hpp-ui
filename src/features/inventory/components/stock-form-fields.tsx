import { ArrowRight, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Stock } from "../types"
import { stockNumber, stockSelectClass } from "./stock-form-utils"

export function StockMaterialField({
  stocks,
  value,
  onChange,
  locked,
  id,
  label = "Bahan baku",
}: {
  stocks: Stock[]
  value: string
  onChange: (value: string) => void
  locked?: boolean
  id: string
  label?: string
}) {
  const selected = stocks.find((stock) => stock.id === value)

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label} <span className="text-destructive">*</span>
      </label>
      <select
        id={id}
        className={stockSelectClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={locked}
        required
      >
        <option value="" disabled>
          Pilih bahan baku
        </option>
        {stocks.map((stock) => (
          <option key={stock.id} value={stock.id}>
            {stock.name} ({stock.base_unit}) — {stock.inventory_method}
          </option>
        ))}
      </select>

      {selected ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/50 px-3.5 py-2.5 text-xs text-muted-foreground border border-border/50">
          <div className="flex items-center gap-2">
            <Package className="size-4 shrink-0 text-primary" />
            <span>
              Stok tercatat:{" "}
              <strong className="font-semibold text-foreground">
                {stockNumber(selected.current_stock)} {selected.base_unit}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {selected.inventory_method === "FEFO" ? (
              <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400 border border-amber-500/20">
                FEFO (Kedaluwarsa)
              </span>
            ) : (
              <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400 border border-blue-500/20">
                FIFO (Masuk Dulu)
              </span>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          {stocks.length
            ? "Pilih bahan baku untuk melihat stok saat ini dan metode inventaris."
            : "Belum ada bahan baku tercatat. Tambahkan bahan baku baru terlebih dahulu."}
        </p>
      )}
    </div>
  )
}

export function StockChangePreview({
  current,
  change,
  unit,
  invalid = false,
}: {
  current: number
  change: number
  unit: string
  invalid?: boolean
}) {
  const result = current + change
  const isIncoming = change >= 0

  return (
    <div
      className={cn(
        "rounded-xl border p-3.5 sm:p-4 transition-colors",
        invalid
          ? "border-destructive/30 bg-destructive/5"
          : isIncoming
          ? "border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10"
          : "border-primary/20 bg-primary/5"
      )}
    >
      <div className="mb-3 flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>Perkiraan stok setelah disimpan</span>
        <span
          className={cn(
            "font-semibold tabular-nums",
            invalid
              ? "text-destructive"
              : isIncoming
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-amber-600 dark:text-amber-400"
          )}
        >
          {isIncoming ? `+${stockNumber(change)}` : `-${stockNumber(Math.abs(change))}`} {unit}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Saat ini</p>
          <p className="mt-1 break-words text-sm font-semibold tabular-nums text-foreground">
            {stockNumber(current)} <span className="text-xs font-normal text-muted-foreground">{unit}</span>
          </p>
        </div>

        <div className="flex justify-center px-1">
          <ArrowRight className="size-4 text-muted-foreground" />
        </div>

        <div className="min-w-0 text-right">
          <p className="text-xs text-muted-foreground">
            Setelah {isIncoming ? "ditambah" : "dikurangi"}
          </p>
          <p
            className={cn(
              "mt-1 break-words text-lg font-bold tabular-nums",
              invalid
                ? "text-destructive"
                : isIncoming
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-foreground"
            )}
          >
            {stockNumber(result)}{" "}
            <span className="text-xs font-normal text-muted-foreground">{unit}</span>
          </p>
        </div>
      </div>

      <p
        className={cn(
          "mt-3 border-t border-border/50 pt-2 text-xs",
          invalid ? "text-destructive font-medium" : "text-muted-foreground"
        )}
      >
        {invalid
          ? "⚠️ Jumlah pengurangan melebihi stok tercatat saat ini."
          : `${isIncoming ? "Masuk ke inventaris" : "Dipotong dari inventaris"}: ${stockNumber(Math.abs(change))} ${unit}`}
      </p>
    </div>
  )
}
