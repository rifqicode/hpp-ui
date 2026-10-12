import * as React from "react"
import { cn } from "@/lib/utils"
import {
  formatNumber,
  formatAsYouType,
  countMeaningfulChars,
  calculateCursorPosition,
  type NumberFormatOptions,
} from "@/lib/number-format"

export interface FormattedNumberInputProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "defaultValue" | "prefix"> {
  value?: number | string
  defaultValue?: number | string
  onChange?: (value: any, rawEvent?: React.ChangeEvent<HTMLInputElement>) => void
  onValueChange?: (values: {
    floatValue: number | undefined
    formattedValue: string
    rawString: string
  }) => void
  allowDecimal?: boolean
  maxDecimals?: number
  thousandSeparator?: string
  decimalSeparator?: string
  allowNegative?: boolean
  valueType?: "number" | "string"
  emptyValue?: "" | 0 | null
  selectOnFocus?: boolean
  prefix?: React.ReactNode
  suffix?: React.ReactNode
}

export const FormattedNumberInput = React.forwardRef<HTMLInputElement, FormattedNumberInputProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      onValueChange,
      allowDecimal = false,
      maxDecimals = 4,
      thousandSeparator = ".",
      decimalSeparator = ",",
      allowNegative = false,
      valueType,
      emptyValue = "",
      selectOnFocus = true,
      prefix,
      suffix,
      className,
      disabled,
      readOnly,
      onKeyDown,
      onFocus,
      onBlur,
      ...props
    },
    forwardedRef
  ) => {
    const internalInputRef = React.useRef<HTMLInputElement | null>(null)
    const setRefs = React.useCallback(
      (node: HTMLInputElement | null) => {
        internalInputRef.current = node
        if (typeof forwardedRef === "function") {
          forwardedRef(node)
        } else if (forwardedRef) {
          forwardedRef.current = node
        }
      },
      [forwardedRef]
    )

    const formatOpts: NumberFormatOptions = React.useMemo(
      () => ({
        allowDecimal,
        maxDecimals,
        thousandSeparator,
        decimalSeparator,
        allowNegative,
      }),
      [allowDecimal, maxDecimals, thousandSeparator, decimalSeparator, allowNegative]
    )

    // Store the last emitted value so we don't reformat local in-progress edits
    const lastEmittedValueRef = React.useRef<any>(null)
    const isInternalUpdateRef = React.useRef<boolean>(false)

    // Local display string state
    const [displayValue, setDisplayValue] = React.useState<string>(() => {
      const initial = value !== undefined ? value : defaultValue
      return formatNumber(initial, formatOpts)
    })

    // Synchronize displayValue when external `value` prop changes
    React.useEffect(() => {
      if (value === undefined) {
        if (defaultValue !== undefined && !isInternalUpdateRef.current) {
          setDisplayValue(formatNumber(defaultValue, formatOpts))
        }
        return
      }

      // Check if this change came from our own onChange emission
      const lastEmitted = lastEmittedValueRef.current
      if (lastEmitted !== null && lastEmitted !== undefined) {
        // If external prop value matches last emitted value, keep local display string as is
        if (value === lastEmitted || String(value) === String(lastEmitted)) {
          return
        }
        // Also handle numeric 0 vs "" matching
        if ((value === 0 || value === "") && (lastEmitted === 0 || lastEmitted === "")) {
          return
        }
      }

      // If local displayValue is currently empty (""), and the incoming prop value is 0 or "",
      // DO NOT force reformat displayValue to "0". Keep it empty ("") so placeholder stays visible.
      if (displayValue === "" && (value === 0 || value === "" || value === "0")) {
        return
      }

      // External update (e.g. form reset, preset button, loaded from API)
      const nextDisplay = formatNumber(value, formatOpts)
      setDisplayValue(nextDisplay)
      lastEmittedValueRef.current = null
    }, [value, defaultValue, formatOpts, displayValue])

    // Determine whether to emit raw number, raw string, or emptyValue
    const resolveValueToEmit = React.useCallback(
      (rawString: string, numericValue: number) => {
        if (rawString === "") {
          return emptyValue
        }
        const targetType = valueType ?? (typeof value === "string" ? "string" : "number")
        if (targetType === "string") {
          return rawString
        }
        return numericValue
      },
      [valueType, value, emptyValue]
    )

    // Apply formatted input value and preserve cursor position
    const applyFormattedChange = React.useCallback(
      (
        newRawInput: string,
        targetMeaningfulChars: number,
        event?: React.ChangeEvent<HTMLInputElement>
      ) => {
        const { display, rawString, numericValue } = formatAsYouType(newRawInput, formatOpts)
        const targetCursor = calculateCursorPosition(display, targetMeaningfulChars, formatOpts)

        isInternalUpdateRef.current = true
        setDisplayValue(display)

        // Queue cursor restoration
        requestAnimationFrame(() => {
          if (internalInputRef.current) {
            internalInputRef.current.setSelectionRange(targetCursor, targetCursor)
          }
          isInternalUpdateRef.current = false
        })

        const emitted = resolveValueToEmit(rawString, numericValue)
        lastEmittedValueRef.current = emitted

        onChange?.(emitted, event)
        onValueChange?.({
          floatValue: rawString === "" ? undefined : numericValue,
          formattedValue: display,
          rawString,
        })
      },
      [formatOpts, onChange, onValueChange, resolveValueToEmit]
    )

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target
      const currentCursor = input.selectionStart ?? input.value.length
      const meaningfulCount = countMeaningfulChars(input.value.slice(0, currentCursor), formatOpts)

      applyFormattedChange(input.value, meaningfulCount, e)
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      const isZero = displayValue === "0" || value === 0 || value === "0"
      if (selectOnFocus === true || (selectOnFocus !== false && isZero)) {
        if (displayValue === "0" || selectOnFocus === true) {
          e.currentTarget.select()
          requestAnimationFrame(() => {
            internalInputRef.current?.select()
          })
        }
      }
      onFocus?.(e)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const input = e.currentTarget
      const { selectionStart, selectionEnd } = input

      // If display value is currently "0" and user types a digit 1-9 (without text selection),
      // directly replace the "0" with that digit.
      if (
        /^[1-9]$/.test(e.key) &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        (input.value === "0" || displayValue === "0") &&
        selectionStart === selectionEnd
      ) {
        e.preventDefault()
        applyFormattedChange(e.key, 1)
        return
      }

      // If display value is currently "0" and user types "0" (without selection), prevent "00"
      if (
        e.key === "0" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        (input.value === "0" || displayValue === "0") &&
        selectionStart === selectionEnd
      ) {
        e.preventDefault()
        return
      }

      // If display value is currently "0" and user presses Backspace or Delete, clear to empty
      if (
        (e.key === "Backspace" || e.key === "Delete") &&
        (input.value === "0" || displayValue === "0")
      ) {
        e.preventDefault()
        applyFormattedChange("", 0)
        return
      }

      // Handle Backspace directly behind a thousand separator
      if (e.key === "Backspace" && selectionStart !== null && selectionStart === selectionEnd && selectionStart > 0) {
        const charBefore = input.value[selectionStart - 1]
        if (charBefore === thousandSeparator) {
          e.preventDefault()
          // Delete the digit before the thousand separator
          const val = input.value
          const newVal = val.slice(0, selectionStart - 2) + val.slice(selectionStart)
          const meaningfulCount = countMeaningfulChars(val.slice(0, selectionStart - 2), formatOpts)
          applyFormattedChange(newVal, meaningfulCount)
          return
        }
      }

      // Handle Delete directly before a thousand separator
      if (e.key === "Delete" && selectionStart !== null && selectionStart === selectionEnd && selectionStart < input.value.length) {
        const charAfter = input.value[selectionStart]
        if (charAfter === thousandSeparator) {
          e.preventDefault()
          // Delete the digit after the thousand separator
          const val = input.value
          const newVal = val.slice(0, selectionStart) + val.slice(selectionStart + 2)
          const meaningfulCount = countMeaningfulChars(val.slice(0, selectionStart), formatOpts)
          applyFormattedChange(newVal, meaningfulCount)
          return
        }
      }

      // Handle decimal keys: block if not allowed, or map '.' to decimalSeparator
      if (e.key === "." || e.key === ",") {
        if (!allowDecimal) {
          e.preventDefault()
          return
        }

        // If decimal separator is already in the value, prevent adding another
        if (input.value.includes(decimalSeparator)) {
          e.preventDefault()
          return
        }

        // If user typed dot and decimal separator is comma, prevent default and insert comma
        if (e.key === "." && decimalSeparator === ",") {
          e.preventDefault()
          const start = selectionStart ?? input.value.length
          const end = selectionEnd ?? input.value.length
          const newVal = input.value.slice(0, start) + decimalSeparator + input.value.slice(end)
          const meaningfulCount = countMeaningfulChars(input.value.slice(0, start), formatOpts) + 1
          applyFormattedChange(newVal, meaningfulCount)
          return
        }
      }

      onKeyDown?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Re-format on blur to clean up any trailing decimal separators like "1.000,"
      if (displayValue.endsWith(decimalSeparator)) {
        const cleaned = displayValue.slice(0, -1)
        setDisplayValue(cleaned)
      }
      onBlur?.(e)
    }

    const inputClasses = cn(
      "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
      prefix && "pl-8",
      suffix && "pr-8",
      className
    )

    const inputElement = (
      <input
        ref={setRefs}
        type="text"
        inputMode={allowDecimal ? "decimal" : "numeric"}
        data-slot="input"
        className={inputClasses}
        value={displayValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        readOnly={readOnly}
        {...props}
      />
    )

    if (prefix || suffix) {
      return (
        <div className="relative flex items-center w-full">
          {prefix && (
            <span className="absolute left-2.5 flex items-center text-muted-foreground pointer-events-none text-xs select-none">
              {prefix}
            </span>
          )}
          {inputElement}
          {suffix && (
            <span className="absolute right-2.5 flex items-center text-muted-foreground pointer-events-none text-xs select-none">
              {suffix}
            </span>
          )}
        </div>
      )
    }

    return inputElement
  }
)

FormattedNumberInput.displayName = "FormattedNumberInput"
export { FormattedNumberInput as default }
