import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import StockDetailPage from '@/pages/inventory/stock-detail-page'
import PurchaseOrderDetailPage from '@/pages/inventory/purchase-order-detail-page'
import RecipeDetailPage from '@/pages/recipes/recipe-detail-page'
import BatchDetailPage from '@/pages/production/batch-detail-page'
import SupplierDetailPage from '@/pages/suppliers/supplier-detail-page'
import SubscriptionPage from '@/pages/subscription/subscription-page'
import { stockService } from '@/features/inventory/services/stock-service'
import { purchaseOrderService } from '@/features/purchase-orders/services/po-service'
import { recipeService } from '@/features/recipes/services/recipe-service'
import { productionService } from '@/features/production/services/production-service'
import { supplierService } from '@/features/suppliers/services/supplier-service'
import { subscriptionService } from '@/features/subscription/services/subscriptionService'
import { mockPageServices, resetSession } from '../support/page-services'
import { renderPage } from '../support/render'

beforeEach(() => { resetSession(); mockPageServices() })

describe('detail page failures', () => {
  it('shows the stock error and a return link', async () => {
    vi.mocked(stockService.getStockDetail).mockRejectedValue(new Error('Bahan tidak ditemukan'))
    renderPage(<StockDetailPage />, '/inventory/stocks/missing', '/inventory/stocks/:materialId')
    expect(await screen.findByText('Bahan tidak ditemukan')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Back to Bahan Baku' })).toHaveAttribute('href', '/inventory/stocks')
  })
  it('handles a missing purchase order', async () => {
    vi.mocked(purchaseOrderService.getPurchaseOrderById).mockRejectedValue(new Error('Not found'))
    renderPage(<PurchaseOrderDetailPage />, '/inventory/purchase-orders/missing', '/inventory/purchase-orders/:poId')
    expect(await screen.findByRole('heading', { name: 'Purchase Order tidak ditemukan' })).toBeVisible()
  })
  it('handles a missing product', async () => {
    vi.mocked(recipeService.getProductById).mockRejectedValue(new Error('Not found'))
    renderPage(<RecipeDetailPage />, '/production/products/missing', '/production/products/:productId')
    expect(await screen.findByRole('alert')).toHaveTextContent('Detail produk belum bisa dimuat. Coba lagi.')
    expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeVisible()
  })
  it('handles a missing batch', async () => {
    vi.mocked(productionService.getBatchById).mockRejectedValue(new Error('Not found'))
    renderPage(<BatchDetailPage />, '/production/batches/missing', '/production/batches/:batchId')
    expect(await screen.findByRole('heading', { name: 'Batch Produksi Tidak Ditemukan' })).toBeVisible()
  })
  it('handles a missing supplier and navigates back', async () => {
    vi.mocked(supplierService.getSupplierById).mockRejectedValue(new Error('Not found'))
    const user = userEvent.setup()
    renderPage(<SupplierDetailPage />, '/inventory/suppliers/missing', '/inventory/suppliers/:supplierId')
    expect(await screen.findByRole('heading', { name: 'Supplier tidak ditemukan' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Kembali ke Daftar Supplier' }))
    expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/inventory/suppliers')
  })
  it('retries subscription usage after a server failure', async () => {
    vi.mocked(subscriptionService.getUsage).mockRejectedValueOnce(new Error('Offline'))
    const user = userEvent.setup()
    renderPage(<SubscriptionPage />, '/subscription')
    expect(await screen.findByRole('heading', { name: 'Gagal Memuat Data Langganan' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Coba Lagi' }))
    expect(await screen.findByRole('heading', { name: 'Paket & Langganan' })).toBeVisible()
  })
})
