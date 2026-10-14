import * as React from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Loader2 } from "lucide-react"

// Layouts
import { DashboardLayout } from "./components/layout/dashboard-layout"

// Lazy-loaded App Pages (Code Splitting)
const DashboardPage = React.lazy(() => import("./pages/dashboard/dashboard-page"))
const StockListPage = React.lazy(() => import("./pages/inventory/stock-list-page"))
const StockDetailPage = React.lazy(() => import("./pages/inventory/stock-detail-page"))
const PurchaseStockPage = React.lazy(() => import("./pages/inventory/purchase-stock-page"))
const MovementStockPage = React.lazy(() => import("./pages/inventory/movement-stock-page"))
const SupplierListPage = React.lazy(() => import("./pages/suppliers/supplier-list-page"))
const SupplierDetailPage = React.lazy(() => import("./pages/suppliers/supplier-detail-page"))
const PurchaseOrderListPage = React.lazy(() => import("./pages/inventory/purchase-order-list-page"))
const CreatePurchaseOrderPage = React.lazy(() => import("./pages/inventory/create-purchase-order-page"))
const PurchaseOrderDetailPage = React.lazy(() => import("./pages/inventory/purchase-order-detail-page"))
const RecipeListPage = React.lazy(() => import("./pages/recipes/recipe-list-page"))
const RecipeCreatePage = React.lazy(() => import("./pages/recipes/recipe-create-page"))
const RecipeDetailPage = React.lazy(() => import("./pages/recipes/recipe-detail-page"))
const BatchListPage = React.lazy(() => import("./pages/production/batch-list-page"))
const BatchCreatePage = React.lazy(() => import("./pages/production/batch-create-page"))
const BatchDetailPage = React.lazy(() => import("./pages/production/batch-detail-page"))
const RecipeSimulationPage = React.lazy(() => import("./pages/production/recipe-simulation-page"))
const ProductionSimulationPage = React.lazy(() => import("./pages/production/production-simulation-page"))
const OverheadListPage = React.lazy(() => import("./pages/production/overhead-list-page"))
const StoreSettingsPage = React.lazy(() => import("./pages/settings/store-settings-page"))
const RoleCreatePage = React.lazy(() => import("./pages/settings/role-create-page"))
const AccountSettingPage = React.lazy(() => import("./pages/settings/account-setting-page"))
const PosPage = React.lazy(() => import("./pages/sales/pos-page"))
const TransactionHistoryPage = React.lazy(() => import("./pages/sales/transaction-history-page"))
const CustomerListPage = React.lazy(() => import("./pages/sales/customer-list-page"))
const SubscriptionPage = React.lazy(() => import("./pages/subscription/subscription-page"))
const LoginPage = React.lazy(() => import("./pages/auth/login-page"))
const RegisterPage = React.lazy(() => import("./pages/auth/register-page"))
const AcceptInvitePage = React.lazy(() => import("./pages/auth/accept-invite-page"))
const ForgotPasswordPage = React.lazy(() => import("./pages/auth/forgot-password-page"))
const ResetPasswordPage = React.lazy(() => import("./pages/auth/reset-password-page"))
const LandingPage = React.lazy(() => import("./pages/landing/landing-page"))

function PageLoader() {
  return (
    <div className="flex h-[50vh] w-full items-center justify-center">
      <div className="flex items-center gap-2.5 rounded-full border bg-card px-4 py-2 shadow-xs">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm font-medium text-muted-foreground">Memuat...</span>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <React.Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Landing & Auth Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/setup-store" element={<RegisterPage initialStep={2} />} />
          <Route path="/accept-invite" element={<AcceptInvitePage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Dashboard Routes */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/inventory/stocks" element={<StockListPage />} />
            <Route path="/inventory/purchase/new" element={<PurchaseStockPage />} />
            <Route path="/inventory/movements/new" element={<MovementStockPage />} />
            <Route path="/inventory/stocks/:materialId" element={<StockDetailPage />} />
            <Route path="/inventory/suppliers" element={<SupplierListPage />} />
            <Route path="/inventory/suppliers/:supplierId" element={<SupplierDetailPage />} />
            <Route path="/inventory/purchase-orders" element={<PurchaseOrderListPage />} />
            <Route path="/inventory/purchase-orders/new" element={<CreatePurchaseOrderPage />} />
            <Route path="/inventory/purchase-orders/:poId" element={<PurchaseOrderDetailPage />} />
            <Route path="/inventory/purchase-orders/:poId/edit" element={<CreatePurchaseOrderPage />} />
            {/* Products & Recipes */}
            <Route path="/production/products" element={<RecipeListPage />} />
            <Route path="/production/products/new" element={<RecipeCreatePage />} />
            <Route path="/production/products/:productId" element={<RecipeDetailPage />} />
            <Route path="/products" element={<Navigate to="/production/products" replace />} />
            <Route path="/products/new" element={<Navigate to="/production/products/new" replace />} />
            <Route path="/production/recipes" element={<Navigate to="/production/products" replace />} />
            <Route path="/production/recipes/new" element={<Navigate to="/production/products/new" replace />} />
            <Route path="/production/recipes/:productId" element={<RecipeDetailPage />} />
            <Route path="/recipes" element={<Navigate to="/production/products" replace />} />
            <Route path="/production/batches" element={<BatchListPage />} />
            <Route path="/production/batches/new" element={<BatchCreatePage />} />
            <Route path="/production/batches/:batchId" element={<BatchDetailPage />} />
            <Route path="/production/hpp" element={<Navigate to="/production/hpp/recipe-simulation" replace />} />
            <Route path="/production/hpp/recipe-simulation" element={<RecipeSimulationPage />} />
            <Route path="/production/hpp/production-simulation" element={<ProductionSimulationPage />} />
            <Route path="/hpp" element={<Navigate to="/production/hpp/recipe-simulation" replace />} />
            <Route path="/production/overheads" element={<OverheadListPage />} />
            <Route path="/overheads" element={<Navigate to="/production/overheads" replace />} />
            <Route path="/sales/pos" element={<PosPage />} />
            <Route path="/sales/history" element={<TransactionHistoryPage />} />
            <Route path="/sales/customers" element={<CustomerListPage />} />
            <Route path="/customers" element={<Navigate to="/sales/customers" replace />} />
            <Route path="/sales" element={<Navigate to="/sales/pos" replace />} />
            <Route path="/settings/profile" element={<Navigate to="/settings?tab=profile" replace />} />
            <Route path="/settings/account" element={<Navigate to="/settings?tab=security" replace />} />
            <Route path="/settings/store" element={<StoreSettingsPage />} />
            <Route path="/settings/role/new" element={<RoleCreatePage />} />
            <Route path="/settings/role/:id" element={<RoleCreatePage />} />
            <Route path="/settings" element={<AccountSettingPage />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </React.Suspense>
    </BrowserRouter>
  )
}

export default App
