import { test, expect } from '@playwright/test';
import { getProductMetrics, filterProducts } from '../src/features/recipes/lib/product-list';
import type { Product } from '../src/features/recipes/types';

function product(values: Partial<Product> = {}): Product {
  return { id: 'test', name: 'Roti Coklat', category: 'Bakery', unit: 'pcs', mode: 'MAKE_TO_STOCK', yieldQty: 10, wastePct: 0.1, imageUrl: null, sellingPrice: 15000, currentStock: 20, latestHpp: 0, minStock: 5, createdAt: '2026-10-19', ingredients: [{ id: 'ingredient', productId: 'test', stockId: 'stock', stockName: 'Tepung', baseUnit: 'gr', quantity: 1000, unitCost: 10, subtotalCost: 10000, availableStock: 10000 }], ...values };
}

test('uses backend estimate or yield/waste per-unit fallback, and prefers actual HPP', () => {
  expect(getProductMetrics(product()).cost).toBe(1100);
  expect(getProductMetrics(product({ estimatedHpp: 2300 })).cost).toBe(2300);
  expect(getProductMetrics(product({ latestHpp: 9000, estimatedHpp: 2300 }))).toMatchObject({ cost: 9000, hasActualHpp: true, margin: 40 });
  expect(getProductMetrics(product({ yieldQty: 0.5, wastePct: 0 })).cost).toBe(20000);
});

test('missing cost or selling price cannot produce a misleading margin', () => {
  expect(getProductMetrics(product({ ingredients: [], estimatedHpp: 0 }))).toMatchObject({ cost: null, margin: null });
  expect(getProductMetrics(product({ sellingPrice: 0 }))).toMatchObject({ margin: null });
  expect(getProductMetrics(product({ latestHpp: 9000, sellingPrice: 7000 }))).toMatchObject({ margin: -28.6, needsAttention: true });
});

test('stock warning respects zero thresholds and excludes MTO stock', () => {
  expect(getProductMetrics(product({ mode: 'MAKE_TO_ORDER', currentStock: 0, latestHpp: 9000 }))).toMatchObject({ lowStock: false, needsAttention: false });
  expect(getProductMetrics(product({ currentStock: 1, minStock: 0, latestHpp: 9000 })).lowStock).toBe(false);
  expect(getProductMetrics(product({ currentStock: 0, minStock: 0, latestHpp: 9000 })).lowStock).toBe(true);
});

test('filters combine across ingredient search, category and stock, with missing margins sorted last', () => {
  const products = [product({ id: 'unknown', ingredients: [], estimatedHpp: 0 }), product({ id: 'low', currentStock: 1, latestHpp: 9000 }), product({ id: 'mto', mode: 'MAKE_TO_ORDER', currentStock: 0, latestHpp: 9000 }), product({ id: 'other', category: 'Pastry', latestHpp: 9000 })];
  expect(filterProducts(products, ' tepung ', 'Bakery', 'low-stock', 'name-asc').map((item) => item.id)).toEqual(['low']);
  for (const sort of ['margin-asc', 'margin-desc'] as const) expect(filterProducts(products, '', '', 'all', sort).at(-1)?.id).toBe('unknown');
  expect(filterProducts(products, '', '', 'no-hpp', 'name-asc').map((item) => item.id)).toEqual(['unknown']);
});
