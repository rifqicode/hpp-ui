import { useState, type ReactNode } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Banknote, Calculator, Check, ClipboardList, Coins, Package, Pencil, Plus } from 'lucide-react';
import { useProductDetailQuery } from '@/features/recipes/hooks/use-recipes-query';
import { ProductBuilder } from '@/features/recipes/components/product-builder';
import { PriceReviewDialog } from '@/features/recipes/components/price-review-dialog';
import { ProductFormPanel, ProductPageHeader } from '@/features/recipes/components/product-form-layout';
import { getVariantMetrics, getPriceReviewReason } from '@/features/recipes/lib/product-list';
import { Button } from '@/components/ui/button';
import { CurrencyText } from '@/components/ui/currency-text';
import { FeedbackAlert } from '@/components/ui/feedback-alert';
import { usePermission } from '@/hooks/use-permission';
import { cn } from '@/lib/utils';

function MetricCard({ label, icon: Icon, children, description, highlight = false }: {
  label: string; icon: typeof Coins; children: ReactNode; description: string; highlight?: boolean;
}) {
  return (
    <div className={cn('min-w-0 rounded-xl border bg-card p-4 sm:p-5', highlight && 'bg-accent')}>
      <dt className="flex items-start justify-between gap-2 text-xs leading-5 text-muted-foreground sm:text-sm">
        <span>{label}</span>
        <Icon className={cn('size-4 shrink-0', highlight && 'text-accent-foreground')} aria-hidden="true" />
      </dt>
      <dd className="mt-3">
        <span className="block break-words text-lg font-semibold tracking-tight tabular-nums sm:text-2xl">{children}</span>
        <span className="mt-1.5 block text-xs leading-5 text-muted-foreground">{description}</span>
      </dd>
    </div>
  );
}

function productionDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Tanggal belum tersedia' : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function RecipeDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const query = useProductDetailQuery(productId);
  const location = useLocation();
  const [selected, setSelected] = useState(() => typeof location.state?.variantId === 'string' ? location.state.variantId : '');
  const [editor, setEditor] = useState<{ step: number; addVariant: boolean } | null>(null);
  const [priceReviewOpen, setPriceReviewOpen] = useState(() => location.state?.reviewPrice === true);
  const { can } = usePermission();
  const requested: unknown = location.state?.returnTo;
  const returnTo = typeof requested === 'string' && /^\/production\/products(?:\?|$)/.test(requested) ? requested : '/production/products';
  const canEdit = can('products:write');

  if (query.isPending) return <FeedbackAlert variant="loading">Memuat detail produk…</FeedbackAlert>;
  if (query.isError) return (
    <div className="space-y-3">
      <FeedbackAlert variant="error">Detail produk belum bisa dimuat. Coba lagi.</FeedbackAlert>
      <Button variant="outline" className="min-h-11" disabled={query.isFetching} onClick={() => void query.refetch()}>Coba lagi</Button>
    </div>
  );
  const product = query.data;
  if (!product) return (
    <div className="space-y-3">
      <FeedbackAlert variant="error">Produk tidak ditemukan.</FeedbackAlert>
      <Button asChild variant="outline" className="min-h-11"><Link to={returnTo}>Kembali ke produk</Link></Button>
    </div>
  );
  const variant = product.variants.find(v => v.id === selected) ?? product.variants.find(v => v.isDefault) ?? product.variants[0];
  const madeToOrder = product.mode === 'MAKE_TO_ORDER';
  const metrics = variant ? getVariantMetrics(variant) : null;
  const reviewReason = variant ? getPriceReviewReason(variant) : null;

  if (editor && canEdit) return (
    <ProductBuilder
      key={product.id}
      product={product}
      initialStep={editor.step}
      initialVariantId={variant?.id}
      startWithNewVariant={editor.addVariant}
      onSaved={(saved) => {
        if (editor.addVariant) {
          const added = saved.variants.find(item => !product.variants.some(previous => previous.id === item.id));
          if (added) setSelected(added.id);
        }
        setEditor(null);
        void query.refetch();
      }}
      onCancel={() => setEditor(null)}
    />
  );

  return (
    <div className="w-full min-w-0 space-y-5 pb-10">
      <ProductPageHeader
        title={product.name}
        backTo={returnTo}
        actions={canEdit && (
          <Button variant="outline" className="min-h-11 gap-2 px-4" onClick={() => setEditor({ step: 0, addVariant: false })}>
            <Pencil className="size-4" aria-hidden="true" />Edit produk
          </Button>
        )}
        description={(
          <div className="mt-3 flex min-w-0 items-start gap-4">
            <span className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted text-muted-foreground sm:size-24">
              <Package className="size-7" aria-hidden="true" />
              {product.imageUrl && <img src={product.imageUrl} alt={product.name} className="absolute inset-0 size-full object-cover" onError={event => { event.currentTarget.hidden = true; }} />}
            </span>
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                <span className="font-medium text-foreground">{product.category || 'Tanpa kategori'}</span>
                <span>{madeToOrder ? 'Buat saat dipesan' : 'Siapkan stok dulu'}</span>
                <span>{product.variants.length} varian</span>
              </div>
              <p className="max-w-2xl whitespace-pre-wrap break-words text-sm leading-6">
                {product.description || 'Belum ada deskripsi produk.'}
              </p>
            </div>
          </div>
        )}
      />

      <section aria-labelledby="product-variants-title" className="min-w-0 rounded-xl border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="product-variants-title" className="text-base font-semibold">Pilihan varian</h2>
            <p className="mt-1 text-sm text-muted-foreground">Pilih varian untuk melihat harga, resep, dan stoknya.</p>
          </div>
          {canEdit && (
            <Button className="min-h-11 gap-2 px-4" onClick={() => setEditor({ step: 1, addVariant: true })}>
              <Plus className="size-4" aria-hidden="true" />Tambah varian
            </Button>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Varian produk">
          {product.variants.map(item => (
            <Button
              key={item.id}
              variant="outline"
              className={cn('min-h-11 max-w-full gap-2 whitespace-normal px-3 text-left', item.id === variant?.id && 'border-primary bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground')}
              aria-pressed={item.id === variant?.id}
              onClick={() => setSelected(item.id)}
            >
              {item.id === variant?.id && <Check className="size-4" aria-hidden="true" />}
              <span className="min-w-0 break-words">{item.variantName}</span>
              {item.isDefault && <span className="text-xs font-normal">Utama</span>}
              {!item.isActive && <span className="text-xs font-normal">Tidak dijual</span>}
            </Button>
          ))}
          {!variant && <p className="text-sm text-muted-foreground">Belum ada varian. Tambahkan pilihan ukuran atau jenis produk di sini.</p>}
        </div>
      </section>

      {variant && (
        <section aria-label={`Detail varian ${variant.variantName}`} className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <h2 className="text-base font-semibold">{variant.variantName}</h2>
            <p className="break-all text-xs text-muted-foreground">Kode produk: {variant.sku || 'Belum diisi'} · Per 1 {variant.unit}</p>
          </div>
          {!variant.isActive && <FeedbackAlert>Varian ini sedang tidak dijual. Aktifkan kembali melalui Edit produk.</FeedbackAlert>}
          {reviewReason && <div className="space-y-3">
            <FeedbackAlert>{reviewReason === 'higher-estimate' ? 'Perkiraan biaya bahan terbaru lebih tinggi dari biaya produksi terakhir. Periksa apakah harga jual masih sesuai.' : reviewReason === 'below-production-cost' ? 'Harga jual saat ini di bawah biaya produksi terakhir. Periksa harga sebelum menjual produk.' : reviewReason === 'higher-suggestion' ? 'Saran harga dari biaya bahan terbaru dan margin yang tersimpan lebih tinggi dari harga jual saat ini. Kamu bisa meninjaunya sebelum mengubah harga.' : 'Harga jual saat ini di bawah perkiraan biaya bahan terbaru. Periksa apakah harga perlu disesuaikan.'}</FeedbackAlert>
            {canEdit && <Button variant="outline" className="min-h-11 gap-2 px-4" onClick={() => setPriceReviewOpen(true)}><Calculator className="size-4" aria-hidden="true" />Tinjau harga</Button>}
          </div>}

          <dl aria-label="Ringkasan varian" className="grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-4">
            <MetricCard label="Harga jual" icon={Banknote} description={`Harga untuk 1 ${variant.unit}`} highlight>
              <CurrencyText value={variant.sellingPrice} />
            </MetricCard>
            <MetricCard label="Biaya produksi terakhir" icon={Coins} description="Dari produksi yang sudah dicatat">
              {variant.latestHpp > 0 ? <CurrencyText value={variant.latestHpp} /> : 'Belum tersedia'}
            </MetricCard>
            <MetricCard label="Perkiraan biaya bahan" icon={Calculator} description={`Biaya bahan untuk 1 ${variant.unit}`}>
              {variant.estimatedHpp > 0 ? <CurrencyText value={variant.estimatedHpp} /> : 'Belum dihitung'}
            </MetricCard>
            <MetricCard label={madeToOrder ? 'Cara menyiapkan produk' : 'Stok tersedia'} icon={Package} description={madeToOrder ? 'Produk dibuat setelah ada pesanan' : variant.currentStock <= 0 ? 'Stok habis, perlu produksi lagi' : variant.currentStock <= variant.minStock ? 'Stok mulai menipis' : 'Siap dijual ke pelanggan'}>
              {madeToOrder ? 'Buat saat dipesan' : <>{variant.currentStock.toLocaleString('id-ID')} <span className="text-sm font-normal">{variant.unit}</span></>}
            </MetricCard>
          </dl>

          <div className="flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="min-w-0">
              <p className="text-sm font-medium">Selisih harga dan biaya</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {metrics?.hasActual ? 'Menggunakan biaya produksi terakhir.' : 'Perkiraan menggunakan biaya bahan, sebelum upah dan biaya operasional.'}
              </p>
            </div>
            <p className={cn('min-w-0 break-words text-lg font-semibold tabular-nums', metrics?.cost !== null && metrics?.cost !== undefined && variant.sellingPrice < metrics.cost && 'text-red-700 dark:text-red-300')}>
              {metrics?.cost !== null && metrics?.cost !== undefined ? (
                <><CurrencyText value={variant.sellingPrice - metrics.cost} />
                  {metrics.margin !== null && <span className="ml-2 text-xs font-normal">({metrics.margin.toLocaleString('id-ID', { maximumFractionDigits: 1 })}% dari harga jual)</span>}
                  {variant.sellingPrice < metrics.cost && <span className="ml-2 text-sm">Di bawah biaya</span>}
                </>
              ) : 'Belum bisa dihitung'}
            </p>
          </div>

          <div className={cn('grid min-w-0 items-start gap-4', !madeToOrder && 'xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]')}>
            <ProductFormPanel title={`Resep ${variant.variantName}`} description={`Takaran bahan untuk membuat 1 ${variant.unit} produk.`}>
              {variant.ingredients.length === 0 ? (
                <div className="rounded-lg border border-dashed p-5">
                  <ClipboardList className="mb-2 size-5 text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm font-medium">Resep belum ditambahkan</p>
                  <p className="mt-1 text-sm text-muted-foreground">Isi bahan dan takarannya untuk menghitung biaya produk.</p>
                </div>
              ) : (
                <table className="w-full table-fixed text-left text-sm" aria-label={`Bahan resep ${variant.variantName}`}>
                  <thead className="border-b text-xs text-muted-foreground">
                    <tr>
                      <th className="w-[40%] pb-3 pr-3 font-medium" scope="col">Bahan</th>
                      <th className="pb-3 pr-2 font-medium" scope="col">Takaran</th>
                      <th className="pb-3 text-right font-medium" scope="col">Biaya bahan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {variant.ingredients.map(ingredient => (
                      <tr key={ingredient.id}>
                        <td className="break-words py-3 pr-3 font-medium">{ingredient.stockName}</td>
                        <td className="break-words py-3 pr-2 tabular-nums">{ingredient.quantity.toLocaleString('id-ID', { maximumFractionDigits: 6 })} {ingredient.baseUnit}</td>
                        <td className="break-words py-3 text-right tabular-nums"><CurrencyText value={ingredient.subtotalCost} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <p className="text-xs leading-5 text-muted-foreground">Perkiraan biaya bahan belum termasuk bahan terbuang, upah, listrik, dan biaya operasional lainnya.</p>
              {canEdit && <Button variant="outline" className="min-h-11 gap-2 px-4" onClick={() => setEditor({ step: 1, addVariant: false })}><Pencil className="size-4" aria-hidden="true" />Edit harga & resep</Button>}
            </ProductFormPanel>

            {!madeToOrder && (
              <ProductFormPanel title="Riwayat produksi" description="Lihat hasil produksi dan stok yang masih tersedia.">
                {variant.batches.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-4 text-sm leading-6 text-muted-foreground">Belum ada produksi yang dicatat untuk varian ini.</p>
                ) : (
                  <ul className="divide-y">
                    {variant.batches.map(batch => (
                      <li key={batch.id} className="space-y-2 py-4 first:pt-0 last:pb-0">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <span className="min-w-0 break-all text-sm font-medium">{batch.batchNumber}</span>
                          <time dateTime={batch.productionDate} className="text-xs text-muted-foreground">{productionDate(batch.productionDate)}</time>
                        </div>
                        <p className="text-sm">Tersisa <span className="font-semibold tabular-nums">{batch.remainingQuantity.toLocaleString('id-ID')}</span> dari {batch.initialQuantity.toLocaleString('id-ID')} {variant.unit}</p>
                        <p className="text-xs text-muted-foreground">Biaya per {variant.unit}: <CurrencyText value={batch.hppAtProduction} /></p>
                      </li>
                    ))}
                  </ul>
                )}
              </ProductFormPanel>
            )}
          </div>
        </section>
      )}

      {madeToOrder && (
        <ProductFormPanel title="Pilihan tambahan" description="Tambahan yang bisa dipilih pelanggan saat memesan.">
          {product.modifierGroups.length === 0 ? <p className="text-sm text-muted-foreground">Produk ini belum memiliki pilihan tambahan.</p> : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {product.modifierGroups.map(group => (
                <li key={group.id} className="min-w-0 rounded-lg border p-4">
                  <h3 className="break-words text-sm font-semibold">{group.name}</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {group.minSelection === 0 ? `Opsional, maksimal ${group.maxSelection} pilihan.` : group.minSelection === group.maxSelection ? `Pilih ${group.minSelection} tambahan.` : `Pilih ${group.minSelection} sampai ${group.maxSelection} tambahan.`}
                  </p>
                  <ul className="mt-3 space-y-2">
                    {group.options.filter(option => option.isActive).map(option => (
                      <li key={option.id} className="flex justify-between gap-3 text-sm">
                        <span className="min-w-0 break-words">{option.name}</span>
                        <span className="shrink-0 tabular-nums">+<CurrencyText value={option.price} /></span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </ProductFormPanel>
      )}

      <PriceReviewDialog
        open={priceReviewOpen}
        product={product}
        initialVariantId={variant?.id}
        onClose={() => setPriceReviewOpen(false)}
        onSaved={() => void query.refetch()}
      />
    </div>
  );
}
