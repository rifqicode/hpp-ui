import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CustomerListPage from '@/pages/sales/customer-list-page'
import { customerService } from '@/features/sales/services/customer-service'
import { mockPageServices, resetSession } from '../support/page-services'
import { customer, mockPopulatedPages } from '../support/populated-pages'
import { renderPage } from '../support/render'
const change = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } })
beforeEach(() => {
  resetSession(); mockPageServices(); mockPopulatedPages()
  vi.spyOn(customerService, 'createCustomer').mockResolvedValue(customer)
  vi.spyOn(customerService, 'updateCustomer').mockResolvedValue(customer)
  vi.spyOn(customerService, 'deleteCustomer').mockResolvedValue(undefined)
  vi.spyOn(window, 'alert').mockImplementation(() => {})
})
async function setup() { const user = userEvent.setup(); renderPage(<CustomerListPage />); await screen.findByText('Pelanggan Rina'); return user }
describe('customer management', () => {
  it('validates and creates a complete customer', async () => {
    const user = await setup(); await user.click(screen.getByRole('button', { name: 'Tambah Pelanggan' }))
    const dialog = screen.getByRole('dialog'), fields = within(dialog).getAllByRole('textbox')
    fireEvent.submit(fields[0].closest('form')!)
    expect(window.alert).toHaveBeenCalledWith('Nama dan Nomor HP wajib diisi')
    for (const [index, value] of ['Budi', '0812999', 'budi@example.com', 'Bandung', 'VIP'].entries()) change(fields[index], value)
    await user.click(within(dialog).getByRole('button', { name: 'Simpan Pelanggan' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(customerService.createCustomer).toHaveBeenCalledWith({ name: 'Budi', phone: '0812999', email: 'budi@example.com', address: 'Bandung', notes: 'VIP' })
    await user.click(screen.getByRole('button', { name: 'Tambah Pelanggan' }))
    expect(screen.getByPlaceholderText('Contoh: Budi Santoso')).toHaveValue('')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Batal' }))
  })
  it('edits all customer fields and opens purchase history', async () => {
    const user = await setup(); await user.click(screen.getByTitle('Edit Pelanggan'))
    let dialog = screen.getByRole('dialog')
    for (const [i, value] of ['Nama Baru', '0812999', 'new@example.com', 'Bogor', 'Pagi'].entries()) change(within(dialog).getAllByRole('textbox')[i], value)
    await user.click(within(dialog).getByRole('button', { name: 'Perbarui' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(customerService.updateCustomer).toHaveBeenCalledWith('customer-1', { name: 'Nama Baru', phone: '0812999', email: 'new@example.com', address: 'Bogor', notes: 'Pagi' })
    await user.click(screen.getByTitle('Edit Pelanggan')); await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Batal' }))
    await user.click(screen.getByTitle('Lihat Detail & Riwayat'))
    dialog = screen.getByRole('dialog', { name: 'Profil & Riwayat Belanja Pelanggan' })
    expect(await within(dialog).findByText('TRX-TEST-001')).toBeVisible()
  })
  it('requires confirmation for deletion and supports filtering and refresh', async () => {
    const user = await setup(); await user.click(screen.getByTitle('Hapus Pelanggan'))
    expect(customerService.deleteCustomer).not.toHaveBeenCalled()
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Batal' }))
    await user.click(screen.getByTitle('Hapus Pelanggan'))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Hapus/ }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(customerService.deleteCustomer).toHaveBeenCalledWith('customer-1')
    const search = screen.getByPlaceholderText('Cari nama, nomor HP, atau email pelanggan...')
    change(search, 'Rina')
    await waitFor(() => expect(customerService.getCustomers).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'Rina' })))
    await user.click(search.parentElement!.querySelector('button')!)
    expect(search).toHaveValue('')
    const summaryRequests = vi.mocked(customerService.getCustomerSummary).mock.calls.length
    await user.click(screen.getByRole('button', { name: 'Refresh' }))
    await waitFor(() => expect(customerService.getCustomerSummary).toHaveBeenCalledTimes(summaryRequests + 1))
  })
  it('paginates search results using the filtered count while keeping the global summary', async () => {
    vi.mocked(customerService.getCustomerSummary).mockResolvedValue({ total_customers: 25, active_customers: 20, total_spent_amount: 1000000 })
    vi.mocked(customerService.getCustomers).mockImplementation(async (query) => ({
      data: [customer], total: query?.search ? 1 : 25, page: query?.page || 1,
      per_page: 10, total_pages: query?.search ? 1 : 3,
    }))
    const user = await setup()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await waitFor(() => expect(customerService.getCustomers).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })))
    await user.type(screen.getByRole('textbox', { name: 'Cari pelanggan' }), 'Rina')
    await waitFor(() => expect(customerService.getCustomers).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'Rina', page: 1 })))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled())
    expect(screen.getByRole('region', { name: 'Ringkasan pelanggan' })).toHaveTextContent('25')
    expect(screen.getByText('Menampilkan 1 dari 1 pelanggan')).toBeVisible()
  })
  it.each(['create', 'update', 'delete', 'detail'] as const)('keeps the dialog usable after a %s failure', async (operation) => {
    const user = await setup()
    if (operation === 'create') {
      vi.mocked(customerService.createCustomer).mockRejectedValueOnce({ response: { data: { message: 'Kontak duplikat' } } })
      await user.click(screen.getByRole('button', { name: 'Tambah Pelanggan' }))
      change(screen.getByPlaceholderText('Contoh: Budi Santoso'), 'Budi'); change(screen.getByPlaceholderText('Contoh: 081234567890'), '0812999')
      await user.click(screen.getByRole('button', { name: 'Simpan Pelanggan' }))
      await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Kontak duplikat'))
    } else if (operation === 'update') {
      vi.mocked(customerService.updateCustomer).mockRejectedValueOnce(new Error('offline'))
      await user.click(screen.getByTitle('Edit Pelanggan')); await user.click(screen.getByRole('button', { name: 'Perbarui' }))
      await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Gagal mengubah pelanggan'))
    } else if (operation === 'delete') {
      vi.mocked(customerService.deleteCustomer).mockRejectedValueOnce(new Error('offline'))
      await user.click(screen.getByTitle('Hapus Pelanggan')); await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Hapus/ }))
      await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Gagal menghapus pelanggan'))
    } else {
      vi.mocked(customerService.getCustomerById).mockRejectedValueOnce(new Error('offline'))
      await user.click(screen.getByTitle('Lihat Detail & Riwayat')); expect(screen.getByRole('dialog')).toBeVisible()
    }
    expect(screen.getByRole('dialog')).toBeVisible()
  })
})
