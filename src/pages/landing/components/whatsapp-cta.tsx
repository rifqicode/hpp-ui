import { useEffect, useState } from "react"

export interface WhatsAppCTAConfig {
  label: string
  url: string
}

export function WhatsAppCTA({ config }: { config: WhatsAppCTAConfig | null }) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [typedCount, setTypedCount] = useState(0)
  const active = hovered || focused
  const characters = Array.from(config?.label ?? "")
  const characterCount = characters.length

  useEffect(() => {
    if (!active || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let count = 0
    let timer: number | undefined
    const start = window.setTimeout(() => {
      timer = window.setInterval(() => {
        count += 1
        setTypedCount(count)
        if (count >= characterCount) window.clearInterval(timer)
      }, 55)
    }, 180)
    return () => {
      window.clearTimeout(start)
      window.clearInterval(timer)
    }
  }, [active, characterCount, config?.label])

  if (!config) return null

  return (
    <a
      href={config.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={config.label}
      onMouseEnter={() => {
        if (!active) setTypedCount(0)
        setHovered(true)
      }}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => {
        if (!active) setTypedCount(0)
        setFocused(true)
      }}
      onBlur={() => setFocused(false)}
      className="group fixed right-3.5 sm:right-[18px] bottom-[max(14px,env(safe-area-inset-bottom))] sm:bottom-[max(18px,env(safe-area-inset-bottom))] z-40 flex h-11 min-w-11 sm:h-14 sm:min-w-14 max-w-[calc(100vw-28px)] sm:max-w-[calc(100vw-36px)] items-center justify-center rounded-full border-2 sm:border-4 border-white bg-[#25D366] text-white shadow-[0_2px_8px_rgba(0,0,0,0.16)] ring-1 ring-black/5 transition-colors hover:bg-[#20bd5a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
    >
      <span className="grid min-w-0 grid-cols-[0fr] transition-[grid-template-columns] duration-300 ease-out group-hover:grid-cols-[1fr] group-focus:grid-cols-[1fr] motion-reduce:transition-none" aria-hidden="true">
        <span className="min-w-0 overflow-hidden">
          <span className="relative ml-3 mr-2 sm:ml-4 sm:mr-3 block whitespace-nowrap text-xs sm:text-sm font-medium">
            <span className="invisible motion-reduce:visible">{config.label}</span>
            <span className="absolute inset-0 truncate motion-reduce:hidden">
              {characters.slice(0, typedCount).join("")}
              {active && typedCount < characterCount && (
                <span className="ml-0.5 inline-block h-3.5 w-px animate-pulse bg-current align-middle" />
              )}
            </span>
          </span>
        </span>
      </span>
      <span className="flex size-9 sm:size-12 shrink-0 items-center justify-center">
        <svg viewBox="0 0 24 24" className="size-5 sm:size-8" fill="currentColor" aria-hidden="true">
          <path d="M20.52 3.48A11.86 11.86 0 0 0 12.05 0C5.48 0 .13 5.35.13 11.92c0 2.1.55 4.15 1.59 5.96L.03 24l6.26-1.64a11.9 11.9 0 0 0 5.76 1.47h.01c6.56 0 11.91-5.35 11.92-11.92a11.84 11.84 0 0 0-3.48-8.43ZM12.06 21.82a9.88 9.88 0 0 1-5.04-1.38l-.36-.21-3.72.98.99-3.63-.24-.37a9.85 9.85 0 0 1-1.51-5.29c0-5.46 4.44-9.9 9.9-9.9a9.83 9.83 0 0 1 7 2.9 9.83 9.83 0 0 1 2.9 7c0 5.46-4.44 9.9-9.92 9.9Zm5.43-7.41c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.48-1.77-1.65-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.91-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.21 3.07c.15.2 2.1 3.2 5.09 4.49.71.31 1.27.49 1.7.63.71.22 1.36.19 1.88.11.57-.08 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z" />
        </svg>
      </span>
    </a>
  )
}
