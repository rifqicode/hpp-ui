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
  hasFilters,
  onResetFilters,
  isLoading,
  isFetching,
  isError,
}: PromotionListFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const selectClass =
    'h-11 w-full min-w-0 cursor-pointer rounded-lg border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:outline-ring xl:h-10 xl:text-sm';

  return (
    <section aria-label="Filter promosi" className="space-y-4">
      <div className="grid grid-cols-2 items-center gap-2 xl:flex xl:flex-wrap">
        <div className="relative col-span-2 min-w-0 xl:min-w-48 xl:flex-1">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label="Cari promosi"
            placeholder="Cari nama promo…"
            value={search}
            onChange={event => onSearchChange(event.target.value)}
            className="h-11 rounded-lg pl-9 pr-11 xl:h-10 [&::-webkit-search-cancel-button]:appearance-none"
          />
          {search && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Hapus pencarian"
              className="absolute right-0 top-0 size-11 xl:size-10"
              onClick={() => onSearchChange('')}
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-11 w-full xl:hidden"
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
            'order-last col-span-2 grid-cols-1 gap-2 min-[380px]:grid-cols-2 xl:order-none xl:grid xl:w-[23rem]',
            showFilters ? 'grid' : 'hidden',
          )}
        >
          <select
            aria-label="Status promosi"
            className={selectClass}
            value={status}
            onChange={event => onStatusChange(event.target.value as PromotionStatusFilter)}
          >
            <option value="all">Semua status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
            <option value="scheduled">Terjadwal</option>
            <option value="ended">Berakhir</option>
          </select>
          <select
            aria-label="Model promosi"
            className={selectClass}
            value={type}
            onChange={event => onTypeChange(event.target.value as PromotionTypeFilter)}
          >
            <option value="all">Semua jenis promo</option>
            <option value="DIRECT_DISCOUNT">Potongan harga</option>
            <option value="BUY_X_GET_Y">Beli X gratis Y</option>
            <option value="BUNDLE">Paket hemat</option>
            <option value="SPECIAL_PRICE">Tebus murah</option>
          </select>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full min-w-0 xl:h-10 xl:w-auto"
              aria-label={`Urutkan: ${PROMO_SORTS[sort]}`}
            >
              <ArrowUpDown className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{PROMO_SORTS[sort]}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {Object.entries(PROMO_SORTS).map(([value, label]) => (
              <DropdownMenuItem
                key={value}
                className="min-h-11"
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
        <div
          className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
          aria-live="polite"
        >
          <span>
            {isLoading
              ? 'Memuat promosi…'
              : isError
                ? 'Data belum tersedia'
                : `${filteredCount.toLocaleString('id-ID')} promosi${hasFilters ? ' ditemukan' : ''}`}
          </span>
          {hasFilters && (
            <Button
              type="button"
              variant="ghost"
              className="h-11 px-2 text-sm sm:h-10"
              onClick={onResetFilters}
            >
              Reset filter
            </Button>
          )}
          {isFetching && !isLoading && <span className="text-xs">Memperbarui…</span>}
        </div>
        <div
          role="group"
          aria-label="Tampilan promosi"
          className="hidden items-center gap-1 xl:flex"
        >
          {[
            { value: 'table' as const, label: 'Tampilan tabel', icon: List },
            { value: 'grid' as const, label: 'Tampilan kartu', icon: LayoutGrid },
          ].map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              type="button"
              size="icon"
              variant={view === value ? 'secondary' : 'ghost'}
              className="size-10"
              aria-label={label}
              aria-pressed={view === value}
              onClick={() => onViewChange(value)}
            >
              <Icon className="size-4" aria-hidden="true" />
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
