import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PosPage from '@/pages/sales/pos-page'
import { recipeService } from '@/features/recipes/services/recipe-service'
import { customerService } from '@/features/sales/services/customer-service'
import { salesService } from '@/features/sales/services/sales-service'
import { mockPageServices, resetSession } from '../support/page-services'
import { product } from '../support/fixtures'
import { customer, sale } from '../support/populated-pages'
import { renderPage } from '../support/render'
beforeEach(() => {
  resetSession(); mockPageServices()
  vi.mocked(recipeService.getProducts).mockResolvedValue([product({ currentStock: 2 }), product({ id: 'empty', name: 'Donat', category: 'Donat', currentStock: 0 }), product({ id: 'mto', name: 'Kopi', category: 'Minuman', mode: 'MAKE_TO_ORDER', currentStock: 0 })])
  vi.spyOn(customerService, 'searchCustomerByPhone').mockResolvedValue(customer)
  vi.spyOn(salesService, 'createSale').mockResolvedValue({ ...sale, totalAmount: 10000, totalCost: 4000, grossProfit: 6000 })
  vi.spyOn(window, 'alert').mockImplementation(() => {})
  vi.spyOn(window, 'print').mockImplementation(() => {})
})
async function setup() {
  const user = userEvent.setup()
  renderPage(<PosPage />, '/sales/pos')
  await screen.findByRole('heading', { name: 'Roti Coklat', level: 3 })
  return user
}
async function addRoti(user: ReturnType<typeof userEvent.setup>) { const card=screen.getByRole('heading',{name:'Roti Coklat',level:3}).closest('[data-slot="card"]')!;await user.click(within(card as HTMLElement).getByRole('button',{name:'Pilih Produk'})); }

describe('POS cart and checkout', () => {
  it('adds products using the keyboard and labels quantity controls', async () => {
    const user = await setup()
    const card = screen.getByRole('heading', { name: 'Roti Coklat', level: 3 }).closest('[data-slot="card"]')!
    within(card as HTMLElement).getByRole('button', { name: 'Pilih Produk' }).focus()
    await user.keyboard('{Enter}')
    expect(screen.getByText('Subtotal (1 item)')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Tambah Roti Coklat - Regular' }))
    expect(screen.getByText('Subtotal (2 item)')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Kurangi Roti Coklat - Regular' })).toBeEnabled()
  })
  it('shows a retry action when the catalog fails to load', async () => {
    vi.mocked(recipeService.getProducts).mockRejectedValueOnce(new Error('Offline'))
    const user = userEvent.setup()
    renderPage(<PosPage />, '/sales/pos')
    expect(await screen.findByRole('alert')).toHaveTextContent('Gagal memuat produk')
    await user.click(screen.getByRole('button', { name: 'Coba lagi' }))
    expect(await screen.findByRole('heading', { name: 'Roti Coklat', level: 3 })).toBeVisible()
  })
  it('filters products by search, category, and stock availability', async () => {
    const user = await setup()
    await user.type(screen.getByPlaceholderText('Cari nama produk atau kategori...'), 'Tidak ada')
    expect(screen.getByText('Tidak ada produk ditemukan')).toBeVisible()
    await user.clear(screen.getByPlaceholderText('Cari nama produk atau kategori...'))
    await user.click(screen.getByRole('button', { name: 'Minuman' }))
    expect(screen.getByRole('heading', { name: 'Kopi' })).toBeVisible()
    expect(screen.queryByRole('heading', { name: 'Roti Coklat' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Semua Produk' }))
    await user.click(screen.getByRole('button', { name: 'Hanya Stok Tersedia' }))
    expect(screen.queryByRole('heading', { name: 'Donat' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Hanya Stok Tersedia' }))
    const emptyCard = screen.getByRole('heading', { name: 'Donat' }).closest('[data-slot="card"]')!
    expect(within(emptyCard as HTMLElement).getByRole('button', { name: 'Pilih Produk' })).toBeDisabled()
  })
  it('caps stock products, supports MTO without inventory, and removes cart lines', async () => {
    const user = await setup()
    await addRoti(user)
    await user.click(screen.getByRole('button', { name: 'Tambah Lagi' }))
    await user.click(screen.getByRole('button', { name: 'Tambah Lagi' }))
    expect(screen.getByText('Subtotal (2 item)')).toBeVisible()
    const addBtn = screen.getByRole('button', { name: 'Tambah Roti Coklat - Regular' })
    const minusBtn = screen.getByRole('button', { name: 'Kurangi Roti Coklat - Regular' })
    expect(addBtn).toBeDisabled()
    await user.click(minusBtn)
    expect(screen.getByText('Subtotal (1 item)')).toBeVisible()
    await user.click(minusBtn)
    expect(screen.getByText('Keranjang Masih Kosong')).toBeVisible()
    await user.click(within(screen.getByRole('heading',{name:'Kopi'}).closest('[data-slot="card"]') as HTMLElement).getByRole('button',{name:'Pilih Produk'}))
    await user.click(screen.getByRole('button', { name: 'Tambah Lagi' }))
    expect(screen.getByText('Subtotal (2 item)')).toBeVisible()
    await user.click(screen.getByTitle('Hapus item'))
    expect(screen.getByRole('button', { name: /^(Bayar|Proses Pesanan)/ })).toBeDisabled()
  })
  it('matches customers, edits notes, and resets the cart', async () => {
    const user = await setup()
    await addRoti(user)
    expect(screen.getByText('Total Tagihan').closest('div')).toHaveTextContent('10.000')
    expect(screen.getByRole('button', { name: /^(Bayar|Proses Pesanan)/ })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: /^(Bayar|Proses Pesanan)/ }))
    const dialog = screen.getByRole('dialog', { name: 'Pembayaran Transaksi' })
    await user.type(within(dialog).getByPlaceholderText('No. HP / WA Pelanggan'), '08123456789')
    await waitFor(() => expect(within(dialog).getByPlaceholderText('Nama Pelanggan (opsional)')).toHaveValue(customer.name))
    await user.clear(within(dialog).getByPlaceholderText('No. HP / WA Pelanggan'))
    await user.clear(within(dialog).getByPlaceholderText('Nama Pelanggan (opsional)'))
    await user.type(within(dialog).getByPlaceholderText('Nama Pelanggan (opsional)'), 'Pembeli Baru')
    await user.type(within(dialog).getByPlaceholderText('No. Meja (opsional)'), '12')
    await user.type(within(dialog).getByPlaceholderText('Catatan Pesanan (opsional)'), 'Tanpa plastik')
    await user.click(within(dialog).getByRole('button', { name: 'Batal' }))
    await user.click(screen.getByRole('button', { name: 'Lihat Keranjang & Bayar' }))
    await user.click(screen.getByRole('button', { name: 'Kembali' }))
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    expect(screen.getByText('Keranjang Masih Kosong')).toBeVisible()
  })
  it.each(['CASH', 'QRIS', 'TRANSFER'] as const)('takes a %s payment, prints a receipt and starts another transaction', async method => {
    const user = await setup()
    await addRoti(user)
    await user.click(screen.getByRole('button', { name: /^(Bayar|Proses Pesanan)/ }))
    const dialog = screen.getByRole('dialog', { name: 'Pembayaran Transaksi' })
    if (method === 'CASH') {
      const cash = within(dialog).getByPlaceholderText('0')
      fireEvent.change(cash, { target: { value: '1000' } })
      expect(within(dialog).getByRole('button', { name: 'Selesaikan Transaksi' })).toBeDisabled()
      await user.click(within(dialog).getByRole('button', { name: 'Rp 50.000' }))
      await user.click(within(dialog).getByRole('button', { name: 'Uang Pas' }))
    } else {
      await user.click(within(dialog).getByRole('button', { name: method === 'QRIS' ? 'QRIS' : 'Transfer Bank' }))
      if (method === 'TRANSFER') await user.type(within(dialog).getByPlaceholderText('No. Referensi / 4 Digit Rekening Pelanggan'), 'REF-001')
    }
    await user.click(within(dialog).getByRole('button', { name: 'Selesaikan Transaksi' }))
    const receipt = await screen.findByRole('dialog', { name: 'Transaksi Berhasil Disimpan!' })
    expect(salesService.createSale).toHaveBeenCalledWith(expect.objectContaining({ paymentMethod: method, discountAmount: 0, items: [{ variantId: 'variant-product-1', modifierOptionIds: [], quantity: 1, priceAtSale: 10000, costAtSale: 4000 }], cashReceived: method === 'CASH' ? 10000 : undefined, paymentReference: method === 'TRANSFER' ? 'REF-001' : undefined }))
    await user.click(within(receipt).getByRole('button', { name: 'Cetak Struk' }))
    expect(window.print).toHaveBeenCalledOnce()
    await user.click(within(receipt).getByRole('button', { name: 'Transaksi Baru' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Keranjang Masih Kosong')).toBeVisible()
  })
  it('retains cart contents after a failed payment and permits cancelling the payment dialog', async () => {
    vi.mocked(salesService.createSale).mockRejectedValueOnce(new Error('Offline'))
    const user = await setup()
    await addRoti(user)
    await user.click(screen.getByRole('button', { name: /^(Bayar|Proses Pesanan)/ }))
    await user.click(screen.getByRole('button', { name: 'Selesaikan Transaksi' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Offline')
    await user.click(screen.getByRole('button', { name: 'Batal' }))
    expect(screen.getByText('Subtotal (1 item)')).toBeVisible()
  })
})
