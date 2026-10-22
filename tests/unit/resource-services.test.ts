import { beforeEach, describe, expect, it, vi } from 'vitest'
import { stockService } from '@/features/inventory/services/stock-service'
import { supplierService } from '@/features/suppliers/services/supplier-service'
import { customerService } from '@/features/sales/services/customer-service'
import { subscriptionService } from '@/features/subscription/services/subscriptionService'
import { aiChatService } from '@/features/ai-chat/services/ai-chat-service'
import { dashboardService } from '@/features/dashboard/services/dashboard-service'
import { salesService } from '@/features/sales/services/sales-service'
import { recipeService } from '@/features/recipes/services/recipe-service'

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }))
vi.mock('@/lib/api-client', () => ({ default: http }))
const customer = { id: 'c1', name: 'Rina', phone: '0812345678' }
beforeEach(() => {
  vi.resetAllMocks()
  for (const method of Object.values(http)) method.mockResolvedValue({ data: { id: 'resource-1' } })
})

describe('stock service', () => {
  it('encodes list parameters and loads detail and summary', async () => {
    await stockService.getStocks({ page: 2, limit: 20, search: 'Gula putih', inventory_method: 'FEFO' })
    expect(http.get).toHaveBeenCalledWith('/stocks?page=2&limit=20&search=Gula+putih&inventory_method=FEFO')
    await stockService.getStocks()
    expect(http.get).toHaveBeenLastCalledWith('/stocks')
    await stockService.getStockDetail('s1'); expect(http.get).toHaveBeenLastCalledWith('/stocks/s1')
    await stockService.getStockSummary(); expect(http.get).toHaveBeenLastCalledWith('/stocks/summary')
  })
  it('normalizes material choices and tolerates unavailable inventory', async () => {
    http.get.mockResolvedValueOnce({ data: { items: [{ id: 's1', name: 'Gula', base_unit: 'g', current_stock: '500' }, { id: 's2', name: 'Susu', base_unit: 'ml', current_stock: 'bad' }] } })
    expect(await stockService.getMaterials()).toEqual([{ id: 's1', name: 'Gula', baseUnit: 'g', currentStock: 500 }, { id: 's2', name: 'Susu', baseUnit: 'ml', currentStock: 0 }])
    http.get.mockResolvedValueOnce({ data: {} }); expect(await stockService.getAllStocks()).toEqual([])
    http.get.mockRejectedValueOnce(new Error('Offline')); expect(await stockService.getMaterials()).toEqual([])
  })
  it('sends create, update, purchase, adjustment, and delete DTOs unchanged', async () => {
    const stock = { name: 'Gula', base_unit: 'g' }
    await stockService.createStock(stock); expect(http.post).toHaveBeenLastCalledWith('/stocks', stock)
    await stockService.updateStock('s1', stock); expect(http.put).toHaveBeenLastCalledWith('/stocks/s1', stock)
    const purchase = { stock_id: 's1', quantity: 10, total_price: 50000 }
    await stockService.recordPurchase(purchase); expect(http.post).toHaveBeenLastCalledWith('/stocks/purchases', purchase)
    const adjustment = { stock_id: 's1', type: 'ADJUSTMENT_OUT' as const, quantity: 1 }
    await stockService.recordAdjustment(adjustment); expect(http.post).toHaveBeenLastCalledWith('/stocks/adjustments', adjustment)
    await stockService.deleteStock('s1'); expect(http.delete).toHaveBeenLastCalledWith('/stocks/s1')
  })
})

describe('suppliers and customers', () => {
  it.each(['paged', 'array', 'empty'])('accepts %s supplier responses', async shape => {
    http.get.mockResolvedValueOnce({ data: shape === 'paged' ? { items: [customer], total: 1, page: 1, limit: 10, totalPages: 1 } : shape === 'array' ? [customer] : null })
    expect((await supplierService.getSuppliers()).items).toHaveLength(shape === 'empty' ? 0 : 1)
  })
  it('loads all supplier records and purchase histories', async () => {
    http.get.mockResolvedValueOnce({ data: [customer] })
    expect(await supplierService.getAllSuppliers()).toEqual([customer])
    await supplierService.getSupplierSummary(); expect(http.get).toHaveBeenLastCalledWith('/suppliers/summary')
    await supplierService.getSupplierById('s1'); expect(http.get).toHaveBeenLastCalledWith('/suppliers/s1')
    http.get.mockResolvedValueOnce({ data: [] }); expect(await supplierService.getSupplierPurchases('s1')).toEqual([])
    http.get.mockResolvedValueOnce({ data: {} }); expect(await supplierService.getSupplierPurchases('s1')).toEqual([])
    const data = { name: 'Supplier', contact: '08123', address: 'Jakarta' }
    await supplierService.createSupplier(data); expect(http.post).toHaveBeenLastCalledWith('/suppliers', data)
    await supplierService.updateSupplier('s1', data); expect(http.put).toHaveBeenLastCalledWith('/suppliers/s1', data)
    await supplierService.deleteSupplier('s1'); expect(http.delete).toHaveBeenLastCalledWith('/suppliers/s1')
  })
  it('loads and mutates customer resources', async () => {
    await customerService.getCustomers({ search: 'Rina', page: 2 }); expect(http.get).toHaveBeenLastCalledWith('/customers', { params: { search: 'Rina', page: 2 } })
    await customerService.getCustomerSummary(); expect(http.get).toHaveBeenLastCalledWith('/customers/summary')
    await customerService.getCustomerById('c1'); expect(http.get).toHaveBeenLastCalledWith('/customers/c1')
    const data = { name: 'Rina', phone: '08123' }
    await customerService.createCustomer(data); expect(http.post).toHaveBeenLastCalledWith('/customers', data)
    await customerService.updateCustomer('c1', data); expect(http.put).toHaveBeenLastCalledWith('/customers/c1', data)
    await customerService.deleteCustomer('c1'); expect(http.delete).toHaveBeenLastCalledWith('/customers/c1')
  })
  it('matches exact phone numbers rather than a fuzzy search result', async () => {
    expect(await customerService.searchCustomerByPhone(' ')).toBeNull()
    expect(await customerService.searchCustomerByPhone('')).toBeNull()
    http.get.mockResolvedValueOnce({ data: { data: [{ ...customer, phone: '999' }, customer] } })
    expect(await customerService.searchCustomerByPhone(' 0812345678 ')).toEqual(customer)
    http.get.mockResolvedValueOnce({ data: {} }); expect(await customerService.searchCustomerByPhone('unknown')).toBeNull()
    http.get.mockRejectedValueOnce(new Error('Offline')); expect(await customerService.searchCustomerByPhone('0812345678')).toBeNull()
  })
})

describe('subscription, dashboard, and AI service contracts', () => {
  it('uses the public plans and scoped billing endpoints', async () => {
    for (const [request, url] of [
      [() => subscriptionService.getPlans(), '/subscription/plans'], [() => subscriptionService.getUsage(), '/subscription/usage'],
      [() => subscriptionService.getMidtransConfig(), '/subscription/config/client'], [() => subscriptionService.getInvoices(), '/subscription/invoices'],
      [() => subscriptionService.getNotifications(), '/notifications'],
    ] as const) { await request(); expect(http.get).toHaveBeenLastCalledWith(url) }
    await subscriptionService.subscribe('GROWTH'); expect(http.post).toHaveBeenLastCalledWith('/subscription/subscribe', { tier: 'GROWTH' })
    await subscriptionService.checkout('MAX_GROWTH'); expect(http.post).toHaveBeenLastCalledWith('/subscription/checkout', { tier: 'MAX_GROWTH' })
    await subscriptionService.markAsRead('n1'); expect(http.patch).toHaveBeenLastCalledWith('/notifications/n1/read')
    await subscriptionService.cancelInvoice('i1'); expect(http.post).toHaveBeenLastCalledWith('/subscription/invoices/i1/cancel')
    await subscriptionService.syncStatus('i1'); expect(http.post).toHaveBeenLastCalledWith('/subscription/invoices/i1/sync-status')
  })
  it('loads operational and HPP dashboards', async () => {
    await dashboardService.getOperationalDashboard()
    expect(http.get).toHaveBeenCalledWith('/dashboard/operational')
    await dashboardService.getHPPDashboard('month')
    expect(http.get).toHaveBeenLastCalledWith('/dashboard/hpp?period=month')
  })
  it('paginates conversations, sends messages, retries and deletes a thread', async () => {
    await aiChatService.getConversations(); expect(http.get).toHaveBeenLastCalledWith('/store/ai/conversations', { params: { page: 1, limit: 20 } })
    await aiChatService.getActiveConversation(); expect(http.get).toHaveBeenLastCalledWith('/store/ai/conversations/active', { params: { limit: 20 } })
    await aiChatService.getConversation('c1', 25, 'm1'); expect(http.get).toHaveBeenLastCalledWith('/store/ai/conversations/c1', { params: { limit: 25, before: 'm1' } })
    await aiChatService.createConversation({ message: 'Stok?' }); expect(http.post).toHaveBeenLastCalledWith('/store/ai/conversations', { message: 'Stok?' })
    await aiChatService.sendMessage('c1', { message: 'Harga?' }); expect(http.post).toHaveBeenLastCalledWith('/store/ai/conversations/c1/messages', { message: 'Harga?' })
    await aiChatService.retryMessage('c1'); expect(http.post).toHaveBeenLastCalledWith('/store/ai/conversations/c1/retry')
    await aiChatService.deleteConversation('c1'); expect(http.delete).toHaveBeenLastCalledWith('/store/ai/conversations/c1')
  })
})

describe('sales service', () => {
  it.each(['array', 'paged', 'empty'])('normalizes %s sale lists', async shape => {
    const sale = { id: 'sale-1', total_amount: 10000 }
    http.get.mockResolvedValueOnce({ data: shape === 'array' ? [sale] : shape === 'paged' ? { data: [sale], total: 10, page: 2, per_page: 5, total_pages: 2 } : {} })
    expect(await salesService.getSales()).toHaveLength(shape === 'empty' ? 0 : 1)
    http.get.mockResolvedValueOnce({ data: shape === 'array' ? [sale] : shape === 'paged' ? { data: [sale], total: 10, page: 2, per_page: 5, total_pages: 2 } : {} })
    expect((await salesService.getPaginatedSales()).data).toHaveLength(shape === 'empty' ? 0 : 1)
  })
  it('uses product catalog service and maps summary numbers', async () => {
    vi.spyOn(recipeService, 'getProducts').mockResolvedValue([])
    expect(await salesService.getProducts()).toEqual([])
    http.get.mockResolvedValueOnce({ data: { total_revenue: '10000', total_transactions: 2, total_hpp: '4000', total_gross_profit: '6000', average_margin_pct: '60' } })
    expect(await salesService.getSummary()).toMatchObject({ totalRevenue: 10000, totalTransactions: 2 })
  })
  it('creates, loads and corrects a sale', async () => {
    await salesService.getSaleById('sale-1'); expect(http.get).toHaveBeenLastCalledWith('/sales/sale-1')
    await salesService.createSale({ items: [{ productId: 'p1', quantity: 2, priceAtSale: 10000, costAtSale: 4000 }], paymentMethod: 'CASH', cashReceived: 20000 })
    expect(http.post).toHaveBeenLastCalledWith('/sales', expect.objectContaining({ items: [expect.objectContaining({ product_id: 'p1', quantity: 2 })] }))
    const correction = { request_id: 'r1', kind: 'CANCEL' as const, reason: 'Salah input', refund_method: 'CASH', items: [] }
    await salesService.correctSale('sale-1', correction); expect(http.post).toHaveBeenLastCalledWith('/sales/sale-1/corrections', correction)
  })
})
