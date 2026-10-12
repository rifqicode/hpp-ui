/**
 * Utilities for formatting and parsing localized numbers.
 *
 * Defaults to Indonesian format:
 * - Thousand separator: '.' (e.g. 1.000.000)
 * - Decimal separator: ',' (e.g. 1.000,5)
 *
 * Outputs clean raw numeric values (pure digits with standard dot decimal point, e.g. 1000.5)
 * for backend payloads and state management.
 */

export interface NumberFormatOptions {
  thousandSeparator?: string
  decimalSeparator?: string
  allowDecimal?: boolean
  maxDecimals?: number
  allowNegative?: boolean
}

export const DEFAULT_NUMBER_FORMAT_OPTIONS: Required<NumberFormatOptions> = {
  thousandSeparator: ".",
  decimalSeparator: ",",
  allowDecimal: false,
  maxDecimals: 4,
  allowNegative: false,
}

function resolveOptions(options?: NumberFormatOptions): Required<NumberFormatOptions> {
  return {
    thousandSeparator: options?.thousandSeparator ?? DEFAULT_NUMBER_FORMAT_OPTIONS.thousandSeparator,
    decimalSeparator: options?.decimalSeparator ?? DEFAULT_NUMBER_FORMAT_OPTIONS.decimalSeparator,
    allowDecimal: options?.allowDecimal ?? DEFAULT_NUMBER_FORMAT_OPTIONS.allowDecimal,
    maxDecimals: options?.maxDecimals ?? DEFAULT_NUMBER_FORMAT_OPTIONS.maxDecimals,
    allowNegative: options?.allowNegative ?? DEFAULT_NUMBER_FORMAT_OPTIONS.allowNegative,
  }
}

/**
 * Formats an integer string with thousand separators.
 */
export function formatIntegerDigits(digits: string, thousandSeparator: string = "."): string {
  if (!digits) return ""
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator)
}

/**
 * Checks if a character is meaningful for cursor calculation.
 * Digits 0-9, minus sign, and decimal separator are meaningful.
 * Thousand separators are formatting artifacts and are not considered meaningful.
 */
export function isMeaningfulChar(char: string, options?: NumberFormatOptions): boolean {
  const opts = resolveOptions(options)
  if (char >= "0" && char <= "9") return true
  if (opts.allowNegative && char === "-") return true
  if (opts.allowDecimal && char === opts.decimalSeparator) return true
  return false
}

/**
 * Counts how many meaningful characters exist in the given string.
 */
export function countMeaningfulChars(str: string, options?: NumberFormatOptions): number {
  let count = 0
  for (let i = 0; i < str.length; i++) {
    if (isMeaningfulChar(str[i], options)) {
      count++
    }
  }
  return count
}

/**
 * Calculates the target cursor index in a formatted display string
 * based on the target count of meaningful characters.
 */
export function calculateCursorPosition(
  display: string,
  targetMeaningfulChars: number,
  options?: NumberFormatOptions
): number {
  if (targetMeaningfulChars <= 0) return 0
  let count = 0
  let pos = 0
  while (pos < display.length && count < targetMeaningfulChars) {
    if (isMeaningfulChar(display[pos], options)) {
      count++
    }
    pos++
  }
  return pos
}

/**
 * Formats a numeric value (number or raw numeric string) to display format.
 *
 * Example:
 * formatNumber(1000000) => "1.000.000"
 * formatNumber("1000.5", { allowDecimal: true }) => "1.000,5"
 * formatNumber("0.001", { allowDecimal: true }) => "0,001"
 */
export function formatNumber(
  value: number | string | null | undefined,
  options?: NumberFormatOptions
): string {
  if (value === null || value === undefined || value === "") {
    return ""
  }

  const opts = resolveOptions(options)
  let rawStr = String(value).trim()
  if (rawStr === "") {
    return ""
  }

  const isNegative = opts.allowNegative && rawStr.startsWith("-")
  if (isNegative) {
    rawStr = rawStr.slice(1)
  }

  // Detect decimal part
  let integerPart = ""
  let decimalPart = ""
  let hasDecimal = false

  if (opts.allowDecimal) {
    // Check if there is a decimal separator.
    // Handles standard dot (e.g. from backend/JS number "1000.5") or localized comma.
    const lastComma = rawStr.lastIndexOf(",")
    const lastDot = rawStr.lastIndexOf(".")

    let decIdx = -1
    if (lastComma !== -1 && lastDot !== -1) {
      // Both exist: usually 1.000,50 (dot is thousand, comma is decimal)
      // or 1,000.50 (comma is thousand, dot is decimal)
      if (lastComma > lastDot) {
        decIdx = lastComma
      } else {
        decIdx = lastDot
      }
    } else if (lastComma !== -1) {
      decIdx = lastComma
    } else if (lastDot !== -1) {
      // Single dot in raw string: e.g. "1000.5" or "0.001"
      decIdx = lastDot
    }

    if (decIdx !== -1) {
      hasDecimal = true
      integerPart = rawStr.slice(0, decIdx).replace(/\D/g, "")
      decimalPart = rawStr.slice(decIdx + 1).replace(/\D/g, "").slice(0, opts.maxDecimals)
    } else {
      integerPart = rawStr.replace(/\D/g, "")
    }
  } else {
    // No decimals allowed, extract all integer digits
    integerPart = rawStr.replace(/\D/g, "")
  }

  // Normalize integer part: strip leading zeros unless it's just "0"
  if (integerPart.length > 1 && integerPart.startsWith("0")) {
    integerPart = integerPart.replace(/^0+/, "") || "0"
  }
  if (!integerPart && (hasDecimal || value === 0 || value === "0")) {
    integerPart = "0"
  }
  if (!integerPart && !hasDecimal) {
    return ""
  }

  const formattedInteger = formatIntegerDigits(integerPart, opts.thousandSeparator)
  let result = (isNegative ? "-" : "") + formattedInteger

  if (hasDecimal && (decimalPart.length > 0 || rawStr.endsWith(",") || rawStr.endsWith("."))) {
    result += opts.decimalSeparator + decimalPart
  }

  return result
}

export interface ParsedNumberResult {
  rawString: string
  numberValue: number
  isValid: boolean
}

/**
 * Parses a formatted display string into a raw numeric string and number.
 *
 * Example:
 * parseNumber("1.000.000") => { rawString: "1000000", numberValue: 1000000, isValid: true }
 * parseNumber("1.000,5", { allowDecimal: true }) => { rawString: "1000.5", numberValue: 1000.5, isValid: true }
 */
export function parseNumber(
  displayValue: string,
  options?: NumberFormatOptions
): ParsedNumberResult {
  if (!displayValue || typeof displayValue !== "string") {
    return { rawString: "", numberValue: 0, isValid: false }
  }

  const opts = resolveOptions(options)
  const trimmed = displayValue.trim()
  if (!trimmed) {
    return { rawString: "", numberValue: 0, isValid: false }
  }

  const isNegative = opts.allowNegative && trimmed.startsWith("-")
  const unsigned = isNegative ? trimmed.slice(1) : trimmed

  let integerDigits = ""
  let decimalDigits = ""
  let hasDecimal = false

  if (opts.allowDecimal) {
    const decIdx = unsigned.lastIndexOf(opts.decimalSeparator)
    if (decIdx !== -1) {
      hasDecimal = true
      integerDigits = unsigned.slice(0, decIdx).replace(/\D/g, "")
      decimalDigits = unsigned.slice(decIdx + 1).replace(/\D/g, "").slice(0, opts.maxDecimals)
    } else {
      integerDigits = unsigned.replace(/\D/g, "")
    }
  } else {
    integerDigits = unsigned.replace(/\D/g, "")
  }

  if (integerDigits.length > 1 && integerDigits.startsWith("0")) {
    integerDigits = integerDigits.replace(/^0+/, "") || "0"
  }
  if (!integerDigits && hasDecimal) {
    integerDigits = "0"
  }

  if (!integerDigits && !decimalDigits) {
    return { rawString: "", numberValue: 0, isValid: false }
  }

  let rawString = (isNegative ? "-" : "") + (integerDigits || "0")
  if (hasDecimal) {
    rawString += "." + decimalDigits
  }

  const numberValue = Number(rawString)
  return {
    rawString,
    numberValue: isNaN(numberValue) ? 0 : numberValue,
    isValid: !isNaN(numberValue),
  }
}

export interface AsYouTypeResult {
  display: string
  rawString: string
  numericValue: number
  hasDecimalSeparator: boolean
}

/**
 * Handles real-time typing input, formatting the display while maintaining intermediate states
 * like trailing decimal separators (e.g. "1.000,").
 */
export function formatAsYouType(
  input: string,
  options?: NumberFormatOptions
): AsYouTypeResult {
  if (input === null || input === undefined || typeof input !== "string" || !input.trim()) {
    return { display: "", rawString: "", numericValue: 0, hasDecimalSeparator: false }
  }

  const opts = resolveOptions(options)
  let s = input.trim()
  if (s === "") {
    return { display: "", rawString: "", numericValue: 0, hasDecimalSeparator: false }
  }

  const isNegative = opts.allowNegative && s.startsWith("-")
  if (isNegative) {
    s = s.slice(1)
  }

  let hasDecimal = false
  let intPart = ""
  let decPart = ""

  if (opts.allowDecimal) {
    // Check if the input contains the decimal separator (or dot if user pasted/typed)
    const commaIdx = s.lastIndexOf(opts.decimalSeparator)
    // If decimal separator is comma, also check if user typed or pasted dot without any comma
    let decIdx = -1
    if (commaIdx !== -1) {
      decIdx = commaIdx
    } else if (opts.decimalSeparator === "," && s.includes(".")) {
      // If dot exists and there are no other dots or it's at the end
      const dots = (s.match(/\./g) || []).length
      // If there is only 1 dot and no commas, user might have pressed dot as decimal
      if (dots === 1 && !s.includes(",")) {
        decIdx = s.lastIndexOf(".")
      }
    }

    if (decIdx !== -1) {
      hasDecimal = true
      intPart = s.slice(0, decIdx).replace(/\D/g, "")
      decPart = s.slice(decIdx + 1).replace(/\D/g, "").slice(0, opts.maxDecimals)
    } else {
      intPart = s.replace(/\D/g, "")
    }
  } else {
    intPart = s.replace(/\D/g, "")
  }

  // Strip leading zeroes unless single 0
  if (intPart.length > 1 && intPart.startsWith("0")) {
    intPart = intPart.replace(/^0+/, "") || "0"
  }
  if (!intPart && hasDecimal) {
    intPart = "0"
  }

  if (!intPart && !hasDecimal && !isNegative) {
    return { display: "", rawString: "", numericValue: 0, hasDecimalSeparator: false }
  }

  const formattedInt = formatIntegerDigits(intPart, opts.thousandSeparator)
  let display = (isNegative ? "-" : "") + formattedInt
  if (hasDecimal) {
    display += opts.decimalSeparator + decPart
  }

  let rawString = (isNegative ? "-" : "") + (intPart || "0")
  if (hasDecimal) {
    rawString += "." + decPart
  }

  const parsedNum = Number(rawString)
  const numericValue = isNaN(parsedNum) ? 0 : parsedNum

  return {
    display,
    rawString: intPart || decPart ? rawString : "",
    numericValue,
    hasDecimalSeparator: hasDecimal,
  }
}
