import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PaymentChannelSelector } from '@/features/subscription/components/PaymentChannelSelector'
import { NativePaymentDisplay } from '@/features/subscription/components/NativePaymentDisplay'
import type { PaymentChannelConfig, SubscriptionInvoice, PaymentInstructions } from '@/features/subscription/types/subscription'
import { renderPage } from '../support/render'

const mockChannels: PaymentChannelConfig[] = [
  { code: 'qris', name: 'QRIS', category: 'QRIS', description: 'GoPay, OVO, DANA, BCA, Livin, dll', enabled: true },
  { code: 'bca_va', name: 'BCA Virtual Account', category: 'VIRTUAL_ACCOUNT', description: 'Transfer via BCA Mobile atau ATM', enabled: true },
  { code: 'mandiri_va', name: 'Mandiri Virtual Account', category: 'VIRTUAL_ACCOUNT', description: 'Transfer via Livin by Mandiri', enabled: true },
  { code: 'disabled_va', name: 'Disabled VA', category: 'VIRTUAL_ACCOUNT', description: 'Disabled', enabled: false },
]

describe('PaymentChannelSelector', () => {
  it('renders enabled payment channels categorized by QRIS and Virtual Account', () => {
    const onSelect = vi.fn()
    renderPage(
      <PaymentChannelSelector
        channels={mockChannels}
        selectedChannelCode="qris"
        onSelectChannel={onSelect}
      />
    )

    expect(screen.getByText('Pembayaran Instan (QRIS)')).toBeVisible()
    expect(screen.getByText('QRIS')).toBeVisible()
    expect(screen.getByText('Virtual Account Bank (Otomatis Terverifikasi)')).toBeVisible()
    expect(screen.getByText('BCA Virtual Account')).toBeVisible()
    expect(screen.getByText('Mandiri Virtual Account')).toBeVisible()
    expect(screen.queryByText('Disabled VA')).not.toBeInTheDocument()
  })

  it('triggers onSelectChannel when a channel card is clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    renderPage(
      <PaymentChannelSelector
        channels={mockChannels}
        selectedChannelCode="qris"
        onSelectChannel={onSelect}
      />
    )

    await user.click(screen.getByText('BCA Virtual Account'))
    expect(onSelect).toHaveBeenCalledWith('bca_va')
  })
})

describe('NativePaymentDisplay', () => {
  const invoice: SubscriptionInvoice = {
    id: 'inv-123',
    invoice_number: 'INV-20261022-ABC123',
    tier: 'GROWTH',
    amount: 149000,
    currency: 'IDR',
    status: 'PENDING',
    payment_method: 'bca_va',
    billing_period_start: '2026-10-22T00:00:00Z',
    billing_period_end: '2026-11-22T00:00:00Z',
  }

  it('renders Virtual Account details and triggers status check and copy actions', async () => {
    const user = userEvent.setup()
    const onCheckStatus = vi.fn().mockResolvedValue(undefined)
    const onCancelInvoice = vi.fn().mockResolvedValue(undefined)

    const instructions: PaymentInstructions = {
      payment_method: 'bca_va',
      bank: 'BCA',
      va_number: '70012345678',
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
    }

    renderPage(
      <NativePaymentDisplay
        invoice={invoice}
        instructions={instructions}
        onCheckStatus={onCheckStatus}
        onCancelInvoice={onCancelInvoice}
      />
    )

    expect(screen.getByText('Virtual Account BCA')).toBeVisible()
    expect(screen.getByText('INV-20261022-ABC123')).toBeVisible()
    expect(screen.getByText('70012345678')).toBeVisible()
    expect(screen.getByText(/Selesaikan pembayaran dalam/)).toBeVisible()

    // Test check status button
    const checkBtn = screen.getByRole('button', { name: /Cek Status Pembayaran/i })
    await user.click(checkBtn)
    expect(onCheckStatus).toHaveBeenCalledWith('inv-123')

    // Test cancel confirmation
    const cancelBtn = screen.getByRole('button', { name: /Batalkan Tagihan/i })
    await user.click(cancelBtn)
    expect(screen.getByText('Konfirmasi Pembatalan Tagihan')).toBeVisible()
    const confirmCancelBtn = screen.getByRole('button', { name: /Ya, Batalkan Tagihan/i })
    await user.click(confirmCancelBtn)
    expect(onCancelInvoice).toHaveBeenCalledWith(invoice)
  })

  it('renders Mandiri Bill Key and Biller Code correctly', () => {
    const instructions: PaymentInstructions = {
      payment_method: 'mandiri_va',
      bank: 'MANDIRI',
      bill_key: '99887766',
      biller_code: '70012',
    }

    renderPage(
      <NativePaymentDisplay
        invoice={{ ...invoice, payment_method: 'mandiri_va' }}
        instructions={instructions}
        onCheckStatus={vi.fn()}
      />
    )

    expect(screen.getByText('Virtual Account MANDIRI')).toBeVisible()
    expect(screen.getByText('70012')).toBeVisible()
    expect(screen.getByText('99887766')).toBeVisible()
  })

  it('renders QRIS QR code image and instructions', () => {
    const instructions: PaymentInstructions = {
      payment_method: 'qris',
      qr_url: 'https://api.sandbox.midtrans.com/v2/qris/123/qr-code',
      qr_string: '00020101021226...',
    }

    renderPage(
      <NativePaymentDisplay
        invoice={{ ...invoice, payment_method: 'qris' }}
        instructions={instructions}
        onCheckStatus={vi.fn()}
      />
    )

    expect(screen.getByText('QRIS Pembayaran Digital')).toBeVisible()
    const qrImg = screen.getByRole('img', { name: 'Kode QRIS Pembayaran' })
    expect(qrImg).toHaveAttribute('src', 'https://api.sandbox.midtrans.com/v2/qris/123/qr-code')
  })
})
