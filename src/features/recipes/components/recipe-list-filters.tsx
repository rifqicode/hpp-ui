import { ArrowUpDown, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
      trailingActions={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-10 gap-1.5 text-xs rounded-md shadow-2xs">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              Urutkan
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 text-xs">
            <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground/70">
              Urutan
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Object.entries(PRODUCT_SORTS).map(([value, label]) => (
              <DropdownMenuItem
                key={value}
                onClick={() => list.update({ sort: value })}
                className="cursor-pointer"
              >
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      }
      actions={
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
