import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RecipeCreatePage from '@/pages/recipes/recipe-create-page'
import RecipeDetailPage from '@/pages/recipes/recipe-detail-page'
import { recipeService } from '@/features/recipes/services/recipe-service'
import { mockPageServices, resetSession } from '../support/page-services'
import { mockPopulatedPages, populatedProduct } from '../support/populated-pages'
import { renderPage } from '../support/render'
beforeEach(() => {
  resetSession(); mockPageServices(); mockPopulatedPages()
  for (const method of ['createProduct', 'updateProduct', 'addIngredient', 'updateIngredientQuantity', 'removeIngredient'] as const) vi.spyOn(recipeService, method).mockResolvedValue(populatedProduct())
  vi.spyOn(recipeService, 'deleteProduct').mockResolvedValue(undefined)
})
const change = (element: HTMLElement, value: string) => fireEvent.change(element, { target: { value } })

describe('product creation', () => {
  it('validates the name and recipe before saving a complete product', async () => {
    const user = userEvent.setup()
    const { container } = renderPage(<RecipeCreatePage />, '/production/products/new')
    await screen.findByRole('button', { name: 'Tambah Bahan Baku', exact: true })
    const form = container.querySelector('form')!
    fireEvent.submit(form)
    expect(screen.getByText('Nama produk wajib diisi')).toBeVisible()
    change(screen.getByLabelText(/Nama Produk/), 'Roti Baru')
    fireEvent.submit(form)
    expect(screen.getByText('Tambahkan minimal 1 bahan baku dengan takaran lebih dari 0')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Tambah Bahan', exact: true }))
    change(screen.getByPlaceholderText('Takaran'), '100')
    change(screen.getByLabelText(/Batas Minimum Stok/), '5')
    change(screen.getByLabelText(/Deskripsi/), 'Catatan resep')
    await user.click(screen.getByRole('button', { name: /^Make to Order/ }))
    await user.click(screen.getByRole('button', { name: /^Make to Stock/ }))
    await user.click(screen.getByRole('button', { name: /pcs/ }))
    await user.click(screen.getByRole('menuitem', { name: 'cup', exact: true }))
    await user.click(screen.getByRole('button', { name: '+ Tambah Kategori', exact: true }))
    change(screen.getByPlaceholderText('Tulis nama kategori produk (misal: Roti, Minuman)...'), 'Kategori Baru')
    change(screen.getByPlaceholderText('50'), '40')
    fireEvent.submit(form)
    await waitFor(() => expect(recipeService.createProduct).toHaveBeenCalled())
    expect(recipeService.createProduct).toHaveBeenCalledWith(expect.objectContaining({ name: 'Roti Baru', category: 'Kategori Baru', unit: 'cup', minStock: 5, description: 'Catatan resep', initialIngredients: [{ stockId: 'stock-1', quantity: 100 }] }))
    await waitFor(() => expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/production/products/product-1'))
  })
  it('retains form data when a save fails', async () => {
    vi.mocked(recipeService.createProduct).mockRejectedValueOnce(new Error('Server sibuk'))
    const user = userEvent.setup()
    const { container } = renderPage(<RecipeCreatePage />, '/production/products/new')
    await screen.findByRole('button', { name: 'Tambah Bahan Baku', exact: true })
    change(screen.getByLabelText(/Nama Produk/), 'Roti Baru')
    await user.click(screen.getByRole('button', { name: 'Tambah Bahan', exact: true }))
    fireEvent.submit(container.querySelector('form')!)
    expect(await screen.findByText('Server sibuk')).toBeVisible()
    expect(screen.getByLabelText(/Nama Produk/)).toHaveValue('Roti Baru')
  })
})

describe('recipe detail actions', () => {
  async function setup() {
    const user = userEvent.setup()
    renderPage(<RecipeDetailPage />, '/production/products/product-1', '/production/products/:productId')
    await screen.findByRole('heading', { name: 'Roti Coklat', level: 1 })
    return user
  }
  it('edits product information and persists the edited payload', async () => {
    const user = await setup()
    change(screen.getByPlaceholderText('Contoh: Roti Manis Coklat Lumer'), 'Roti Baru')
    change(screen.getByPlaceholderText('Roti, Pastry, Donat, dll.'), 'Bakery')
    change(screen.getByPlaceholderText('pcs, box, loaf, roll, loyang'), 'box')
    change(screen.getByPlaceholderText('Tuliskan karakteristik resep, tips adonan/proofing, suhu pemanggangan oven, atau catatan khusus lainnya...'), 'Resep baru')
    const panel = screen.getByRole('tabpanel')
    for (const input of within(panel).queryAllByRole('spinbutton')) change(input, '10')
    await user.click(screen.getByRole('button', { name: /Make to Order/ }))
    await user.click(screen.getByRole('button', { name: /Make to Stock/ }))
    await user.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))
    expect(recipeService.updateProduct).toHaveBeenCalledWith('product-1', expect.objectContaining({ name: 'Roti Baru', category: 'Bakery', unit: 'box', description: 'Resep baru' }))
  })
  it('adds, edits, and removes recipe ingredients', async () => {
    const user = await setup()
    await user.click(screen.getByRole('tab', { name: /Resep & BOM/ }))
    await user.click(screen.getByRole('button', { name: 'Tambah Bahan Baku' }))
    let dialog = screen.getByRole('dialog', { name: 'Tambah Bahan Baku ke Formula' })
    const qty = within(dialog).getByRole('spinbutton')
    change(qty, '0')
    fireEvent.submit(qty.closest('form')!)
    expect(within(dialog).getByText('Jumlah takaran harus lebih dari 0')).toBeVisible()
    change(qty, '50')
    const unit = within(dialog).getByRole('combobox')
    await user.selectOptions(unit, 'kg')
    await user.click(within(dialog).getByRole('button', { name: 'Tambahkan Bahan' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(recipeService.addIngredient).toHaveBeenCalledWith('product-1', { stockId: 'stock-1', quantity: 50000 })
    const row = screen.getByRole('row', { name: /Tepung Terigu/ })
    await user.click(within(row).getAllByRole('button')[0])
    dialog = screen.getByRole('dialog', { name: 'Ubah Takaran Bahan' })
    change(within(dialog).getByRole('spinbutton'), '25')
    await user.selectOptions(within(dialog).getByRole('combobox'), 'g')
    await user.click(within(dialog).getByRole('button', { name: 'Simpan', exact: true }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(recipeService.updateIngredientQuantity).toHaveBeenCalledWith('product-1', 'ing-1', 25)
    await user.click(within(screen.getByRole('row', { name: /Tepung Terigu/ })).getAllByRole('button')[1])
    expect(recipeService.removeIngredient).toHaveBeenCalledWith('product-1', 'ing-1')
  })
  it('shows production simulation and FIFO batch history', async () => {
    const user = await setup()
    await user.click(screen.getByRole('tab', { name: 'Simulator Dapur' }))
    for (const input of within(screen.getByRole('tabpanel')).queryAllByRole('spinbutton')) change(input, '20')
    const presets = within(screen.getByRole('tabpanel')).queryAllByRole('button')
    for (const preset of presets) if (/^\d+/.test(preset.textContent || '')) await user.click(preset)
    expect(screen.getByRole('tab', { name: 'Simulator Dapur' })).toHaveAttribute('aria-selected', 'true')
    await user.click(screen.getByRole('tab', { name: /Batch FIFO/ }))
    expect(screen.getByText('LOT-TEST-001')).toBeVisible()
  })
  it('requires a confirmation before product deletion', async () => {
    const user = await setup()
    await user.click(screen.getAllByRole('button', { name: 'Hapus', exact: true })[0])
    const dialog = screen.getByRole('dialog', { name: 'Hapus Resep & Produk Ini?' })
    expect(recipeService.deleteProduct).not.toHaveBeenCalled()
    await user.click(within(dialog).getByRole('button', { name: /Hapus/ }))
    await waitFor(() => expect(recipeService.deleteProduct).toHaveBeenCalledWith('product-1'))
  })
})
