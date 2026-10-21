import * as React from "react"
import { Info } from "lucide-react"
import { getCompatibleUnits, getQuantityInBaseUnit } from "@/lib/units"
import { FormattedNumberInput } from "@/components/ui/formatted-number-input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { stockNumber, stockSelectClass } from "./stock-form-utils"
import { cn } from "@/lib/utils"

export interface PurchaseUnitFieldsProps {
  baseUnit: string
  unit: string
  packageSize: number
  quantity: number
  onUnitChange: (unit: string) => void
  onPackageSizeChange: (size: number) => void
  disabled?: boolean
  className?: string
  quantityHint?: string
  idPrefix?: string
}

export function PurchaseUnitFields({
  baseUnit,
  unit,
  packageSize,
  quantity,
  onUnitChange,
  onPackageSizeChange,
  disabled = false,
  className,
  idPrefix = "purchase",
  quantityHint,
}: PurchaseUnitFieldsProps) {
  const [helpOpen, setHelpOpen] = React.useState(false)
  const currentUnit = unit || baseUnit
  const compatible = React.useMemo(() => {
    return [...new Set([baseUnit, ...getCompatibleUnits(baseUnit)])].filter(Boolean)
  }, [baseUnit])

  const isKemasan = currentUnit === "kemasan"
  const baseQuantity = getQuantityInBaseUnit(quantity, currentUnit, baseUnit, packageSize)
  const hasValidQuantity = quantity > 0 && Number.isFinite(quantity) && Number.isFinite(baseQuantity) && baseQuantity > 0

  return (
    <div className={cn("min-w-0 space-y-2", className)}>
      <div className="space-y-2">
        <div className="flex min-h-5 items-center gap-1.5">
          <label htmlFor={`${idPrefix}-unit-select`} className="text-sm font-medium text-foreground">
            Satuan Pembelian <span className="text-destructive">*</span>
          </label>
          <Tooltip open={helpOpen} onOpenChange={setHelpOpen}>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Info satuan pembelian"
                className="relative inline-flex size-5 shrink-0 items-center justify-center text-muted-foreground transition-colors after:absolute after:-inset-1 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onPointerDown={(event) => event.preventDefault()}
                onClick={(event) => { event.preventDefault(); setHelpOpen((open) => !open) }}
              >
                <Info className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" align="start" sideOffset={8} className="block w-72 max-w-[calc(100vw-2rem)] space-y-2 p-3 text-xs leading-relaxed">
              <p className="font-semibold">Pilih satuan sesuai pembelian</p>
              <p>Bisa memakai satuan dasar{baseUnit ? ` (${baseUnit})` : ""}, satuan turunan, atau kemasan seperti karung, dus, dan pack.</p>
              <p>Untuk kemasan, isi jumlah {baseUnit || "satuan dasar"} per kemasan. Contoh: 2 karung berisi 25 {baseUnit || "satuan"} per karung akan dicatat sebagai 50 {baseUnit || "satuan"}.</p>
              {hasValidQuantity && <p>Jumlah dalam satuan dasar: <strong>{stockNumber(baseQuantity)} {baseUnit}</strong>.</p>}
              <p>{quantityHint || "Total harga faktur adalah biaya seluruh pembelian ini."}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <select
          id={`${idPrefix}-unit-select`}
          className={stockSelectClass}
          value={currentUnit}
          onChange={(e) => onUnitChange(e.target.value)}
          disabled={disabled || !baseUnit}
        >
          {!baseUnit && <option value="">Pilih bahan baku terlebih dahulu</option>}
          {compatible.map((u) => (
            <option key={u} value={u}>
              {u === baseUnit ? `${u} (Satuan Dasar)` : u}
            </option>
          ))}
          <option value="kemasan">Kemasan (karung, sak, dus, pack, jerigen)</option>
        </select>
      </div>

      {isKemasan && (
        <div className="space-y-2 pt-1">
          <label htmlFor={`${idPrefix}-package-size`} className="text-sm font-medium text-foreground">
            Isi per Kemasan ({baseUnit}) <span className="text-destructive">*</span>
          </label>
          <FormattedNumberInput
            id={`${idPrefix}-package-size`}
            value={packageSize ? String(packageSize) : ""}
            onChange={(val) => onPackageSizeChange(Number(val) || 0)}
            allowDecimal
            maxDecimals={4}
            min={0.0001}
            placeholder="Contoh: 25"
            suffix={baseUnit}
            disabled={disabled}
            className="h-11 rounded-xl bg-background"
            required
          />
        </div>
      )}

      {hasValidQuantity && currentUnit !== baseUnit && (!isKemasan || packageSize > 0) && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {stockNumber(quantity)} {currentUnit}{isKemasan ? ` × ${stockNumber(packageSize)} ${baseUnit}` : ""} ={" "}
          <span className="font-medium text-foreground">{stockNumber(baseQuantity)} {baseUnit}</span>
        </p>
      )}
    </div>
  )
}
