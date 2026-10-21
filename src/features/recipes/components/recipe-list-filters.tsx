import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListFilters } from "@/components/ui/list-filters";
import { PRODUCT_SORTS } from "../lib/product-list";
import type { useProductList } from "../hooks/use-product-list";

interface RecipeListFiltersProps {
  list: ReturnType<typeof useProductList>;
}

export function RecipeListFilters({ list }: RecipeListFiltersProps) {
  const categories = list.category && !list.categories.includes(list.category)
    ? [list.category, ...list.categories]
    : list.categories;

  return (
    <ListFilters
      label="Filter produk"
      search={{
        label: "Cari produk",
        placeholder: "Cari nama produk, kategori, atau bahan baku...",
        value: list.search,
        onChange: (value) => list.update({ q: value || undefined }),
      }}
      filters={[
        {
          id: "category", label: "Kategori produk", value: list.category,
          onChange: (value) => list.update({ category: value || undefined }),
          options: [{ value: "", label: "Semua kategori" }, ...categories.map((category) => ({ value: category, label: category }))],
        },
        {
          id: "attention", label: "Kondisi produk", value: list.attention,
          onChange: (value) => list.update({ attention: value === "all" ? undefined : value }),
          options: [
            { value: "all", label: "Semua kondisi" },
            { value: "needs-attention", label: "Perlu perhatian" },
            { value: "low-stock", label: "Stok menipis / habis" },
            { value: "no-hpp", label: "Belum ada HPP aktual" },
          ],
        },
      ]}
      summary={list.isPending ? "Memuat produk..." : list.isError ? "Data belum tersedia" : `${list.total} produk${list.hasFilters ? ` dari ${list.stats.total}` : ""}`}
      hasFilters={list.hasFilters}
      onReset={list.resetFilters}
      isFetching={list.isFetching && !list.isPending}
      fetchingLabel="Memperbarui produk"
      actions={
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
      }
    >
      {list.attention === "needs-attention" && (
        <p className="text-[11px] text-muted-foreground">
          Produk dengan stok menipis, HPP belum aktual, atau margin rugi.
        </p>
      )}
    </ListFilters>
  );
}
