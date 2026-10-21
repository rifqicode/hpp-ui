import { test, expect } from '@playwright/test'
import { buildPurchaseOrderItems, type PurchaseOrderItemDraft } from '../src/features/purchase-orders/lib/order-items'

const item: PurchaseOrderItemDraft = { stockId: 'stock-1', stockName: 'Tepung', quantity: '2', baseUnit: 'g', inputUnit: 'kg', totalPrice: '50000' }

test('Purchase Order keeps quantity-only payload even after switching away from Direct Order', () => {
  expect(buildPurchaseOrderItems([item], 'PURCHASE_ORDER')).toEqual([{ stock_id: 'stock-1', quantity: 2000 }])
})

test('Direct Order includes invoice total and converts package quantity to base units', () => {
  expect(buildPurchaseOrderItems([{ ...item, inputUnit: 'kemasan', packageSize: 25000 }], 'DIRECT_ORDER')).toEqual([
    { stock_id: 'stock-1', quantity: 50000, total_price: 50000 },
  ])
})

for (const category of ['PURCHASE_ORDER', 'DIRECT_ORDER'] as const) {
  test(`${category} normalizes valid conversion results in the JSON payload`, () => {
    for (const [draft, expected] of [
      [{ ...item, quantity: '1.001' }, 1001],
      [{ ...item, quantity: '3', inputUnit: 'kemasan', packageSize: 0.1 }, 0.3],
    ] as const) {
      const payload = JSON.parse(JSON.stringify(buildPurchaseOrderItems([draft], category)))
      expect(payload[0].quantity).toBe(expected)
    }
    expect(() => buildPurchaseOrderItems([{ ...item, quantity: '0.12345', inputUnit: 'g' }], category)).toThrow()
    expect(() => buildPurchaseOrderItems([{ ...item, quantity: '0.0000000001', inputUnit: 'g' }], category)).toThrow()
  })
}

test('Direct Order rejects incomplete item details or prices before submitting', () => {
  const invalid: PurchaseOrderItemDraft[] = [
    { ...item, totalPrice: undefined }, { ...item, totalPrice: '0' }, { ...item, totalPrice: '-1' },
    { ...item, totalPrice: 'Infinity' }, { ...item, totalPrice: '0.00001' },
    { ...item, totalPrice: '0.0001' }, // Unit cost would round to zero.
    { ...item, stockId: '' }, { ...item, quantity: '0' },
    { ...item, inputUnit: 'kemasan', packageSize: 0 },
  ]
  for (const row of invalid) expect(() => buildPurchaseOrderItems([row], 'DIRECT_ORDER')).toThrow()
  expect(() => buildPurchaseOrderItems([], 'DIRECT_ORDER')).toThrow()
})
