import { useState } from 'react';
import { ArrowUpDown, Check, LayoutGrid, List, Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  PROMO_SORTS,
  type PromotionSort,
  type PromotionStatusFilter,
  type PromotionTypeFilter,
} from '../lib/promotion-list';

interface PromotionListFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: PromotionStatusFilter;
  onStatusChange: (status: PromotionStatusFilter) => void;
  type: PromotionTypeFilter;
  onTypeChange: (type: PromotionTypeFilter) => void;
  sort: PromotionSort;
  onSortChange: (sort: PromotionSort) => void;
  view: 'table' | 'grid';
  onViewChange: (view: 'table' | 'grid') => void;
  filteredCount: number;
  totalCount: number;
  hasFilters: boolean;
  onResetFilters: () => void;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
}

export function PromotionListFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  type,
  onTypeChange,
  sort,
  onSortChange,
  view,
  onViewChange,
  filteredCount,
  totalCount,
  hasFilters,
  onResetFilters,
  isLoading,
  isFetching,
  isError,
}: PromotionListFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <section aria-label="Filter promosi" className="space-y-3">
      <div className="grid grid-cols-2 items-center gap-2 md:flex md:flex-wrap">
        <div className="relative col-span-2 w-full min-w-0 md:w-auto md:flex-1">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            aria-label="Cari promosi"
            placeholder="Cari nama, kode, atau deskripsi promosi..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 rounded-lg pl-9 pr-9"
          />
          {search && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Hapus pencarian"
              className="absolute right-0 top-0 size-9"
              onClick={() => onSearchChange('')}
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-lg w-full md:hidden"
          aria-expanded={showFilters}
          aria-controls="promotion-filter-options"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          Filter{hasFilters && ' aktif'}
        </Button>

        <div
          id="promotion-filter-options"
          className={cn(
            'order-last col-span-2 w-full grid-cols-2 gap-2 md:order-none md:grid md:w-auto md:max-w-md',
            showFilters ? 'grid' : 'hidden'
          )}
        >
          <select
            aria-label="Status promosi"
            className="h-9 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-card"
            value={status}
            onChange={(e) => onStatusChange(e.target.value as PromotionStatusFilter)}
          >
            <option value="all">Semua status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
            <option value="scheduled">Terjadwal</option>
            <option value="ended">Berakhir</option>
          </select>

          <select
            aria-label="Model promosi"
            className="h-9 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-card"
            value={type}
            onChange={(e) => onTypeChange(e.target.value as PromotionTypeFilter)}
          >
            <option value="all">Semua model</option>
            <option value="DIRECT_DISCOUNT">Potongan Harga (Diskon)</option>
            <option value="BUY_X_GET_Y">Beli X Gratis Y (Bonus)</option>
            <option value="BUNDLE">Paket Kombo Hemat</option>
            <option value="SPECIAL_PRICE">Tebus Murah</option>
          </select>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-lg w-full min-w-0 md:w-auto"
              aria-label={`Urutkan: ${PROMO_SORTS[sort]}`}
            >
              <ArrowUpDown className="size-4" aria-hidden="true" />
              <span className="truncate">{PROMO_SORTS[sort]}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {Object.entries(PROMO_SORTS).map(([value, label]) => (
              <DropdownMenuItem
                key={value}
                onClick={() => onSortChange(value as PromotionSort)}
              >
                {label}
                {sort === value && <Check className="ml-auto size-4" aria-hidden="true" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
          <span>
            {isLoading
              ? 'Memuat promosi...'
              : isError
              ? 'Data belum tersedia'
              : `${filteredCount} promosi${hasFilters ? ` dari ${totalCount}` : ''}`}
          </span>
          {hasFilters && (
            <Button
              type="button"
              variant="ghost"
              className="h-8 text-xs text-primary dark:text-indigo-300"
              onClick={onResetFilters}
            >
              Reset filter
            </Button>
          )}
          {isFetching && !isLoading && <span>Memperbarui promosi...</span>}
        </div>

        <div role="group" aria-label="Tampilan promosi" className="hidden items-center gap-1 md:flex">
          {[
            { value: 'table' as const, label: 'Tampilan tabel', icon: List },
            { value: 'grid' as const, label: 'Tampilan kartu', icon: LayoutGrid },
          ].map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              type="button"
              size="icon"
              variant={view === value ? 'secondary' : 'ghost'}
              className="size-9"
              aria-label={label}
              aria-pressed={view === value}
              onClick={() => onViewChange(value)}
            >
              <Icon className="size-4" />
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
