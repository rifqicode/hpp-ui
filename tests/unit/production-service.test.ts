import { beforeEach, describe, expect, it, vi } from 'vitest'
import { productionService } from '@/features/production/services/production-service'
const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock('@/lib/api-client', () => ({ default: http }))
beforeEach(() => { vi.resetAllMocks(); http.get.mockResolvedValue({ data: {} }); http.post.mockResolvedValue({ data: {} }) })

describe('production backend mapping', () => {
  it('uses actual consumptions, snapshot names, and all overhead categories', async () => {
    const raw = { id: 'b1', batch_number: 'B-1', status: 'COMPLETED', qty_planned: '10', qty_actual: '9', waste_quantity: '1', bom_cost: '1000', total_cost: '2000', hpp_per_unit: '222', recipe_snapshot: { product_name: 'Roti', product_category: 'Bakery', product_unit: 'pcs', selling_price: '1000', items: [{ stock_id: 's1', stock_name: 'Tepung', unit: 'g' }] }, consumptions: [{ stock_id: 's1', quantity: '100', subtotal_cost: '1000' }, { stock_id: 's2', stock: { name: 'Gula', base_unit: 'g' } }, { stock_id: 's3' }], overheads: [{ name: 'Tenaga kerja', amount: 10 }, { name: 'Gas', amount: 20 }, { name: 'Kemasan', amount: 30 }, { name: 'Lainnya', amount: 40 }, {}] }
    http.get.mockResolvedValueOnce({ data: raw })
    const batch = await productionService.getBatchById('b1')
    expect(batch).toMatchObject({ productName: 'Roti', targetQuantity: 10, goodQuantity: 9, wasteQuantity: 1, stockCost: 1000, hasActualConsumptions: true, overheadBreakdown: { labor: 10, energy: 20, packaging: 30, other: 40 } })
    expect(batch.ingredients).toMatchObject([{ stockName: 'Tepung', quantity: 100, cost: 1000 }, { stockName: 'Gula', baseUnit: 'g' }, { stockName: 'Bahan', baseUnit: 'unit' }])
  })
  it('scales recipe estimates by planned quantity, yield and waste when consumption is absent', async () => {
    http.get.mockResolvedValueOnce({ data: { id: 'b1', qty_planned: '20', recipe_snapshot: { yield_qty: '10', waste_pct: '0.1', items: [{ stock_id: 's1', quantity: 100, cost_per_unit: 10 }] } } })
    expect((await productionService.getBatchById('b1')).ingredients[0]).toMatchObject({ quantity: 220.00000000000003, cost: 2200.0000000000005 })
  })
  it.each([null, {}, { target_quantity: 0, recipe_snapshot: { yield_qty: 0, waste_pct: -1, items: [{}] }, product: { name: 'Roti', category_model: { name: 'Bakery' }, unit: 'box', selling_price: 10000 } }])('handles incomplete production records: %j', async data => {
    http.get.mockResolvedValueOnce({ data })
    const result = await productionService.getBatchById('b1')
    expect(typeof result).toBe('object')
    if (data) expect(result.targetQuantity).toBe(0)
  })
  it.each(['array', 'paged', 'empty'])('loads %s batch lists', async shape => {
    http.get.mockResolvedValueOnce({ data: shape === 'array' ? [{ id: 'b1', batchNumber: 'B1', product: { category: 'Bakery' } }] : shape === 'paged' ? { items: [{ id: 'b1' }] } : null })
    expect(await productionService.getBatches()).toHaveLength(shape === 'empty' ? 0 : 1)
  })
  it('passes scoped calendar filters and the abort signal', async () => {
    const signal = new AbortController().signal
    await productionService.getCalendar({ month: '2026-01' }, 's1', signal)
    expect(http.get).toHaveBeenCalledWith('/production/calendar', { params: { month: '2026-01' }, headers: { 'X-Store-ID': 's1' }, signal })
  })
})

describe('production commands', () => {
  it('maps preview, start and pickup DTOs', async () => {
    await productionService.previewProduction({ productId: 'p1', quantity: 20 })
    expect(http.post).toHaveBeenLastCalledWith('/production/preview', { product_id: 'p1', quantity: 20 })
    await productionService.startProduction({ productId: 'p1', targetQuantity: 20 })
    expect(http.post).toHaveBeenLastCalledWith('/production', { product_id: 'p1', planned_qty: 20, notes: '' })
    await productionService.pickupProduction('b1'); expect(http.post).toHaveBeenLastCalledWith('/production/b1/pickup')
  })
  it('supports both itemized and legacy completion overheads', async () => {
    await productionService.completeProduction('b1', { goodQuantity: 10, wasteQuantity: 1, overheads: [{ overheadTypeId: 'o1', name: 'Gas', amount: 20 }] })
    expect(http.post).toHaveBeenLastCalledWith('/production/b1/complete', expect.objectContaining({ actual_qty: 10, waste_qty: 1, overheads: [{ overhead_type_id: 'o1', name: 'Gas', amount: 20 }] }))
    await productionService.completeProduction('b1', { goodQuantity: 10, wasteQuantity: 0, overheadLabor: 10, overheadEnergy: 20, overheadPackaging: 30, overheadOther: 40 })
    expect(http.post).toHaveBeenLastCalledWith('/production/b1/complete', expect.objectContaining({ overheads: [{ name: 'Tenaga Kerja Langsung', amount: 10 }, { name: 'Listrik & Utilitas', amount: 20 }, { name: 'Kemasan & Packaging', amount: 30 }, { name: 'Overhead Lainnya', amount: 40 }] }))
    await productionService.completeProduction('b1', { goodQuantity: 0, wasteQuantity: 0 })
    expect(http.post).toHaveBeenLastCalledWith('/production/b1/complete', expect.objectContaining({ overheads: [] }))
    await productionService.cancelProduction('b1'); expect(http.post).toHaveBeenLastCalledWith('/production/b1/void', { reason: 'Dibatalkan oleh pengguna' })
    await productionService.cancelProduction('b1', 'Rusak'); expect(http.post).toHaveBeenLastCalledWith('/production/b1/void', { reason: 'Rusak' })
  })
})
