import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RecipeListPage from '@/pages/recipes/recipe-list-page'
import RecipeDetailPage from '@/pages/recipes/recipe-detail-page'
import { Route, Routes } from 'react-router-dom'
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
  it('filters products needing price review and opens the affected variant without changing its price', async () => {
    const item=product();
    item.variants.push({...item.variants[0],id:'large',variantName:'Large',sellingPrice:12000,latestHpp:5000,estimatedHpp:7000,isDefault:false});
    vi.mocked(recipeService.getProducts).mockResolvedValue([item,product({id:'other',name:'Donat'})]);
    vi.mocked(recipeService.getProductById).mockResolvedValue(item);
    const user=userEvent.setup();
    renderPage(<Routes><Route path="/production/products" element={<RecipeListPage/>}/><Route path="/production/products/:productId" element={<RecipeDetailPage/>}/></Routes>,'/production/products');
    await screen.findByRole('table');
    await user.click(screen.getByRole('button',{name:/Periksa harga/}));
    expect(screen.getByRole('combobox',{name:'Kondisi produk'})).toHaveValue('price-review');
    const table=screen.getByRole('table');
    expect(within(table).queryByText('Donat')).not.toBeInTheDocument();
    await user.click(within(table).getByRole('button',{name:'Tinjau harga'}));
    await screen.findByRole('heading',{name:'Tinjau harga Roti Coklat'});
    expect(screen.getByLabelText('Nama varian')).toHaveValue('Large');
    expect(screen.getByLabelText('Harga jual (Rp)')).toHaveValue('12.000');
    expect(screen.getByRole('button',{name:'Pakai hasil perhitungan'})).toBeVisible();
    expect(screen.getByRole('button',{name:'Simpan harga baru'})).toBeVisible();
  });
  it('calculates and saves price in the focused price review dialog', async () => {
    const item = product();
    item.variants.push({
      ...item.variants[0],
      id: 'large',
      variantName: 'Large',
      sellingPrice: 6000,
      latestHpp: 5000,
      estimatedHpp: 7000,
      isDefault: false,
    });
    vi.mocked(recipeService.getProducts).mockResolvedValue([item]);
    const updateSpy = vi.spyOn(recipeService, 'updateProduct').mockResolvedValue(item);

    const user = userEvent.setup();
    renderPage(<RecipeListPage />, '/production/products');
    const table = await screen.findByRole('table');
    await user.click(within(table).getByRole('button', { name: 'Tinjau harga' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Tinjau harga Roti Coklat' })).toBeVisible();
    expect(within(dialog).getByLabelText('Nama varian')).toHaveValue('Large');

    expect(within(dialog).getByText(/Harga jual saat ini lebih rendah dari perkiraan biaya bahan/)).toBeVisible();

    const marginInput = within(dialog).getByLabelText('Margin (%)');
    await user.clear(marginInput);
    await user.type(marginInput, '50');

    const applyBtn = within(dialog).getByRole('button', { name: 'Pakai hasil perhitungan' });
    expect(applyBtn).toBeEnabled();
    await user.click(applyBtn);

    expect(within(dialog).getByLabelText('Harga jual (Rp)')).toHaveValue('14.000');

    await user.click(within(dialog).getByRole('button', { name: 'Simpan harga baru' }));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        'product-1',
        expect.objectContaining({
          variants: expect.arrayContaining([
            expect.objectContaining({
              id: 'large',
              sellingPrice: 14000,
              targetMargin: 0.5,
            }),
          ]),
        })
      );
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
  it('expands variants so price, HPP, margin and stock share the same context', async () => {
    const item = product();
    item.variants.push({ ...item.variants[0], id: 'large', variantName: 'Large', sku: 'LARGE', sellingPrice: 20000, latestHpp: 9000, currentStock: 3, isDefault: false });
    vi.mocked(recipeService.getProducts).mockResolvedValue([item]);
    const user = userEvent.setup(); renderPage(<RecipeListPage />, '/production/products');
    const table = await screen.findByRole('table', { name: 'Tabel produk' });
    await user.click(within(table).getByRole('button', { name: 'Lihat varian' }));
    const large = within(table).getByText('Large').closest('li')!;
    expect(within(large).getByText('Rp 20.000')).toBeVisible();
    expect(within(large).getByText('Rp 9.000')).toBeVisible();
    expect(within(large).getByText('55%')).toBeVisible();
    expect(within(large).getByText('Menipis')).toBeVisible();
    await user.click(within(table).getByRole('button', { name: 'Tutup varian' }));
    expect(large).not.toBeVisible();
  });
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
  it('uses the low stock card as a filter and resets from the total card', async () => {
    const user = userEvent.setup()
    renderPage(<RecipeListPage />, '/production/products')
    await screen.findByRole('table')
    const summary = screen.getByRole('region', { name: 'Ringkasan produk' })
    expect(within(summary).getAllByRole('button')).toHaveLength(3)
    await user.click(within(summary).getByRole('button', { name: /Stok menipis \/ habis/ }))
    expect(screen.getByRole('combobox', { name: 'Kondisi produk' })).toHaveValue('low-stock')
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
