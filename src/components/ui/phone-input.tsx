import * as React from "react"

import { Input } from "@/components/ui/input"
import {
  formatInternationalPhone,
  normalizeOperationalPhoneInput,
} from "@/features/auth/lib/phone"
import { cn } from "@/lib/utils"

interface PhoneInputProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> {
  /** Full international value, e.g. "+62812...". */
  value: string
  onValueChange: (value: string) => void
}

/** Phone field with a visible "+62" prefix; the value is always emitted as "+62...". */
function PhoneInput({ value, onValueChange, className, ...props }: PhoneInputProps) {
  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground"
      >
        +62
      </span>
      <Input
        {...props}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        value={normalizeOperationalPhoneInput(value)}
        onChange={(e) => onValueChange(formatInternationalPhone(e.target.value))}
        className={cn("pl-11", className)}
      />
    </div>
  )
}

export { PhoneInput }
