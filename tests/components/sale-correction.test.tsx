import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SaleCorrectionPanel } from '@/features/sales/components/sale-correction-panel'
import { salesService } from '@/features/sales/services/sales-service'
import { useAuthStore } from '@/store/use-auth-store'
import { sale } from '../support/populated-pages'
import { mockPageServices, resetSession } from '../support/page-services'
import { renderPage, deferred } from '../support/render'
beforeEach(() => { resetSession(); mockPageServices(); useAuthStore.getState().setPermissions(['orders:void']); vi.spyOn(salesService, 'correctSale').mockResolvedValue({ ...sale, status: 'RETURNED' }) })

describe('sale correction', () => {
  it.each(['CANCELLED', 'RETURNED'] as const)('does not allow corrections of %s sales', status => {
    renderPage(<SaleCorrectionPanel sale={{ ...sale, status }} onCorrected={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Koreksi transaksi' })).not.toBeInTheDocument()
  })
  it('requires permission to offer corrections', () => {
    useAuthStore.getState().setPermissions([])
    renderPage(<SaleCorrectionPanel sale={sale} onCorrected={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Koreksi transaksi' })).not.toBeInTheDocument()
  })
  it('validates quantity, reason and condition, then submits a partial return', async () => {
    const user = userEvent.setup(), corrected = vi.fn()
    renderPage(<SaleCorrectionPanel sale={sale} onCorrected={corrected} />)
    await user.click(screen.getByRole('button', { name: 'Koreksi transaksi' }))
    const confirm = screen.getByRole('button', { name: 'Konfirmasi koreksi & catat refund' })
    expect(confirm).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Jumlah retur Roti Coklat - Regular'), { target: { value: '3' } })
    await user.type(screen.getByLabelText('Alasan koreksi'), ' Barang rusak ')
    expect(confirm).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Jumlah retur Roti Coklat - Regular'), { target: { value: '1' } })
    await user.click(screen.getByRole('checkbox'))
    await user.selectOptions(screen.getByLabelText('Metode pengembalian uang'), 'TRANSFER')
    await user.type(screen.getByLabelText('Referensi refund (opsional)'), 'REF-1')
    expect(screen.getByText('Refund:').parentElement).toHaveTextContent('10.000')
    await user.click(confirm)
    await waitFor(() => expect(corrected).toHaveBeenCalled())
    expect(salesService.correctSale).toHaveBeenCalledWith(sale.id, { kind: 'RETURN', reason: 'Barang rusak', refund_method: 'TRANSFER', refund_reference: 'REF-1', request_id: expect.any(String), items: [{ sale_item_id: 'line-1', quantity: 1, restock: false }] })
  })
  it('reuses the request id when retrying the same failed correction', async () => {
    vi.mocked(salesService.correctSale).mockRejectedValueOnce(new Error('Offline'))
    const user = userEvent.setup()
    renderPage(<SaleCorrectionPanel sale={sale} onCorrected={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Koreksi transaksi' }))
    await user.selectOptions(screen.getByLabelText('Jenis koreksi'), 'CANCEL')
    await user.type(screen.getByLabelText('Alasan koreksi'), 'Salah input')
    await user.click(screen.getByRole('button', { name: 'Konfirmasi koreksi & catat refund' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Offline')
    const id = vi.mocked(salesService.correctSale).mock.calls[0][1].request_id
    await user.click(screen.getByRole('button', { name: 'Konfirmasi koreksi & catat refund' }))
    await waitFor(() => expect(salesService.correctSale).toHaveBeenCalledTimes(2))
    expect(vi.mocked(salesService.correctSale).mock.calls[1][1]).toMatchObject({ request_id: id, kind: 'CANCEL', items: [] })
  })
  it('locks controls while saving and can close without submitting', async () => {
    const pending = deferred<typeof sale>()
    vi.mocked(salesService.correctSale).mockReturnValue(pending.promise)
    const user = userEvent.setup()
    renderPage(<SaleCorrectionPanel sale={sale} onCorrected={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Koreksi transaksi' }))
    await user.click(screen.getByRole('button', { name: 'Tutup' }))
    expect(salesService.correctSale).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Koreksi transaksi' }))
    await user.selectOptions(screen.getByLabelText('Jenis koreksi'), 'CANCEL')
    await user.type(screen.getByLabelText('Alasan koreksi'), 'Salah input')
    await user.click(screen.getByRole('button', { name: 'Konfirmasi koreksi & catat refund' }))
    expect(screen.getByLabelText('Alasan koreksi')).toBeDisabled()
    pending.resolve(sale)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Koreksi transaksi' })).toBeVisible())
  })
  it('renders historical corrections with actor and restock information', () => {
    renderPage(<SaleCorrectionPanel sale={{ ...sale, refundedAmount: 5000, corrections: [{ id: 'c1', actor_id: 'user1', actor_name: 'Rina', kind: 'RETURN', reason: 'Rusak', refund_method: 'CASH', refund_reference: 'REF', refund_amount: 5000, created_at: '2026-01-01', items: [{ id: 'ci1', sale_item_id: 'line-1', quantity: 1, restock: false }] }, { id: 'c2', actor_id: 'user2', kind: 'CANCEL', reason: 'Salah', refund_method: 'CASH', refund_reference: '', refund_amount: 0, created_at: '2026-01-01', items: [{ id: 'ci2', sale_item_id: 'missing', quantity: 1, restock: true }] }] }} onCorrected={vi.fn()} />)
    expect(screen.getByText('Dicatat oleh: Rina')).toBeVisible()
    expect(screen.getByText(/Tidak kembali ke stok/)).toBeVisible()
  })
})
