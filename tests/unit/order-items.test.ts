import { describe, expect, it } from 'vitest'
import { buildPurchaseOrderItems, type PurchaseOrderItemDraft } from '@/features/purchase-orders/lib/order-items'

const item: PurchaseOrderItemDraft = {
  stockId: 'flour', stockName: 'Tepung', quantity: '2',
  inputUnit: 'kg', baseUnit: 'g', totalPrice: '30000',
}

describe('purchase order items', () => {
  it('converts purchasing quantities to the stock base unit', () => {
    expect(buildPurchaseOrderItems([item], 'PURCHASE_ORDER')).toEqual([
      { stock_id: 'flour', quantity: 2000 },
    ])
  })

  it('includes invoice totals for direct orders', () => {
    expect(buildPurchaseOrderItems([item], 'DIRECT_ORDER')).toEqual([
      { stock_id: 'flour', quantity: 2000, total_price: 30000 },
    ])
  })

  it('converts package counts using the configured size', () => {
    expect(buildPurchaseOrderItems([
      { ...item, inputUnit: 'kemasan', packageSize: 25000 },
    ], 'PURCHASE_ORDER')[0].quantity).toBe(50000)
  })

  it('rejects an empty order', () => {
    expect(() => buildPurchaseOrderItems([], 'PURCHASE_ORDER')).toThrow('Tambahkan minimal 1 item')
  })

  it.each([{ stockId: '' }, { stockName: '' }])('rejects an unselected material: %j', (override) => {
    expect(() => buildPurchaseOrderItems([{ ...item, ...override }], 'PURCHASE_ORDER'))
      .toThrow('belum dipilih')
  })

  it.each(['0', '-1', 'abc', 'Infinity', '0.00000001'])('rejects invalid base quantities: %s', (quantity) => {
    expect(() => buildPurchaseOrderItems([{ ...item, quantity }], 'PURCHASE_ORDER'))
      .toThrow('Kuantitas untuk "Tepung"')
  })

  it('rejects incompatible dimensions and packages without a size', () => {
    for (const inputUnit of ['ml', 'kemasan']) {
      expect(() => buildPurchaseOrderItems([{ ...item, inputUnit }], 'PURCHASE_ORDER'))
        .toThrow('Kuantitas')
    }
  })

  it.each(['', '0', '-10', 'abc', 'Infinity', '12.12345', '0.0001'])('rejects invalid invoice totals: %s', (totalPrice) => {
    expect(() => buildPurchaseOrderItems([{ ...item, totalPrice }], 'DIRECT_ORDER'))
      .toThrow('Total harga faktur')
  })

  it('validates every item without mutating the draft', () => {
    const draft = { ...item }
    expect(() => buildPurchaseOrderItems([draft, { ...item, stockId: '' }], 'DIRECT_ORDER'))
      .toThrow('belum dipilih')
    expect(draft).toEqual(item)
  })
})
