import { describe, expect, it } from 'vitest';
import { changePromotionType, formReadiness, fromLocalDateTime, inputFromPromotion, newPromotionInput, positiveDecimal, toLocalDateTime } from '@/features/promotions/lib/promotion-form';
import { getActiveMenuTitle } from '@/lib/page-info';
import { filterNavigation, getActiveNavigationIds, NAVIGATION } from '@/components/layout/sidebar-navigation';
import { promotionFixture } from '../support/promotion-fixtures';

describe('promotion form contracts', () => {
  it('preserves stored decimals and version while clearing previous risk confirmation', () => {
    const input = inputFromPromotion(promotionFixture({ discount_value: '9.9999', version: 7, loss_leader_confirmed: true }));
    expect(input.discount_value).toBe('9.9999');
    expect(input.version).toBe(7);
    expect(input.loss_leader_confirmed).toBe(false);
    expect(input).not.toHaveProperty('planning_snapshot');
    expect(input).not.toHaveProperty('budget_spent');
  });
  it('never invents a default cost basis and clears incompatible strategy fields', () => {
    const initial = newPromotionInput();
    expect(initial.cost_basis).toBe('');
    expect(formReadiness(initial)).toContain('dasar HPP');
    const bundle = changePromotionType(initial, 'BUNDLE');
    expect(bundle.items).toEqual([]);
    expect(bundle.discount_type).toBe('');
    const direct = changePromotionType(bundle, 'DIRECT_DISCOUNT');
    expect(direct.bundle_price).toBeNull();
    expect(direct.items).toEqual([]);
  });
  it.each(['0.0001', '1', '9999999999999999.9999'])('accepts precise positive decimal %s without financial arithmetic', value => expect(positiveDecimal(value)).toBe(true));
  it.each(['0', '-1', '1e3', '1.00001', ''])('rejects invalid or nonpositive decimal %s', value => expect(positiveDecimal(value)).toBe(false));
  it('round-trips a local schedule instant', () => {
    const iso = fromLocalDateTime('2026-10-28T14:30');
    expect(toLocalDateTime(iso)).toBe('2026-10-28T14:30');
    expect(fromLocalDateTime('')).toBeNull();
  });
  it('registers the master route with a separate menu permission and subscription feature', () => {
    expect(getActiveMenuTitle('/sales/promotions')).toBe('Promosi & Diskon');
    expect([...getActiveNavigationIds(NAVIGATION, '/sales/promotions')]).toEqual(['order', 'promotions']);
    const visible = filterNavigation(NAVIGATION, code => code === 'menu:promotions');
    const item = visible.find(group => group.id === 'order')?.children?.find(child => child.id === 'promotions');
    expect(item?.requiredFeature).toBe('promotions_discounts');
    expect(filterNavigation(NAVIGATION, code => code === 'menu:pos').find(group => group.id === 'order')?.children?.some(child => child.id === 'promotions')).toBe(false);
  });
});
