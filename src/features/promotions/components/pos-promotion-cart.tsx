import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PromotionCurrencyText as CurrencyText } from './promotion-currency';
import type { usePOSPromotions } from '../hooks/use-pos-promotions';

type State = ReturnType<typeof usePOSPromotions>;

export function POSRewardItems({ promotion }: { promotion: State }) {
  return <>{promotion.rewards.map(line => {
    const reward = promotion.candidate?.items.find(item => item.item_role === 'REWARD' && item.variant_id === line.variant_id);
    const free = reward && /^0(?:\.0*)?$/.test(reward.reward_price);
    return <div key={line.variant_id} className="space-y-2 rounded-lg border border-primary/30 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="break-words text-sm font-semibold">{line.name}</p><Badge variant="secondary">{free ? '[GRATIS]' : '[TEBUS MURAH]'}</Badge></div>
      <div className="flex justify-between gap-2 text-xs"><span>{line.quantity} × <CurrencyText value={line.charged_price} /></span><CurrencyText value={line.subtotal} /></div>
      {line.modifier_groups?.flatMap(group => group.options).filter(option => line.modifier_option_ids?.includes(option.id)).map(option => <p key={option.id} className="text-xs text-muted-foreground">+ {option.name} · <CurrencyText value={option.price} /></p>)}
      {Boolean(line.modifier_groups?.length) && <Button variant="outline" className="h-8 w-full text-xs" onClick={() => promotion.setOpen(true)}>Atur topping hadiah</Button>}
    </div>;
  })}</>;
}

export function POSPromotionControls({ promotion, hasItems }: { promotion: State; hasItems: boolean }) {
  if (!promotion.permitted) return null;
  return <div className="space-y-2">
    <Button variant="outline" className="h-8 w-full text-xs" disabled={!hasItems} onClick={() => promotion.setOpen(true)}>Gunakan Promosi</Button>
    {promotion.selectedId && <div className="space-y-2 rounded-lg border p-2.5 text-xs">
      <p className="break-words font-semibold">Promo: {promotion.selectedName}</p>
      {promotion.validating ? <p role="status" className="text-muted-foreground">Memvalidasi keranjang dan hadiah…</p> : promotion.error ? <p role="alert" className="text-destructive">{promotion.error}</p> : promotion.applied?.needs_configuration ? <p className="text-muted-foreground">Lengkapi topping wajib hadiah sebelum membayar.</p> : promotion.applied && <p>Potongan <CurrencyText value={promotion.applied.discount_amount} /></p>}
      <Button variant="ghost" className="h-8 w-full text-xs" onClick={promotion.clear}>Lepas promosi</Button>
    </div>}
  </div>;
}
