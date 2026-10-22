import { describe, expect, it } from 'vitest'
import { transformProductFromApi } from '@/features/recipes/services/recipe-service'
import { normalizeSale } from '@/features/sales/services/sales-service'
import { toError } from '@/features/settings/services/settings-service'

describe('product response mapping', () => {
  it('maps numeric API strings, ingredient costs, and batch lots', () => {
    const result = transformProductFromApi({
      id: 'p1', name: 'Roti', selling_price: '10000', latest_hpp: '4000', current_stock: '20',
      mode: 'MAKE_TO_ORDER', yield_qty: '10', waste_pct: '0.1', estimated_hpp: '3500',
      ingredients: [{ id: 'i1', stock_id: 's1', stock_name: 'Tepung', quantity: '100', unit_cost: '10' }],
      batches: [{ id: 'batch-123456', remaining_quantity: '2', initial_quantity: '10', hpp_at_production: '4000' }],
    })
    expect(result).toMatchObject({ sellingPrice: 10000, latestHpp: 4000, estimatedHpp: 3500, currentStock: 20, mode: 'MAKE_TO_ORDER', yieldQty: 10, wastePct: 0.1 })
    expect(result.ingredients[0]).toMatchObject({ productId: 'p1', stockId: 's1', stockName: 'Tepung', quantity: 100, unitCost: 10, subtotalCost: 1000 })
    expect(result.batches?.[0]).toMatchObject({ remainingQuantity: 2, initialQuantity: 10, hppAtProduction: 4000, status: 'active' })
  })
  it('supports camelCase responses and depleted lots', () => {
    expect(transformProductFromApi({ id: 'p1', name: 'Roti', categoryName: 'Bakery', sellingPrice: 12000, latestHpp: 3000, imageUrl: 'https://example.com/roti.png', batches: [{ id: 'b1', remainingQuantity: 0 }] })).toMatchObject({ category: 'Bakery', sellingPrice: 12000, latestHpp: 3000, imageUrl: 'https://example.com/roti.png', batches: [expect.objectContaining({ status: 'depleted' })] })
  })
  it('supplies defaults when optional or numeric fields are missing or invalid', () => {
    expect(transformProductFromApi({ id: 'p1', name: 'Roti', yield_qty: 'invalid', selling_price: 'invalid', mode: 'unknown' })).toMatchObject({ unit: 'pcs', mode: 'MAKE_TO_STOCK', yieldQty: 1, sellingPrice: 0, latestHpp: 0, ingredients: [], batches: [] })
    expect(transformProductFromApi({ id: 'p2', name: 'Roti', yieldQty: 0 }).yieldQty).toBe(1)
  })
})

describe('sales response mapping', () => {
  it('calculates net revenue, costs, and margin after a partial return', () => {
    const sale = normalizeSale({ id: 'sale-1', total_amount: '100000', total_cost: '40000', refunded_amount: '25000', restored_cost: '10000', items: [{ id: 'line-1', quantity: '4', returned_quantity: '1', price_at_sale: '25000', cost_at_sale: '10000', product: { id: 'p1', name: 'Roti', category: { name: 'Bakery' }, unit: 'pcs' } }] })
    expect(sale).toMatchObject({ originalTotalAmount: 100000, totalAmount: 75000, totalCost: 30000, grossProfit: 45000, profitMarginPct: 60 })
    expect(sale.items[0]).toMatchObject({ returnedQuantity: 1, quantity: 4, priceAtSale: 25000, costAtSale: 10000, productName: 'Roti', category: 'Bakery' })
  })
  it('handles a full refund without dividing by zero', () => {
    expect(normalizeSale({ id: 's1', totalAmount: 10000, totalCost: 4000, refunded_amount: 10000, restored_cost: 4000 })).toMatchObject({ totalAmount: 0, totalCost: 0, grossProfit: 0, profitMarginPct: 0, items: [] })
  })
  it('uses guest and item defaults for older responses', () => {
    expect(normalizeSale({ id: 's1', items: [{ id: 'i1', quantity: 1 }] })).toMatchObject({ customerName: 'Guest', invoiceNumber: 'TRX-UNKNOWN', paymentMethod: 'CASH', items: [expect.objectContaining({ productName: 'Product', category: 'Uncategorized', unit: 'pcs' })] })
  })
})

describe('settings error messages', () => {
  it.each([
    [{ response: { data: { message: 'Akses ditolak' } } }, 'Akses ditolak'],
    [{ response: { data: { error: 'Tidak ditemukan' } } }, 'Tidak ditemukan'],
    [{ response: { data: { errors: 'Nama wajib diisi' } } }, 'Nama wajib diisi'],
    [{ response: { data: { errors: ['Nama wajib diisi', 'Email tidak valid'] } } }, 'Nama wajib diisi, Email tidak valid'],
    [{ response: { data: { errors: { name: 'Nama wajib diisi', email: '' } } } }, 'Nama wajib diisi'],
    [new Error('Koneksi terputus'), 'Koneksi terputus'],
    [new Error('Request failed with status code 500'), 'Gagal menyimpan'],
    [null, 'Gagal menyimpan'], [{}, 'Gagal menyimpan'],
  ])('extracts a useful message from %j', (error, expected) => {
    expect(toError(error, 'Gagal menyimpan').message).toBe(expected)
  })
})
