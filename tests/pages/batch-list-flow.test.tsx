import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BatchListPage from '@/pages/production/batch-list-page'
import { productionService } from '@/features/production/services/production-service'
import { mockPageServices, resetSession } from '../support/page-services'
import { mockPopulatedPages } from '../support/populated-pages'
import { batch } from '../support/fixtures'
import { renderPage } from '../support/render'
const change = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } })
beforeEach(() => {
  resetSession(); mockPageServices(); mockPopulatedPages()
  vi.spyOn(productionService, 'pickupProduction').mockResolvedValue(batch)
  vi.spyOn(productionService, 'completeProduction').mockResolvedValue(batch)
  vi.spyOn(productionService, 'cancelProduction').mockResolvedValue(batch)
})
async function setup() { const user = userEvent.setup(); renderPage(<BatchListPage />, '/production/batches?tab=list'); await screen.findAllByText('BATCH-TEST-003'); return user }
describe('production list actions', () => {
  it('starts queued batches and reports a pickup error', async () => {
    const user = await setup()
    await user.click(screen.getAllByRole('button', { name: 'Mulai proses' })[0])
    await waitFor(() => expect(productionService.pickupProduction).toHaveBeenCalledWith('batch-0'))
    vi.mocked(productionService.pickupProduction).mockRejectedValueOnce(new Error('Stok kurang'))
    await user.click(screen.getAllByRole('button', { name: 'Mulai proses' })[1])
    expect(await screen.findByText('Stok kurang')).toBeVisible()
  })
  it('validates harvest totals and saves actual overhead costs', async () => {
    const user = await setup(); await user.click(screen.getAllByRole('button', { name: 'Selesaikan', exact: true })[0])
    const dialog = screen.getByRole('dialog'), fields = within(dialog).getAllByRole('spinbutton')
    change(fields[0], '')
    fireEvent.submit(fields[0].closest('form')!)
    expect(screen.getByText('Jumlah unit bagus harus lebih dari 0')).toBeVisible()
    fireEvent.blur(fields[0]); expect(fields[0]).toHaveValue(1)
    change(fields[0], '8'); change(fields[1], ''); fireEvent.blur(fields[1]); expect(fields[1]).toHaveValue(0)
    change(fields[1], '2')
    for (const cost of fields.slice(2)) { change(cost, ''); fireEvent.blur(cost); change(cost, '1000') }
    await user.click(within(dialog).getByRole('button', { name: 'Simpan & Masukkan ke Stok Jadi' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(productionService.completeProduction).toHaveBeenCalledWith('batch-2', expect.objectContaining({ goodQuantity: 8, wasteQuantity: 2, overheads: [expect.objectContaining({ name: 'Gas Dapur', amount: 1000 })] }))
  })
  it('keeps completion open on backend failure and allows cancellation', async () => {
    const user = await setup(); vi.mocked(productionService.completeProduction).mockRejectedValueOnce(new Error('Tidak bisa selesai'))
    await user.click(screen.getAllByRole('button', { name: 'Selesaikan', exact: true })[0])
    await user.click(screen.getByRole('button', { name: 'Simpan & Masukkan ke Stok Jadi' }))
    expect(await screen.findByText('Tidak bisa selesai')).toBeVisible()
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Batal' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it('confirms cancellation with a reason and handles server errors', async () => {
    const user = await setup()
    async function open() { await user.click(screen.getAllByRole('button', { name: /Aksi lainnya untuk BATCH-TEST-003/ })[0]); await user.click(screen.getByRole('menuitem', { name: 'Batalkan batch' })) }
    await open(); await user.click(screen.getByRole('button', { name: 'Kembali' })); expect(productionService.cancelProduction).not.toHaveBeenCalled()
    await open(); change(screen.getByPlaceholderText('Contoh: Oven mati, adonan rusak/terkontaminasi...'), 'Oven mati')
    vi.mocked(productionService.cancelProduction).mockRejectedValueOnce(new Error('Gagal server'))
    await user.click(screen.getByRole('button', { name: 'Batalkan & Pulihkan Stok' }))
    expect(await screen.findByText('Gagal server')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Batalkan & Pulihkan Stok' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(productionService.cancelProduction).toHaveBeenLastCalledWith('batch-2', 'Oven mati')
  })
  it('filters status and searches names, products, and notes', async () => {
    const user = await setup()
    const filters = screen.getByLabelText('Filter status batch')
    for (const button of within(filters).getAllByRole('button')) await user.click(button)
    const search = screen.getByRole('textbox', { name: 'Cari batch produksi' })
    change(search, 'NO-MATCH'); expect(screen.getByText(/Tidak ada batch/)).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Hapus pencarian' }))
    const summaries = screen.getByLabelText('Ringkasan produksi')
    for (const button of within(summaries).getAllByRole('button')) await user.click(button)
    await user.click(within(summaries).getByRole('button', { name: /Semua batch/ }))
    change(search, 'Pesanan pelanggan'); expect(screen.queryAllByText('BATCH-TEST-001')).toHaveLength(0)
    await user.click(screen.getByRole('button', { name: 'Hapus pencarian' }))
    await user.click(screen.getByRole('button', { name: /Refresh/ }))
    expect(productionService.getBatches).toHaveBeenCalledTimes(2)
    await user.click(screen.getByRole('tab', { name: 'Kalender' }))
    expect(screen.getByRole('tab', { name: 'Kalender' })).toHaveAttribute('aria-selected', 'true')
  })
})
