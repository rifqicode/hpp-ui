import { Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  ProductCompactCard,
  ProductTableRow,
} from "@/features/recipes/components/product-list-items";
import { RecipeDeleteDialog } from "@/features/recipes/components/recipe-delete-dialog";
import { RecipeListFilters } from "@/features/recipes/components/recipe-list-filters";
import { RecipeListHeader } from "@/features/recipes/components/recipe-list-header";
import { RecipeListStats } from "@/features/recipes/components/recipe-list-stats";
import { useProductList } from "@/features/recipes/hooks/use-product-list";
import { cn } from "@/lib/utils";

export default function RecipeListPage() {
  const list = useProductList();

  return (
    <div className="flex min-w-0 flex-col gap-4 pb-10">
      <RecipeListHeader list={list} />
      <RecipeListStats list={list} />
      <RecipeListFilters list={list} />

      {list.isError ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-card p-6 text-center"
        >
          <p className="font-semibold">Gagal memuat produk</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {list.error.message}
          </p>
          <Button
            variant="outline"
            className="mt-3"
            onClick={() => void list.refetch()}
            disabled={list.isFetching}
          >
            Coba lagi
          </Button>
        </div>
      ) : list.isPending ? (
        <div
          role="status"
          aria-label="Memuat daftar produk"
          className="space-y-2 rounded-xl border p-3"
        >
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-lg bg-muted motion-reduce:animate-none"
            />
          ))}
        </div>
      ) : list.total === 0 ? (
        <div className="rounded-xl border border-dashed bg-card px-4 py-10 text-center">
          <Package className="mx-auto mb-3 h-7 w-7 text-muted-foreground" />
          <h2 className="font-semibold">
            {list.hasFilters ? "Tidak ada produk yang cocok" : "Belum ada produk"}
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {list.hasFilters
              ? "Ubah kata kunci atau reset filter untuk melihat produk lainnya."
              : "Tambahkan produk pertama untuk mulai mengelola resep dan harga jual."}
          </p>
          {list.hasFilters ? (
            <Button
              variant="outline"
              className="mt-4"
              onClick={list.resetFilters}
            >
              Reset filter
            </Button>
          ) : (
            list.canCreate && (
              <Button className="mt-4" onClick={list.createProduct}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Produk Pertama
              </Button>
            )
          )}
        </div>
      ) : (
        <section
          aria-label="Daftar produk"
          aria-busy={list.isFetching}
          className="space-y-3"
        >
          {list.view === "table" && (
            <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
              <div className="overflow-x-auto">
                <table className="w-full text-left" aria-label="Tabel produk">
                  <thead className="border-b bg-muted/40 text-xs font-medium text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-4 py-3">
                        Produk
                      </th>
                      {["Harga jual", "HPP / unit", "Margin", "Stok jadi"].map(
                        (label) => (
                          <th
                            scope="col"
                            key={label}
                            className="whitespace-nowrap px-3 py-3 text-right"
                          >
                            {label}
                          </th>
                        )
                      )}
                      <th
                        scope="col"
                        className="w-12 px-2 py-3 text-right"
                      >
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.items.map((product) => (
                      <ProductTableRow
                        key={product.id}
                        product={product}
                        returnTo={list.returnTo}
                        canDelete={list.canDelete}
                        onDelete={list.selectDelete}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div
            className={cn(
              "grid gap-3",
              list.view === "grid"
                ? "sm:grid-cols-2 xl:grid-cols-3"
                : "md:hidden"
            )}
            aria-label="Kartu produk"
          >
            {list.items.map((product) => (
              <ProductCompactCard
                key={product.id}
                product={product}
                returnTo={list.returnTo}
                canDelete={list.canDelete}
                onDelete={list.selectDelete}
              />
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-muted-foreground">
              Estimasi bahan belum termasuk overhead produksi. HPP aktual memakai
              produksi terakhir.
            </p>
            <TablePagination
              total={list.total}
              displayedCount={list.items.length}
              page={list.page}
              totalPages={list.totalPages}
              onPrev={() =>
                list.update({ page: String(list.page - 1) }, false)
              }
              onNext={() =>
                list.update({ page: String(list.page + 1) }, false)
              }
              disabled={list.isFetching}
              label="produk"
            />
            <p className="text-right text-[11px] text-muted-foreground">
              Halaman {list.page} dari {list.totalPages}
            </p>
          </div>
        </section>
      )}

      <RecipeDeleteDialog list={list} />
    </div>
  );
}
