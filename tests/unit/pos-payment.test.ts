import { describe, expect, it } from 'vitest';
import { calculatePOSPayment, getQuickCashAmounts } from '@/features/sales/lib/payment';

describe('POS payment amounts', () => {
  it.each([
    [102689.9988, 102700, 10.0012],
    [102649.6, 102600, -49.6],
    [102650, 102700, 50],
    [102700, 102700, 0],
    [0, 0, 0],
    [49.9999, 0, -49.9999],
  ])('rounds cash total %s to %s with adjustment %s', (total, payableTotal, cashRoundingAdjustment) => {
    expect(calculatePOSPayment(total, 'CASH')).toEqual({ payableTotal, cashRoundingAdjustment });
  });

  it.each(['QRIS', 'EDC', 'TRANSFER'] as const)('preserves four decimal places for %s', method => {
    expect(calculatePOSPayment(102689.9988, method)).toEqual({ payableTotal: 102689.9988, cashRoundingAdjustment: 0 });
  });

  it.each([0, 10000, 102700, 200000, 1000000, 12500000])('never suggests insufficient cash for %s', total => {
    const amounts = getQuickCashAmounts(total);
    expect(amounts.length).toBeGreaterThan(0);
    expect(new Set(amounts).size).toBe(amounts.length);
    for (const amount of amounts) {
      expect(amount).toBeGreaterThanOrEqual(total);
      expect(Number.isInteger(amount)).toBe(true);
    }
  });
});
