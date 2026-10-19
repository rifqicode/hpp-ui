import { LayoutGrid, List, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PRODUCT_SORTS } from "../lib/product-list";
import type { useProductList } from "../hooks/use-product-list";

interface RecipeListFiltersProps {
  list: ReturnType<typeof useProductList>;
}

export function RecipeListFilters({ list }: RecipeListFiltersProps) {
  return (
    <section
      aria-label="Filter produk"
      className="space-y-2.5 rounded-xl border bg-card p-3"
    >
      <div className="flex flex-col gap-2 lg:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            aria-label="Cari produk"
            placeholder="Cari nama produk, kategori, atau bahan baku..."
            value={list.search}
            onChange={(event) =>
              list.update({ q: event.target.value || undefined })
            }
            className="h-10 pl-9 pr-9 text-sm"
          />
          {list.search && (
            <button
              type="button"
              aria-label="Hapus pencarian"
              onClick={() => list.update({ q: undefined })}
              className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded hover:bg-muted"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="grid min-w-0 grid-cols-2 gap-2 lg:w-[370px]">
          <select
            aria-label="Kategori produk"
            value={list.category}
            onChange={(event) =>
              list.update({ category: event.target.value || undefined })
            }
            className="h-10 min-w-0 rounded-md border bg-background px-2 text-xs"
          >
            <option value="">Semua kategori</option>
            {list.category && !list.categories.includes(list.category) && (
              <option value={list.category}>{list.category}</option>
            )}
            {list.categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            aria-label="Kondisi produk"
            value={list.attention}
            onChange={(event) =>
              list.update({
                attention:
                  event.target.value === "all"
                    ? undefined
                    : event.target.value,
              })
            }
            className="h-10 min-w-0 rounded-md border bg-background px-2 text-xs"
          >
            <option value="all">Semua kondisi</option>
            <option value="needs-attention">Perlu perhatian</option>
            <option value="low-stock">Stok menipis / habis</option>
            <option value="no-hpp">Belum ada HPP aktual</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          className="flex items-center gap-2 text-xs text-muted-foreground"
          aria-live="polite"
        >
          <span>
            {list.isPending
              ? "Memuat produk..."
              : list.isError
                ? "Data belum tersedia"
                : `${list.total} produk${list.hasFilters ? ` dari ${list.stats.total}` : ""}`}
          </span>
          {list.hasFilters && (
            <button
              type="button"
              onClick={list.resetFilters}
              className="rounded px-1 py-1 font-medium text-primary hover:underline"
            >
              Reset filter
            </button>
          )}
          {list.isFetching && !list.isPending && (
            <Loader2
              className="h-3.5 w-3.5 animate-spin"
              aria-label="Memperbarui produk"
            />
          )}
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Urutkan
            <select
              aria-label="Urutkan produk"
              value={list.sort}
              onChange={(event) => list.update({ sort: event.target.value })}
              className="h-8 min-w-0 rounded-md border bg-background px-2 text-xs text-foreground"
            >
              {Object.entries(PRODUCT_SORTS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <div
            className="hidden items-center gap-0.5 rounded-md border p-0.5 md:flex"
            role="group"
            aria-label="Tampilan produk"
          >
            {[
              { value: "table", label: "Tampilan tabel", icon: List },
              { value: "grid", label: "Tampilan kartu", icon: LayoutGrid },
            ].map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                size="icon"
                variant={list.view === value ? "secondary" : "ghost"}
                aria-label={label}
                aria-pressed={list.view === value}
                onClick={() => list.update({ view: value }, false)}
                className="h-7 w-8"
              >
                <Icon className="h-3.5 w-3.5" />
              </Button>
            ))}
          </div>
        </div>
      </div>

      {list.attention === "needs-attention" && (
        <p className="text-[11px] text-muted-foreground">
          Produk dengan stok menipis, HPP belum aktual, atau margin rugi.
        </p>
      )}
    </section>
  );
}
