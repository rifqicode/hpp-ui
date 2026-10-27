import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import PurchaseOrderListPage from '@/pages/inventory/purchase-order-list-page'
import { purchaseOrderService } from '@/features/purchase-orders/services/po-service'
import { mockPageServices, resetSession } from '../support/page-services'
import { renderPage } from '../support/render'
import { order } from '../support/fixtures'
import type { PurchaseOrder, PurchaseOrderQueryParams } from '@/features/purchase-orders/types'

function mockOrders(records: PurchaseOrder[]) {
  vi.mocked(purchaseOrderService.getPurchaseOrders).mockImplementation(async (params: PurchaseOrderQueryParams = {}) => {
    const items = records.filter((record) => {
      if (params.status && record.status !== params.status) return false
      if (params.receipt_status && record.receiptStatus !== params.receipt_status) return false
      if (params.payment_status && record.paymentStatus !== params.payment_status) return false
      switch (params.kanban_column) {
        case 'pengajuan': return record.status === 'PURCHASE_REQUEST'
        case 'dipesan': return record.status === 'PURCHASE_ORDER' && record.receiptStatus !== 'RECEIVED'
        case 'diterima': return record.status === 'PURCHASE_ORDER' && record.receiptStatus === 'RECEIVED' && record.paymentStatus !== 'PAID'
        case 'selesai': return record.status === 'COMPLETED'
        case 'ditutup': return record.status === 'CANCELLED' || record.status === 'REJECTED'
        default: return true
      }
    })
    const page = params.page ?? 1
    return { items: items.slice((page - 1) * 10, page * 10), total: items.length, page, limit: 10, totalPages: Math.ceil(items.length / 10) || 1 }
  })
}

beforeEach(() => {
  resetSession()
  mockPageServices()
})

it('refreshes orders and summary, filters by summary and resets all filter values', async () => {
  const user = userEvent.setup()
  renderPage(<PurchaseOrderListPage />)
  await waitFor(() => expect(purchaseOrderService.getPurchaseOrders).toHaveBeenCalledTimes(5))
  await user.click(screen.getByRole('button', { name: 'Refresh pembelian' }))
  await waitFor(() => expect(purchaseOrderService.getPurchaseOrders).toHaveBeenCalledTimes(10))
  expect(purchaseOrderService.getPurchaseOrderSummary).toHaveBeenCalledTimes(2)
  await user.click(screen.getByRole('button', { name: /Menunggu persetujuan/ }))
  await waitFor(() => expect(purchaseOrderService.getPurchaseOrders).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'PURCHASE_REQUEST', page: 1 })))
  await user.selectOptions(screen.getByRole('combobox', { name: 'Penerimaan' }), 'RECEIVED')
  await user.selectOptions(screen.getByRole('combobox', { name: 'Pembayaran' }), 'UNPAID')
  await user.click(screen.getByRole('button', { name: 'Urutkan' }))
  await user.click(screen.getByRole('menuitem', { name: 'Nominal Tertinggi' }))
  await waitFor(() => expect(purchaseOrderService.getPurchaseOrders).toHaveBeenLastCalledWith(expect.objectContaining({ receipt_status: 'RECEIVED', payment_status: 'UNPAID', sort_by: 'amount-desc' })))
  await user.click(screen.getByRole('button', { name: 'Reset filter' }))
  await waitFor(() => expect(purchaseOrderService.getPurchaseOrders).toHaveBeenLastCalledWith(expect.objectContaining({ status: undefined, receipt_status: undefined, payment_status: undefined, sort_by: 'date-desc' })))
})

it('shows a recoverable list error instead of the first-purchase empty state', async () => {
  vi.mocked(purchaseOrderService.getPurchaseOrders).mockRejectedValue(new Error('Offline'))
  const user = userEvent.setup()
  renderPage(<PurchaseOrderListPage />)
  await user.click(screen.getByRole('tab', { name: 'List' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Gagal memuat pembelian')
  expect(screen.queryByText('Belum Ada Pengajuan Pembelian')).not.toBeInTheDocument()
  mockOrders([order])
  await user.click(screen.getByRole('button', { name: 'Coba lagi' }))
  expect(await screen.findByRole('link', { name: order.poNumber })).toBeVisible()
})

it('reports a failed summary without hiding orders or showing zero as a real total', async () => {
  vi.mocked(purchaseOrderService.getPurchaseOrderSummary).mockRejectedValue(new Error('Offline'))
  mockOrders([order])
  renderPage(<PurchaseOrderListPage />)
  expect(await screen.findByRole('alert')).toHaveTextContent('Ringkasan pembelian gagal dimuat.')
  expect(screen.getByText('Ringkasan belum tersedia')).toBeVisible()
  expect(screen.getByRole('link', { name: order.poNumber })).toBeVisible()
})

it('shows no matches in kanban when receipt or payment filters return no records', async () => {
  localStorage.setItem('po_view_mode', 'kanban')
  const user = userEvent.setup()
  renderPage(<PurchaseOrderListPage />)
  await user.selectOptions(screen.getByRole('combobox', { name: 'Pembayaran' }), 'UNPAID')
  expect(await screen.findByRole('heading', { name: 'Tidak ada pesanan yang cocok' })).toBeVisible()
  expect(screen.queryByText('Belum Ada Pengajuan Pembelian')).not.toBeInTheDocument()
})

it('keeps rejected and cancelled purchases visible in kanban without treating them as completed', async () => {
  localStorage.setItem('po_view_mode', 'kanban')
  mockOrders([{ ...order, status: 'CANCELLED', receiptStatus: 'RECEIVED', paymentStatus: 'PAID' }])
  renderPage(<PurchaseOrderListPage />)
  expect(await screen.findByRole('link', { name: order.poNumber })).toBeVisible()
  expect(screen.getByRole('heading', { name: 'Ditolak / Dibatalkan' })).toBeVisible()
  expect(screen.getAllByRole('link', { name: order.poNumber })).toHaveLength(1)
})

it('shows all four filters and defaults to labeled Kanban tabs with keyboard navigation', async () => {
  const user = userEvent.setup()
  mockOrders([order])
  renderPage(<PurchaseOrderListPage />)
  for (const name of ['Kategori', 'Status Dokumen', 'Penerimaan', 'Pembayaran']) {
    expect(screen.getByRole('combobox', { name })).toBeVisible()
  }
  expect(screen.queryByRole('button', { name: /Filter lainnya/ })).not.toBeInTheDocument()
  const kanban = screen.getByRole('tab', { name: 'Kanban' })
  expect(kanban).toHaveAttribute('aria-selected', 'true')
  expect(await screen.findByRole('heading', { name: 'Purchase Request' })).toBeVisible()
  await user.click(screen.getByRole('tab', { name: 'List' }))
  expect(await screen.findByRole('table', { name: 'Daftar pembelian' })).toBeVisible()
  expect(screen.getByRole('tab', { name: 'List' })).toHaveAttribute('aria-selected', 'true')
  await user.keyboard('{ArrowLeft}')
  await waitFor(() => expect(kanban).toHaveAttribute('aria-selected', 'true'))
})

it('loads ten per column independently and only queries the ten-item list when its tab is opened', async () => {
  localStorage.setItem('po_view_mode', 'table')
  const records = (['PURCHASE_REQUEST', 'PURCHASE_ORDER', 'COMPLETED'] as const).flatMap((status) =>
    Array.from({ length: 15 }, (_, i) => ({ ...order, id: `${status}-${i}`, poNumber: `${status}-${i}`, status, receiptStatus: 'NOT_RECEIVED' as const, paymentStatus: 'UNPAID' as const })))
  mockOrders(records)
  const user = userEvent.setup()
  renderPage(<PurchaseOrderListPage />)
  await waitFor(() => expect(screen.getAllByRole('link', { name: /^(PURCHASE_REQUEST|PURCHASE_ORDER|COMPLETED)-/ })).toHaveLength(30))
  expect(screen.queryByRole('button', { name: 'Prev' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument()
  expect(purchaseOrderService.getPurchaseOrders).toHaveBeenCalledTimes(5)
  for (const [params] of vi.mocked(purchaseOrderService.getPurchaseOrders).mock.calls) {
    expect(params).toMatchObject({ limit: 10, page: 1, sort_by: 'date-desc' })
    expect(params?.kanban_column).toBeTruthy()
  }
  await user.click(screen.getByRole('button', { name: 'Muat lebih banyak Purchase Request' }))
  await waitFor(() => expect(screen.getAllByRole('link', { name: /^PURCHASE_REQUEST-/ })).toHaveLength(15))
  expect(screen.getAllByRole('link', { name: /^PURCHASE_ORDER-/ })).toHaveLength(10)
  expect(screen.queryByRole('button', { name: 'Muat lebih banyak Purchase Request' })).not.toBeInTheDocument()
  expect(purchaseOrderService.getPurchaseOrders).toHaveBeenLastCalledWith(expect.objectContaining({ kanban_column: 'pengajuan', page: 2, limit: 10 }))
  await user.click(screen.getByRole('tab', { name: 'List' }))
  expect(await screen.findByRole('table', { name: 'Daftar pembelian' })).toBeVisible()
  expect(purchaseOrderService.getPurchaseOrders).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, limit: 10, sort_by: 'date-desc' }))
  expect(vi.mocked(purchaseOrderService.getPurchaseOrders).mock.lastCall?.[0]?.kanban_column).toBeUndefined()
  expect(screen.getAllByRole('link', { name: /^PURCHASE_REQUEST-/ })).toHaveLength(10)
  await user.click(screen.getByRole('tab', { name: 'Kanban' }))
  await user.selectOptions(screen.getByRole('combobox', { name: 'Pembayaran' }), 'PAID')
  await waitFor(() => expect(screen.getByRole('heading', { name: 'Tidak ada pesanan yang cocok' })).toBeVisible())
  const filtered = vi.mocked(purchaseOrderService.getPurchaseOrders).mock.calls.filter(([params]) => params?.payment_status === 'PAID')
  expect(filtered).toHaveLength(5)
  expect(filtered.every(([params]) => params?.page === 1 && params?.kanban_column)).toBe(true)
})

it('keeps loaded cards when loading more fails and retries just that column', async () => {
  mockOrders(Array.from({ length: 15 }, (_, i) => ({ ...order, id: `request-${i}`, poNumber: `Request-${i}` })))
  const implementation = vi.mocked(purchaseOrderService.getPurchaseOrders).getMockImplementation()!
  let fail = true
  vi.mocked(purchaseOrderService.getPurchaseOrders).mockImplementation((params) => {
    if (params?.page === 2 && fail) return Promise.reject(new Error('Gagal memuat halaman berikutnya'))
    return implementation(params)
  })
  const user = userEvent.setup()
  renderPage(<PurchaseOrderListPage />)
  await user.click(await screen.findByRole('button', { name: 'Muat lebih banyak Purchase Request' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Gagal memuat halaman berikutnya')
  expect(screen.getAllByRole('link', { name: /^Request-/ })).toHaveLength(10)
  fail = false
  await user.click(screen.getByRole('button', { name: 'Coba lagi Purchase Request' }))
  await waitFor(() => expect(screen.getAllByRole('link', { name: /^Request-/ })).toHaveLength(15))
})
