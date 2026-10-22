import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { SubscriptionWelcome } from '@/features/subscription/components/SubscriptionWelcome'
import { subscriptionService } from '@/features/subscription/services/subscriptionService'
import { idlePayment, usePaymentState } from '@/features/subscription/lib/payment-state'
import { claimSubscriptionWelcome } from '@/features/subscription/lib/welcome-receipt'
import type { SubscriptionInvoice } from '@/features/subscription/types/subscription'
import { resetSession } from '../support/page-services'
import { usage, user, store } from '../support/fixtures'
import { renderPage } from '../support/render'

let sequence = 0
let invoice: SubscriptionInvoice

beforeEach(() => {
  resetSession()
  invoice = {
    id: `welcome-${++sequence}`, invoice_number: 'INV-WELCOME', tier: 'GROWTH', amount: 149000,
    currency: 'IDR', status: 'PAID', payment_method: 'qris', billing_period_start: '2026-12-01T00:00:00Z', billing_period_end: '2026-12-31T00:00:00Z',
  }
  usePaymentState.setState({ ...idlePayment, scope: `${user.id}:${store.id}`, phase: 'confirmed', invoiceId: invoice.id })
  vi.spyOn(subscriptionService, 'getUsage').mockResolvedValue(usage({ current_period_end: invoice.billing_period_end }))
  vi.spyOn(subscriptionService, 'getInvoices').mockResolvedValue([invoice])
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})

it('welcomes a verified subscriber and moves focus to the usage action', async () => {
  const visitor = userEvent.setup()
  renderPage(<SubscriptionWelcome />, '/dashboard')
  expect(await screen.findByRole('heading', { name: 'Paket Growth kamu sudah aktif!' })).toBeVisible()
  expect(screen.getByText('31 Desember 2026')).toBeVisible()
  expect(screen.getByText(/149.000/)).toBeVisible()
  const action = screen.getByRole('button', { name: 'Lihat paket & penggunaan' })
  await waitFor(() => expect(action).toHaveFocus())
  await visitor.click(action)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/subscription')
})

it('does not show a success welcome for an unpaid invoice or incomplete activation', async () => {
  vi.mocked(subscriptionService.getInvoices).mockResolvedValue([{ ...invoice, status: 'PENDING' }])
  const first = renderPage(<SubscriptionWelcome />)
  await waitFor(() => expect(first.client.isFetching()).toBe(0))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(localStorage.getItem(`subscription-welcome:${user.id}:${invoice.id}`)).toBeNull()
  first.unmount()
  vi.mocked(subscriptionService.getInvoices).mockResolvedValue([invoice])
  vi.mocked(subscriptionService.getUsage).mockResolvedValue(usage({ current_period_end: '2026-12-01T00:00:00Z' }))
  const second = renderPage(<SubscriptionWelcome />)
  await waitFor(() => expect(second.client.isFetching()).toBe(0))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('recognizes renewal from previous paid invoices and can be dismissed with Escape', async () => {
  vi.mocked(subscriptionService.getInvoices).mockResolvedValue([invoice, { ...invoice, id: 'older-invoice', billing_period_end: '2026-12-01T00:00:00Z' }])
  const visitor = userEvent.setup()
  renderPage(<SubscriptionWelcome />)
  expect(await screen.findByRole('heading', { name: 'Paket Growth kamu diperpanjang.' })).toBeVisible()
  await visitor.keyboard('{Escape}')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('does not reopen the welcome when the same confirmed payment is revisited', async () => {
  const visitor = userEvent.setup()
  const first = renderPage(<SubscriptionWelcome />)
  await visitor.click(await screen.findByRole('button', { name: 'Tutup' }))
  first.unmount()
  usePaymentState.setState({ welcomeInvoiceId: null })
  const second = renderPage(<SubscriptionWelcome />)
  await waitFor(() => expect(second.client.isFetching()).toBe(0))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(localStorage.getItem(`subscription-welcome:${user.id}:${invoice.id}`)).toBe('shown')
})

it('respects reduced motion while still displaying the welcome', async () => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
  renderPage(<SubscriptionWelcome />)
  expect(await screen.findByRole('dialog')).toBeVisible()
  expect(HTMLCanvasElement.prototype.getContext).not.toHaveBeenCalled()
  expect(document.querySelector('canvas')).toHaveAttribute('hidden')
})

it('never opens for staff even if a confirmed state is present', async () => {
  vi.mocked(subscriptionService.getUsage).mockResolvedValue(usage({ can_manage_billing: false, owner_id: 'another-owner', current_period_end: invoice.billing_period_end }))
  const page = renderPage(<SubscriptionWelcome />)
  await waitFor(() => expect(page.client.isFetching()).toBe(0))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(subscriptionService.getInvoices).not.toHaveBeenCalled()
})

it('namespaces welcome receipts and tolerates unavailable browser storage', () => {
  const id = `receipt-${sequence}`
  expect(claimSubscriptionWelcome('owner-a', id)).toBe(true)
  expect(claimSubscriptionWelcome('owner-a', id)).toBe(false)
  expect(claimSubscriptionWelcome('owner-b', id)).toBe(true)
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
  expect(claimSubscriptionWelcome('storage-blocked', id)).toBe(true)
  expect(claimSubscriptionWelcome('storage-blocked', id)).toBe(false)
})
