import { describe, expect, it } from 'vitest';
import { materialUnitCost } from '@/features/onboarding/lib/material-unit-cost';

describe('onboarding material unit cost', () => {
  it.each([
    ['20000', '1000', '20'],
    ['40000', '2000', '20'],
    ['25000', '50', '500'],
    ['12.3456', '0.125', '98.7648'],
    ['1', '6', '0.1667'],
    ['1', '20000', '0.0001'],
    ['9007199254740993', '1', '9007199254740993'],
  ])('divides total %s by quantity %s with four-decimal half-up rounding', (price, quantity, expected) => {
    expect(materialUnitCost(price, quantity)).toBe(expected);
  });

  it.each([['', '1000'], ['20000', ''], ['20000', '0'], ['0', '1000'], ['-10', '1'], ['not-a-number', '1']])('leaves invalid total %s or quantity %s uncalculated', (price, quantity) => {
    expect(materialUnitCost(price, quantity)).toBeNull();
  });
});
