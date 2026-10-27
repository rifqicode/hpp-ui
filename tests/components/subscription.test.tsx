import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QuotaBadge } from '@/features/subscription/components/QuotaBadge'
import { GracePeriodBanner } from '@/features/subscription/components/GracePeriodBanner'
import { PaymentNotice } from '@/features/subscription/components/PaymentNotice'
import { UpgradeModal } from '@/features/subscription/components/UpgradeModal'
import { idlePayment, usePaymentState } from '@/features/subscription/lib/payment-state'
import { useAuthStore } from '@/store/use-auth-store'
import { subscriptionService } from '@/features/subscription/services/subscriptionService'
import { mockPageServices, resetSession } from '../support/page-services'
import { usage } from '../support/fixtures'
import { renderPage } from '../support/render'
import type { SubscriptionInvoice } from '@/features/subscription/types/subscription'

beforeEach(() => {
  resetSession()
  usePaymentState.setState(idlePayment)
  mockPageServices()
})

describe('QuotaBadge', () => {
  it.each([[0, 0], [1, -1], [7, 10], [8, 10], [10, 10], [12, 10]])('renders current=%i and limit=%i', async (current, limit) => {
    const data = usage()
    data.quotas.products = { current, limit, remaining: Math.max(0, limit - current) }
    vi.mocked(subscriptionService.getUsage).mockResolvedValue(data)
    const onUpgrade = vi.fn()
    const user = userEvent.setup()
    const { client } = renderPage(<QuotaBadge resource="products" label="Kuota produk" onUpgradeClick={onUpgrade} />)
    await waitFor(() => expect(client.isFetching()).toBe(0))
    if (limit === 0) {
      expect(screen.queryByText('Kuota produk:')).not.toBeInTheDocument()
    } else if (limit === -1) {
      expect(screen.getByText('Tak Terbatas')).toBeVisible()
      expect(screen.queryByRole('button', { name: 'Upgrade' })).not.toBeInTheDocument()
    } else if (current >= limit) {
      await user.click(screen.getByRole('button', { name: 'Upgrade' }))
      expect(onUpgrade).toHaveBeenCalledOnce()
    } else {
      expect(screen.getByText('Kuota produk:')).toBeVisible()
      expect(screen.queryByRole('button', { name: 'Upgrade' })).not.toBeInTheDocument()
    }
  })
})

describe('GracePeriodBanner', () => {
  it('stays hidden while the subscription is active', async () => {
    const { client } = renderPage(<GracePeriodBanner onUpgradeClick={vi.fn()} />)
    await waitFor(() => expect(client.isFetching()).toBe(0))
    expect(screen.queryByText('Masa Tenggang')).not.toBeInTheDocument()
  })
  it('shows the expired tier and an actionable renewal button', async () => {
    vi.mocked(subscriptionService.getUsage).mockResolvedValue(usage({ effective_tier: 'GROWTH', is_in_grace_period: true, grace_period_until: '2099-01-01T00:00:00Z' }))
    const onUpgrade = vi.fn()
    const user = userEvent.setup()
    renderPage(<GracePeriodBanner onUpgradeClick={onUpgrade} />)
    expect(await screen.findByText('Masa Tenggang')).toBeVisible()
    expect(screen.getByText('Growth')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Perpanjang Paket Sekarang' }))
    expect(onUpgrade).toHaveBeenCalledOnce()
  })
})

describe('PaymentNotice', () => {
  it.each([true, false])('hides confirmed payment feedback when compact is %s', async compact => {
    usePaymentState.setState({ scope: 'user-1:store-1', invoiceId: 'inv-123', phase: 'confirmed', pollUntil: 0, message: 'Pembayaran terverifikasi. Paket dan masa aktif sudah diperbarui.' })
    const view = renderPage(<PaymentNotice compact={compact} />)
    await waitFor(() => expect(view.client.isFetching()).toBe(0))
    expect(screen.queryByText('Menunggu Konfirmasi Pembayaran')).not.toBeInTheDocument()
    expect(screen.queryByText(/Pembayaran terverifikasi/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cek status pembayaran' })).not.toBeInTheDocument()
  })

  it('removes the waiting notice immediately after payment becomes confirmed without clearing success state', async () => {
    usePaymentState.setState({ scope: 'user-1:store-1', invoiceId: 'inv-123', phase: 'waiting', pollUntil: 0, message: 'Konfirmasi pembayaran belum diterima.' })
    renderPage(<PaymentNotice compact />)
    expect(screen.getByText('Menunggu Konfirmasi Pembayaran')).toBeVisible()
    act(() => usePaymentState.getState().update({ scope: 'user-1:store-1', phase: 'confirmed', pollUntil: 0, message: 'Pembayaran terverifikasi. Paket dan masa aktif sudah diperbarui.' }))
    expect(screen.queryByText('Menunggu Konfirmasi Pembayaran')).not.toBeInTheDocument()
    expect(usePaymentState.getState().phase).toBe('confirmed')
    expect(usePaymentState.getState().invoiceId).toBe('inv-123')
  })

  it('renders high contrast payment notice with bold title and link in compact mode', async () => {
    usePaymentState.setState({
      scope: 'user-1:store-1',
      invoiceId: 'inv-123',
      phase: 'waiting',
      pollUntil: 0,
      message: 'Konfirmasi pembayaran belum diterima.',
    })
    renderPage(<PaymentNotice compact />)
    expect(screen.getByText('Menunggu Konfirmasi Pembayaran')).toBeVisible()
    expect(screen.getByText('Konfirmasi pembayaran belum diterima.')).toBeVisible()
    expect(screen.getByRole('link', { name: /Lihat langganan dan tagihan/i })).toBeVisible()
  })

  it('hides the waiting notice when status synchronization verifies payment and refreshes billing data', async () => {
    const user = userEvent.setup()
    usePaymentState.setState({ scope: 'user-1:store-1', invoiceId: 'inv-default', phase: 'waiting', pollUntil: 0, message: 'Konfirmasi pembayaran belum diterima.' })
    const view = renderPage(<PaymentNotice />)
    await waitFor(() => expect(view.client.isFetching()).toBe(0))
    await user.click(screen.getByRole('button', { name: 'Cek status pembayaran' }))
    await waitFor(() => expect(usePaymentState.getState().phase).toBe('confirmed'))
    expect(subscriptionService.syncStatus).toHaveBeenCalledWith('inv-default', undefined)
    expect(vi.mocked(subscriptionService.getUsage).mock.calls.length).toBeGreaterThan(1)
    expect(vi.mocked(subscriptionService.getInvoices).mock.calls.length).toBeGreaterThan(1)
    expect(screen.queryByText('Menunggu Konfirmasi Pembayaran')).not.toBeInTheDocument()
  })

  it('renders error title and action button in non-compact mode', async () => {
    usePaymentState.setState({
      scope: 'user-1:store-1',
      invoiceId: 'inv-123',
      phase: 'error',
      pollUntil: 0,
      message: 'Pembayaran belum berhasil.',
    })
    renderPage(<PaymentNotice />)
    expect(screen.getByText('Kendala Pembayaran')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Cek status pembayaran' })).toBeVisible()
  })
})

describe('UpgradeModal', () => {
  const pendingInv: SubscriptionInvoice = {
    id: 'inv-pending',
    invoice_number: 'INV-PENDING-001',
    tier: 'GROWTH',
    amount: 175000,
    currency: 'IDR',
    status: 'PENDING',
    payment_method: 'MIDTRANS',
    billing_period_start: '2026-12-01T00:00:00Z',
    billing_period_end: '2026-12-31T00:00:00Z',
    snap_token: 'snap-token',
  }

  it('renders feature lock callout banner when reason is provided', async () => {
    vi.mocked(subscriptionService.getUsage).mockResolvedValue(usage())
    vi.mocked(subscriptionService.getPlans).mockResolvedValue([
      {
        tier: 'GROWTH',
        name: 'Growth',
        price: 175000,
        billing_period: 'MONTHLY',
        description: '',
        limits: { max_stores: 3, max_stocks: 120, max_products: 60, max_batches_per_mo: 150, max_staff_per_store: 3, max_suppliers: 25, max_customers: 100 },
        features: usage().features,
      },
    ])
    vi.mocked(subscriptionService.getInvoices).mockResolvedValue([])

    renderPage(
      <UpgradeModal
        isOpen
        onClose={vi.fn()}
        reason='Fitur "Analitik Produksi & Estimasi HPP" belum tersedia pada paket langganan toko saat ini.'
      />
    )

    expect(await screen.findByText('Kelola Paket Langganan')).toBeVisible()
    expect(
      screen.getByText('Fitur "Analitik Produksi & Estimasi HPP" belum tersedia pada paket langganan toko saat ini.')
    ).toBeVisible()
  })

  it('renders rich pending payment card when pendingInvoice is present', async () => {
    vi.mocked(subscriptionService.getUsage).mockResolvedValue(usage())
    vi.mocked(subscriptionService.getPlans).mockResolvedValue([])
    vi.mocked(subscriptionService.getInvoices).mockResolvedValue([pendingInv])

    renderPage(<UpgradeModal isOpen onClose={vi.fn()} />)

    expect(await screen.findByText('Pembayaran Belum Selesai')).toBeVisible()
    expect(screen.getByText('INV-PENDING-001')).toBeVisible()
    expect(screen.getByText(/Paket Growth · Durasi 30 Hari/)).toBeVisible()
    expect(screen.getByRole('button', { name: /Lanjutkan Pembayaran/i })).toBeVisible()
    expect(screen.getByRole('button', { name: /Cek Status/i })).toBeVisible()
    expect(screen.getByRole('link', { name: /Kelola di Halaman Tagihan/i })).toBeVisible()
  })

  it('automatically closes modal when payment phase becomes confirmed', async () => {
    vi.mocked(subscriptionService.getUsage).mockResolvedValue(usage())
    vi.mocked(subscriptionService.getPlans).mockResolvedValue([])
    vi.mocked(subscriptionService.getInvoices).mockResolvedValue([])

    const onClose = vi.fn()
    renderPage(<UpgradeModal isOpen onClose={onClose} />)

    const userState = useAuthStore.getState()
    const scope = `${userState.user?.id}:${userState.activeStoreId}`
    usePaymentState.getState().update({
      scope,
      phase: 'confirmed',
      message: 'Pembayaran berhasil!',
      invoiceId: 'inv-123',
    })

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('runs silent status check every 5 seconds when activeNativePayment is open', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    try {
      const nativePendingInv: SubscriptionInvoice = {
        ...pendingInv,
        payment_method: 'qris',
        metadata: JSON.stringify({
          instructions: {
            payment_method: 'qris',
            qr_url: 'https://example.com/qr.png',
          },
        }),
      }
      vi.mocked(subscriptionService.getUsage).mockResolvedValue(usage())
      vi.mocked(subscriptionService.getPlans).mockResolvedValue([])
      vi.mocked(subscriptionService.getInvoices).mockResolvedValue([nativePendingInv])
      vi.mocked(subscriptionService.syncStatus).mockResolvedValue({
        invoice: nativePendingInv,
        changed: false,
        provider_checked: true,
        provider_status: 'pending',
        checked_at: new Date().toISOString(),
      })

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      renderPage(<UpgradeModal isOpen onClose={vi.fn()} />)

      // Click "Lanjutkan Pembayaran" to enter activeNativePayment view
      const resumeBtn = await screen.findByRole('button', { name: /Lanjutkan Pembayaran/i })
      await user.click(resumeBtn)

      expect(await screen.findByText('QRIS Pembayaran Digital')).toBeVisible()

      // Advance 5 seconds
      await vi.advanceTimersByTimeAsync(5000)
      expect(subscriptionService.syncStatus).toHaveBeenCalledWith('inv-pending', undefined)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('useSubscriptionPayment checkStatus silent mode', () => {
  it('does not set isChecking or change phase to verifying when silent is true', async () => {
    const inv: SubscriptionInvoice = {
      id: 'inv-silent-1',
      invoice_number: 'INV-SILENT',
      tier: 'GROWTH',
      amount: 175000,
      currency: 'IDR',
      status: 'PENDING',
      payment_method: 'qris',
      billing_period_start: '2026-12-01T00:00:00Z',
      billing_period_end: '2026-12-31T00:00:00Z',
    }
    vi.mocked(subscriptionService.syncStatus).mockResolvedValue({
      invoice: inv,
      changed: false,
      provider_checked: true,
      provider_status: 'pending',
      checked_at: new Date().toISOString(),
    })

    const { useSubscriptionPayment } = await import('@/features/subscription/hooks/useSubscriptionPayment')
    const { renderHook, act } = await import('@testing-library/react')
    const { createWrapper } = await import('../support/render')

    const { result } = renderHook(() => useSubscriptionPayment(), { wrapper: createWrapper().wrapper })

    expect(result.current.isChecking).toBeFalsy()
    expect(result.current.phase).toBe('idle')

    await act(async () => {
      await result.current.checkStatus('inv-silent-1', undefined, true)
    })

    expect(subscriptionService.syncStatus).toHaveBeenCalledWith('inv-silent-1', undefined)
    expect(result.current.isChecking).toBeFalsy()
    expect(result.current.phase).toBe('idle')
  })

  it('updates phase to confirmed when silent check detects PAID invoice', async () => {
    const inv: SubscriptionInvoice = {
      id: 'inv-silent-paid',
      invoice_number: 'INV-SILENT-PAID',
      tier: 'GROWTH',
      amount: 175000,
      currency: 'IDR',
      status: 'PAID',
      payment_method: 'qris',
      billing_period_start: '2026-12-01T00:00:00Z',
      billing_period_end: '2026-12-31T00:00:00Z',
    }
    vi.mocked(subscriptionService.syncStatus).mockResolvedValue({
      invoice: inv,
      changed: true,
      provider_checked: true,
      provider_status: 'settlement',
      checked_at: new Date().toISOString(),
    })

    const { useSubscriptionPayment } = await import('@/features/subscription/hooks/useSubscriptionPayment')
    const { renderHook, act } = await import('@testing-library/react')
    const { createWrapper } = await import('../support/render')

    const { result } = renderHook(() => useSubscriptionPayment(), { wrapper: createWrapper().wrapper })

    await act(async () => {
      await result.current.checkStatus('inv-silent-paid', undefined, true)
    })

    expect(result.current.phase).toBe('confirmed')
  })
})
