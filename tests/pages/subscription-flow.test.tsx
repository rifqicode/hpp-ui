import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import SubscriptionPage from '@/pages/subscription/subscription-page'
import { subscriptionService } from '@/features/subscription/services/subscriptionService'
import { idlePayment, usePaymentState } from '@/features/subscription/lib/payment-state'
import { loadMidtransSnap, payWithSnap, type SnapCallbacks } from '@/lib/midtrans'
import type { PlanConfig, SubscriptionInvoice } from '@/features/subscription/types/subscription'
import { renderPage } from '../support/render'
import { resetSession } from '../support/page-services'
import { usage } from '../support/fixtures'

vi.mock('@/lib/midtrans', () => ({ loadMidtransSnap: vi.fn(), payWithSnap: vi.fn() }))
const pendingInvoice: SubscriptionInvoice = {
  id: 'invoice-1', invoice_number: 'INV-1', tier: 'GROWTH', amount: 175000, currency: 'IDR',
  status: 'PENDING', payment_method: 'MIDTRANS', billing_period_start: '2026-12-01T00:00:00Z',
  billing_period_end: '2026-12-31T00:00:00Z', snap_token: 'snap-token', snap_redirect_url: 'https://app.midtrans.com/pay',
}
const plans: PlanConfig[] = [
  { tier: 'GROWTH', name: 'Growth', price: 175000, billing_period: 'MONTHLY', description: '', limits: { max_stores: 3, max_stocks: 120, max_products: 60, max_batches_per_mo: 150, max_staff_per_store: 3, max_suppliers: 25, max_customers: 100 }, features: usage().features },
  { tier: 'MAX_GROWTH', name: 'Max Growth', price: 525000, billing_period: 'MONTHLY', description: '', limits: { max_stores: 10, max_stocks: -1, max_products: -1, max_batches_per_mo: -1, max_staff_per_store: 20, max_suppliers: -1, max_customers: -1 }, features: usage().features },
]

beforeEach(() => {
  resetSession()
  usePaymentState.setState(idlePayment)
  vi.mocked(loadMidtransSnap).mockResolvedValue()
  vi.mocked(payWithSnap).mockReset()
  vi.spyOn(subscriptionService, 'getUsage').mockResolvedValue(usage({ current_period_end: '2026-12-01T00:00:00Z' }))
  vi.spyOn(subscriptionService, 'getPlans').mockResolvedValue(plans)
  vi.spyOn(subscriptionService, 'getPaymentChannels').mockResolvedValue([
    { code: 'qris', name: 'QRIS', category: 'QRIS', description: 'GoPay, OVO, dll', enabled: true },
    { code: 'bca_va', name: 'BCA Virtual Account', category: 'VIRTUAL_ACCOUNT', description: 'BCA', enabled: true },
  ])
  vi.spyOn(subscriptionService, 'getInvoices').mockResolvedValue([])
  vi.spyOn(subscriptionService, 'getMidtransConfig').mockResolvedValue({ client_key: 'production-key', is_production: true })
  vi.spyOn(subscriptionService, 'checkout').mockResolvedValue({ invoice: pendingInvoice, snap_token: 'snap-token', snap_redirect_url: 'https://app.midtrans.com/pay', client_key: 'production-key', is_production: true })
  vi.spyOn(subscriptionService, 'cancelInvoice').mockResolvedValue()
  vi.spyOn(subscriptionService, 'syncStatus').mockImplementation(async (id: string) => {
    const invoices = await subscriptionService.getInvoices()
    const found = invoices.find((item) => item.id === id) || pendingInvoice
    return {
      invoice: found,
      changed: found.status === 'PAID',
      provider_checked: true,
      provider_status: found.status === 'PAID' ? 'settlement' : 'pending',
      checked_at: new Date().toISOString(),
    }
  })
})

it('renews the current plan after a review using backend pricing', async () => {
  const user = userEvent.setup()
  renderPage(<SubscriptionPage />, '/subscription')
  await user.click(await screen.findByRole('button', { name: 'Perpanjang paket' }))
  const modal = await screen.findByRole('dialog')
  expect(await within(modal).findByText('120 bahan baku')).toBeVisible()
  expect(subscriptionService.checkout).not.toHaveBeenCalled()
  await user.click(within(modal).getByRole('button', { name: 'Tinjau perpanjangan' }))
  expect(within(modal).getByText(/175.000/)).toBeVisible()
  expect(within(modal).getByText(/Sisa masa aktif tetap dipertahankan/)).toBeVisible()
  await user.click(within(modal).getByRole('button', { name: 'Lanjut ke pembayaran' }))
  await waitFor(() => expect(payWithSnap).toHaveBeenCalledWith('snap-token', expect.any(Object)))
  expect(subscriptionService.checkout).toHaveBeenCalledWith('GROWTH', 'qris')
  expect(loadMidtransSnap).toHaveBeenCalledWith('production-key', true)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('keeps the current plan until payment and activation are verified', async () => {
  const user = userEvent.setup()
  vi.mocked(subscriptionService.getInvoices).mockResolvedValue([pendingInvoice])
  let callbacks: SnapCallbacks = {}
  vi.mocked(payWithSnap).mockImplementation((_token, value) => { callbacks = value ?? {} })
  renderPage(<SubscriptionPage />, '/subscription')
  await user.click(await screen.findByRole('button', { name: 'Lanjutkan pembayaran' }))
  await waitFor(() => expect(payWithSnap).toHaveBeenCalled())
  act(() => callbacks.onSuccess?.({}))
  expect(await screen.findByText(/Sedang memverifikasi aktivasi/)).toBeVisible()
  expect(screen.queryByText(/Paket dan masa aktif sudah diperbarui/)).not.toBeInTheDocument()
  vi.mocked(subscriptionService.getInvoices).mockResolvedValue([{ ...pendingInvoice, status: 'PAID' }])
  vi.mocked(subscriptionService.getUsage).mockResolvedValue(usage({ current_period_end: pendingInvoice.billing_period_end }))
  await user.click(screen.getByRole('button', { name: 'Cek status' }))
  expect(await screen.findByText(/Paket dan masa aktif sudah diperbarui/)).toBeVisible()
  expect(screen.queryByRole('button', { name: 'Lanjutkan pembayaran' })).not.toBeInTheDocument()
})

it('preserves pending payment when Snap is closed and permits a confirmed cancellation', async () => {
  const user = userEvent.setup()
  vi.mocked(subscriptionService.getInvoices).mockResolvedValue([pendingInvoice])
  vi.mocked(payWithSnap).mockImplementation((_token, value) => value?.onClose?.())
  renderPage(<SubscriptionPage />, '/subscription')
  await user.click(await screen.findByRole('button', { name: 'Lanjutkan pembayaran' }))
  expect(await screen.findByText(/Jendela pembayaran ditutup/)).toBeVisible()
  await user.click(screen.getByRole('button', { name: 'Batalkan tagihan' }))
  expect(subscriptionService.cancelInvoice).not.toHaveBeenCalled()
  vi.mocked(subscriptionService.getInvoices).mockResolvedValue([{ ...pendingInvoice, status: 'CANCELLED' }])
  await user.click(screen.getByRole('button', { name: 'Ya, batalkan tagihan' }))
  await waitFor(() => expect(subscriptionService.cancelInvoice).toHaveBeenCalledWith(pendingInvoice.id))
  await waitFor(() => expect(screen.queryByText('Pembayaran belum selesai')).not.toBeInTheDocument())
})

it('shows failed invoice requests as errors and allows retry', async () => {
  const user = userEvent.setup()
  vi.mocked(subscriptionService.getInvoices).mockRejectedValue(new Error('offline'))
  renderPage(<SubscriptionPage />, '/subscription')
  expect(await screen.findByText(/Tagihan belum dapat dimuat/)).toBeVisible()
  expect(screen.queryByText('Belum Ada Tagihan')).not.toBeInTheDocument()
  vi.mocked(subscriptionService.getInvoices).mockResolvedValue([])
  await user.click(screen.getByRole('button', { name: 'Muat ulang tagihan' }))
  expect(await screen.findByText('Belum Ada Tagihan')).toBeVisible()
})

it('keeps store usage visible to staff while hiding billing actions', async () => {
  vi.mocked(subscriptionService.getUsage).mockResolvedValue(usage({ owner_id: 'other-owner', can_manage_billing: false }))
  renderPage(<SubscriptionPage />, '/subscription')
  expect(await screen.findByText('Dikelola pemilik toko')).toBeVisible()
  expect(screen.getByText('Penggunaan Kuota Toko')).toBeVisible()
  expect(screen.queryByRole('button', { name: 'Perpanjang paket' })).not.toBeInTheDocument()
  expect(subscriptionService.getInvoices).not.toHaveBeenCalled()
})

it.each([
  ['FREE', 'Mulai berlangganan', false],
  ['GROWTH', 'Perpanjang paket', true],
  ['MAX_GROWTH', 'Perpanjang paket', false],
] as const)('shows the appropriate subscription actions for %s', async (tier, primaryAction, canCompare) => {
  vi.mocked(subscriptionService.getUsage).mockResolvedValue(usage({ tier, effective_tier: tier, current_period_end: tier === 'FREE' ? null : '2026-12-31T00:00:00Z' }))
  renderPage(<SubscriptionPage />, '/subscription')
  expect(await screen.findByRole('button', { name: primaryAction })).toBeVisible()
  const comparison = screen.queryByRole('button', { name: 'Bandingkan paket' })
  if (canCompare) expect(comparison).toBeVisible()
  else expect(comparison).not.toBeInTheDocument()
})

it('updates notice message when check status reports transaction not found', async () => {
  const user = userEvent.setup()
  vi.mocked(subscriptionService.getInvoices).mockResolvedValue([pendingInvoice])
  vi.mocked(subscriptionService.syncStatus).mockResolvedValue({
    invoice: pendingInvoice,
    changed: false,
    provider_checked: true,
    provider_status: 'not_found',
    checked_at: new Date().toISOString(),
  })
  renderPage(<SubscriptionPage />, '/subscription')
  await user.click(await screen.findByRole('button', { name: 'Cek status' }))
  expect(await screen.findByText('Transaksi belum ditemukan. Lanjutkan pembayaran atau coba cek kembali.')).toBeVisible()
})

it('updates notice message when check status reports pending', async () => {
  const user = userEvent.setup()
  vi.mocked(subscriptionService.getInvoices).mockResolvedValue([pendingInvoice])
  vi.mocked(subscriptionService.syncStatus).mockResolvedValue({
    invoice: pendingInvoice,
    changed: false,
    provider_checked: true,
    provider_status: 'pending',
    checked_at: new Date().toISOString(),
  })
  renderPage(<SubscriptionPage />, '/subscription')
  await user.click(await screen.findByRole('button', { name: 'Cek status' }))
  expect(await screen.findByText('Pembayaran belum diterima. Selesaikan pembayaran lalu cek kembali.')).toBeVisible()
})

it('handles check status error with retryable message', async () => {
  const user = userEvent.setup()
  vi.mocked(subscriptionService.getInvoices).mockResolvedValue([pendingInvoice])
  vi.mocked(subscriptionService.syncStatus).mockRejectedValue(new Error('Gateway timeout'))
  renderPage(<SubscriptionPage />, '/subscription')
  await user.click(await screen.findByRole('button', { name: 'Cek status' }))
  expect(await screen.findByText('Gateway timeout')).toBeVisible()
})

it('reconciles status using DANA transaction_id from Snap callback', async () => {
  const user = userEvent.setup()
  vi.mocked(subscriptionService.getInvoices).mockResolvedValue([pendingInvoice])
  let callbacks: SnapCallbacks = {}
  vi.mocked(payWithSnap).mockImplementation((_token, value) => { callbacks = value ?? {} })
  renderPage(<SubscriptionPage />, '/subscription')
  await user.click(await screen.findByRole('button', { name: 'Lanjutkan pembayaran' }))
  await waitFor(() => expect(payWithSnap).toHaveBeenCalled())

  const danaTxId = 'A120261021203903VaEf1JdUUSID'
  vi.mocked(subscriptionService.syncStatus).mockResolvedValue({
    invoice: { ...pendingInvoice, status: 'PAID' },
    changed: true,
    provider_checked: true,
    provider_status: 'settlement',
  })

  act(() => callbacks.onSuccess?.({ transaction_id: danaTxId }))
  await waitFor(() => expect(subscriptionService.syncStatus).toHaveBeenCalledWith(pendingInvoice.id, danaTxId))
})

it('reconciles status using order_id from URL search parameter when returning with transaction_id', async () => {
  const danaTxId = 'A120261021203903VaEf1JdUUSID'
  vi.mocked(subscriptionService.getInvoices).mockResolvedValue([pendingInvoice])
  vi.mocked(subscriptionService.syncStatus).mockResolvedValue({
    invoice: { ...pendingInvoice, status: 'PAID' },
    changed: true,
    provider_checked: true,
    provider_status: 'settlement',
  })

  window.history.pushState({}, '', `/subscription?order_id=${danaTxId}`)
  renderPage(<SubscriptionPage />, `/subscription?order_id=${danaTxId}`)
  await waitFor(() => expect(subscriptionService.syncStatus).toHaveBeenCalledWith(pendingInvoice.id, danaTxId))
})

it('runs 5-second interval timer when activePaymentModal is active', async () => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
  try {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const vaInvoice: SubscriptionInvoice = {
      ...pendingInvoice,
      payment_method: 'bca_va',
      metadata: JSON.stringify({
        instructions: {
          payment_method: 'bca_va',
          bank: 'BCA',
          va_number: '1234567890',
        },
      }),
    }
    vi.mocked(subscriptionService.getInvoices).mockResolvedValue([vaInvoice])
    vi.mocked(subscriptionService.syncStatus).mockResolvedValue({
      invoice: vaInvoice,
      changed: false,
      provider_checked: true,
      provider_status: 'pending',
    })

    renderPage(<SubscriptionPage />, '/subscription')
    await user.click(await screen.findByRole('button', { name: 'Lanjutkan pembayaran' }))

    expect(await screen.findByText('Instruksi Pembayaran')).toBeVisible()

    await vi.advanceTimersByTimeAsync(5000)
    expect(subscriptionService.syncStatus).toHaveBeenCalledWith(vaInvoice.id, undefined)
  } finally {
    vi.useRealTimers()
  }
})
