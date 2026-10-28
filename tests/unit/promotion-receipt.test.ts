import { describe, expect, it } from 'vitest';
import { isFreeReward, rewardBadge } from '@/features/promotions/lib/receipt-promotion';
import { normalizeSale } from '@/features/sales/services/sales-service';

describe('promotion receipt labels', () => {
  it('keeps a free base item free when decimal-priced toppings are fully charged', () => {
    expect(isFreeReward('0.3', [{ price: '0.1' }, { price: '0.2' }])).toBe(true);
    expect(isFreeReward('0.3001', [{ price: '0.1' }, { price: '0.2' }])).toBe(false);
  });
  it('normalizes snapshots and preserves the free/special distinction for receipts', () => {
    const sale = normalizeSale({ promotion_id: 'p1', promotions: [{ promo_name: 'Coffee Offer' }], items: [
      { id: 'free', is_reward_item: true, price_at_sale: '3000', modifiers: [{ id: 'extra', name: 'Shot', price: '3000' }] },
      { id: 'special', is_reward_item: true, price_at_sale: '6000', modifiers: [{ id: 'extra', name: 'Shot', price: '3000' }] },
      { id: 'normal', price_at_sale: '10000' },
    ] });
    expect(sale.promotionId).toBe('p1');
    expect(sale.promotions?.[0].promo_name).toBe('Coffee Offer');
    expect(sale.items.map(rewardBadge)).toEqual(['[GRATIS]', '[TEBUS MURAH]', '']);
  });
});
