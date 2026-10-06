import { Button } from "@/components/ui/button"

export interface TablePaginationProps {
  total: number
  displayedCount: number
  page?: number
  totalPages?: number
  onPrev: () => void
  onNext: () => void
  disabled?: boolean
  label?: string
  prevLabel?: string
  nextLabel?: string
  className?: string
}

export function TablePagination({
  total,
  displayedCount,
  page,
  totalPages,
  onPrev,
  onNext,
  disabled = false,
  label = "data",
  prevLabel = "Prev",
  nextLabel = "Next",
  className = "",
}: TablePaginationProps) {
  if (total <= 0) return null

  const isPrevDisabled = disabled || (page !== undefined ? page <= 1 : false)
  const isNextDisabled =
    disabled || (totalPages !== undefined && page !== undefined ? page >= totalPages : false)

  return (
    <div
      className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="text-xs text-muted-foreground">
        Menampilkan {displayedCount} dari {total} {label}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={onPrev}
          disabled={isPrevDisabled}
        >
          {prevLabel}
        </Button>
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={onNext}
          disabled={isNextDisabled}
        >
          {nextLabel}
        </Button>
      </div>
    </div>
  )
}
