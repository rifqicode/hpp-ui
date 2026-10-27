import * as React from "react"
import { cn } from "@/lib/utils"
import { CURO_DIRECTION_04, CURO_COLORS } from "./curo-paths"

export type CuroLogoVariant = "badge" | "arc-dot" | "dual-arc" | "single-stroke"

export interface CuroLogoProps extends React.SVGProps<SVGSVGElement> {
  variant?: CuroLogoVariant
  className?: string
  gradient?: boolean
  darkMode?: boolean
}

/**
 * CuroLogo renders the official Curo brand mark.
 * Direction 04 ("badge") is the default official identity:
 * an arched shield / badge monogram forming a fluid 'C' with an inner layered fold
 * and an aperture precision core node.
 */
export function CuroLogo({
  variant = "badge",
  className,
  gradient = true,
  darkMode = false,
  ...props
}: CuroLogoProps) {
  const gradientId = React.useId()
  const hoodGradId = `curo-hood-${gradientId}`
  const baseGradId = `curo-base-${gradientId}`
  const nodeGradId = `curo-node-${gradientId}`
  const foldGradId = `curo-fold-${gradientId}`

  if (variant === "badge") {
    return (
      <svg
        viewBox={CURO_DIRECTION_04.viewBox}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("shrink-0 select-none", className)}
        aria-hidden="true"
        {...props}
      >
        <defs>
          {darkMode ? (
            <>
              {/* Dark mode palette: White/Ice hood, soft periwinkle base, cornflower node */}
              <linearGradient id={hoodGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor={CURO_COLORS.iceTint} />
              </linearGradient>
              <linearGradient id={baseGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={CURO_COLORS.periwinkle} />
                <stop offset="100%" stopColor={CURO_COLORS.cornflowerViolet} />
              </linearGradient>
              <radialGradient id={nodeGradId} cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor={CURO_COLORS.cornflowerViolet} />
                <stop offset="100%" stopColor="#6366F1" />
              </radialGradient>
            </>
          ) : (
            <>
              {/* Light mode palette: Deep violet hood, cornflower violet base, lavender node */}
              <linearGradient id={hoodGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={CURO_COLORS.deepViolet} />
                <stop offset="100%" stopColor="#4C1D95" />
              </linearGradient>
              <linearGradient id={baseGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={CURO_COLORS.cornflowerViolet} />
                <stop offset="100%" stopColor="#A5B4FC" />
              </linearGradient>
              <radialGradient id={nodeGradId} cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor={CURO_COLORS.periwinkle} />
                <stop offset="100%" stopColor="#A78BFA" />
              </radialGradient>
              <linearGradient id={foldGradId} x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
                <stop offset="100%" stopColor={CURO_COLORS.softBlush} stopOpacity="0.1" />
              </linearGradient>
            </>
          )}
        </defs>

        {/* 1. Fluid Base Contour ('C' body) */}
        <path
          d={CURO_DIRECTION_04.basePath}
          fill={gradient ? `url(#${baseGradId})` : "currentColor"}
          opacity={gradient ? 1 : 0.65}
        />

        {/* 2. Arched Badge Hood (Monogram Upper Arc) */}
        <path
          d={CURO_DIRECTION_04.hoodPath}
          fill={gradient ? `url(#${hoodGradId})` : "currentColor"}
        />

        {/* 3. Subtle Inner Luminous Fold Accent */}
        {gradient && !darkMode && (
          <path
            d={CURO_DIRECTION_04.hoodPath}
            fill={`url(#${foldGradId})`}
            opacity="0.25"
          />
        )}

        {/* 4. Aperture Precision Core Node */}
        <circle
          cx={CURO_DIRECTION_04.node.cx}
          cy={CURO_DIRECTION_04.node.cy}
          r={CURO_DIRECTION_04.node.r}
          fill={gradient ? `url(#${nodeGradId})` : "currentColor"}
        />
      </svg>
    )
  }

  // Backward compatibility for explorations
  const strokeColor = gradient ? `url(#${gradientId})` : "currentColor"
  const fillColor = gradient ? `url(#${gradientId})` : "currentColor"

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
      {...props}
    >
      {gradient && (
        <defs>
          <linearGradient
            id={gradientId}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
        </defs>
      )}

      {variant === "arc-dot" && (
        <>
          <path
            d="M 23.5 22.5 A 10 10 0 1 1 19.4 6.6"
            stroke={strokeColor}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <circle cx="24" cy="10.5" r="2.25" fill={fillColor} />
        </>
      )}

      {variant === "dual-arc" && (
        <>
          <path
            d="M 23.5 9 A 11 11 0 0 0 11.5 24.5"
            stroke={strokeColor}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M 11.5 7.5 A 11 11 0 0 0 23.5 23"
            stroke={strokeColor}
            strokeWidth="3.5"
            strokeLinecap="round"
            className="opacity-75"
          />
        </>
      )}

      {variant === "single-stroke" && (
        <>
          <path
            d="M 23.5 10.5 L 19.5 6.5 L 12.5 6.5 L 6.5 12.5 L 6.5 19.5 L 12.5 25.5 L 19.5 25.5 L 23.5 21.5"
            stroke={strokeColor}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  )
}

export interface CuroWordmarkProps extends React.HTMLAttributes<HTMLSpanElement> {
  className?: string
  darkMode?: boolean
}

/**
 * CuroWordmark renders the friendly, geometric lowercase wordmark "curo".
 * Styled with exact weight and tight tracking as designed in the brand identity.
 */
export function CuroWordmark({
  className,
  darkMode = false,
  ...props
}: CuroWordmarkProps) {
  return (
    <span
      className={cn(
        "font-extrabold tracking-[-0.035em] lowercase font-sans leading-none select-none transition-colors",
        darkMode ? "text-white" : "text-[#2E1065]",
        className
      )}
      {...props}
    >
      curo
    </span>
  )
}

export interface CuroBrandProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CuroLogoVariant
  logoClassName?: string
  textClassName?: string
  layout?: "horizontal" | "stacked"
  darkMode?: boolean
}

/**
 * CuroBrand provides the unified brand lockup: Symbol + Wordmark.
 */
export function CuroBrand({
  variant = "badge",
  logoClassName = "size-7 sm:size-8",
  textClassName = "text-xl sm:text-2xl",
  layout = "horizontal",
  darkMode = false,
  className,
  ...props
}: CuroBrandProps) {
  return (
    <div
      className={cn(
        "flex items-center",
        layout === "stacked" ? "flex-col gap-2 text-center" : "flex-row gap-2.5",
        className
      )}
      {...props}
    >
      <CuroLogo
        variant={variant}
        darkMode={darkMode}
        className={cn("shrink-0", logoClassName)}
      />
      <CuroWordmark
        darkMode={darkMode}
        className={cn(textClassName)}
      />
    </div>
  )
}

export interface CuroAppIconProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  innerClassName?: string
}

/**
 * CuroAppIcon renders the squircle app icon badge as featured in Direction 04.
 */
export function CuroAppIcon({
  className,
  innerClassName,
  ...props
}: CuroAppIconProps) {
  return (
    <div
      className={cn(
        "relative rounded-[24%] bg-gradient-to-br from-[#3B0764] via-[#2E1065] to-[#1E1B4B] p-[16%] flex items-center justify-center shadow-2xl shadow-purple-950/30 ring-1 ring-white/10 select-none overflow-hidden",
        className
      )}
      {...props}
    >
      <CuroLogo
        variant="badge"
        darkMode
        className={cn("w-full h-full", innerClassName)}
      />
    </div>
  )
}

export { CURO_COLORS }
