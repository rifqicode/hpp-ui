import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PromotionCurrencyText as CurrencyText } from './promotion-currency';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { promotionError, promotionTypes } from '../lib/promotion-form';
import type { usePOSPromotions } from '../hooks/use-pos-promotions';
import type { Product } from '@/features/recipes/types';

export function POSPromotionDialog({ promotion, products }: { promotion: ReturnType<typeof usePOSPromotions>; products: Product[] }) {
  function itemName(item: { variant_id?: string | null; product_id?: string | null; category_id?: string | null }) {
    if (item.variant_id) { for (const product of products) { const variant = product.variants.find(row => row.id === item.variant_id); if (variant) return `${product.name} / ${variant.variantName}`; } }
    if (item.product_id) return products.find(product => product.id === item.product_id)?.name || 'Produk sesuai aturan';
    if (item.category_id) return products.find(product => product.categoryId === item.category_id)?.category || 'Kategori sesuai aturan';
    return 'Varian sesuai aturan';
  }
  return <Dialog open={promotion.open} onOpenChange={promotion.setOpen}><DialogContent className="max-w-2xl" closeButtonClassName="flex h-9 w-9 items-center justify-center top-2 right-2">
    <DialogHeader><DialogTitle>Gunakan Promosi</DialogTitle><DialogDescription>Pilih satu promosi yang memenuhi syarat. Harga dan ketersediaan diperiksa kembali saat pembayaran.</DialogDescription></DialogHeader>
    {promotion.candidates.isPending ? <p role="status" className="text-sm text-muted-foreground">Memeriksa promosi untuk keranjang ini…</p> : promotion.candidates.isError ? <p role="alert" className="text-sm text-destructive">{promotionError(promotion.candidates.error)}</p> : !promotion.candidates.data?.length ? <p className="text-sm text-muted-foreground">Belum ada promosi aktif untuk toko ini.</p> : <ul className="space-y-3">
      {promotion.candidates.data.map(candidate => <li key={candidate.id} className="space-y-3 rounded-xl border p-3">
        <div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h3 className="break-words text-sm font-semibold">{candidate.name}</h3><p className="text-xs text-muted-foreground">{promotionTypes.find(type => type.value === candidate.promo_type)?.label}</p></div><Badge variant={candidate.eligible ? 'success' : 'secondary'}>{candidate.eligible ? 'Memenuhi syarat' : 'Belum memenuhi syarat'}</Badge></div>
        {candidate.description && <p className="text-xs text-muted-foreground">{candidate.description}</p>}
        <p className="text-xs text-muted-foreground">Minimum belanja <CurrencyText value={candidate.min_purchase_amount} />{candidate.is_customer_required ? ' · Wajib nomor HP pelanggan' : ''}</p>
        {candidate.items.map((item, index) => <p key={index} className="text-xs text-muted-foreground">{item.item_role === 'TRIGGER' ? 'Pemicu' : 'Hadiah per set'}: {item.required_quantity} × {itemName(item)}{item.item_role === 'REWARD' ? ` · Harga hadiah Rp ${item.reward_price}` : ''}</p>)}
        {!candidate.eligible && <p className="text-xs text-destructive">{candidate.reason}</p>}
        {candidate.eligible && <p className="text-sm">Hemat <CurrencyText value={candidate.discount_amount} /></p>}
        <Button className="h-9 w-full rounded-lg" variant={candidate.id === promotion.selectedId ? 'secondary' : 'outline'} disabled={!candidate.eligible || promotion.candidates.isFetching} onClick={() => promotion.choose(candidate)}>{candidate.id === promotion.selectedId ? 'Pilih ulang promosi ini' : 'Pilih promosi'}</Button>
      </li>)}
    </ul>}
    {promotion.selectedId && <section className="space-y-3 rounded-xl border p-3" aria-label="Konfigurasi hadiah promo">
      <h3 className="text-sm font-semibold">{promotion.selectedName}</h3>
      {promotion.validating && <p role="status" className="text-sm text-muted-foreground">Memeriksa hadiah…</p>}
      <>
        {promotion.error && <p role="alert" className="text-sm text-destructive">{promotion.error}</p>}
        {promotion.configurationRewards.map(line => <div key={line.variant_id} className="space-y-2"><p className="text-sm font-medium">{line.name} × {line.quantity}</p>
          {(line.modifier_groups || []).map(group => {
            const chosen = promotion.rewardSelections[line.variant_id] || [];
            const count = group.options.filter(option => chosen.includes(option.id)).length;
            return <fieldset key={group.id} className="space-y-1"><legend className="text-xs text-muted-foreground">{group.name} · Pilih {group.min_selection}–{group.max_selection}</legend>
              {group.options.map(option => <label key={option.id} className="flex min-h-9 items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2"><input type="checkbox" checked={chosen.includes(option.id)} disabled={!chosen.includes(option.id) && count >= group.max_selection} onChange={event => promotion.configureReward(line.variant_id, event.target.checked ? [...chosen, option.id] : chosen.filter(id => id !== option.id))} />{option.name}</span><span>+<CurrencyText value={option.price} /></span></label>)}
            </fieldset>;
          })}
        </div>)}
        {promotion.candidate?.needs_configuration && <p className="text-xs text-muted-foreground">Lengkapi pilihan topping wajib untuk hadiah. Topping tetap ditagihkan penuh.</p>}
      </>
      <Button className="h-9 w-full rounded-lg" disabled={!promotion.ready} onClick={() => promotion.setOpen(false)}>Gunakan promo terpilih</Button>
    </section>}
    <div className="flex flex-wrap gap-2"><Button variant="outline" className="h-9 rounded-lg" disabled={promotion.candidates.isFetching} onClick={promotion.refresh}>Periksa ulang</Button>{promotion.selectedId && <Button variant="ghost" className="h-9 rounded-lg" onClick={() => { promotion.clear(); promotion.setOpen(false); }}>Lepas promosi</Button>}</div>
  </DialogContent></Dialog>;
}
