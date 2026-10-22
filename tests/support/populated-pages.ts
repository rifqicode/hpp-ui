import { vi } from 'vitest'
import { stockService } from '@/features/inventory/services/stock-service'
import { recipeService } from '@/features/recipes/services/recipe-service'
import { supplierService } from '@/features/suppliers/services/supplier-service'
import { purchaseOrderService } from '@/features/purchase-orders/services/po-service'
import { productionService } from '@/features/production/services/production-service'
import { overheadService } from '@/features/overheads/services/overhead-service'
import { customerService } from '@/features/sales/services/customer-service'
import { salesService, normalizeSale } from '@/features/sales/services/sales-service'
import { settingsService } from '@/features/settings/services/settings-service'
import { dashboardService } from '@/features/dashboard/services/dashboard-service'
import { useAuthStore } from '@/store/use-auth-store'
import type { Product } from '@/features/recipes/types'
import type { ProductionStatus } from '@/features/production/types'
import type { PurchaseOrderStatus } from '@/features/purchase-orders/types'
import { batch, order, product, stock, store, supplier, user, permissions } from './fixtures'

export const allPermissions = ['menu:dashboard', 'menu:stocks', 'menu:recipes', 'menu:pos', 'menu:settings', 'stocks:read', 'stocks:write', 'stocks:create', 'stocks:update', 'stocks:delete', 'products:read', 'products:write', 'products:delete', 'recipes:create', 'recipes:update', 'recipes:delete', 'orders:read', 'orders:create', 'orders:void', 'purchase_orders:approve', 'purchase_orders:complete', 'purchase_orders:reject', 'purchase_orders:create', 'purchase_orders:update']
export const customer = { id: 'customer-1', name: 'Pelanggan Rina', phone: '08123456789', email: 'customer@example.com', address: 'Jakarta', total_orders: 3, total_spent: 30000, last_order_at: '2026-01-01T10:00:00Z', created_at: '2026-01-01T00:00:00Z', notes: 'Pelanggan tetap' }
export const sale = normalizeSale({ id: 'sale-1', invoice_number: 'TRX-TEST-001', store_id: store.id, cashier_name: user.name, customer_name: customer.name, customer, total_amount: 20000, total_cost: 8000, gross_profit: 12000, payment_method: 'CASH', cash_received: 25000, cash_change: 5000, transaction_date: '2026-01-01T10:00:00Z', created_at: '2026-01-01T10:00:00Z', items: [{ id: 'line-1', product_id: 'product-1', product_name: 'Roti Coklat', quantity: 2, price_at_sale: 10000, cost_at_sale: 4000, subtotal: 20000, total_cost: 8000, gross_profit: 12000 }], status: 'COMPLETED' })
export const overheads = [{ id: 'oh1', storeId: store.id, name: 'Gas Dapur', category: 'PRODUCTION' as const, defaultAmount: 15000, notes: 'Biaya produksi', isActive: true, createdAt: '2026-01-01' }, { id: 'oh2', storeId: store.id, name: 'Sewa Toko', category: 'OPERATIONAL' as const, defaultAmount: null, notes: '', isActive: false, createdAt: '2026-01-01' }]
export function populatedProduct(edge = false): Product {
  return product({
    description: 'Roti untuk toko', targetMargin: 50, imageUrl: edge ? null : 'https://example.com/roti.png',
    mode: edge ? 'MAKE_TO_ORDER' : 'MAKE_TO_STOCK', currentStock: edge ? 0 : 20, minStock: 5,
    sellingPrice: edge ? 0 : 10000, latestHpp: edge ? 0 : 4000, estimatedHpp: edge ? 3000 : 3500,
    yieldQty: 10, wastePct: 0.05,
    ingredients: [{ id: 'ing-1', productId: 'product-1', stockId: stock.id, stockName: stock.name, baseUnit: 'g', quantity: 100, unitCost: 10, subtotalCost: 1000, availableStock: edge ? 0 : 5000 }],
    batches: [{ id: 'lot1', batchNumber: 'LOT-TEST-001', initialQuantity: 20, remainingQuantity: edge ? 0 : 20, hppAtProduction: 4000, productionDate: '2026-01-01T00:00:00Z', status: edge ? 'depleted' : 'active' }],
  })
}
export function mockPopulatedPages(edge = false) {
  useAuthStore.setState({ permissions: allPermissions })
  const first = populatedProduct(edge)
  const products = [first, product({ id: 'product-2', name: 'Donat', currentStock: 0, sellingPrice: 5000, latestHpp: 6000, category: '', minStock: 1 }), product({ id: 'product-3', name: 'Kopi Susu', mode: 'MAKE_TO_ORDER', currentStock: 0, latestHpp: 0, estimatedHpp: 2500, sellingPrice: 12000 })]
  vi.mocked(recipeService.getProducts).mockResolvedValue(products)
  vi.mocked(recipeService.getProductById).mockResolvedValue(first)
  vi.mocked(recipeService.getCategories).mockResolvedValue([{ id: 'cat1', name: 'Roti', description: 'Bakery' }, { id: 'cat2', name: 'Minuman' }])
  vi.mocked(recipeService.getProductEstimate).mockResolvedValue({ productId: first.id, productName: first.name, sellingPrice: first.sellingPrice, targetMargin: 50, yieldQty: 10, wastePct: 0.05, rawMaterialTotal: 1000, bomCostPerUnit: 100, bomItems: first.ingredients, estimatedHpp: 105, recommendedPrice: 500, actualMargin: 90, actualMarkup: 100 })
  vi.mocked(recipeService.getProductSummary).mockResolvedValue({ total_products: 3, active_products: 2, low_stock_count: 1 })
  const stocks = [stock, { ...stock, id: 'stock-2', name: 'Gula Pasir', base_unit: 'kg', inventory_method: 'FEFO' as const, current_stock: edge ? 0 : 2, expired_stock: 1, available_stock: 1 }]
  vi.mocked(stockService.getStocks).mockResolvedValue({ items: stocks, total: 2, page: 1, limit: 10, total_pages: 1 })
  vi.mocked(stockService.getAllStocks).mockResolvedValue(stocks)
  vi.mocked(stockService.getMaterials).mockResolvedValue(stocks.map(s => ({ id: s.id, name: s.name, baseUnit: s.base_unit, currentStock: Number(s.current_stock), latestPrice: 10 })))
  vi.mocked(stockService.getStockSummary).mockResolvedValue({ total_materials: 2, healthy_stock: 1, low_stock: 1, out_of_stock: 1 })
  vi.mocked(stockService.getStockDetail).mockResolvedValue({ stock: stocks[edge ? 1 : 0], active_batches: [{ id: 'stocklot1', stock_id: stock.id, supplier_id: supplier.id, initial_quantity: 5000, remaining_quantity: edge ? 0 : 3000, price_per_unit: 10, expired_at: edge ? '2020-01-01' : '2099-01-01', created_at: '2026-01-01' }], movements: ['PURCHASE', 'PRODUCTION_CONSUMPTION', 'PRODUCTION_REVERSAL', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT'].map((type, i) => ({ id: `mov${i}`, stock_id: stock.id, type: type as 'PURCHASE', quantity: i % 2 ? -10 : 10, reference_id: 'ref1', created_at: '2026-01-01T10:00:00Z' })) })
  vi.mocked(supplierService.getSuppliers).mockResolvedValue({ items: [{ ...supplier, totalOrdersCount: 3, totalPurchases: 30000, suppliedMaterials: [stock.name] }], total: 1, page: 1, limit: 10, totalPages: 1 })
  vi.mocked(supplierService.getSupplierById).mockResolvedValue({ ...supplier, totalOrdersCount: 3, totalPurchases: 30000 })
  vi.mocked(supplierService.getSupplierPurchases).mockResolvedValue([{ id: 'purchase1', stockName: stock.name, quantity: 1000, baseUnit: 'g', totalPrice: 15000, pricePerUnit: 15, purchaseDate: '2026-01-01T00:00:00Z' }])
  vi.mocked(customerService.getCustomers).mockResolvedValue({ data: [customer], total: 1, page: 1, per_page: 10, total_pages: 1 })
  vi.spyOn(customerService, 'getCustomerById').mockResolvedValue({ customer, sales: [sale] })
  vi.mocked(salesService.getPaginatedSales).mockResolvedValue({ data: ['COMPLETED', 'IN_PROGRESS', 'CANCELLED', 'RETURNED'].map((status, i) => ({ ...sale, id: `sale${i}`, paymentMethod: (['CASH', 'QRIS', 'TRANSFER', 'DEBIT'] as const)[i], status: status as 'COMPLETED' })), total: 4, page: 1, per_page: 10, total_pages: 1 })
  vi.mocked(salesService.getSummary).mockResolvedValue({ totalRevenue: 100000, totalTransactions: 10, totalHpp: 40000, totalGrossProfit: 60000, averageMarginPct: 60, averageOrderValue: 10000 })
  const statuses: ProductionStatus[] = ['DRAFT', 'QUEUED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'VOID']
  const batches = statuses.map((status, i) => ({ ...batch, id: `batch-${i}`, batchNumber: `BATCH-TEST-00${i + 1}`, status, goodQuantity: status === 'COMPLETED' ? 8 : 0, wasteQuantity: status === 'COMPLETED' ? 2 : 0, totalCost: 40000, hppPerUnit: 5000, overheadCost: 5000, notes: i % 2 ? 'Pesanan pelanggan' : '', ingredients: [{ stockId: stock.id, stockName: stock.name, baseUnit: 'g', quantity: 100, cost: 1000 }], overheads: [{ name: 'Gas', amount: 5000 }], hasActualConsumptions: !edge, completedAt: status === 'COMPLETED' ? '2026-01-01T10:00:00Z' : undefined, voidReason: status === 'VOID' ? 'Salah produksi' : undefined, voidedAt: status === 'VOID' ? '2026-01-01T10:00:00Z' : undefined }))
  vi.mocked(productionService.getBatches).mockResolvedValue(batches)
  vi.mocked(productionService.getBatchById).mockResolvedValue({ ...batches[edge ? 3 : 2], id: batch.id, batchNumber: batch.batchNumber })
  vi.spyOn(productionService, 'previewProduction').mockResolvedValue({ product_id: first.id, product_name: first.name, planned_qty: 10, is_all_sufficient: !edge, items: [{ stock_id: stock.id, stock_name: stock.name, unit: 'g', required_qty: 1000, available_qty: edge ? 0 : 5000, is_sufficient: !edge, estimated_cost: 10000 }], estimated_bom: 10000, overheads: [{ name: 'Gas', amount: 5000 }], estimated_overhead: 5000, estimated_total: 15000, estimated_hpp: 1500 })
  const poStatuses: PurchaseOrderStatus[] = ['IN_PROGRESS', 'PURCHASE_REQUEST', 'PURCHASE_ORDER', 'COMPLETED', 'CANCELLED', 'REJECTED']
  const orders = poStatuses.map((status, i) => ({ ...order, id: `po-${i}`, poNumber: `PO-TEST-00${i + 1}`, status, category: i % 2 ? 'DIRECT_ORDER' as const : 'PURCHASE_ORDER' as const, items: [{ id: 'poi1', stockId: stock.id, stockName: stock.name, baseUnit: 'g', quantity: 1000, unitPrice: 10, totalPrice: 10000 }], totalAmount: 10000, notes: i % 2 ? '' : 'Segera dipesan', attachments: [{ name: 'invoice.pdf', url: 'https://example.com/invoice.pdf' }], completionAttachments: status === 'COMPLETED' ? [{ name: 'received.pdf', url: 'https://example.com/received.pdf' }] : [], logs: [{ id: 'log1', userId: user.id, userName: user.name, action: status, createdAt: '2026-01-01T10:00:00Z', notes: 'Catatan' }] }))
  vi.mocked(purchaseOrderService.getPurchaseOrders).mockResolvedValue({ items: orders, total: orders.length, page: 1, limit: 10, totalPages: 1 })
  vi.mocked(purchaseOrderService.getPurchaseOrderById).mockResolvedValue({ ...orders[edge ? 3 : 1], id: order.id, poNumber: order.poNumber })
  vi.mocked(overheadService.getOverheadSummary).mockResolvedValue({ total_overheads: 2, active_count: 1, inactive_count: 1, production_count: 1, operational_count: 1 })
  vi.mocked(overheadService.getOverheads).mockResolvedValue(overheads)
  vi.mocked(overheadService.getPaginatedOverheads).mockResolvedValue({ items: overheads, total: 2, page: 1, limit: 10, totalPages: 1 })
  vi.mocked(settingsService.getStaffList).mockResolvedValue([{ id: 'staff1', userId: 'staff-user', name: 'Staf Toko', email: 'staff@example.com', role: 'Kasir', status: 'active', joinedAt: '2026-01-01' }, { id: 'invite1', name: 'Staf Baru', email: 'invite@example.com', role: 'Kasir', status: 'invited' }])
  vi.mocked(settingsService.getRolesList).mockResolvedValue([{ id: 'role1', name: 'Kasir', storeId: store.id, description: 'Kasir toko', permissions }, { id: 'owner', name: 'OWNER', is_system: true, permissions: [] }])
  vi.mocked(settingsService.getSessions).mockResolvedValue([{ id: 'current', device: 'Laptop', browser: 'Chrome', location: 'Jakarta', lastActive: 'Sekarang', isCurrent: true, type: 'desktop' }, { id: 'other', device: 'Ponsel', browser: 'Safari', location: 'Bandung', lastActive: 'Kemarin', isCurrent: false, type: 'mobile' }])
  vi.mocked(settingsService.getStoresList).mockResolvedValue([store, { ...store, id: 'store-2', name: 'Toko Kedua', status: 'offline' }])
  vi.mocked(dashboardService.getOperationalDashboard).mockResolvedValue({ active_batches: [{ id: batch.id, batch_number: batch.batchNumber, product_id: first.id, product_name: first.name, product_unit: first.unit, category: first.category, target_quantity: '10', started_at: '2026-01-01T08:00:00Z', elapsed_minutes: 25 }], active_batch_count: 1, waste_scrap_summary: { total_target_quantity: '10', total_good_quantity: '8', total_waste_quantity: '2', scrap_rate_pct: '20', completed_batches: 1 }, low_stock_alerts: [{ stock_id: stock.id, stock_name: stock.name, base_unit: 'g', current_stock: '0', min_stock: '10', status: edge ? 'OUT' : 'LOW' }], expiring_batches: [{ batch_id: 'lot1', stock_id: stock.id, stock_name: stock.name, base_unit: 'g', remaining_quantity: '100', price_per_unit: '10', expired_at: '2026-01-01', days_until_expiry: edge ? -1 : 3 }], pending_po_count: 1, total_inventory_valuation: '50000' })
}
