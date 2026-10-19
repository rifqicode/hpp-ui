import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { useProductList } from "../hooks/use-product-list";

interface RecipeListStatsProps {
  list: ReturnType<typeof useProductList>;
}

export function RecipeListStats({ list }: RecipeListStatsProps) {
  const statsReady = !list.isPending && !list.isError;

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={list.resetFilters}
        aria-pressed={!list.hasFilters}
        className="rounded-xl border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4"
      >
        <span className="block text-xs text-muted-foreground">Total produk</span>
        <span className="mt-1 block text-xl font-semibold tabular-nums">
          {statsReady ? list.stats.total : "—"}
        </span>
      </button>

      <button
        type="button"
        onClick={() =>
          list.update({
            attention: "needs-attention",
            q: undefined,
            category: undefined,
          })
        }
        aria-pressed={list.attention === "needs-attention"}
        className={cn(
          "rounded-xl border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4",
          list.attention === "needs-attention" &&
            "border-primary/50 bg-primary/5"
        )}
      >
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
          Perlu perhatian
        </span>
        <span className="mt-1 block text-xl font-semibold tabular-nums">
          {statsReady ? list.stats.attention : "—"}
        </span>
      </button>
    </div>
  );
}
