import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuotaBadge } from '@/features/subscription';
import { cn } from '@/lib/utils';
import type { useProductList } from '../hooks/use-product-list';

interface RecipeListHeaderProps {
  list: ReturnType<typeof useProductList>;
}

export function RecipeListHeader({ list }: RecipeListHeaderProps) {
  return (
    <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Produk</h1>
        <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
          Kelola harga, HPP, dan stok produk.
        </p>
        <QuotaBadge resource="products" label="Kuota produk" onUpgradeClick={list.requestUpgrade} />
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-11"
          onClick={() => void list.refetch()}
          disabled={list.isFetching}
          aria-label="Refresh produk"
        >
          <RefreshCw className={cn('mr-1.5 h-3.5 w-3.5', list.isFetching && 'animate-spin')} />
          Refresh
        </Button>
        {list.canCreate && (
          <Button className="h-11" onClick={list.createProduct}>
            <Plus className="mr-1.5 h-4 w-4" />
            Tambah Produk
          </Button>
        )}
      </div>
    </header>
  );
}
