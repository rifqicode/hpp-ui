import * as React from "react"
import { APP_NAME, cn } from "@/lib/utils"
import { EKATRA_MARK } from "./ekatra-paths"

interface EkatraLogoProps extends React.SVGProps<SVGSVGElement> {
  gradient?: boolean
  darkMode?: boolean
}

export function EkatraLogo({ gradient = true, darkMode = false, className, ...props }: EkatraLogoProps) {
  const gradientId = React.useId()
  return (
    <svg viewBox={EKATRA_MARK.viewBox} fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("shrink-0 select-none", className)} aria-hidden="true" {...props}>
      {gradient && (
        <defs>
          <linearGradient id={gradientId} x1="78" y1="82" x2="144" y2="68" gradientUnits="userSpaceOnUse">
            <stop stopColor={darkMode ? "var(--brand-indigo-soft)" : "var(--brand-indigo)"} />
            <stop offset="1" stopColor="var(--brand-emerald)" />
          </linearGradient>
        </defs>
      )}
      <path d={EKATRA_MARK.tail} stroke={gradient ? `url(#${gradientId})` : "currentColor"} strokeWidth="14" />
      <g stroke={gradient ? (darkMode ? "var(--brand-indigo-soft)" : "var(--brand-indigo)") : "currentColor"} strokeWidth="14">
        <path d={EKATRA_MARK.loop} />
        <path d={EKATRA_MARK.arrow} />
      </g>
      <path d={EKATRA_MARK.arrowhead} fill={gradient ? (darkMode ? "var(--brand-indigo-soft)" : "var(--brand-indigo)") : "currentColor"} />
    </svg>
  )
}

interface EkatraWordmarkProps extends React.HTMLAttributes<HTMLSpanElement> {
  darkMode?: boolean
}

export function EkatraWordmark({ className, darkMode = false, ...props }: EkatraWordmarkProps) {
  return (
    <span className={cn("whitespace-nowrap font-extrabold tracking-[-0.035em] font-sans leading-none select-none transition-colors", darkMode ? "text-white" : "text-[var(--brand-ink)]", className)} {...props}>
      {APP_NAME.replace(/\s+POS$/i, "")}{" "}<span className={cn(darkMode ? "text-[var(--brand-emerald)]" : "text-[var(--brand-emerald-strong)]")}>POS</span>
    </span>
  )
}

interface EkatraBrandProps extends React.HTMLAttributes<HTMLDivElement> {
  darkMode?: boolean
  tagline?: boolean
  logoClassName?: string
}

export function EkatraBrand({ darkMode = false, tagline = false, logoClassName, className, ...props }: EkatraBrandProps) {
  return (
    <div className={cn("inline-flex min-w-0 items-center gap-2", className)} {...props}>
      <EkatraLogo darkMode={darkMode} className={cn("h-[1.5em] w-[2.15em]", logoClassName)} />
      <div className="min-w-0">
        <EkatraWordmark darkMode={darkMode} />
        {tagline && <p className={cn("mt-2 text-xs font-normal tracking-normal", darkMode ? "text-slate-300" : "text-slate-600")}>Satu Alur, Usaha Teratur.</p>}
      </div>
    </div>
  )
}
