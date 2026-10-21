import type { User } from '@/features/auth/types'
import type { Stock, StockDetail } from '@/features/inventory/types'
import type { Product } from '@/features/recipes/types'
import type { StoreInfo, Permission } from '@/features/settings/types'
import type { Supplier } from '@/features/suppliers/types'
import type { PurchaseOrder } from '@/features/purchase-orders/types'
import type { ProductionBatch, ProductionCalendarItem, ProductionCalendarResponse } from '@/features/production/types'
import type { SubscriptionUsageData } from '@/features/subscription/types/subscription'

export const user: User = { id: 'user-1', name: 'Rina', email: 'rina@example.com', role: 'OWNER', account_type: 'OWNER' }
export const store: StoreInfo = { id: 'store-1', name: 'Toko Rina', category: 'Bakery', location: 'Jakarta', status: 'online' }
export const stock: Stock = {
  id: 'stock-1', store_id: store.id, name: 'Tepung Terigu', base_unit: 'g', current_stock: 5000,
  inventory_method: 'FIFO', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
}
export const stockDetail: StockDetail = { stock, active_batches: [], movements: [] }
export const supplier: Supplier = { id: 'supplier-1', name: 'Supplier Tepung', contact: '081234567890', address: 'Jakarta', totalPurchases: 0, totalOrdersCount: 0 }
export function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 'product-1', name: 'Roti Coklat', category: 'Roti', unit: 'pcs', mode: 'MAKE_TO_STOCK',
    yieldQty: 10, wastePct: 0, imageUrl: null, sellingPrice: 10000, currentStock: 20,
    latestHpp: 4000, minStock: 5, createdAt: '2026-01-01T00:00:00Z', ingredients: [], ...overrides,
  }
}
export const order: PurchaseOrder = {
  id: 'po-1', poNumber: 'PO-TEST-001', category: 'PURCHASE_ORDER', attachments: [], completionAttachments: [],
  supplierId: supplier.id, supplierName: supplier.name, createdByUserId: user.id, createdByName: user.name,
  orderDate: '2026-01-01T00:00:00Z', status: 'PURCHASE_REQUEST', items: [], logs: [], totalAmount: 0, createdAt: '2026-01-01T00:00:00Z',
}
export const batch: ProductionBatch = {
  id: 'batch-1', batchNumber: 'BATCH-TEST-001', productId: 'product-1', productName: 'Roti Coklat',
  productCategory: 'Roti', productUnit: 'pcs', sellingPrice: 10000, status: 'QUEUED',
  targetQuantity: 10, stockCost: 40000, startedAt: '2026-01-01T08:00:00Z', ingredients: [], overheads: [],
}
export function calendarItem(overrides: Partial<ProductionCalendarItem> = {}): ProductionCalendarItem {
  return {
    id: batch.id, batch_number: batch.batchNumber, product_id: batch.productId, product_name: batch.productName,
    product_unit: 'pcs', status: 'QUEUED', started_at: batch.startedAt, ended_at: batch.startedAt,
    start_date: '2026-01-01', end_date: '2026-01-01', qty_planned: '10', qty_actual: '0', total_cost: '0', hpp_per_unit: '0', ...overrides,
  }
}
export const calendar: ProductionCalendarResponse = {
  month: '2026-01', timezone: 'Asia/Jakarta', today: '2026-01-01',
  summary: { total: 0, by_status: { DRAFT: 0, QUEUED: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0, VOID: 0 }, completed_cost: '0' },
  items: [], days: [{ date: '2026-01-01', item_ids: [] }],
}
export function usage(overrides: Partial<SubscriptionUsageData> = {}): SubscriptionUsageData {
  const quota = { current: 0, limit: 100, remaining: 100 }
  return {
    tier: 'GROWTH', effective_tier: 'GROWTH', status: 'ACTIVE', is_in_grace_period: false,
    grace_period_until: null, current_period_end: null,
    quotas: { stocks: { ...quota }, products: { ...quota }, batches: { ...quota }, staff: { ...quota }, stores: { ...quota }, suppliers: { ...quota }, customers: { ...quota } },
    features: { export_reports: true, multi_role_customization: true, production_analytics: true, advanced_pos: true }, ...overrides,
  }
}
export const permissions: Permission[] = [
  { id: 'p1', code: 'products:read', name: 'Lihat produk', group: 'products' },
  { id: 'p2', code: 'products:write', name: 'Tambah produk', group: 'products' },
  { id: 'p3', code: 'products:delete', name: 'Hapus produk', group: 'products' },
]
