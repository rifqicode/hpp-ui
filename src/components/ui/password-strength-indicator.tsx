/* eslint-disable react-refresh/only-export-components */
import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export function calculatePasswordStrength(password: string): number {
  if (!password) return 0
  let score = 0
  if (password.length >= 6) score += 1
  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1
  if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1
  return score
}

export function validatePassword(password: string): string | null {
  if (!password || password.length < 8) {
    return "Kata sandi minimal 8 karakter."
  }
  if (!(/[A-Za-z]/.test(password) && /[0-9]/.test(password))) {
    return "Kata sandi harus mengandung kombinasi huruf dan angka."
  }
  if (calculatePasswordStrength(password) < 2) {
    return "Kekuatan kata sandi masih lemah. Gunakan kombinasi huruf dan angka yang lebih kuat."
  }
  return null
}

interface PasswordStrengthIndicatorProps {
  password: string
  className?: string
}

export function PasswordStrengthIndicator({
  password,
  className,
}: PasswordStrengthIndicatorProps) {
  const strength = React.useMemo(() => calculatePasswordStrength(password), [password])

  if (!password || password.length === 0) {
    return null
  }

  const hasMinLength = password.length >= 8
  const hasLetterAndNumber = /[A-Za-z]/.test(password) && /[0-9]/.test(password)
  const hasMixedOrSymbol =
    (/[A-Z]/.test(password) && /[a-z]/.test(password)) || /[^A-Za-z0-9]/.test(password)

  return (
    <div className={cn("pt-1.5 space-y-1.5", className)}>
      {/* 4-Segment Progress Bar */}
      <div className="grid grid-cols-4 gap-1.5">
        <div
          className={cn(
            "h-1 rounded-full transition-all",
            strength >= 1
              ? strength === 1
                ? "bg-rose-500"
                : strength === 2
                ? "bg-amber-500"
                : "bg-emerald-500"
              : "bg-slate-200"
          )}
        />
        <div
          className={cn(
            "h-1 rounded-full transition-all",
            strength >= 2
              ? strength === 2
                ? "bg-amber-500"
                : "bg-emerald-500"
              : "bg-slate-200"
          )}
        />
        <div
          className={cn(
            "h-1 rounded-full transition-all",
            strength >= 3 ? "bg-emerald-500" : "bg-slate-200"
          )}
        />
        <div
          className={cn(
            "h-1 rounded-full transition-all",
            strength >= 4 ? "bg-emerald-500" : "bg-slate-200"
          )}
        />
      </div>

      {/* Strength Status Text */}
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span>Kekuatan kata sandi:</span>
        <span
          className={cn(
            "font-bold",
            strength <= 1
              ? "text-rose-600"
              : strength === 2
              ? "text-amber-600"
              : "text-emerald-600"
          )}
        >
          {strength <= 1 && "Lemah"}
          {strength === 2 && "Sedang"}
          {strength >= 3 && "Kuat & Aman"}
        </span>
      </div>

      {/* Criteria Checklist */}
      <div className="pt-0.5 space-y-1">
        <div
          className={cn(
            "flex items-center gap-1.5 text-[11px] transition-colors",
            hasMinLength ? "text-emerald-600 font-medium" : "text-slate-400"
          )}
        >
          <Check
            className={cn(
              "size-3.5 shrink-0",
              hasMinLength ? "text-emerald-600" : "text-slate-400"
            )}
          />
          <span>Minimal 8 karakter</span>
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 text-[11px] transition-colors",
            hasLetterAndNumber ? "text-emerald-600 font-medium" : "text-slate-400"
          )}
        >
          <Check
            className={cn(
              "size-3.5 shrink-0",
              hasLetterAndNumber ? "text-emerald-600" : "text-slate-400"
            )}
          />
          <span>Mengandung huruf dan angka</span>
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 text-[11px] transition-colors",
            hasMixedOrSymbol ? "text-emerald-600 font-medium" : "text-slate-400"
          )}
        >
          <Check
            className={cn(
              "size-3.5 shrink-0",
              hasMixedOrSymbol ? "text-emerald-600" : "text-slate-400"
            )}
          />
          <span>Kombinasi huruf besar & kecil atau simbol</span>
        </div>
      </div>
    </div>
  )
}
