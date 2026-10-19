import * as React from "react"
import { cn } from "@/lib/utils"
import { formatIntegerDigits } from "@/lib/number-format"

export interface FormatCurrencyOptions {
  /**
   * Currency prefix prepended before the numeric amount.
   * Defaults to `"Rp "`. Can be set to `""` for pure delimiter formatting.
   */
  prefix?: string

  /**
   * Currency suffix appended after the numeric amount, e.g. `"/kg"`, `",-"`.
   * Defaults to `""`.
   */
  suffix?: string

  /**
   * Whether decimal fractions are enabled.
   * Defaults to `false`.
   */
  allowDecimal?: boolean

  /**
   * Number of decimal digits to display.
   * Defaults to `0` when `allowDecimal` is false, and `2` when `allowDecimal` is true.
   */
  decimalDigits?: number

  /**
   * Prepend a "+" sign before positive values greater than 0 (e.g. `"+Rp 5.000"`).
   * Defaults to `false`.
   */
  showPositiveSign?: boolean

  /**
   * Thousand separator symbol. Defaults to `"."`.
   */
  thousandSeparator?: string

  /**
   * Decimal separator symbol. Defaults to `","`.
   */
  decimalSeparator?: string

  /**
   * Fallback text when value is null, undefined, NaN, or empty string.
   * Defaults to `"-"`. Note that `0` is formatted as `"Rp 0"`.
   */
  emptyDisplay?: string
}

export interface CurrencyTextProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "children">,
    FormatCurrencyOptions {
  /**
   * Numeric or string currency value.
   * Safely handles numbers, numeric strings, empty strings, null, undefined, and NaN.
   */
  value: number | string | null | undefined

  /**
   * HTML semantic element tag or component to render.
   * Defaults to `"span"`.
   */
  as?: React.ElementType
}

/**
 * Safely parses an input value into numeric information.
 */
function parseNumericValue(value: number | string | null | undefined): {
  isValid: boolean
  isNegative: boolean
  numVal: number
} {
  if (value === null || value === undefined) {
    return { isValid: false, isNegative: false, numVal: 0 }
  }

  if (typeof value === "number") {
    if (Number.isNaN(value) || !Number.isFinite(value)) {
      return { isValid: false, isNegative: false, numVal: 0 }
    }
    return {
      isValid: true,
      isNegative: value < 0,
      numVal: value,
    }
  }

  if (typeof value !== "string") {
    return { isValid: false, isNegative: false, numVal: 0 }
  }

  const trimmed = value.trim()
  if (
    !trimmed ||
    trimmed.toLowerCase() === "nan" ||
    trimmed.toLowerCase() === "null" ||
    trimmed.toLowerCase() === "undefined"
  ) {
    return { isValid: false, isNegative: false, numVal: 0 }
  }

  // Detect negative sign
  const isNegative = trimmed.includes("-")

  // Remove currency prefixes (Rp, IDR), signs, and whitespace
  const cleaned = trimmed
    .replace(/^([+-])?\s*(rp\.?|idr)\s*/i, "")
    .replace(/[+-]/g, "")
    .trim()

  if (!cleaned || !/\d/.test(cleaned)) {
    return { isValid: false, isNegative: false, numVal: 0 }
  }

  // Reject unexpected non-numeric characters
  if (/[^\d.,]/.test(cleaned)) {
    return { isValid: false, isNegative: false, numVal: 0 }
  }

  const lastDot = cleaned.lastIndexOf(".")
  const lastComma = cleaned.lastIndexOf(",")

  let integerDigits = ""
  let decimalDigits = ""

  if (lastDot !== -1 && lastComma !== -1) {
    if (lastComma > lastDot) {
      // 150.000,50 -> dot is thousand, comma is decimal
      integerDigits = cleaned.slice(0, lastComma).replace(/\D/g, "")
      decimalDigits = cleaned.slice(lastComma + 1).replace(/\D/g, "")
    } else {
      // 150,000.50 -> comma is thousand, dot is decimal
      integerDigits = cleaned.slice(0, lastDot).replace(/\D/g, "")
      decimalDigits = cleaned.slice(lastDot + 1).replace(/\D/g, "")
    }
  } else if (lastComma !== -1) {
    // Only comma: standard Indonesian decimal separator
    integerDigits = cleaned.slice(0, lastComma).replace(/\D/g, "")
    decimalDigits = cleaned.slice(lastComma + 1).replace(/\D/g, "")
  } else if (lastDot !== -1) {
    const dotsCount = cleaned.split(".").length - 1
    if (dotsCount > 1) {
      // Multiple dots: thousand separators (e.g. 1.000.000)
      integerDigits = cleaned.replace(/\D/g, "")
    } else {
      // Single dot: check if thousand separator (15.000) or decimal (15000.5)
      const [left, right = ""] = cleaned.split(".")
      if (right.length === 3 && left.length <= 3) {
        integerDigits = cleaned.replace(/\D/g, "")
      } else {
        integerDigits = left.replace(/\D/g, "")
        decimalDigits = right.replace(/\D/g, "")
      }
    }
  } else {
    integerDigits = cleaned.replace(/\D/g, "")
  }

  let finalRaw = (isNegative ? "-" : "") + (integerDigits || "0")
  if (decimalDigits) {
    finalRaw += "." + decimalDigits
  }

  const num = Number(finalRaw)
  if (Number.isNaN(num) || !Number.isFinite(num)) {
    return { isValid: false, isNegative: false, numVal: 0 }
  }

  return {
    isValid: true,
    isNegative: num < 0,
    numVal: num,
  }
}

/**
 * Pure utility function to format numbers or numeric strings into Indonesian currency format.
 *
 * @example
 * formatCurrency(150000) // "Rp 150.000"
 * formatCurrency(-15000) // "-Rp 15.000"
 * formatCurrency(5000, { showPositiveSign: true }) // "+Rp 5.000"
 * formatCurrency(0) // "Rp 0"
 * formatCurrency(null) // "-"
 * formatCurrency(15000.5, { allowDecimal: true }) // "Rp 15.000,50"
 */
export function formatCurrency(
  value: number | string | null | undefined,
  options?: FormatCurrencyOptions
): string {
  const prefix = options?.prefix ?? "Rp "
  const suffix = options?.suffix ?? ""
  const allowDecimal =
    options?.allowDecimal ??
    (options?.decimalDigits !== undefined && options.decimalDigits > 0)
  const decimalDigits = options?.decimalDigits ?? (allowDecimal ? 2 : 0)
  const showPositiveSign = options?.showPositiveSign ?? false
  const thousandSeparator = options?.thousandSeparator ?? "."
  const decimalSeparator = options?.decimalSeparator ?? ","
  const emptyDisplay = options?.emptyDisplay ?? "-"

  const parsed = parseNumericValue(value)
  if (!parsed.isValid) {
    return emptyDisplay
  }

  const absVal = Math.abs(parsed.numVal)
  const isZero = absVal === 0

  let formattedNumber = ""
  if (allowDecimal && decimalDigits > 0) {
    const fixed = absVal.toFixed(decimalDigits)
    const [intPart, decPart] = fixed.split(".")
    const formattedInt = formatIntegerDigits(intPart, thousandSeparator)
    formattedNumber = `${formattedInt}${decimalSeparator}${decPart}`
  } else {
    const rounded = Math.round(absVal)
    formattedNumber = formatIntegerDigits(String(rounded), thousandSeparator)
  }

  let sign = ""
  if (parsed.isNegative && !isZero) {
    sign = "-"
  } else if (showPositiveSign && parsed.numVal > 0) {
    sign = "+"
  }

  return `${sign}${prefix}${formattedNumber}${suffix}`
}

/**
 * Presentational text/label display component for formatted currency.
 *
 * @example
 * <CurrencyText value={150000} /> // renders <span>Rp 150.000</span>
 * <CurrencyText value={-15000} className="text-red-500" /> // renders <span class="text-red-500">-Rp 15.000</span>
 * <CurrencyText value={5000} showPositiveSign className="text-emerald-600 font-bold" /> // renders <span class="...">+Rp 5.000</span>
 * <CurrencyText as="strong" value={25000} suffix="/kg" /> // renders <strong>Rp 25.000/kg</strong>
 */
export const CurrencyText = React.forwardRef<HTMLElement, CurrencyTextProps>(
  (
    {
      value,
      prefix = "Rp ",
      suffix = "",
      allowDecimal = false,
      decimalDigits,
      showPositiveSign = false,
      thousandSeparator = ".",
      decimalSeparator = ",",
      emptyDisplay = "-",
      className,
      as: Component = "span",
      ...props
    },
    ref
  ) => {
    const formatted = formatCurrency(value, {
      prefix,
      suffix,
      allowDecimal,
      decimalDigits,
      showPositiveSign,
      thousandSeparator,
      decimalSeparator,
      emptyDisplay,
    })

    return (
      <Component
        ref={ref as React.Ref<any>}
        className={cn(className)}
        {...props}
      >
        {formatted}
      </Component>
    )
  }
)

CurrencyText.displayName = "CurrencyText"

/** Alias for CurrencyText */
export const CurrencyLabel = CurrencyText

/** Alias for CurrencyText */
export const FormattedCurrency = CurrencyText
