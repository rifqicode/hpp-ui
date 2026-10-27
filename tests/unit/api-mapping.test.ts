import { describe, expect, it } from 'vitest'
import { normalizeSale } from '@/features/sales/services/sales-service'
import { toError } from '@/features/settings/services/settings-service'

describe('sales response mapping', () => {
  it('calculates net revenue, costs, and margin after a partial return', () => {
    const sale = normalizeSale({ id: 'sale-1', total_amount: '100000', total_cost: '40000', refunded_amount: '25000', restored_cost: '10000', items: [{ id: 'line-1', quantity: '4', returned_quantity: '1', price_at_sale: '25000', cost_at_sale: '10000', variant_id:'v1',variant_name:'Regular',product_name:'Roti',unit:'pcs',variant:{product_id:'p1',product:{name:'Roti',category:'Bakery'}} }] })
    expect(sale).toMatchObject({ originalTotalAmount: 100000, totalAmount: 75000, totalCost: 30000, grossProfit: 45000, profitMarginPct: 60 })
    expect(sale.items[0]).toMatchObject({ returnedQuantity: 1, quantity: 4, priceAtSale: 25000, costAtSale: 10000, productName: 'Roti - Regular', category: 'Bakery' })
  })
  it('handles a full refund without dividing by zero', () => {
    expect(normalizeSale({ id: 's1', totalAmount: 10000, totalCost: 4000, refunded_amount: 10000, restored_cost: 4000 })).toMatchObject({ totalAmount: 0, totalCost: 0, grossProfit: 0, profitMarginPct: 0, items: [] })
  })
  it('uses guest and item defaults for older responses', () => {
    expect(normalizeSale({ id: 's1', items: [{ id: 'i1', quantity: 1 }] })).toMatchObject({ customerName: 'Guest', invoiceNumber: 'TRX-UNKNOWN', paymentMethod: 'CASH', items: [expect.objectContaining({ productName: 'Produk - Varian', category: 'Uncategorized', unit: 'pcs' })] })
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
