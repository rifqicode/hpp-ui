import * as React from "react"
import { NumericFormat, type NumberFormatValues, type SourceInfo } from "react-number-format"
import { cn } from "@/lib/utils"

export interface FormattedNumberInputProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "defaultValue" | "prefix" | "type"> {
  type?: "text" | "tel" | "password"
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
      onFocus,
      type = "text",
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

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      if (selectOnFocus) {
        e.currentTarget.select()
      }
      onFocus?.(e)
    }

    const handleValueChange = (values: NumberFormatValues, sourceInfo: SourceInfo) => {
      let emitted: any
      if (values.value === "") {
        emitted = emptyValue
      } else {
        const targetType = valueType ?? (typeof value === "string" ? "string" : "number")
        emitted = targetType === "string" ? values.value : (values.floatValue ?? 0)
      }

      onChange?.(emitted, sourceInfo.event as React.ChangeEvent<HTMLInputElement>)
      onValueChange?.({
        floatValue: values.floatValue,
        formattedValue: values.formattedValue,
        rawString: values.value,
      })
    }

    const inputClasses = cn(
      "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
      prefix && "pl-8",
      suffix && "pr-8",
      className
    )

    const inputElement = (
      <NumericFormat
        getInputRef={setRefs}
        type={type}
        value={value}
        defaultValue={defaultValue}
        thousandSeparator={thousandSeparator}
        decimalSeparator={decimalSeparator}
        decimalScale={allowDecimal ? maxDecimals : 0}
        allowNegative={allowNegative}
        inputMode={allowDecimal ? "decimal" : "numeric"}
        data-slot="input"
        className={inputClasses}
        disabled={disabled}
        readOnly={readOnly}
        onFocus={handleFocus}
        onValueChange={handleValueChange}
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
