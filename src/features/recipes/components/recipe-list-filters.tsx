import { useState } from 'react';
import { ArrowUpDown, Check, LayoutGrid, List, Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { PRODUCT_SORTS } from '../lib/product-list';
import type { useProductList } from '../hooks/use-product-list';
import { ProductSelect } from './product-form-layout';

export function RecipeListFilters({ list }: { list: ReturnType<typeof useProductList> }) {
  const [showFilters, setShowFilters] = useState(false);
  const categories = list.category && !list.categories.includes(list.category) ? [list.category, ...list.categories] : list.categories;
  return <section aria-label="Filter produk" className="space-y-3">
    <div className="grid grid-cols-2 items-center gap-2 md:flex md:flex-wrap">
      <div className="relative col-span-2 w-full min-w-0 md:w-auto md:flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden /><Input aria-label="Cari produk" placeholder="Cari nama, SKU, kategori, atau bahan..." value={list.search} onChange={e => list.update({ q: e.target.value || undefined })} className="h-11 pl-9 pr-11" />{list.search && <Button type="button" variant="ghost" size="icon" aria-label="Hapus pencarian" className="absolute right-0 top-0 size-11" onClick={() => list.update({ q: undefined })}><X className="size-4" aria-hidden /></Button>}</div>
      <Button type="button" variant="outline" className="h-11 w-full md:hidden" aria-expanded={showFilters} aria-controls="product-filter-options" onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal className="size-4" aria-hidden />Filter{(list.category || list.attention !== 'all') && ' aktif'}</Button>
      <div id="product-filter-options" className={cn('order-last col-span-2 w-full grid-cols-2 gap-2 md:order-none md:grid md:w-auto md:max-w-sm', showFilters ? 'grid' : 'hidden')}>
        <ProductSelect aria-label="Kategori produk" value={list.category} onChange={e => list.update({ category: e.target.value || undefined })}><option value="">Semua kategori</option>{categories.map(category => <option key={category} value={category}>{category}</option>)}</ProductSelect>
        <ProductSelect aria-label="Kondisi produk" value={list.attention} onChange={e => list.update({ attention: e.target.value === 'all' ? undefined : e.target.value })}><option value="all">Semua kondisi</option><option value="needs-attention">Perlu perhatian</option><option value="low-stock">Stok menipis / habis</option><option value="no-hpp">HPP belum aktual</option><option value="loss">Harga di bawah biaya</option><option value="price-review">Periksa harga</option></ProductSelect>
      </div>
      <DropdownMenu><DropdownMenuTrigger asChild><Button type="button" variant="outline" className="h-11 w-full min-w-0 md:w-auto" aria-label={`Urutkan: ${PRODUCT_SORTS[list.sort]}`}><ArrowUpDown className="size-4" aria-hidden /><span className="truncate">{PRODUCT_SORTS[list.sort]}</span></Button></DropdownMenuTrigger><DropdownMenuContent align="end">{Object.entries(PRODUCT_SORTS).map(([value, label]) => <DropdownMenuItem key={value} onClick={() => list.update({ sort: value })}>{label}{list.sort === value && <Check className="ml-auto size-4" aria-hidden />}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground" aria-live="polite"><span>{list.isPending ? 'Memuat produk...' : list.isError ? 'Data belum tersedia' : `${list.total} produk${list.hasFilters ? ` dari ${list.stats.total}` : ''}`}</span>{list.hasFilters && <Button type="button" variant="ghost" className="h-11 text-xs text-primary dark:text-indigo-300" onClick={list.resetFilters}>Reset filter</Button>}{list.isFetching && !list.isPending && <span>Memperbarui produk...</span>}</div><div role="group" aria-label="Tampilan produk" className="hidden items-center gap-1 md:flex">{[{ value: 'table', label: 'Tampilan tabel', icon: List }, { value: 'grid', label: 'Tampilan kartu', icon: LayoutGrid }].map(({ value, label, icon: Icon }) => <Button key={value} type="button" size="icon" variant={list.view === value ? 'secondary' : 'ghost'} className="size-9" aria-label={label} aria-pressed={list.view === value} onClick={() => list.update({ view: value }, false)}><Icon className="size-4" /></Button>)}</div></div>
  </section>;
}
