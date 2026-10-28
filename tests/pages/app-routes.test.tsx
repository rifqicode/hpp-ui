import { render, screen } from '@testing-library/react'
import { Outlet } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import App from '@/App'

vi.mock('@/components/layout/dashboard-layout', () => ({ DashboardLayout: () => <Outlet /> }))
vi.mock('@/pages/dashboard/dashboard-page', () => ({ default: () => <h1>DashboardPage</h1> }))
vi.mock('@/pages/inventory/stock-list-page', () => ({ default: () => <h1>StockListPage</h1> }))
vi.mock('@/pages/inventory/stock-detail-page', () => ({ default: () => <h1>StockDetailPage</h1> }))
vi.mock('@/pages/inventory/purchase-stock-page', () => ({ default: () => <h1>PurchaseStockPage</h1> }))
vi.mock('@/pages/inventory/movement-stock-page', () => ({ default: () => <h1>MovementStockPage</h1> }))
vi.mock('@/pages/suppliers/supplier-list-page', () => ({ default: () => <h1>SupplierListPage</h1> }))
vi.mock('@/pages/suppliers/supplier-detail-page', () => ({ default: () => <h1>SupplierDetailPage</h1> }))
vi.mock('@/pages/inventory/purchase-order-list-page', () => ({ default: () => <h1>PurchaseOrderListPage</h1> }))
vi.mock('@/pages/inventory/create-purchase-order-page', () => ({ default: () => <h1>CreatePurchaseOrderPage</h1> }))
vi.mock('@/pages/inventory/purchase-order-detail-page', () => ({ default: () => <h1>PurchaseOrderDetailPage</h1> }))
vi.mock('@/pages/recipes/recipe-list-page', () => ({ default: () => <h1>RecipeListPage</h1> }))
vi.mock('@/pages/recipes/recipe-create-page', () => ({ default: () => <h1>RecipeCreatePage</h1> }))
vi.mock('@/pages/recipes/recipe-detail-page', () => ({ default: () => <h1>RecipeDetailPage</h1> }))
vi.mock('@/pages/production/batch-list-page', () => ({ default: () => <h1>BatchListPage</h1> }))
vi.mock('@/pages/production/batch-create-page', () => ({ default: () => <h1>BatchCreatePage</h1> }))
vi.mock('@/pages/production/batch-detail-page', () => ({ default: () => <h1>BatchDetailPage</h1> }))
vi.mock('@/pages/production/recipe-simulation-page', () => ({ default: () => <h1>RecipeSimulationPage</h1> }))
vi.mock('@/pages/production/production-simulation-page', () => ({ default: () => <h1>ProductionSimulationPage</h1> }))
vi.mock('@/pages/production/overhead-list-page', () => ({ default: () => <h1>OverheadListPage</h1> }))
vi.mock('@/pages/settings/store-settings-page', () => ({ default: () => <h1>StoreSettingsPage</h1> }))
vi.mock('@/pages/settings/role-create-page', () => ({ default: () => <h1>RoleCreatePage</h1> }))
vi.mock('@/pages/settings/account-setting-page', () => ({ default: () => <h1>AccountSettingPage</h1> }))
vi.mock('@/pages/sales/pos-page', () => ({ default: () => <h1>PosPage</h1> }))
vi.mock('@/pages/sales/transaction-history-page', () => ({ default: () => <h1>TransactionHistoryPage</h1> }))
vi.mock('@/pages/sales/customer-list-page', () => ({ default: () => <h1>CustomerListPage</h1> }))
vi.mock('@/pages/subscription/subscription-page', () => ({ default: () => <h1>SubscriptionPage</h1> }))
vi.mock('@/pages/notifications/notification-list-page', () => ({ default: () => <h1>NotificationListPage</h1> }))
vi.mock('@/pages/guidance/store-guidance-page', () => ({ default: () => <h1>StoreGuidancePage</h1> }))
vi.mock('@/pages/auth/login-page', () => ({ default: () => <h1>LoginPage</h1> }))
vi.mock('@/pages/auth/register-page', () => ({ default: ({ initialStep }: { initialStep?: number }) => <h1>{initialStep === 2 ? 'StoreSetup' : 'RegisterPage'}</h1> }))
vi.mock('@/pages/auth/accept-invite-page', () => ({ default: () => <h1>AcceptInvitePage</h1> }))
vi.mock('@/pages/auth/forgot-password-page', () => ({ default: () => <h1>ForgotPasswordPage</h1> }))
vi.mock('@/pages/auth/reset-password-page', () => ({ default: () => <h1>ResetPasswordPage</h1> }))
vi.mock('@/pages/auth/verify-email-page', () => ({ default: () => <h1>VerifyEmailPage</h1> }))
vi.mock('@/pages/landing/landing-page', () => ({ default: () => <h1>LandingPage</h1> }))

const routes = [
  ['/', 'LandingPage'], ['/login', 'LoginPage'], ['/register', 'RegisterPage'], ['/setup-store', 'StoreSetup'],
  ['/verify-email', 'VerifyEmailPage'], ['/accept-invite', 'AcceptInvitePage'],
  ['/forgot-password', 'ForgotPasswordPage'], ['/reset-password', 'ResetPasswordPage'],
  ['/dashboard', 'DashboardPage'], ['/inventory/stocks', 'StockListPage'], ['/inventory/stocks/stock-1', 'StockDetailPage'],
  ['/inventory/purchase/new', 'PurchaseStockPage'], ['/inventory/movements/new', 'MovementStockPage'],
  ['/inventory/suppliers', 'SupplierListPage'], ['/inventory/suppliers/supplier-1', 'SupplierDetailPage'],
  ['/inventory/purchase-orders', 'PurchaseOrderListPage'], ['/inventory/purchase-orders/new', 'CreatePurchaseOrderPage'],
  ['/inventory/purchase-orders/po-1', 'PurchaseOrderDetailPage'], ['/inventory/purchase-orders/po-1/edit', 'CreatePurchaseOrderPage'],
  ['/production/products', 'RecipeListPage'], ['/production/products/new', 'RecipeCreatePage'], ['/production/products/p1', 'RecipeDetailPage'],
  ['/production/batches', 'BatchListPage'], ['/production/batches/new', 'BatchCreatePage'], ['/production/batches/b1', 'BatchDetailPage'],
  ['/production/hpp/recipe-simulation', 'RecipeSimulationPage'], ['/production/hpp/production-simulation', 'ProductionSimulationPage'],
  ['/production/overheads', 'OverheadListPage'], ['/sales/pos', 'PosPage'], ['/sales/history', 'TransactionHistoryPage'],
  ['/sales/customers', 'CustomerListPage'], ['/settings', 'AccountSettingPage'], ['/settings/store', 'StoreSettingsPage'],
  ['/settings/role/new', 'RoleCreatePage'], ['/settings/role/role-1', 'RoleCreatePage'], ['/subscription', 'SubscriptionPage'],
  ['/notifications', 'NotificationListPage'], ['/guidance', 'StoreGuidancePage'],
] as const

function openApp(entry: string) {
  window.history.replaceState({}, '', entry)
  return render(<App />)
}

describe('application routes', () => {
  it.each(routes)('opens %s in %s', async (path, page) => {
    openApp(path)
    expect(await screen.findByRole('heading', { name: page })).toBeVisible()
  })

  it.each([
    ['/products', '/production/products', 'RecipeListPage'],
    ['/products/new', '/production/products/new', 'RecipeCreatePage'],
    ['/production/recipes', '/production/products', 'RecipeListPage'],
    ['/production/recipes/new', '/production/products/new', 'RecipeCreatePage'],
    ['/recipes', '/production/products', 'RecipeListPage'],
    ['/production/hpp', '/production/hpp/recipe-simulation', 'RecipeSimulationPage'],
    ['/hpp', '/production/hpp/recipe-simulation', 'RecipeSimulationPage'],
    ['/overheads', '/production/overheads', 'OverheadListPage'],
    ['/customers', '/sales/customers', 'CustomerListPage'],
    ['/sales', '/sales/pos', 'PosPage'],
    ['/settings/profile', '/settings?tab=profile', 'AccountSettingPage'],
    ['/settings/account', '/settings?tab=security', 'AccountSettingPage'],
    ['/unknown-route', '/dashboard', 'DashboardPage'],
  ])('redirects %s to %s', async (entry, destination, page) => {
    openApp(entry)
    expect(await screen.findByRole('heading', { name: page })).toBeVisible()
    expect(window.location.pathname + window.location.search).toBe(destination)
  })
})
