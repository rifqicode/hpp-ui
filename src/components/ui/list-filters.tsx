import type { ReactNode } from 'react'
import { Loader2, Search, X } from 'lucide-react'
import { Input } from './input'
import { cn } from '@/lib/utils'

export interface ListFilterSelect {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly { value: string; label: string }[]
}

export interface ListFiltersProps {
  label: string
  search: {
    label: string
    placeholder: string
    value: string
    onChange: (value: string) => void
  }
  filters?: readonly ListFilterSelect[]
  summary?: ReactNode
  hasFilters: boolean
  onReset: () => void
  isFetching?: boolean
  fetchingLabel?: string
  actions?: ReactNode
  trailingActions?: ReactNode
  children?: ReactNode
}

// The page owns filter values and data fetching; this component owns their layout.
export function ListFilters({
  label,
  search,
  filters = [],
  summary,
  hasFilters,
  onReset,
  isFetching = false,
  fetchingLabel = 'Memperbarui data',
  actions,
  trailingActions,
  children,
}: ListFiltersProps) {
  return <section aria-label={label} className="space-y-2.5 rounded-xl border bg-card p-3">
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
      <div className="relative min-w-0 flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          aria-label={search.label}
          placeholder={search.placeholder}
          value={search.value}
          onChange={(event) => search.onChange(event.target.value)}
          className="h-10 pl-9 pr-9 text-sm"
        />
        {search.value && <button
          type="button"
          aria-label="Hapus pencarian"
          onClick={() => search.onChange('')}
          className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded hover:bg-muted"
        ><X className="h-3.5 w-3.5" /></button>}
      </div>

      {filters.length > 0 && <div className={cn('grid min-w-0 gap-2',
        filters.length === 1 ? 'grid-cols-1 lg:w-[185px]'
          : filters.length === 2 ? 'grid-cols-2 lg:w-[370px]'
            : 'grid-cols-2 sm:grid-cols-3 lg:w-[555px]')}>
        {filters.map((filter) => <select
          key={filter.id}
          aria-label={filter.label}
          value={filter.value}
          onChange={(event) => filter.onChange(event.target.value)}
          className="h-10 min-w-0 rounded-md border bg-background px-2 text-xs"
        >
          {filter.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>)}
      </div>}

      {trailingActions && (
        <div className="flex items-center gap-2 shrink-0">
          {trailingActions}
        </div>
      )}
    </div>

    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
        <span>{summary}</span>
        {hasFilters && <button type="button" onClick={onReset} className="rounded px-1 py-1 font-medium text-primary hover:underline">Reset filter</button>}
        {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-label={fetchingLabel} />}
      </div>
      {actions}
    </div>
    {children}
  </section>
}
