import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Topbar } from '@/components/layout/topbar'
import { UserDropdown } from '@/components/layout/user-dropdown'
import { StoreDropdown } from '@/components/layout/store-dropdown'
import { NotificationDropdown } from '@/components/layout/notification-dropdown'
import { SidebarMain } from '@/components/layout/sidebar-main'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { SidebarProvider } from '@/components/ui/sidebar'
import { LoadingOverlay } from '@/components/ui/loading-overlay'
import { settingsService } from '@/features/settings/services/settings-service'
import { subscriptionService } from '@/features/subscription/services/subscriptionService'
import { useAuthStore } from '@/store/use-auth-store'
import { mockPageServices, resetSession } from '../support/page-services'
import { allPermissions, mockPopulatedPages } from '../support/populated-pages'
import { usage } from '../support/fixtures'
import { renderPage } from '../support/render'
import { render } from '@testing-library/react'
beforeEach(() => {
  resetSession(); mockPageServices(); mockPopulatedPages()
  HTMLElement.prototype.scrollTo = vi.fn(); HTMLElement.prototype.scrollIntoView = vi.fn()
  vi.mocked(settingsService.getStorePermissions).mockResolvedValue({ permissions: allPermissions })
})
describe('topbar breadcrumb routing', () => {
  it.each([
    ['/', 'Overview'], ['/dashboard/', 'Overview'], ['/inventory/stocks', 'Stok Bahan'], ['/inventory/stocks/s1', 'Detail Bahan'], ['/inventory/purchase/new', 'Catat Belanja Masuk'], ['/inventory/movements/new', 'Koreksi Mutasi'], ['/inventory/purchase-orders', 'Purchase'], ['/inventory/purchase-orders/new', 'Buat PO Baru'], ['/inventory/purchase-orders/p1', 'Detail Purchase Order'], ['/inventory/suppliers', 'Pemasok (Suppliers)'], ['/inventory/suppliers/s1', 'Detail Pemasok'], ['/production/products', 'Produk'], ['/production/recipes', 'Produk'], ['/production/products/new', 'Tambah Produk Baru'], ['/production/recipes/new', 'Tambah Produk Baru'], ['/production/products/p1', 'Detail Produk'], ['/production/recipes/p1', 'Detail Produk'], ['/production/batches', 'Batch Dapur'], ['/production/batches/new', 'Mulai Batch Baru'], ['/production/batches/b1', 'Audit & HPP Batch'], ['/production/hpp', 'Kalkulator HPP'], ['/sales/pos', 'Kasir (POS)'], ['/sales/history', 'Riwayat Transaksi'], ['/settings/store', 'Toko & Cabang'], ['/settings', 'Pengaturan Umum'], ['/settings/profile', 'Edit Profil'], ['/settings/account', 'Pengaturan Akun & Keamanan'], ['/unknown', 'Page'],
  ])('shows the breadcrumb for %s', (path, label) => {
    renderPage(<SidebarProvider><Topbar /></SidebarProvider>, path)
    expect(screen.getByText(label)).toBeVisible()
  })
})
describe('header dropdown controls', () => {
  it('opens account links and logs out', async () => {
    const user = userEvent.setup(); renderPage(<UserDropdown />)
    await user.click(screen.getByRole('button', { name: /Menu pengguna/ }))
    expect(screen.getByRole('menuitem', { name: 'Profil Pengguna' })).toHaveAttribute('href', '/settings?tab=profile')
    expect(screen.getByRole('menuitem', { name: 'Keamanan & Sesi' })).toHaveAttribute('href', '/settings?tab=security')
    await user.click(screen.getByRole('menuitem', { name: 'Log out' }))
    expect(useAuthStore.getState().token).toBeNull(); expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/login')
  })
  it('keeps the current store selected and handles a failed switch', async () => {
    const user = userEvent.setup(), switchStore = vi.spyOn(settingsService, 'switchStore').mockRejectedValue(new Error('offline'))
    renderPage(<SidebarProvider><StoreDropdown /></SidebarProvider>)
    await screen.findByRole('button', { name: /Toko aktif: Toko Rina/ })
    await user.click(screen.getByRole('button'))
    await user.click(screen.getByRole('menuitem', { name: /Toko Rina/ }))
    expect(switchStore).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button')); await user.click(screen.getByRole('menuitem', { name: /Toko Kedua/ }))
    await waitFor(() => expect(switchStore).toHaveBeenCalledWith('store-2'))
    expect(useAuthStore.getState().activeStoreId).toBe('store-1')
  })
  it('shows an empty notification inbox', async () => {
    renderPage(<NotificationDropdown />); await userEvent.click(screen.getByRole('button', { name: 'Notifikasi' }))
    expect(screen.getByText('Tidak ada notifikasi saat ini')).toBeVisible()
  })
  it('renders all notification types and marks unread notifications individually or together', async () => {
    const notifications = ['SUBSCRIPTION_EXPIRING_SOON', 'SUBSCRIPTION_IN_GRACE_PERIOD', 'SUBSCRIPTION_EXPIRED', 'SUBSCRIPTION_RENEWED', 'OTHER'].map((type, i) => ({ id: `n${i}`, type, title: `Info ${i}`, message: `Pesan ${i}`, is_read: i === 4, created_at: '2026-01-01' }))
    vi.mocked(subscriptionService.getNotifications).mockResolvedValue(notifications)
    const mark = vi.spyOn(subscriptionService, 'markAsRead').mockResolvedValue(undefined)
    const user = userEvent.setup(); renderPage(<NotificationDropdown />)
    await waitFor(() => expect(subscriptionService.getNotifications).toHaveBeenCalled())
    await user.click(screen.getByRole('button', { name: 'Notifikasi' }))
    await screen.findByText('Info 0')
    await user.click(screen.getByText('Info 4')); expect(mark).not.toHaveBeenCalled()
    await user.click(screen.getByText('Info 0')); await waitFor(() => expect(mark).toHaveBeenCalledWith('n0'))
    await user.click(screen.getByRole('button', { name: 'Tandai sudah dibaca' }))
    await waitFor(() => expect(mark).toHaveBeenCalledWith('n3'))
  })
})
describe('main dashboard navigation', () => {
  it('expands sections, activates links, and requests an upgrade for a locked feature', async () => {
    vi.mocked(subscriptionService.getUsage).mockResolvedValue(usage({ features: { ...usage().features, production_analytics: false } }))
    const event = vi.fn(); window.addEventListener('open-upgrade-modal', event)
    const user = userEvent.setup(); renderPage(<SidebarProvider><SidebarMain /></SidebarProvider>, '/production/products')
    await screen.findByRole('button', { name: 'Production', exact: true })
    for (const button of screen.getAllByRole('button')) if (button.hasAttribute('aria-controls') && button.getAttribute('aria-expanded') === 'false') await user.click(button)
    await user.click(screen.getByRole('button', { name: /Simulasi Resep Baru/ }))
    expect(event).toHaveBeenCalled()
    await user.click(screen.getByRole('link', { name: 'Produk' }))
    expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/production/products')
    window.removeEventListener('open-upgrade-modal', event)
  })
  it('renders the authenticated layout and opens the upgrade modal from a custom event', async () => {
    renderPage(<DashboardLayout />, '/dashboard')
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeVisible()
    act(() => window.dispatchEvent(new CustomEvent('open-upgrade-modal', { detail: { message: 'Kuota toko habis', tier: 'MAX_GROWTH' } })))
    expect(await screen.findByText('Kuota toko habis')).toBeVisible()
    const close = screen.getByRole('button', { name: /Close/ }); await userEvent.click(close)
    await waitFor(() => expect(screen.queryByText('Kuota toko habis')).not.toBeInTheDocument())
  })
  it('redirects unauthenticated sessions to login', () => {
    resetSession(false); renderPage(<DashboardLayout />, '/dashboard')
    expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/login')
  })
})
it('delays the loading overlay, cancels fast loads, and hides when complete', async () => {
  vi.useFakeTimers(); const { rerender } = render(<LoadingOverlay visible />)
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
  await act(async () => { await vi.advanceTimersByTimeAsync(199) })
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
  await act(async () => { await vi.advanceTimersByTimeAsync(1) })
  expect(screen.getByRole('status')).toHaveTextContent('Memuat...')
  rerender(<LoadingOverlay visible={false} />)
  await act(async () => { await vi.advanceTimersByTimeAsync(0) })
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
  rerender(<LoadingOverlay visible />); rerender(<LoadingOverlay visible={false} />)
  await act(async () => { await vi.advanceTimersByTimeAsync(200) })
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})
