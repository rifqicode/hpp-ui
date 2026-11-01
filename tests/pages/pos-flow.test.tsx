import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PosPage from '@/pages/sales/pos-page'
import { recipeService } from '@/features/recipes/services/recipe-service'
import { customerService } from '@/features/sales/services/customer-service'
import { salesService } from '@/features/sales/services/sales-service'
import { settingsService } from '@/features/settings/services/settings-service'
import { store } from '../support/fixtures'
import { mockPageServices, resetSession } from '../support/page-services'
import { product } from '../support/fixtures'
import { customer, sale } from '../support/populated-pages'
import { renderPage } from '../support/render'
beforeEach(() => {
  resetSession(); mockPageServices()
  vi.mocked(settingsService.getStoreProfile).mockResolvedValue({ ...store, payment_config: { enable_cash: true, enable_qris: true, enable_edc: true, enable_bank_transfer: true, qris_image_url: '/qris-test.png', qris_merchant_name: 'Toko Rina', edc_supported_banks: ['BCA'], bank_accounts: [], payment_instruction: '' } })
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
  it.each(['CASH', 'QRIS', 'TRANSFER', 'EDC'] as const)('takes a %s payment, prints a receipt and starts another transaction', async method => {
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
      await user.click(within(dialog).getByRole('button', { name: { QRIS: 'QRIS', TRANSFER: 'Transfer Bank', EDC: 'EDC / Kartu' }[method] }))
      expect(within(dialog).queryByRole('textbox', { name: 'Uang diterima' })).not.toBeInTheDocument()
      expect(within(dialog).queryByRole('button', { name: 'Uang Pas' })).not.toBeInTheDocument()
      expect(within(dialog).queryByText('Kembalian:')).not.toBeInTheDocument()
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
  it('rounds fractional cash checkout and prints the authoritative payment amounts', async () => {
    vi.mocked(recipeService.getProducts).mockResolvedValue([
      product({ id: 'p-odd', name: 'Roti Unik', currentStock: 5, sellingPrice: 12640.4 })
    ])
    vi.mocked(salesService.createSale).mockResolvedValue({ ...sale, paymentMethod: 'CASH', totalAmount: 12600, cashRoundingAdjustment: -40.4, cashReceived: 12600, cashChange: 0 })
    const user = userEvent.setup()
    renderPage(<PosPage />, '/sales/pos')
    const heading = await screen.findByRole('heading', { name: 'Roti Unik', level: 3 })
    const card = heading.closest('[data-slot="card"]')!
    await user.click(within(card as HTMLElement).getByRole('button', { name: 'Pilih Produk' }))

    // Cart shows unrounded bill
    expect(screen.getByText('Total Tagihan').closest('div')).toHaveTextContent('12.640')

    await user.click(screen.getByRole('button', { name: /^(Bayar|Proses Pesanan)/ }))
    const dialog = screen.getByRole('dialog', { name: 'Pembayaran Transaksi' })

    // In modal with CASH, payable total is rounded down to 12.600
    expect(within(dialog).getByText('Total yang Harus Dibayar').closest('div')).toHaveTextContent('12.600')
    expect(within(dialog).getByText('(Pembulatan: -Rp 40)')).toBeVisible()

    // Uang pas chip defaults to 12.600
    const uangPas = within(dialog).getByRole('button', { name: 'Uang Pas' })
    expect(uangPas).toBeVisible()
    await user.click(uangPas)

    // Kembalian should be 0
    expect(within(dialog).getByText('Kembalian:').closest('div')).toHaveTextContent('Rp 0')

    // Submit payment
    await user.click(within(dialog).getByRole('button', { name: 'Selesaikan Transaksi' }))

    expect(salesService.createSale).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentMethod: 'CASH',
        cashReceived: 12600,
        cashRoundingAdjustment: -40.4,
        cash_rounding_adjustment: -40.4,
      })
    )
    const receipt = await screen.findByRole('dialog', { name: 'Transaksi Berhasil Disimpan!' })
    expect(within(receipt).getByText('Pembulatan Tunai:').closest('div')).toHaveTextContent('-Rp 40')
    expect(within(receipt).getByText('TOTAL:').closest('div')).toHaveTextContent('12.600')
    expect(within(receipt).getByText('Kembalian:').closest('div')).toHaveTextContent('Rp 0')
  })

  it.each(['QRIS', 'EDC', 'TRANSFER'] as const)('keeps a fractional %s total while displaying whole Rupiah', async method => {
    vi.mocked(recipeService.getProducts).mockResolvedValue([product({ sellingPrice: 102689.9988 })])
    const user = await setup()
    await addRoti(user)
    await user.click(screen.getByRole('button', { name: /^Bayar/ }))
    const dialog = screen.getByRole('dialog', { name: 'Pembayaran Transaksi' })
    expect(within(dialog).getByText('Total yang Harus Dibayar').closest('div')).toHaveTextContent('102.700')
    expect(within(dialog).getByRole('button', { name: 'Rp 110.000' })).toBeVisible()
    expect(within(dialog).queryByRole('button', { name: 'Rp 100.000' })).not.toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: { QRIS: 'QRIS', EDC: 'EDC / Kartu', TRANSFER: 'Transfer Bank' }[method] }))
    expect(within(dialog).getByText('Total yang Harus Dibayar').closest('div')).toHaveTextContent('102.690')
    expect(within(dialog).queryByRole('textbox', { name: 'Uang diterima' })).not.toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Selesaikan Transaksi' }))
    expect(salesService.createSale).toHaveBeenCalledWith(expect.objectContaining({ paymentMethod: method, cashRoundingAdjustment: 0, cashReceived: undefined }))
  })

  it('blocks checkout when no payment method is enabled', async () => {
    vi.mocked(settingsService.getStoreProfile).mockResolvedValue({ ...store, payment_config: { enable_cash: false, enable_qris: false, enable_edc: false, enable_bank_transfer: false, qris_image_url: '', qris_merchant_name: '', edc_supported_banks: [], bank_accounts: [], payment_instruction: '' } })
    const user = await setup()
    await addRoti(user)
    expect(screen.getByRole('button', { name: /^Bayar/ })).toBeDisabled()
    expect(screen.getByRole('alert')).toHaveTextContent('Aktifkan metode pembayaran')
  })
})
