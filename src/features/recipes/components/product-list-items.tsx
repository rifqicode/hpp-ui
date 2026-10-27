import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ChevronDown, MoreHorizontal, Package, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CurrencyText } from '@/components/ui/currency-text';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { getProductMetrics, getVariantMetrics, needsPriceReview } from '../lib/product-list';
import type { Product, ProductVariant } from '../types';

interface ProductItemProps {
  product: Product;
  returnTo: string;
  canDelete: boolean;
  onDelete: (product: Product) => void;
  onReviewPrice?: (product: Product, variantId?: string) => void;
}

export function VariantCost({ variant }: { variant: ProductVariant }) {
  const { hasActual, hasEstimated, isCostHigher } = getVariantMetrics(variant);

  if (hasActual && hasEstimated) {
    return (
      <span className="block text-sm tabular-nums">
        <span className="flex items-center justify-end gap-1.5">
          <CurrencyText value={variant.latestHpp} />
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">HPP</span>
        </span>
        <span className="mt-0.5 flex items-center justify-end gap-1 text-xs">
          <span className="text-muted-foreground">Est:</span>
          <CurrencyText value={variant.estimatedHpp} className={isCostHigher ? 'font-medium text-amber-600 dark:text-amber-400' : 'text-muted-foreground'} />
          {isCostHigher && (
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400" title="Estimasi bahan baku saat ini lebih tinggi dari HPP terakhir">
              ▲ Naik
            </span>
          )}
        </span>
      </span>
    );
  }

  if (hasActual) {
    return (
      <span className="block text-sm tabular-nums">
        <CurrencyText value={variant.latestHpp} />
        <span className="mt-0.5 block text-xs text-muted-foreground">HPP Terakhir</span>
      </span>
    );
  }

  if (hasEstimated) {
    return (
      <span className="block text-sm tabular-nums">
        <CurrencyText value={variant.estimatedHpp} />
        <span className="mt-0.5 block text-xs text-muted-foreground">Estimasi Bahan</span>
      </span>
    );
  }

  return <span className="block text-sm tabular-nums">Belum dihitung</span>;
}

export function VariantMargin({ variant }: { variant: ProductVariant }) {
  const { margin, actual, cost } = getVariantMetrics(variant);
  if (cost !== null && variant.sellingPrice < cost) return <span className="block text-sm font-medium text-red-700 dark:text-red-300"><CurrencyText value={variant.sellingPrice - cost} /><span className="mt-0.5 block text-xs font-normal">{actual ? 'Di bawah biaya produksi' : 'Di bawah perkiraan bahan'}</span></span>;
  return <span className="block text-sm tabular-nums">{margin === null ? 'Belum tersedia' : <>{margin.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%{!actual && <span className="mt-0.5 block text-xs text-muted-foreground">Perkiraan dari biaya bahan</span>}</>}</span>;
}

export function VariantStock({ variant, mode }: { variant: ProductVariant; mode: Product['mode'] }) {
  if (mode === 'MAKE_TO_ORDER') return <span className="text-sm text-muted-foreground">Buat saat dipesan</span>;
  const low = variant.currentStock <= variant.minStock;
  return <span className="block text-sm tabular-nums">{variant.currentStock.toLocaleString('id-ID')} {variant.unit}{low && <span className="mt-0.5 block text-xs font-medium">{variant.currentStock <= 0 ? 'Habis' : 'Menipis'}</span>}</span>;
}

function ProductIdentity({ product, returnTo, onReviewPrice }: Pick<ProductItemProps, 'product' | 'returnTo' | 'onReviewPrice'>) {
  const reviewVariant = product.variants.find(needsPriceReview);
  return <div className="min-w-0"><Link to={`/production/products/${product.id}`} state={{ returnTo }} className="group flex min-w-0 items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
    <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted text-muted-foreground"><Package className="size-4" aria-hidden />{product.imageUrl && <img src={product.imageUrl} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" onError={e => { e.currentTarget.hidden = true; }} />}</span>
    <span className="min-w-0"><span className="block break-words text-sm font-semibold leading-snug group-hover:underline">{product.name}</span><span className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs leading-5 text-muted-foreground"><span>{product.category || 'Tanpa kategori'}</span><span>{product.variants.filter(v => v.isActive).length} varian</span><span>{product.mode === 'MAKE_TO_ORDER' ? 'Buat saat dipesan' : 'Siapkan stok dulu'}</span></span></span>
  </Link>{reviewVariant && <Button type="button" variant="ghost" className="mt-1 min-h-11 gap-1.5 px-2 text-xs text-amber-800 dark:text-amber-300" onClick={() => onReviewPrice?.(product, reviewVariant.id)}><AlertCircle className="size-3.5" aria-hidden="true" />Tinjau harga</Button>}</div>;
}

function ProductActions({ product, returnTo, canDelete, onDelete }: ProductItemProps) {
  return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Aksi untuk ${product.name}`} className="size-11 shrink-0"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem asChild><Link to={`/production/products/${product.id}`} state={{ returnTo }}>Lihat detail</Link></DropdownMenuItem>{canDelete && <><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => onDelete(product)} className="text-red-700 focus:text-red-700 dark:text-red-300 dark:focus:text-red-300"><Trash2 className="mr-2 size-4" />Hapus produk</DropdownMenuItem></>}</DropdownMenuContent></DropdownMenu>;
}

function ProductPrice({ product }: { product: Product }) {
  const prices = product.variants.filter(v => v.isActive).map(v => v.sellingPrice);
  if (!prices.length) return <span className="text-sm text-muted-foreground">Tanpa varian aktif</span>;
  const low = Math.min(...prices), high = Math.max(...prices);
  return <span className="text-sm tabular-nums"><CurrencyText value={low} />{high !== low && <> – <CurrencyText value={high} /></>}</span>;
}

function ProductCost({ product }: { product: Product }) {
  const active = product.variants.filter(v => v.isActive);
  if (active.length === 1) return <VariantCost variant={active[0]} />;
  return <span className="text-sm text-muted-foreground">{active.length ? 'Lihat per varian' : 'Belum tersedia'}</span>;
}

function ProductMargin({ product }: { product: Product }) {
  const active = product.variants.filter(v => v.isActive);
  if (active.length === 1) return <VariantMargin variant={active[0]} />;
  const { margin } = getProductMetrics(product);
  if (margin !== null && margin < 0) return <span className="text-sm font-medium text-red-700 dark:text-red-300">Harga di bawah biaya<span className="mt-0.5 block text-xs font-normal text-muted-foreground">Lihat rincian per varian</span></span>;
  return <span className="block text-sm tabular-nums">{margin === null ? 'Belum tersedia' : <>{margin.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%<span className="mt-0.5 block text-xs text-muted-foreground">Terendah · lihat varian</span></>}</span>;
}

function ProductStock({ product }: { product: Product }) {
  const active = product.variants.filter(v => v.isActive);
  if (active.length === 1) return <VariantStock variant={active[0]} mode={product.mode} />;
  if (product.mode === 'MAKE_TO_ORDER') return <span className="text-sm text-muted-foreground">Buat saat dipesan</span>;
  const low = active.filter(v => v.currentStock <= v.minStock).length;
  return <span className="text-sm">{low ? `${low} varian menipis / habis` : 'Lihat per varian'}</span>;
}

function VariantBreakdown({ product, onReviewPrice }: { product: Product; onReviewPrice?: (product: Product, variantId?: string) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground">Harga, biaya dan stok untuk masing-masing varian aktif.</p>
      <ul className="divide-y">
        {product.variants.filter(v => v.isActive).map(v => {
          const { isCostHigher } = getVariantMetrics(v);
          const reviewNeeded = needsPriceReview(v);
          return (
            <li key={v.id} className="grid min-w-0 gap-3 py-3 first:pt-0 last:pb-0 lg:grid-cols-[minmax(0,1fr)_3fr]">
              <div className="min-w-0">
                <p className="break-words text-sm font-semibold">{v.variantName}</p>
                <p className="mt-1 break-all text-xs text-muted-foreground">{v.sku || 'SKU belum tersedia'}</p>
                {reviewNeeded && onReviewPrice && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="mt-1.5 h-8 gap-1 px-2 text-xs text-amber-800 dark:text-amber-300"
                    onClick={() => onReviewPrice(product, v.id)}
                  >
                    <AlertCircle className="size-3.5" aria-hidden="true" />
                    Tinjau harga
                  </Button>
                )}
              </div>
              <dl className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-5">
                {[
                  ['Harga jual', <CurrencyText value={v.sellingPrice} />],
                  ['HPP aktual terakhir', v.latestHpp > 0 ? <CurrencyText value={v.latestHpp} /> : 'Belum tersedia'],
                  [
                    'Estimasi bahan baku',
                    v.estimatedHpp > 0 ? (
                      <span className="flex items-center gap-1">
                        <CurrencyText
                          value={v.estimatedHpp}
                          className={isCostHigher ? 'font-medium text-amber-600 dark:text-amber-400' : undefined}
                        />
                        {isCostHigher && (
                          <span
                            className="text-[10px] font-semibold text-amber-600 dark:text-amber-400"
                            title="Estimasi bahan baku saat ini lebih tinggi dari HPP terakhir"
                          >
                            ▲ Naik
                          </span>
                        )}
                      </span>
                    ) : (
                      'Belum dihitung'
                    ),
                  ],
                  ['Margin', <VariantMargin variant={v} />],
                  ['Stok jadi', <VariantStock variant={v} mode={product.mode} />],
                ].map(([label, value], i) => (
                  <div key={i} className="min-w-0">
                    <dt className="mb-1 text-xs text-muted-foreground">{label}</dt>
                    <dd className="break-words text-sm">{value}</dd>
                  </div>
                ))}
              </dl>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ProductTableRow(props: ProductItemProps) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const multiple = props.product.variants.filter(v => v.isActive).length > 1;
  return <><tr className="border-b last:border-b-0 hover:bg-muted/30"><td className="max-w-xs px-4 py-3"><ProductIdentity {...props} />{multiple && <Button type="button" variant="ghost" className="mt-1 h-9 gap-1 text-xs" aria-expanded={expanded} aria-controls={detailsId} onClick={() => setExpanded(!expanded)}><ChevronDown className={cn('size-3.5', expanded && 'rotate-180')} aria-hidden />{expanded ? 'Tutup varian' : 'Lihat varian'}</Button>}</td><td className="px-3 py-3 text-right"><ProductPrice product={props.product} /></td><td className="px-3 py-3 text-right"><ProductCost product={props.product} /></td><td className="px-3 py-3 text-right"><ProductMargin product={props.product} /></td><td className="px-3 py-3 text-right"><ProductStock product={props.product} /></td><td className="px-2 py-3 text-right"><ProductActions {...props} /></td></tr>{multiple && <tr id={detailsId} hidden={!expanded} className="border-b bg-muted/20"><td colSpan={6} className="p-4"><VariantBreakdown product={props.product} onReviewPrice={props.onReviewPrice} /></td></tr>}</>;
}

export function ProductCompactCard(props: ProductItemProps) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const multiple = props.product.variants.filter(v => v.isActive).length > 1;
  return <article className="min-w-0 rounded-xl border bg-card p-4"><div className="flex items-start justify-between gap-2"><div className="min-w-0 flex-1"><ProductIdentity {...props} /></div><ProductActions {...props} /></div><dl className="mt-3 grid grid-cols-2 gap-4 border-t pt-3">{[
    ['Harga jual', <ProductPrice product={props.product} />], ['HPP / unit', <ProductCost product={props.product} />], ['Margin', <ProductMargin product={props.product} />], ['Stok jadi', <ProductStock product={props.product} />],
  ].map(([label, value], i) => <div key={i} className="min-w-0"><dt className="mb-1 text-xs text-muted-foreground">{label}</dt><dd className="break-words text-sm">{value}</dd></div>)}</dl>{multiple && <><Button type="button" variant="outline" className="mt-4 h-11 w-full" aria-expanded={expanded} aria-controls={detailsId} onClick={() => setExpanded(!expanded)}>{expanded ? 'Tutup varian' : 'Lihat varian'}<ChevronDown className={cn('size-4', expanded && 'rotate-180')} aria-hidden /></Button><div id={detailsId} hidden={!expanded} className="mt-3 border-t pt-3"><VariantBreakdown product={props.product} onReviewPrice={props.onReviewPrice} /></div></>}</article>;
}
