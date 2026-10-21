import { Link } from 'react-router-dom';
import { ChevronRight, MoreHorizontal, Package, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CurrencyText } from '@/components/ui/currency-text';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { getProductMetrics } from '../lib/product-list';
import type { Product } from '../types';

interface ProductItemProps {
  product: Product;
  returnTo: string;
  canDelete: boolean;
  onDelete: (product: Product) => void;
}

function ProductIdentity({ product, returnTo }: Pick<ProductItemProps, 'product' | 'returnTo'>) {
  const madeToOrder = product.mode === 'MAKE_TO_ORDER';
  return <Link to={`/production/products/${product.id}`} state={{ returnTo }} className="group flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted text-muted-foreground">
      <Package className="h-4 w-4" aria-hidden />
      {product.imageUrl && <img src={product.imageUrl} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" onError={(event) => { event.currentTarget.hidden = true; }} />}
    </span>
    <span className="min-w-0 space-y-1">
      <span className="block break-words text-sm font-semibold leading-snug text-foreground group-hover:text-primary">{product.name}</span>
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
        <span>{product.category || 'Tanpa kategori'}</span>
        <span title={madeToOrder ? 'Dibuat sesuai pesanan' : 'Diproduksi untuk stok'} className={cn('rounded border px-1.5 py-px text-[10px] font-medium', madeToOrder ? 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300' : 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300')}>{madeToOrder ? 'MTO' : 'MTS'}</span>
      </span>
    </span>
  </Link>;
}

function ProductPrice({ product }: { product: Product }) {
  return product.sellingPrice > 0 ? <span className="font-medium tabular-nums"><CurrencyText value={product.sellingPrice} /><span className="ml-1 text-[10px] font-normal text-muted-foreground">/{product.unit}</span></span> : <span className="text-xs text-muted-foreground">Belum diatur</span>;
}

function ProductCost({ product }: { product: Product }) {
  const { hasActualHpp, actualHpp, estimatedHpp } = getProductMetrics(product);

  if (!hasActualHpp) {
    if (estimatedHpp !== null) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-help text-right">
              <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
                <CurrencyText value={estimatedHpp} />
              </span>
              <span className="mt-0.5 block text-[10px] text-muted-foreground">
                Estimasi resep
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="block max-w-xs border border-border bg-popover text-left text-popover-foreground shadow-md [&_svg]:fill-popover"
          >
            <p className="font-semibold text-amber-500">Estimasi HPP (Belum Produksi)</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Dihitung otomatis on-the-fly dari resep dan harga stok bahan gudang saat ini. Belum ada catatan batch produksi riil.
            </p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return <span className="text-xs text-muted-foreground">Belum tersedia</span>;
  }

  if (hasActualHpp && actualHpp !== null) {
    return (
      <span>
          <div className="text-right">
            <span className="font-semibold tabular-nums text-foreground">
              <CurrencyText value={actualHpp} />
            </span>
            {estimatedHpp !== null && (
              <span className="mt-0.5 block text-[10px] text-muted-foreground/80 tabular-nums">
                HPP bahan gudang: <CurrencyText value={estimatedHpp} />
              </span>
            )}
          </div>
      </span>
    );
  }

  return <span className="text-xs text-muted-foreground">Belum tersedia</span>;
}

function ProductMargin({ product }: { product: Product }) {
  const { margin, hasActualHpp } = getProductMetrics(product);
  if (margin === null) return <span className="text-xs text-muted-foreground" title="Atur harga jual dan biaya untuk menghitung margin">—</span>;
  return <div>
    <span className={cn('inline-flex rounded-md border px-1.5 py-0.5 text-xs font-medium tabular-nums', margin < 0 ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300' : margin < 25 ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300')}>{margin.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%</span>
    {!hasActualHpp && <span className="mt-0.5 block text-[10px] text-muted-foreground">Estimasi</span>}
  </div>;
}

function ProductStock({ product }: { product: Product }) {
  const { lowStock } = getProductMetrics(product);
  if (product.mode === 'MAKE_TO_ORDER') return <span className="text-xs text-muted-foreground">Sesuai pesanan</span>;
  return <div>
    <span className={cn('text-sm font-medium tabular-nums', lowStock && 'text-amber-700 dark:text-amber-300')}>{product.currentStock.toLocaleString('id-ID')} <span className="text-[11px] font-normal">{product.unit}</span></span>
    <span className={cn('mt-0.5 block text-[10px]', lowStock ? 'text-amber-700 dark:text-amber-300' : 'text-muted-foreground')}>{product.currentStock <= 0 ? 'Habis' : lowStock ? 'Menipis' : 'Tersedia'}</span>
  </div>;
}

function ProductActions({ product, returnTo, canDelete, onDelete }: ProductItemProps) {
  return <DropdownMenu>
    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Aksi untuk ${product.name}`} className="h-9 w-9 shrink-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem asChild><Link to={`/production/products/${product.id}`} state={{ returnTo }}>Lihat detail<ChevronRight className="ml-auto h-3.5 w-3.5" /></Link></DropdownMenuItem>
      {canDelete && <><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => onDelete(product)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-3.5 w-3.5" />Hapus produk</DropdownMenuItem></>}
    </DropdownMenuContent>
  </DropdownMenu>;
}

export function ProductTableRow(props: ProductItemProps) {
  return <tr className="border-b last:border-b-0 hover:bg-muted/30">
    <td className="max-w-xs px-4 py-3"><ProductIdentity {...props} /></td>
    <td className="px-3 py-3 text-right text-sm"><ProductPrice product={props.product} /></td>
    <td className="px-3 py-3 text-right text-sm"><ProductCost product={props.product} /></td>
    <td className="px-3 py-3 text-right"><ProductMargin product={props.product} /></td>
    <td className="px-3 py-3 text-right"><ProductStock product={props.product} /></td>
    <td className="px-2 py-3 text-right"><ProductActions {...props} /></td>
  </tr>;
}

export function ProductCompactCard(props: ProductItemProps) {
  return <article className="min-w-0 rounded-xl border bg-card p-3 shadow-2xs">
    <div className="flex items-start justify-between gap-2"><div className="min-w-0 flex-1"><ProductIdentity {...props} /></div><ProductActions {...props} /></div>
    <div className="mt-3 grid grid-cols-2 gap-3 border-y py-2.5 text-sm">
      <div><p className="mb-1 text-[11px] text-muted-foreground">Harga jual</p><ProductPrice product={props.product} /></div>
      <div className="text-right"><p className="mb-1 text-[11px] text-muted-foreground">Biaya per unit</p><ProductCost product={props.product} /></div>
    </div>
    <div className="mt-2.5 flex items-center justify-between gap-3"><ProductStock product={props.product} /><div className="flex items-center gap-2"><span className="text-[11px] text-muted-foreground">Margin</span><ProductMargin product={props.product} /></div></div>
  </article>;
}
