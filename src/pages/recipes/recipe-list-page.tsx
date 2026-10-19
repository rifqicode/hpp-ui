import { AlertTriangle, LayoutGrid, List, Loader2, Package, Plus, RefreshCw, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TablePagination } from '@/components/ui/table-pagination';
import { QuotaBadge } from '@/features/subscription';
import { useProductList } from '@/features/recipes/hooks/use-product-list';
import { ProductCompactCard, ProductTableRow } from '@/features/recipes/components/product-list-items';
import { PRODUCT_SORTS } from '@/features/recipes/lib/product-list';
import { cn } from '@/lib/utils';

export default function RecipeListPage() {
  const list = useProductList();
  const statsReady = !list.isPending && !list.isError;
  return <div className="flex min-w-0 flex-col gap-4 pb-10">
    <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Produk & Resep</h1>
        <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">Kelola harga, HPP, dan stok produk.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => void list.refetch()} disabled={list.isFetching} aria-label="Refresh produk"><RefreshCw className={cn('mr-1.5 h-3.5 w-3.5', list.isFetching && 'animate-spin')} />Refresh</Button>
        {list.canCreate && <Button size="sm" onClick={list.createProduct}><Plus className="mr-1.5 h-4 w-4" />Tambah Produk</Button>}
        <QuotaBadge resource="products" label="Kuota" className="ml-auto" onUpgradeClick={list.requestUpgrade} />
      </div>
    </header>

    <div className="grid grid-cols-2 gap-3">
      <button type="button" onClick={list.resetFilters} aria-pressed={!list.hasFilters} className="rounded-xl border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4">
        <span className="block text-xs text-muted-foreground">Total produk</span><span className="mt-1 block text-xl font-semibold tabular-nums">{statsReady ? list.stats.total : '—'}</span>
      </button>
      <button type="button" onClick={() => list.update({ attention: 'needs-attention', q: undefined, category: undefined })} aria-pressed={list.attention === 'needs-attention'} className={cn('rounded-xl border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4', list.attention === 'needs-attention' && 'border-primary/50 bg-primary/5')}>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><AlertTriangle className="h-3.5 w-3.5 text-amber-600" />Perlu perhatian</span><span className="mt-1 block text-xl font-semibold tabular-nums">{statsReady ? list.stats.attention : '—'}</span>
      </button>
    </div>

    <section aria-label="Filter produk" className="space-y-2.5 rounded-xl border bg-card p-3">
      <div className="flex flex-col gap-2 lg:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input aria-label="Cari produk" placeholder="Cari nama produk, kategori, atau bahan baku..." value={list.search} onChange={(event) => list.update({ q: event.target.value || undefined })} className="h-10 pl-9 pr-9 text-sm" />
          {list.search && <button type="button" aria-label="Hapus pencarian" onClick={() => list.update({ q: undefined })} className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded hover:bg-muted"><X className="h-3.5 w-3.5" /></button>}
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-2 lg:w-[370px]">
          <select aria-label="Kategori produk" value={list.category} onChange={(event) => list.update({ category: event.target.value || undefined })} className="h-10 min-w-0 rounded-md border bg-background px-2 text-xs">
            <option value="">Semua kategori</option>
            {list.category && !list.categories.includes(list.category) && <option value={list.category}>{list.category}</option>}
            {list.categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <select aria-label="Kondisi produk" value={list.attention} onChange={(event) => list.update({ attention: event.target.value === 'all' ? undefined : event.target.value })} className="h-10 min-w-0 rounded-md border bg-background px-2 text-xs">
            <option value="all">Semua kondisi</option><option value="needs-attention">Perlu perhatian</option><option value="low-stock">Stok menipis / habis</option><option value="no-hpp">Belum ada HPP aktual</option>
          </select>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
          <span>{list.isPending ? 'Memuat produk...' : list.isError ? 'Data belum tersedia' : `${list.total} produk${list.hasFilters ? ` dari ${list.stats.total}` : ''}`}</span>
          {list.hasFilters && <button type="button" onClick={list.resetFilters} className="rounded px-1 py-1 font-medium text-primary hover:underline">Reset filter</button>}
          {list.isFetching && !list.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-label="Memperbarui produk" />}
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">Urutkan
            <select aria-label="Urutkan produk" value={list.sort} onChange={(event) => list.update({ sort: event.target.value })} className="h-8 min-w-0 rounded-md border bg-background px-2 text-xs text-foreground">
              {Object.entries(PRODUCT_SORTS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <div className="hidden items-center gap-0.5 rounded-md border p-0.5 md:flex" role="group" aria-label="Tampilan produk">
            {[{ value: 'table', label: 'Tampilan tabel', icon: List }, { value: 'grid', label: 'Tampilan kartu', icon: LayoutGrid }].map(({ value, label, icon: Icon }) => <Button key={value} size="icon" variant={list.view === value ? 'secondary' : 'ghost'} aria-label={label} aria-pressed={list.view === value} onClick={() => list.update({ view: value }, false)} className="h-7 w-8"><Icon className="h-3.5 w-3.5" /></Button>)}
          </div>
        </div>
      </div>
      {list.attention === 'needs-attention' && <p className="text-[11px] text-muted-foreground">Produk dengan stok menipis, HPP belum aktual, atau margin rugi.</p>}
    </section>

    {list.isError ? <div role="alert" className="rounded-xl border border-destructive/30 bg-card p-6 text-center">
      <p className="font-semibold">Gagal memuat produk</p><p className="mt-1 text-sm text-muted-foreground">{list.error.message}</p><Button variant="outline" className="mt-3" onClick={() => void list.refetch()} disabled={list.isFetching}>Coba lagi</Button>
    </div> : list.isPending ? <div role="status" aria-label="Memuat daftar produk" className="space-y-2 rounded-xl border p-3">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-16 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />)}</div> : list.total === 0 ? <div className="rounded-xl border border-dashed bg-card px-4 py-10 text-center">
      <Package className="mx-auto mb-3 h-7 w-7 text-muted-foreground" /><h2 className="font-semibold">{list.hasFilters ? 'Tidak ada produk yang cocok' : 'Belum ada produk'}</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{list.hasFilters ? 'Ubah kata kunci atau reset filter untuk melihat produk lainnya.' : 'Tambahkan produk pertama untuk mulai mengelola resep dan harga jual.'}</p>
      {list.hasFilters ? <Button variant="outline" className="mt-4" onClick={list.resetFilters}>Reset filter</Button> : list.canCreate && <Button className="mt-4" onClick={list.createProduct}><Plus className="mr-2 h-4 w-4" />Tambah Produk Pertama</Button>}
    </div> : <section aria-label="Daftar produk" aria-busy={list.isFetching} className="space-y-3">
      {list.view === 'table' && <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
        <div className="overflow-x-auto"><table className="w-full text-left" aria-label="Tabel produk">
          <thead className="border-b bg-muted/40 text-xs font-medium text-muted-foreground"><tr><th scope="col" className="px-4 py-3">Produk</th>{['Harga jual', 'HPP / unit', 'Margin', 'Stok jadi'].map((label) => <th scope="col" key={label} className="px-3 py-3 text-right whitespace-nowrap">{label}</th>)}<th scope="col" className="w-12 px-2 py-3 text-right">Aksi</th></tr></thead>
          <tbody>{list.items.map((product) => <ProductTableRow key={product.id} product={product} returnTo={list.returnTo} canDelete={list.canDelete} onDelete={list.selectDelete} />)}</tbody>
        </table></div>
      </div>}
      <div className={cn('grid gap-3', list.view === 'grid' ? 'sm:grid-cols-2 xl:grid-cols-3' : 'md:hidden')} aria-label="Kartu produk">{list.items.map((product) => <ProductCompactCard key={product.id} product={product} returnTo={list.returnTo} canDelete={list.canDelete} onDelete={list.selectDelete} />)}</div>
      <div className="flex flex-col gap-2"><p className="text-[11px] text-muted-foreground">Estimasi bahan belum termasuk overhead produksi. HPP aktual memakai produksi terakhir.</p><TablePagination total={list.total} displayedCount={list.items.length} page={list.page} totalPages={list.totalPages} onPrev={() => list.update({ page: String(list.page - 1) }, false)} onNext={() => list.update({ page: String(list.page + 1) }, false)} disabled={list.isFetching} label="produk" prevLabel="Sebelumnya" nextLabel="Berikutnya" /><p className="text-right text-[11px] text-muted-foreground">Halaman {list.page} dari {list.totalPages}</p></div>
    </section>}

    <Dialog open={Boolean(list.productToDelete)} onOpenChange={(open) => { if (!open) list.closeDelete(); }}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader><DialogTitle>Hapus produk?</DialogTitle><DialogDescription>Produk <strong>{list.productToDelete?.name}</strong> akan dihapus dari katalog. Riwayat produksi tetap tersimpan.</DialogDescription></DialogHeader>
        {list.deleteError && <p role="alert" className="text-sm text-destructive">{list.deleteError.message}</p>}
        <DialogFooter className="gap-2"><Button variant="outline" onClick={list.closeDelete} disabled={list.isDeleting}>Batal</Button><Button variant="destructive" onClick={() => void list.confirmDelete()} disabled={list.isDeleting}>{list.isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Hapus produk</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
