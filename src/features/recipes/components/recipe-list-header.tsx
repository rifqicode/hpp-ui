import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuotaBadge } from "@/features/subscription";
import { cn } from "@/lib/utils";
import type { useProductList } from "../hooks/use-product-list";

interface RecipeListHeaderProps {
  list: ReturnType<typeof useProductList>;
}

export function RecipeListHeader({ list }: RecipeListHeaderProps) {
  return (
    <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Produk
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
          Kelola harga, HPP, dan stok produk.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => void list.refetch()}
          disabled={list.isFetching}
          aria-label="Refresh produk"
        >
          <RefreshCw
            className={cn(
              "mr-1.5 h-3.5 w-3.5",
              list.isFetching && "animate-spin"
            )}
          />
          Refresh
        </Button>
        {list.canCreate && (
          <Button size="sm" onClick={list.createProduct}>
            <Plus className="mr-1.5 h-4 w-4" />
            Tambah Produk
          </Button>
        )}
        <QuotaBadge
          resource="products"
          label="Kuota"
          className="ml-auto"
          onUpgradeClick={list.requestUpgrade}
        />
      </div>
    </header>
  );
}
