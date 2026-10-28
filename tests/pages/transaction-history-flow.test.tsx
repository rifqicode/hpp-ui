import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TransactionHistoryPage from '@/pages/sales/transaction-history-page'
import type { SaleQuery } from '@/features/sales/types'
import { salesService } from '@/features/sales/services/sales-service'
import { mockPageServices, resetSession } from '../support/page-services'
import { sale } from '../support/populated-pages'
import { renderPage } from '../support/render'

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 1, 0, 30))
  resetSession()
  mockPageServices()
  vi.mocked(salesService.getPaginatedSales).mockResolvedValue({ data: [sale], total: 11, page: 1, per_page: 10, total_pages: 2 })
})
afterEach(() => { vi.useRealTimers() })

async function setup() {
  const user = userEvent.setup()
  renderPage(<TransactionHistoryPage />, '/sales/history')
  await screen.findByRole('button', { name: `Struk ${sale.invoiceNumber}` })
  return user
}
async function expectQuery(expected: Record<string, unknown>) {
  await waitFor(() => {
    for (const [key, value] of Object.entries(expected)) {
      expect(vi.mocked(salesService.getPaginatedSales).mock.lastCall?.[0]?.[key as keyof SaleQuery]).toEqual(value)
      expect(vi.mocked(salesService.getSummary).mock.lastCall?.[0]?.[key as keyof SaleQuery]).toEqual(value)
    }
  })
}

describe('transaction history filters', () => {
  it('uses local dates and includes exactly seven days across a month boundary', async () => {
    const user = await setup()
    await expectQuery({ start_date: '2026-10-01', end_date: '2026-10-01' })
    await user.click(screen.getByRole('button', { name: '7 Hari Terakhir' }))
    await expectQuery({ start_date: '2026-09-25', end_date: '2026-10-01' })
    await user.click(screen.getByRole('button', { name: 'Hari Ini' }))
    await expectQuery({ start_date: '2026-10-01', end_date: '2026-10-01' })
    await user.click(screen.getByRole('button', { name: 'Semua Waktu' }))
    await expectQuery({ start_date: undefined, end_date: undefined })
  })

  it('does not fetch draft dates until a complete, ordered range is applied', async () => {
    const user = await setup()
    const requests = vi.mocked(salesService.getPaginatedSales).mock.calls.length
    await user.click(screen.getByRole('button', { name: 'Pilih tanggal' }))
    fireEvent.change(screen.getByLabelText('Dari tanggal'), { target: { value: '2026-09-20' } })
    fireEvent.change(screen.getByLabelText('Sampai tanggal'), { target: { value: '2026-09-10' } })
    expect(screen.getByRole('alert')).toHaveTextContent('Tanggal akhir harus sama atau setelah tanggal mulai')
    expect(screen.getByRole('button', { name: 'Terapkan' })).toBeDisabled()
    expect(salesService.getPaginatedSales).toHaveBeenCalledTimes(requests)
    fireEvent.change(screen.getByLabelText('Sampai tanggal'), { target: { value: '' } })
    expect(screen.getByRole('alert')).toHaveTextContent('Lengkapi tanggal')
    fireEvent.change(screen.getByLabelText('Sampai tanggal'), { target: { value: '2026-09-20' } })
    await user.click(screen.getByRole('button', { name: 'Terapkan' }))
    await expectQuery({ start_date: '2026-09-20', end_date: '2026-09-20', page: 1 })
    expect(screen.queryByLabelText('Dari tanggal')).not.toBeInTheDocument()
  })

  it('cancels draft dates without changing the active period', async () => {
    const user = await setup()
    await user.click(screen.getByRole('button', { name: 'Pilih tanggal' }))
    fireEvent.change(screen.getByLabelText('Dari tanggal'), { target: { value: '2026-01-01' } })
    await user.click(screen.getByRole('button', { name: 'Batal' }))
    await expectQuery({ start_date: '2026-10-01', end_date: '2026-10-01' })
    await user.click(screen.getByRole('button', { name: 'Pilih tanggal' }))
    expect(screen.getByLabelText('Dari tanggal')).toHaveValue('2026-10-01')
  })

  it('combines select filters and resets pagination without a request for the old page', async () => {
    const user = await setup()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await expectQuery({ page: 2 })
    const requests = vi.mocked(salesService.getPaginatedSales).mock.calls.length
    await user.selectOptions(screen.getByRole('combobox', { name: 'Status transaksi' }), 'CANCELLED')
    await expectQuery({ page: 1, status: 'CANCELLED' })
    expect(vi.mocked(salesService.getPaginatedSales).mock.calls.slice(requests).every(([query]) => query?.page === 1)).toBe(true)
    await user.selectOptions(screen.getByRole('combobox', { name: 'Metode pembayaran' }), 'QRIS')
    await user.type(screen.getByRole('textbox', { name: 'Cari transaksi' }), 'TRX')
    await expectQuery({ status: 'CANCELLED', payment_method: 'QRIS', search: 'TRX', page: 1 })
    await user.click(screen.getByRole('button', { name: 'Semua Waktu' }))
    await user.click(screen.getByRole('button', { name: 'Reset filter' }))
    await expectQuery({ status: undefined, payment_method: undefined, search: undefined, start_date: '2026-10-01', end_date: '2026-10-01', page: 1 })
  })

  it('keeps the filter count hidden and opens transaction details with the keyboard', async () => {
    const user = await setup()
    expect(screen.queryByText(/transaksi ditemukan/)).not.toBeInTheDocument()
    screen.getByRole('button', { name: `Struk ${sale.invoiceNumber}` }).focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('dialog', { name: 'Detail Transaksi' })).toBeVisible()
  })

  it('offers a retry when transactions fail without reporting an empty result', async () => {
    vi.mocked(salesService.getPaginatedSales).mockRejectedValueOnce(new Error('Offline'))
    const user = userEvent.setup()
    renderPage(<TransactionHistoryPage />, '/sales/history')
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Gagal memuat transaksi')
    expect(screen.queryByText('Belum ada transaksi di periode ini')).not.toBeInTheDocument()
    await user.click(within(alert).getByRole('button', { name: 'Coba lagi' }))
    expect(await screen.findByRole('button', { name: `Struk ${sale.invoiceNumber}` })).toBeVisible()
  })

  it('displays the 5s auto-refresh indicator badge in the header', async () => {
    await setup()
    expect(screen.getByText('Auto 5s')).toBeInTheDocument()
  })

  it('automatically refetches data after 5 seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    await setup()
    const initialCalls = vi.mocked(salesService.getPaginatedSales).mock.calls.length
    await vi.advanceTimersByTimeAsync(5100)
    expect(vi.mocked(salesService.getPaginatedSales).mock.calls.length).toBeGreaterThan(initialCalls)
  })
})
