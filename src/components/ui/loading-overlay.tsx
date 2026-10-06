import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingOverlayProps {
  visible: boolean
  /** Delay (ms) before showing, to avoid flicker on fast requests */
  delay?: number
  className?: string
}

/**
 * Translucent overlay (z-index) placed over the content area.
 * Parent must be `relative`. Content underneath stays rendered.
 */
export function LoadingOverlay({ visible, delay = 200, className }: LoadingOverlayProps) {
  const [show, setShow] = React.useState(false)

  React.useEffect(() => {
    if (!visible) {
      const t = setTimeout(() => setShow(false), 0)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setShow(true), delay)
    return () => clearTimeout(t)
  }, [visible, delay])

  if (!show) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "absolute inset-0 z-40 flex items-center justify-center bg-background/60 backdrop-blur-[1px]",
        className
      )}
    >
      <div className="flex items-center gap-2.5 rounded-full border bg-card px-4 py-2 shadow-md">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm font-medium text-muted-foreground">Memuat...</span>
      </div>
    </div>
  )
}
