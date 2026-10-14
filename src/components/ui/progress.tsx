import * as React from "react"
import { cn } from "@/lib/utils"

export interface ProgressProps extends React.ComponentProps<"div"> {
  value?: number
  indicatorClassName?: string
}

function Progress({
  className,
  value = 0,
  indicatorClassName,
  ...props
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, value))

  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percentage}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className={cn(
          "h-full w-full flex-1 bg-primary transition-all duration-300",
          indicatorClassName
        )}
        style={{ transform: `translateX(-${100 - percentage}%)` }}
      />
    </div>
  )
}

export { Progress }
