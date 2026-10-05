import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

// Layouts
import { DashboardLayout } from "./components/layout/dashboard-layout"

// App Pages
import DashboardPage from "./pages/dashboard/dashboard-page"
import StockListPage from "./pages/inventory/stock-list-page"
import StockDetailPage from "./pages/inventory/stock-detail-page"
import PurchaseStockPage from "./pages/inventory/purchase-stock-page"
import MovementStockPage from "./pages/inventory/movement-stock-page"
import SupplierListPage from "./pages/suppliers/supplier-list-page"
import SupplierDetailPage from "./pages/suppliers/supplier-detail-page"
import PurchaseOrderListPage from "./pages/inventory/purchase-order-list-page"
import CreatePurchaseOrderPage from "./pages/inventory/create-purchase-order-page"
import PurchaseOrderDetailPage from "./pages/inventory/purchase-order-detail-page"
import RecipeListPage from "./pages/recipes/recipe-list-page"
import RecipeCreatePage from "./pages/recipes/recipe-create-page"
import RecipeDetailPage from "./pages/recipes/recipe-detail-page"
import BatchListPage from "./pages/production/batch-list-page"
import BatchCreatePage from "./pages/production/batch-create-page"
import BatchDetailPage from "./pages/production/batch-detail-page"
import HppCalculatorPage from "./pages/production/hpp-calculator-page"
import StoreSettingsPage from "./pages/settings/store-settings-page"
import AccountSettingPage from "./pages/settings/account-setting-page"
import PosPage from "./pages/sales/pos-page"
import TransactionHistoryPage from "./pages/sales/transaction-history-page"
import LoginPage from "./pages/auth/login-page"
import RegisterPage from "./pages/auth/register-page"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth & Onboarding Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/setup-store" element={<RegisterPage initialStep={2} />} />

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
          <Route path="/production/recipes" element={<RecipeListPage />} />
          <Route path="/production/recipes/new" element={<RecipeCreatePage />} />
          <Route path="/production/recipes/:productId" element={<RecipeDetailPage />} />
          <Route path="/recipes" element={<Navigate to="/production/recipes" replace />} />
          <Route path="/production/batches" element={<BatchListPage />} />
          <Route path="/production/batches/new" element={<BatchCreatePage />} />
          <Route path="/production/batches/:batchId" element={<BatchDetailPage />} />
          <Route path="/production/hpp" element={<HppCalculatorPage />} />
          <Route path="/hpp" element={<Navigate to="/production/hpp" replace />} />
          <Route path="/sales/pos" element={<PosPage />} />
          <Route path="/sales/history" element={<TransactionHistoryPage />} />
          <Route path="/sales" element={<Navigate to="/sales/pos" replace />} />
          <Route path="/settings/profile" element={<Navigate to="/settings?tab=profile" replace />} />
          <Route path="/settings/account" element={<Navigate to="/settings?tab=security" replace />} />
          <Route path="/settings/store" element={<StoreSettingsPage />} />
          <Route path="/settings" element={<AccountSettingPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
