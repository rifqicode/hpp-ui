import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useStockDetail } from '@/features/inventory/hooks/use-stock-detail'
import { useStocks } from '@/features/inventory/hooks/use-stocks'
import { useMovementStock } from '@/features/inventory/hooks/use-movement-stock'
import { usePurchaseStock } from '@/features/inventory/hooks/use-purchase-stock'
import { stockService } from '@/features/inventory/services/stock-service'
import { createWrapper, deferred } from '../support/render'
import { stock, stockDetail } from '../support/fixtures'
import { mockPageServices, resetSession } from '../support/page-services'

beforeEach(() => {
  resetSession()
  mockPageServices()
})

describe('stock detail', () => {
  it('does not request a detail without an id', () => {
    const { result } = renderHook(() => useStockDetail())
    expect(result.current.loading).toBe(false)
    expect(stockService.getStockDetail).not.toHaveBeenCalled()
  })
  it('loads the detail and can refresh it', async () => {
    const { result } = renderHook(() => useStockDetail(stock.id))
    await waitFor(() => expect(result.current.detail).toEqual(stockDetail))
    expect(result.current.loading).toBe(false)
    await act(() => result.current.loadDetail())
    expect(stockService.getStockDetail).toHaveBeenCalledTimes(2)
  })
  it.each([new Error('Tidak ditemukan'), null])('reports load failures and permits a successful retry: %s', async (error) => {
    vi.mocked(stockService.getStockDetail).mockRejectedValueOnce(error)
    const { result } = renderHook(() => useStockDetail(stock.id))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe(error instanceof Error ? error.message : 'Failed to load stock details')
    await act(() => result.current.loadDetail())
    expect(result.current.error).toBe('')
    expect(result.current.detail).toEqual(stockDetail)
  })
  it('ignores a stale response after the selected stock changes', async () => {
    const old = deferred<typeof stockDetail>()
    vi.mocked(stockService.getStockDetail).mockReturnValueOnce(old.promise)
    const next = { ...stockDetail, stock: { ...stock, id: 'stock-2', name: 'Gula' } }
    vi.mocked(stockService.getStockDetail).mockResolvedValueOnce(next)
    const { result, rerender } = renderHook(({ id }) => useStockDetail(id), { initialProps: { id: stock.id } })
    rerender({ id: 'stock-2' })
    await waitFor(() => expect(result.current.detail).toEqual(next))
    await act(async () => old.resolve(stockDetail))
    expect(result.current.detail).toEqual(next)
  })
})

describe('inventory mutations', () => {
  it('loads list data and debounces a trimmed search before querying', async () => {
    const { result } = renderHook(() => useStocks(), createWrapper())
    await waitFor(() => expect(result.current.loading).toBe(false))
    act(() => result.current.setSearch(' Tepung '))
    await waitFor(() => expect(stockService.getStocks).toHaveBeenCalledWith(expect.objectContaining({ search: 'Tepung', page: 1 })))
  })
  it('creates, updates, and deletes stock while invalidating the cache', async () => {
    vi.spyOn(stockService, 'createStock').mockResolvedValue(stock)
    vi.spyOn(stockService, 'updateStock').mockResolvedValue({ ...stock, name: 'Tepung Baru' })
    vi.spyOn(stockService, 'deleteStock').mockResolvedValue(undefined)
    const options = createWrapper()
    const invalidate = vi.spyOn(options.client, 'invalidateQueries')
    const { result } = renderHook(() => useStocks(), options)
    await waitFor(() => expect(result.current.loading).toBe(false))
    const payload = { name: stock.name, base_unit: stock.base_unit }
    await act(() => result.current.handleCreateStock(payload))
    expect(stockService.createStock).toHaveBeenCalledWith(payload)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['subscription-usage'] })
    await act(() => result.current.handleUpdateStock(stock.id, { ...payload, name: 'Tepung Baru' }))
    expect(stockService.updateStock).toHaveBeenCalledWith(stock.id, { ...payload, name: 'Tepung Baru' })
    await act(() => result.current.handleDeleteStock(stock.id))
    expect(stockService.deleteStock).toHaveBeenCalledWith(stock.id)
    expect(result.current.isSubmitting).toBe(false)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['stocks'] })
  })
  it('propagates a failed stock creation and keeps its message in the form', async () => {
    vi.spyOn(stockService, 'createStock').mockRejectedValue(new Error('Kuota penuh'))
    const { result } = renderHook(() => useStocks(), createWrapper())
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => { await expect(result.current.handleCreateStock({ name: 'Gula', base_unit: 'g' })).rejects.toThrow('Kuota penuh') })
    expect(result.current.error).toBe('Kuota penuh')
    expect(result.current.isSubmitting).toBe(false)
  })
  it('records stock adjustments with the original DTO', async () => {
    vi.spyOn(stockService, 'recordAdjustment').mockResolvedValue({ id: 'movement-1' })
    const { result } = renderHook(useMovementStock, createWrapper())
    await waitFor(() => expect(result.current.loading).toBe(false))
    const payload = { stock_id: stock.id, type: 'ADJUSTMENT_OUT' as const, quantity: 100, reason: 'Rusak' }
    await act(() => result.current.handleRecordAdjustment(payload))
    expect(stockService.recordAdjustment).toHaveBeenCalledWith(payload)
    expect(result.current.isSubmitting).toBe(false)
  })
  it('disables dependency requests when the purchase dialog is closed', () => {
    renderHook(() => usePurchaseStock({ enabled: false }), createWrapper())
    expect(stockService.getAllStocks).not.toHaveBeenCalled()
  })
  it('loads dependencies and records a purchase', async () => {
    vi.spyOn(stockService, 'recordPurchase').mockResolvedValue({ id: 'purchase-1' })
    const { result } = renderHook(usePurchaseStock, createWrapper())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.stocks).toEqual([stock])
    expect(result.current.suppliers).toHaveLength(1)
    const payload = { stock_id: stock.id, quantity: 1000, total_price: 15000 }
    await act(() => result.current.handleRecordPurchase(payload))
    expect(stockService.recordPurchase).toHaveBeenCalledWith(payload)
    expect(result.current.isSubmitting).toBe(false)
  })
})
