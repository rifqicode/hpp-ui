import { describe, expect, it } from 'vitest'
import { filterProducts, getProductMetrics, type ProductSort } from '@/features/recipes/lib/product-list'
import { product } from '../support/fixtures'

describe('product costs and margins', () => {
  it('prefers realized HPP over the current recipe estimate', () => {
    expect(getProductMetrics(product({ estimatedHpp: 3000 }))).toMatchObject({ cost: 4000, actualHpp: 4000, estimatedHpp: 3000, margin: 60, needsAttention: false })
  })
  it('calculates a missing estimate from ingredients, yield, and waste', () => {
    const item = product({ latestHpp: 0, yieldQty: 10, wastePct: 0.1, ingredients: [{ id: 'i1', productId: 'product-1', stockId: 's1', stockName: 'Tepung', baseUnit: 'g', quantity: 100, unitCost: 100, subtotalCost: 10000, availableStock: 500 }] })
    expect(getProductMetrics(item)).toMatchObject({ actualHpp: null, estimatedHpp: 1100, cost: 1100, margin: 89, needsAttention: true })
  })
  it('handles absent costs, zero yield, and unset selling prices', () => {
    expect(getProductMetrics(product({ latestHpp: 0, yieldQty: 0, sellingPrice: 0 }))).toMatchObject({ cost: null, margin: null })
  })
  it.each([0, 5])('flags stock at or below the minimum: %i', (currentStock) => {
    expect(getProductMetrics(product({ currentStock })).lowStock).toBe(true)
  })
  it('does not flag stock levels for a made to order product', () => {
    expect(getProductMetrics(product({ mode: 'MAKE_TO_ORDER', currentStock: 0 })).lowStock).toBe(false)
  })
  it('flags a loss even when there is sufficient stock', () => {
    expect(getProductMetrics(product({ latestHpp: 15000 }))).toMatchObject({ margin: -50, needsAttention: true })
  })
})

describe('product filtering and sorting', () => {
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
