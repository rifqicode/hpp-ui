import type { User } from '@/features/auth/types'
import type { Stock, StockDetail } from '@/features/inventory/types'
import type { Product, ProductVariant } from '@/features/recipes/types'
import type { StoreInfo, Permission } from '@/features/settings/types'
import type { Supplier } from '@/features/suppliers/types'
import type { PurchaseOrder } from '@/features/purchase-orders/types'
import type { ProductionBatch } from '@/features/production/types'
import type { SubscriptionUsageData } from '@/features/subscription/types/subscription'

export const user: User = { id: 'user-1', name: 'Rina', email: 'rina@example.com', role: 'OWNER', account_type: 'OWNER' }
export const store: StoreInfo = { id: 'store-1', name: 'Toko Rina', staff_login_code: 'toko-rina-123456789abc', category: 'Bakery', location: 'Jakarta', status: 'online' }
export const stock: Stock = {
  id: 'stock-1', store_id: store.id, name: 'Tepung Terigu', base_unit: 'g', current_stock: 5000,
  inventory_method: 'FIFO', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
}
export const stockDetail: StockDetail = { stock, active_batches: [], movements: [] }
export const supplier: Supplier = { id: 'supplier-1', name: 'Supplier Tepung', contact: '081234567890', address: 'Jakarta', totalPurchases: 0, totalOrdersCount: 0 }
export function product(overrides: Partial<Product> & Partial<ProductVariant> = {}): Product {
 const id=overrides.id??'product-1';
 const variant:ProductVariant={id:'variant-'+id,productId:id,variantName:'Regular',sku:'SKU-'+id,unit:overrides.unit??'pcs',sellingPrice:overrides.sellingPrice??10000,targetMargin:overrides.targetMargin??0.5,currentStock:overrides.currentStock??20,latestHpp:overrides.latestHpp??4000,estimatedHpp:overrides.estimatedHpp??0,minStock:overrides.minStock??5,isDefault:true,isActive:true,ingredients:overrides.ingredients??[],batches:overrides.batches??[]};
 return {id,name:overrides.name??'Roti Coklat',category:overrides.category??'Roti',mode:overrides.mode??'MAKE_TO_STOCK',imageUrl:overrides.imageUrl??null,description:overrides.description??'',createdAt:overrides.createdAt??'2026-01-01T00:00:00Z',modifierGroups:overrides.modifierGroups??[],variants:overrides.variants??[variant]};
}
export const order: PurchaseOrder = {
  id: 'po-1', poNumber: 'PO-TEST-001', category: 'PURCHASE_ORDER', attachments: [], completionAttachments: [],
  supplierId: supplier.id, supplierName: supplier.name, createdByUserId: user.id, createdByName: user.name,
  orderDate: '2026-01-01T00:00:00Z', status: 'PURCHASE_REQUEST', receiptStatus: 'NOT_RECEIVED', paymentStatus: 'UNPAID',
  items: [], logs: [], totalAmount: 0, createdAt: '2026-01-01T00:00:00Z',
}
export const batch: ProductionBatch = {
  id: 'batch-1', batchNumber: 'BATCH-TEST-001', variantId:'variant-product-1', productId: 'product-1', productName: 'Roti Coklat',
  productCategory: 'Roti', productUnit: 'pcs', sellingPrice: 10000, status: 'QUEUED',
  targetQuantity: 10, stockCost: 40000, startedAt: '2026-01-01T08:00:00Z', ingredients: [], overheads: [],
}
export function usage(overrides: Partial<SubscriptionUsageData> = {}): SubscriptionUsageData {
  const quota = { current: 0, limit: 100, remaining: 100 }
  return {
    owner_id: user.id, can_manage_billing: true,
    tier: 'GROWTH', effective_tier: 'GROWTH', status: 'ACTIVE', is_in_grace_period: false,
    grace_period_until: null, current_period_end: null,
    quotas: { stocks: { ...quota }, products: { ...quota }, batches: { ...quota }, staff: { ...quota }, stores: { ...quota }, suppliers: { ...quota }, customers: { ...quota } },
    features: { export_reports: true, multi_role_customization: true, production_analytics: true, advanced_pos: true, ai_assistant: true }, ...overrides,
  }
}
export const permissions: Permission[] = [
  { id: 'p1', code: 'products:read', name: 'Lihat produk', group: 'products' },
  { id: 'p2', code: 'products:write', name: 'Tambah produk', group: 'products' },
  { id: 'p3', code: 'products:delete', name: 'Hapus produk', group: 'products' },
]
