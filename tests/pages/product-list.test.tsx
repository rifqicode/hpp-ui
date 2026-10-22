import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RecipeListPage from '@/pages/recipes/recipe-list-page'
import { recipeService } from '@/features/recipes/services/recipe-service'
import { subscriptionService } from '@/features/subscription/services/subscriptionService'
import { useAuthStore } from '@/store/use-auth-store'
import { mockPageServices, resetSession } from '../support/page-services'
import { product, usage } from '../support/fixtures'
import { renderPage, deferred } from '../support/render'

beforeEach(() => {
  resetSession()
  mockPageServices()
  vi.mocked(recipeService.getProducts).mockResolvedValue([product(), product({ id: 'p2', name: 'Donat', category: 'Donat', sellingPrice: 5000, currentStock: 0 })])
})

describe('product list page', () => {
  it('shows initial loading and then renders product metrics', async () => {
    const pending = deferred<ReturnType<typeof product>[]>()
    vi.mocked(recipeService.getProducts).mockReturnValue(pending.promise)
    renderPage(<RecipeListPage />, '/production/products')
    expect(screen.getByRole('status', { name: 'Memuat daftar produk' })).toBeVisible()
    pending.resolve([product()])
    const table = await screen.findByRole('table', { name: 'Tabel produk' })
    expect(within(table).getByRole('link', { name: /Roti Coklat/ })).toHaveAttribute('href', '/production/products/product-1')
    expect(within(table).getByText('60%')).toBeVisible()
  })
  it('shows an empty catalog with a creation action', async () => {
    vi.mocked(recipeService.getProducts).mockResolvedValue([])
    renderPage(<RecipeListPage />, '/production/products')
    expect(await screen.findByRole('heading', { name: 'Belum ada produk' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Tambah Produk Pertama' })).toBeVisible()
  })
  it('filters by search and category while preserving the URL', async () => {
    const user = userEvent.setup()
    renderPage(<RecipeListPage />, '/production/products')
    await screen.findByRole('table', { name: 'Tabel produk' })
    await user.type(screen.getByRole('textbox', { name: 'Cari produk' }), 'Donat')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Kategori produk' }), 'Donat')
    expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('q=Donat&category=Donat')
    expect(within(screen.getByRole('table')).queryByText('Roti Coklat')).not.toBeInTheDocument()
    expect(within(screen.getByRole('table')).getByRole('link', { name: /Donat/ })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Reset filter' }))
    expect(screen.getByRole('textbox', { name: 'Cari produk' })).toHaveValue('')
    expect(within(screen.getByRole('table')).getByText('Roti Coklat')).toBeVisible()
  })
  it('uses the attention stat as a filter and resets from the total stat', async () => {
    const user = userEvent.setup()
    renderPage(<RecipeListPage />, '/production/products')
    await screen.findByRole('table')
    await user.click(screen.getByRole('button', { name: /Perlu perhatian/ }))
    expect(screen.getByRole('combobox', { name: 'Kondisi produk' })).toHaveValue('needs-attention')
    expect(within(screen.getByRole('table')).queryByText('Roti Coklat')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Total produk/ }))
    expect(within(screen.getByRole('table')).getByText('Roti Coklat')).toBeVisible()
  })
  it('normalizes invalid sort, view, attention, and page query parameters', async () => {
    renderPage(<RecipeListPage />, '/production/products?sort=unknown&view=unknown&attention=unknown&page=-5')
    await screen.findByRole('table')
    expect(screen.getByRole('button', { name: /Urutkan/ })).toBeVisible()
    expect(screen.getByRole('combobox', { name: 'Kondisi produk' })).toHaveValue('all')
    expect(screen.getByRole('button', { name: 'Prev' })).toBeDisabled()
  })
  it('sorts products using the sort dropdown menu', async () => {
    const user = userEvent.setup()
    renderPage(<RecipeListPage />, '/production/products')
    await screen.findByRole('table')
    await user.click(screen.getByRole('button', { name: /Urutkan/ }))
    await user.click(screen.getByRole('menuitem', { name: 'Harga tertinggi' }))
    expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('sort=price-desc')
  })
  it('changes to card view and back to table view', async () => {
    const user = userEvent.setup()
    renderPage(<RecipeListPage />, '/production/products')
    await screen.findByRole('table')
    await user.click(screen.getByRole('button', { name: 'Tampilan kartu' }))
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tampilan kartu' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: 'Tampilan tabel' }))
    expect(screen.getByRole('table')).toBeVisible()
  })
  it('retries a failed product fetch', async () => {
    vi.mocked(recipeService.getProducts).mockRejectedValueOnce(new Error('Server sibuk'))
    const user = userEvent.setup()
    renderPage(<RecipeListPage />, '/production/products')
    expect(await screen.findByRole('alert')).toHaveTextContent('Server sibuk')
    await user.click(screen.getByRole('button', { name: 'Coba lagi' }))
    expect(await screen.findByRole('table')).toBeVisible()
  })
  it('hides product creation when the user lacks write permission', async () => {
    useAuthStore.getState().setPermissions(['products:read'])
    renderPage(<RecipeListPage />, '/production/products')
    await screen.findByRole('table')
    expect(screen.queryByRole('button', { name: 'Tambah Produk' })).not.toBeInTheDocument()
  })
  it('requests an upgrade when the product quota is exhausted', async () => {
    const data = usage()
    data.quotas.products = { current: 10, limit: 10, remaining: 0 }
    vi.mocked(subscriptionService.getUsage).mockResolvedValue(data)
    const upgrade = vi.fn()
    window.addEventListener('open-upgrade-modal', upgrade)
    try {
      const user = userEvent.setup()
      const { client } = renderPage(<RecipeListPage />, '/production/products')
      await waitFor(() => expect(client.isFetching()).toBe(0))
      await user.click(screen.getByRole('button', { name: 'Tambah Produk' }))
      expect(upgrade).toHaveBeenCalledOnce()
      expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent(/^\/production\/products$/)
    } finally { window.removeEventListener('open-upgrade-modal', upgrade) }
  })
  it('requires confirmation before deleting a product', async () => {
    const remove = vi.spyOn(recipeService, 'deleteProduct').mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderPage(<RecipeListPage />, '/production/products')
    const table = await screen.findByRole('table')
    await user.click(within(table).getByRole('button', { name: 'Aksi untuk Roti Coklat' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Hapus produk' }))
    const dialog = screen.getByRole('dialog', { name: 'Hapus produk?' })
    expect(remove).not.toHaveBeenCalled()
    await user.click(within(dialog).getByRole('button', { name: 'Batal' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(remove).not.toHaveBeenCalled()
    await user.click(within(table).getByRole('button', { name: 'Aksi untuk Roti Coklat' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Hapus produk' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Hapus produk' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(remove).toHaveBeenCalledWith('product-1')
  })
})
