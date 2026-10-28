import { newPromotionInput } from '@/features/promotions/lib/promotion-form';
import type { Promotion, PromotionOptions, PromotionSimulation } from '@/features/promotions/types';

export const promotionStoreId = '11111111-1111-4111-8111-111111111111';
export const promotionVariantId = '22222222-2222-4222-8222-222222222222';
export const promotionOptions: PromotionOptions = { data: [
  { id: promotionVariantId, name: 'Roti / Regular', product_id: 'product-1', product_name: 'Roti', category_id: 'category-1', category_name: 'Bakery', selling_price: '20000' },
  { id: '33333333-3333-4333-8333-333333333333', name: 'Kopi / Regular', product_id: 'product-2', product_name: 'Kopi', category_id: 'category-2', category_name: 'Minuman', selling_price: '10000' },
], total: 2, page: 1, per_page: 50 };

export function simulationFixture(loss = false): PromotionSimulation {
  return {
    cost_basis_used: 'LATEST_HPP', health_status: loss ? 'MARGIN_DEFICIT' : 'PROFITABLE', is_loss_leader: loss,
    unit_economics: { gross_sales: '20000', promo_discount: '2000', net_sales: '18000', total_cogs: loss ? '21000' : '10000', gross_profit: loss ? '-3000' : '8000', margin_pct: loss ? '-16.67' : '44.44' },
    budget_analysis: { total_budget: '100000', discount_per_trx: '2000', recommended_usage_limit: 50, projected_gross_profit: loss ? '-150000' : '400000', projected_total_loss: loss ? '-150000' : '0' },
    prescriptive_advice: [], lines: [{ variant_id: promotionVariantId, name: 'Roti / Regular', quantity: '1', normal_price: '20000', charged_price: '20000', discount_amount: '2000', subtotal: '18000', total_cost: loss ? '21000' : '10000', gross_profit: loss ? '-3000' : '8000', is_reward_item: false }],
  };
}

export function promotionFixture(patch: Partial<Promotion> = {}): Promotion {
  return {
    ...newPromotionInput(), name: 'Sarapan Hemat', id: '44444444-4444-4444-8444-444444444444', store_id: promotionStoreId, cost_basis: 'LATEST_HPP',
    simulation_items: [{ variant_id: promotionVariantId, quantity: '1' }], version: 1, usage_count: 0, usage_limit: 50,
    budget_spent: '0', promo_budget: '100000', estimated_discount: '2000', planning_snapshot: simulationFixture(),
    created_at: '2026-10-28T00:00:00Z', updated_at: '2026-10-28T00:00:00Z', ...patch,
  };
}
