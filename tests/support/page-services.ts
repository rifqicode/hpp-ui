import { modifierService } from '@/features/recipes/services/modifier-service';
import { onboardingService } from '@/features/onboarding/services/onboarding-service';
import { guidanceService } from '@/features/guidance/services/guidance-service';
import { vi } from 'vitest'
import apiClient from '@/lib/api-client'
import { authService } from '@/features/auth/services/auth-service'
import { agreementDocument } from './agreement-fixture'
import { stockService } from '@/features/inventory/services/stock-service'
import { recipeService } from '@/features/recipes/services/recipe-service'
import { supplierService } from '@/features/suppliers/services/supplier-service'
import { purchaseOrderService } from '@/features/purchase-orders/services/po-service'
import { productionService } from '@/features/production/services/production-service'
import { overheadService } from '@/features/overheads/services/overhead-service'
import { customerService } from '@/features/sales/services/customer-service'
import { salesService } from '@/features/sales/services/sales-service'
import { settingsService } from '@/features/settings/services/settings-service'
import { subscriptionService } from '@/features/subscription/services/subscriptionService'
import { dashboardService } from '@/features/dashboard/services/dashboard-service'
import { dashboardFixture } from './dashboard-fixture'
import { useAuthStore } from '@/store/use-auth-store'
import { batch, order, permissions, product, stock, stockDetail, store, supplier, usage, user } from './fixtures'

export function resetSession(authenticated = true) {
  localStorage.clear()
  sessionStorage.clear()
  useAuthStore.setState({
    user: authenticated ? user : null, token: authenticated ? 'test-token' : null,
    activeStoreId: authenticated ? store.id : null, activeStoreName: authenticated ? store.name : null,
    permissions: [...permissions.map(p => p.code), 'menu:reports'],
  })
}

export function mockPageServices() {
  vi.spyOn(onboardingService, 'get').mockResolvedValue({ state: { id: 'onboarding-1', store_id: 'store-1', status: 'IN_PROGRESS', step: 1, revision: 0, draft: {}, product_id: null }, should_start: false });
  vi.spyOn(onboardingService, 'materials').mockResolvedValue([]);
  vi.spyOn(onboardingService, 'products').mockResolvedValue([]);
  vi.spyOn(guidanceService, 'list').mockResolvedValue([]);
  vi.spyOn(guidanceService, 'complete').mockResolvedValue({ guidance: 'mock', is_completed: true });
  vi.spyOn(dashboardService, 'getOverview').mockResolvedValue(dashboardFixture())
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true, json: async () => ({ success: true, data: { whatsapp: null } }),
  }))
  // Any request missing a fixture must fail before reaching the network.
  for (const method of ['get', 'post', 'put', 'patch', 'delete'] as const) {
    vi.spyOn(apiClient, method).mockRejectedValue(new Error('Unexpected API request: add a test fixture'))
  }

  vi.spyOn(authService, 'getCurrentUser').mockResolvedValue({ user, token: 'test-token' })
  vi.spyOn(authService, 'getServiceAgreement').mockResolvedValue(agreementDocument)
  vi.spyOn(authService, 'getInviteDetails').mockResolvedValue({ email: user.email, name: user.name, store_name: store.name, role_name: 'Kasir', is_existing_user: false })
  vi.spyOn(authService, 'validateResetToken').mockResolvedValue({ valid: true, email: user.email })
  vi.spyOn(settingsService, 'getStoresList').mockResolvedValue([store])
  vi.spyOn(settingsService, 'getStoreProfile').mockResolvedValue(store)
  vi.spyOn(settingsService, 'getStorePermissions').mockResolvedValue({ permissions: permissions.map(p => p.code), role: 'OWNER' })
  vi.spyOn(settingsService, 'getSessions').mockResolvedValue([])
  vi.spyOn(settingsService, 'getStaffList').mockResolvedValue([])
  vi.spyOn(settingsService, 'getRolesList').mockResolvedValue([])
  vi.spyOn(settingsService, 'getRoleById').mockResolvedValue(null)
  vi.spyOn(settingsService, 'getPermissionsCatalog').mockResolvedValue(permissions)
  vi.spyOn(settingsService, 'getUserProfile').mockResolvedValue({ ...user, plan: 'GROWTH', emailVerified: true })
  vi.spyOn(settingsService, 'getPreferences').mockResolvedValue({ lowStockThresholdDays: 3, currency: 'IDR', timezone: 'Asia/Jakarta', autoBatchFifoDeduction: true })
  vi.spyOn(settingsService, 'getTelegramStatus').mockResolvedValue({ connected: false, allowPurchasesViaBot: false, allowSalesViaBot: false, dailyReportAlert: false })
  vi.spyOn(stockService, 'getStocks').mockResolvedValue({ items: [], total: 0, page: 1, limit: 10, total_pages: 1 })
  vi.spyOn(stockService, 'getAllStocks').mockResolvedValue([stock])
  vi.spyOn(stockService, 'getStockDetail').mockResolvedValue(stockDetail)
  vi.spyOn(stockService, 'getStockSummary').mockResolvedValue({ total_materials: 0, healthy_stock: 0, low_stock: 0, out_of_stock: 0 })
  vi.spyOn(stockService, 'getMaterials').mockResolvedValue([{ id: stock.id, name: stock.name, baseUnit: stock.base_unit }])
  vi.spyOn(modifierService, 'list').mockResolvedValue([])
  vi.spyOn(recipeService, 'getProducts').mockResolvedValue([])
  vi.spyOn(recipeService, 'getProductById').mockResolvedValue(product())
  vi.spyOn(recipeService, 'getProductSummary').mockResolvedValue({ total_products: 0, active_products: 0, low_stock_count: 0 })
  vi.spyOn(recipeService, 'getCategories').mockResolvedValue([])
  vi.spyOn(recipeService, 'getAvailableMaterials').mockResolvedValue([{ id: stock.id, name: stock.name, baseUnit: 'g', currentStock: 5000, avgCostPerUnit: 10 }])
  vi.spyOn(recipeService, 'getProductEstimate').mockResolvedValue({ variantId: 'variant-product-1', productName: 'Roti Coklat', sellingPrice: 10000, targetMargin: 0.5, rawMaterialTotal: 0, bomCostPerUnit: 0, bomItems: [], estimatedHpp: 0, recommendedPrice: 0, actualMargin: 0, actualMarkup: 0 })
  vi.spyOn(supplierService, 'getSuppliers').mockResolvedValue({ items: [], total: 0, page: 1, limit: 10, totalPages: 1 })
  vi.spyOn(supplierService, 'getAllSuppliers').mockResolvedValue([supplier])
  vi.spyOn(supplierService, 'getSupplierById').mockResolvedValue(supplier)
  vi.spyOn(supplierService, 'getSupplierPurchases').mockResolvedValue([])
  vi.spyOn(supplierService, 'getSupplierSummary').mockResolvedValue({ total_suppliers: 0, active_suppliers: 0, total_purchases_amount: 0 })
  vi.spyOn(purchaseOrderService, 'getPurchaseOrders').mockResolvedValue({ items: [], total: 0, page: 1, limit: 10, totalPages: 1 })
  vi.spyOn(purchaseOrderService, 'getPurchaseOrderById').mockResolvedValue(order)
  vi.spyOn(purchaseOrderService, 'getPurchaseOrderSummary').mockResolvedValue({ total_orders: 0, request_count: 0, order_count: 0, completed_count: 0, total_completed_amount: 0 })
  vi.spyOn(productionService, 'getBatches').mockResolvedValue([])
  vi.spyOn(productionService, 'getBatchById').mockResolvedValue(batch)
  vi.spyOn(overheadService, 'getOverheads').mockResolvedValue([])
  vi.spyOn(overheadService, 'getPaginatedOverheads').mockResolvedValue({ items: [], total: 0, page: 1, limit: 10, totalPages: 1 })
  vi.spyOn(overheadService, 'getOverheadSummary').mockResolvedValue({ total_overheads: 0, active_count: 0, inactive_count: 0, production_count: 0, operational_count: 0 })
  vi.spyOn(customerService, 'getCustomers').mockResolvedValue({ data: [], total: 0, page: 1, per_page: 10, total_pages: 1 })
  vi.spyOn(customerService, 'getCustomerSummary').mockResolvedValue({ total_customers: 0, active_customers: 0, total_spent_amount: 0 })
  vi.spyOn(salesService, 'getProducts').mockResolvedValue([])
  vi.spyOn(salesService, 'getSales').mockResolvedValue([])
  vi.spyOn(salesService, 'getPaginatedSales').mockResolvedValue({ data: [], total: 0, page: 1, per_page: 10, total_pages: 1 })
  vi.spyOn(salesService, 'getSummary').mockResolvedValue({ totalRevenue: 0, totalTransactions: 0, totalHpp: 0, totalGrossProfit: 0, averageMarginPct: 0 })
  vi.spyOn(subscriptionService, 'getUsage').mockResolvedValue(usage())
  vi.spyOn(subscriptionService, 'getInvoices').mockResolvedValue([])
  vi.spyOn(subscriptionService, 'getPlans').mockResolvedValue([])
  vi.spyOn(subscriptionService, 'getNotifications').mockResolvedValue([])
  vi.spyOn(subscriptionService, 'syncStatus').mockResolvedValue({
    invoice: {
      id: 'inv-default',
      invoice_number: 'INV-DEFAULT',
      tier: 'GROWTH',
      amount: 175000,
      currency: 'IDR',
      status: 'PAID',
      payment_method: 'MIDTRANS',
      billing_period_start: new Date().toISOString(),
      billing_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
    },
    changed: false,
    provider_checked: true,
    provider_status: 'settlement',
    checked_at: new Date().toISOString(),
  })
  vi.spyOn(dashboardService, 'getOperationalDashboard').mockResolvedValue({ active_batches: [], active_batch_count: 0, waste_scrap_summary: { total_target_quantity: '0', total_good_quantity: '0', total_waste_quantity: '0', scrap_rate_pct: '0', completed_batches: 0 }, low_stock_alerts: [], expiring_batches: [], pending_po_count: 0, total_inventory_valuation: '0' })
  vi.spyOn(dashboardService, 'getHPPDashboard').mockResolvedValue({ period: 'week', cost_breakdown: { bom_cost: '0', labor_cost: '0', overhead_cost: '0', total_cost: '0', bom_share_pct: '0', labor_share_pct: '0', overhead_share_pct: '0' }, average_product_margin: '0', star_products: [], at_risk_products: [], realized_vs_recipe_hpp: [], sales_summary: { total_revenue: '0', total_cost: '0', gross_profit: '0', profit_margin_pct: '0', total_transactions: 0 } })
}
