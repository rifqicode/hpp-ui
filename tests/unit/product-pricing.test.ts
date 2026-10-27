import { describe, expect, it } from 'vitest';
import { getSuggestedSellingPrice, newVariant } from '@/features/recipes/lib/product-form';
import { filterProducts, needsPriceReview } from '@/features/recipes/lib/product-list';
import { product } from '../support/fixtures';

describe('optional selling price calculator', () => {
  const materials = [{ id: 'flour', name: 'Tepung', baseUnit: 'g', currentStock: 1000, avgCostPerUnit: 10 }];

  it('calculates a suggestion from current material costs without changing a manual price', () => {
    const variant = { ...newVariant('Regular'), sellingPrice: 12500, targetMargin: 0.5, ingredients: [{ stockId: 'flour', quantity: 100, unit: 'g' }] };
    expect(getSuggestedSellingPrice(variant, materials)).toBe(2000);
    expect(getSuggestedSellingPrice(variant, [{ ...materials[0], avgCostPerUnit: 20 }])).toBe(4000);
    expect(variant.sellingPrice).toBe(12500);
  });

  it('does not suggest a price when ingredient costs or the percentage are invalid', () => {
    const variant = { ...newVariant('Regular'), ingredients: [{ stockId: 'flour', quantity: 100, unit: 'g' }] };
    expect(getSuggestedSellingPrice(variant)).toBeNull();
    expect(getSuggestedSellingPrice(variant, [])).toBeNull();
    expect(getSuggestedSellingPrice({ ...variant, targetMargin: -1 }, materials)).toBeNull();
    expect(getSuggestedSellingPrice({ ...variant, targetMargin: 1 }, materials)).toBeNull();
    expect(getSuggestedSellingPrice({ ...variant, ingredients: [] }, materials)).toBeNull();
  });
});

describe('price review signals', () => {
  it('flags a higher ingredient estimate even when the old production cost still leaves a positive margin', () => {
    const item = product({ latestHpp: 4000, estimatedHpp: 6000, sellingPrice: 10000 });
    expect(needsPriceReview(item.variants[0])).toBe(true);
    expect(filterProducts([item], '', '', 'price-review', 'name-asc')).toEqual([item]);
  });

  it('flags prices below current estimates or actual production costs and ignores archived variants', () => {
    const variant = product().variants[0];
    expect(needsPriceReview({ ...variant, sellingPrice: 3000, estimatedHpp: 5000 })).toBe(true);
    expect(needsPriceReview({ ...variant, sellingPrice: 3000, estimatedHpp: 0 })).toBe(true);
    expect(needsPriceReview({ ...variant, sellingPrice: 3000, estimatedHpp: 5000, isActive: false })).toBe(false);
    expect(needsPriceReview({ ...variant, sellingPrice: 10000, estimatedHpp: 3000 })).toBe(false);
  });
  it('can prompt review before the price falls below costs, using the saved additional rate', () => {
    const variant = { ...product().variants[0], latestHpp: 0, estimatedHpp: 2000, sellingPrice: 3000, targetMargin: 0.5 };
    expect(needsPriceReview(variant)).toBe(true);
    expect(needsPriceReview({ ...variant, sellingPrice: 4000 })).toBe(false);
  });
});
