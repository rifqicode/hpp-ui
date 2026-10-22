import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import OverheadListPage from '@/pages/production/overhead-list-page'
import { overheadService } from '@/features/overheads/services/overhead-service'
import { mockPageServices, resetSession } from '../support/page-services'
import { mockPopulatedPages, overheads } from '../support/populated-pages'
import { renderPage } from '../support/render'
const change = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } })
beforeEach(() => {
  resetSession(); mockPageServices(); mockPopulatedPages()
  vi.spyOn(overheadService, 'createOverhead').mockResolvedValue(overheads[0])
  vi.spyOn(overheadService, 'updateOverhead').mockResolvedValue(overheads[0])
  vi.spyOn(overheadService, 'deleteOverhead').mockResolvedValue(undefined)
})
async function setup() { const user = userEvent.setup(); renderPage(<OverheadListPage />); await screen.findByText('Gas Dapur'); return user }
describe('overhead management', () => {
  it('validates and creates an inactive operational expense', async () => {
    const user = await setup(); await user.click(screen.getAllByRole('button', { name: /Tambah Biaya/ })[0])
    const dialog = screen.getByRole('dialog'), name = within(dialog).getByLabelText(/Nama Biaya Overhead/)
    fireEvent.submit(name.closest('form')!)
    expect(screen.getByText('Nama biaya overhead wajib diisi')).toBeVisible()
    change(name, 'Kemasan'); change(within(dialog).getByLabelText('Nominal Standar (Rp)'), '-1')
    fireEvent.submit(name.closest('form')!)
    expect(screen.getByText('Nominal tidak boleh negatif')).toBeVisible()
    change(within(dialog).getByLabelText('Nominal Standar (Rp)'), '5000')
    change(within(dialog).getByLabelText('Catatan Tambahan'), 'Per bulan')
    await user.click(within(dialog).getAllByRole('radio')[1])
    await user.click(within(dialog).getByRole('switch'))
    await user.click(within(dialog).getByRole('button', { name: 'Tambah Biaya Overhead' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(overheadService.createOverhead).toHaveBeenCalledWith({ name: 'Kemasan', category: 'OPERATIONAL', defaultAmount: 5000, notes: 'Per bulan', isActive: false })
    expect(screen.getByText(/berhasil ditambahkan/)).toBeVisible()
  })
  it('edits, toggles status, and confirms deletion', async () => {
    const user = await setup(); await user.click(screen.getAllByTitle('Edit overhead')[0])
    change(screen.getByLabelText(/Nama Biaya Overhead/), 'Gas Baru')
    change(screen.getByLabelText('Nominal Standar (Rp)'), '')
    await user.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(overheadService.updateOverhead).toHaveBeenCalledWith('oh1', expect.objectContaining({ name: 'Gas Baru', defaultAmount: null }))
    await user.click(screen.getAllByRole('switch', { name: 'Toggle active status' })[0])
    await waitFor(() => expect(overheadService.updateOverhead).toHaveBeenCalledWith('oh1', { isActive: false }))
    await user.click(screen.getAllByTitle('Hapus overhead')[0])
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Batal' }))
    await user.click(screen.getAllByTitle('Hapus overhead')[0])
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Hapus/ }))
    await waitFor(() => expect(overheadService.deleteOverhead).toHaveBeenCalledWith('oh1'))
    expect(await screen.findByText(/berhasil dihapus/)).toBeVisible()
  })
  it('passes status/category/search filters to the API and refreshes totals', async () => {
    const user = await setup()
    for (const val of ['ACTIVE', 'INACTIVE', 'ALL']) await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), val)
    for (const val of ['PRODUCTION', 'OPERATIONAL', 'ALL']) await user.selectOptions(screen.getByRole('combobox', { name: 'Kategori' }), val)
    change(screen.getByPlaceholderText('Cari nama biaya atau keterangan...'), 'Gas')
    await waitFor(() => expect(overheadService.getPaginatedOverheads).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'Gas' })))
    await user.click(screen.getByRole('button', { name: /Refresh/ }))
    expect(overheadService.getOverheadSummary).toHaveBeenCalledTimes(2)
  })
  it.each(['save', 'toggle', 'delete'] as const)('shows feedback when %s fails', async operation => {
    const user = await setup()
    if (operation === 'save') {
      vi.mocked(overheadService.updateOverhead).mockRejectedValueOnce(new Error('offline'))
      await user.click(screen.getAllByTitle('Edit overhead')[0]); await user.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))
      expect(await screen.findByText('Terjadi kesalahan saat menyimpan biaya overhead.')).toBeVisible()
      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Batal' }))
    } else if (operation === 'toggle') {
      vi.mocked(overheadService.updateOverhead).mockRejectedValueOnce(new Error('offline'))
      await user.click(screen.getAllByRole('switch')[0]); expect(await screen.findByText('Gagal mengubah status "Gas Dapur".')).toBeVisible()
    } else {
      vi.mocked(overheadService.deleteOverhead).mockRejectedValueOnce(new Error('offline'))
      await user.click(screen.getAllByTitle('Hapus overhead')[0]); await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Hapus/ }))
      expect(await screen.findByText('Gagal menghapus biaya overhead "Gas Dapur".')).toBeVisible()
    }
  })
  it('clears success feedback after its display interval', async () => {
    const user = await setup(); vi.useFakeTimers()
    await act(async () => { fireEvent.click(screen.getAllByRole('switch')[0]) })
    expect(screen.getByText(/Status "Gas Dapur" diubah/)).toBeVisible()
    await act(async () => { await vi.advanceTimersByTimeAsync(4500) })
    expect(screen.queryByText(/Status "Gas Dapur" diubah/)).not.toBeInTheDocument()
    void user
  })
})
