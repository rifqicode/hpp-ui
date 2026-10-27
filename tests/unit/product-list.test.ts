import { describe, expect, it } from 'vitest'
import { filterProducts, getProductMetrics, getVariantMetrics, type ProductSort } from '@/features/recipes/lib/product-list'
import { product } from '../support/fixtures'

describe('getVariantMetrics', () => {
  it('computes metrics when both latestHpp and estimatedHpp exist and estimated is higher', () => {
    const variant = { ...product().variants[0], latestHpp: 4000, estimatedHpp: 5000, sellingPrice: 10000 };
    const metrics = getVariantMetrics(variant);
    expect(metrics).toEqual({
      hasActual: true,
      hasEstimated: true,
      actual: true,
      cost: 4000,
      isCostHigher: true,
      margin: 60,
    });
  });

  it('computes metrics when estimatedHpp is lower than latestHpp', () => {
    const variant = { ...product().variants[0], latestHpp: 6000, estimatedHpp: 5000, sellingPrice: 10000 };
    const metrics = getVariantMetrics(variant);
    expect(metrics).toEqual({
      hasActual: true,
      hasEstimated: true,
      actual: true,
      cost: 6000,
      isCostHigher: false,
      margin: 40,
    });
  });

  it('handles only latestHpp present', () => {
    const variant = { ...product().variants[0], latestHpp: 4000, estimatedHpp: 0, sellingPrice: 10000 };
    const metrics = getVariantMetrics(variant);
    expect(metrics).toEqual({
      hasActual: true,
      hasEstimated: false,
      actual: true,
      cost: 4000,
      isCostHigher: false,
      margin: 60,
    });
  });

  it('handles only estimatedHpp present', () => {
    const variant = { ...product().variants[0], latestHpp: 0, estimatedHpp: 5000, sellingPrice: 10000 };
    const metrics = getVariantMetrics(variant);
    expect(metrics).toEqual({
      hasActual: false,
      hasEstimated: true,
      actual: false,
      cost: 5000,
      isCostHigher: false,
      margin: 50,
    });
  });

  it('handles neither present', () => {
    const variant = { ...product().variants[0], latestHpp: 0, estimatedHpp: 0, sellingPrice: 10000 };
    const metrics = getVariantMetrics(variant);
    expect(metrics).toEqual({
      hasActual: false,
      hasEstimated: false,
      actual: false,
      cost: null,
      isCostHigher: false,
      margin: null,
    });
  });
});

describe('product costs and margins',()=>{
 it('uses the actual cost of each variant before its estimate',()=>{expect(getProductMetrics(product({estimatedHpp:3000}))).toMatchObject({hasActualHpp:true,margin:60,needsAttention:false});});
 it('uses the per-unit estimate without yield/waste multipliers',()=>{expect(getProductMetrics(product({latestHpp:0,estimatedHpp:1100}))).toMatchObject({hasActualHpp:false,margin:89,needsAttention:true});});
 it('handles absent costs and prices',()=>{expect(getProductMetrics(product({latestHpp:0,sellingPrice:0})).margin).toBeNull();});
 it.each([0,5])('flags stock at or below minimum %i',currentStock=>{expect(getProductMetrics(product({currentStock})).lowStock).toBe(true);});
 it('does not flag MTO as out of finished goods',()=>{expect(getProductMetrics(product({mode:'MAKE_TO_ORDER',currentStock:0})).lowStock).toBe(false);});
 it('flags loss on any active variant',()=>{const p=product();p.variants.push({...p.variants[0],id:'v2',variantName:'Large',latestHpp:15000,isDefault:false});expect(getProductMetrics(p)).toMatchObject({margin:-50,needsAttention:true});});
 it('ignores an archived variant for catalog attention',()=>{const p=product();p.variants.push({...p.variants[0],id:'v2',isActive:false,currentStock:0,latestHpp:15000});expect(getProductMetrics(p).needsAttention).toBe(false);});
});

describe('product filtering and sorting', () => {
  it('filters losses using any active variant', () => {
    const loss = product({ id: 'loss', sellingPrice: 1000, latestHpp: 2000 });
    expect(filterProducts([product(), loss], '', '', 'loss', 'name-asc').map(item => item.id)).toEqual(['loss']);
  });
  const products = [product(), product({ id: 'p2', name: 'Donat', category: 'Donat', sellingPrice: 5000, latestHpp: 0, currentStock: 0 }), product({ id: 'p3', name: 'Susu', category: 'Minuman', sellingPrice: 8000, latestHpp: 6000, currentStock: 10 })]
  it('normalizes search whitespace and casing', () => {
    expect(filterProducts(products, ' ROTI ', '', 'all', 'name-asc').map(p => p.id)).toEqual(['product-1'])
  })
  it('combines category and attention filters', () => {
    expect(filterProducts(products, '', 'Donat', 'low-stock', 'name-asc').map(p => p.id)).toEqual(['p2'])
    expect(filterProducts(products, '', '', 'no-hpp', 'name-asc').map(p => p.id)).toEqual(['p2'])
    expect(filterProducts(products, '', '', 'needs-attention', 'name-asc').map(p => p.id)).toEqual(['p2'])
  })
  it.each<[ProductSort, string[]]>([
    ['name-asc', ['p2', 'product-1', 'p3']], ['name-desc', ['p3', 'product-1', 'p2']],
    ['price-asc', ['p2', 'p3', 'product-1']], ['price-desc', ['product-1', 'p3', 'p2']],
    ['stock-asc', ['p2', 'p3', 'product-1']], ['margin-asc', ['p3', 'product-1', 'p2']],
    ['margin-desc', ['product-1', 'p3', 'p2']],
  ])('sorts using %s and puts missing margins last', (sort, expected) => {
    expect(filterProducts(products, '', '', 'all', sort).map(p => p.id)).toEqual(expected)
  })
  it('breaks ties by id without reordering the original list', () => {
    const input = [product({ id: 'z' }), product({ id: 'a' })]
    expect(filterProducts(input, '', '', 'all', 'price-asc').map(p => p.id)).toEqual(['a', 'z'])
    expect(input.map(p => p.id)).toEqual(['z', 'a'])
  })
})
