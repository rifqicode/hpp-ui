import { Calculator, Check, Package, PackageMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { useProductList } from '../hooks/use-product-list';
import type { ProductAttentionFilter } from '../lib/product-list';

const numberFormat = new Intl.NumberFormat('id-ID');

export function RecipeListStats({ list }: { list: ReturnType<typeof useProductList> }) {
  const ready = !list.isPending && !list.isError;
  const items = [
    {
      label: 'Total produk', value: list.stats.total, filter: 'all',
      description: 'Semua produk di katalog', icon: Package,
      iconClass: 'bg-accent text-accent-foreground',
    },
    {
      label: 'Stok menipis / habis', value: list.stats.lowStock, filter: 'low-stock',
      description: 'Periksa stok siap jual', icon: PackageMinus,
      iconClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    },
    {
      label: 'Periksa harga', value: list.stats.priceReview, filter: 'price-review',
      description: 'Biaya atau saran harga perlu ditinjau', icon: Calculator,
      iconClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    },
  ] satisfies { label: string; value: number; filter: ProductAttentionFilter; description: string; icon: typeof Package; iconClass: string }[];

  return (
    <section aria-label="Ringkasan produk" aria-busy={list.isPending} className="grid min-w-0 gap-3 min-[380px]:grid-cols-2 xl:grid-cols-4">
      {items.map(({ label, value, filter, description, icon: Icon, iconClass }) => {
        const selected = ready && (filter === 'all' ? !list.hasFilters : list.attention === filter);

        return (
          <Button
            key={filter}
            type="button"
            variant="outline"
            disabled={!ready}
            aria-pressed={selected}
            onClick={() => filter === 'all' ? list.resetFilters() : list.update({ attention: filter, q: undefined, category: undefined })}
            className={cn(
              'h-auto min-w-0 flex-col items-stretch justify-start gap-0 whitespace-normal rounded-xl border-0 bg-card px-3 py-4 text-left shadow-none ring-1 ring-foreground/10 transition-colors hover:bg-card hover:ring-primary disabled:opacity-100 sm:px-5',
              selected && 'ring-primary',
            )}
          >
            <span className="flex items-center justify-between gap-1.5">
              <span className="min-w-0 text-xs font-medium text-muted-foreground sm:text-sm">{label}</span>
              <span className={cn('flex shrink-0 items-center justify-center rounded-lg p-1.5 sm:p-2', iconClass)}>
                <Icon className="size-3.5 sm:size-4" aria-hidden="true" />
              </span>
            </span>
            <span className="mt-3 flex items-center justify-between gap-2">
              {list.isPending ? (
                <>
                  <span aria-hidden="true" className="h-7 w-14 animate-pulse rounded bg-muted motion-reduce:animate-none lg:h-8" />
                  <span className="sr-only">Memuat jumlah produk</span>
                </>
              ) : (
                <span className="min-w-0 text-xl font-bold tracking-tight tabular-nums text-foreground [overflow-wrap:anywhere] lg:text-2xl">
                  {ready ? numberFormat.format(value) : '-'}
                </span>
              )}
              {selected && <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />}
            </span>
            <span className="mt-2 text-xs font-normal leading-relaxed text-muted-foreground xl:min-h-[3.25em]">
              {list.isError ? 'Data belum bisa dimuat' : description}
            </span>
          </Button>
        );
      })}
    </section>
  );
}
