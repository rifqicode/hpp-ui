import { test } from '@playwright/test';

test('product list: compact responsive layout, reliable costs, filtering, navigation and delete recovery', async ({ page }) => {
  const storeId = '11111111-1111-4111-8111-111111111111';
  let products = Array.from({ length: 26 }, (_, index) => ({
    id: `product-${index}`, name: ['01 Roti Coklat Premium Isi Belgian Dark Chocolate', '02 Croissant Tanpa Produksi', '03 Kopi Susu Pesanan', '04 Brownies Rugi', '05 Donat Habis', '06 Produk Belum Ada Biaya'][index] || `Produk ${String(index).padStart(2, '0')}`,
    category: index === 25 ? 'Pastry' : 'Bakery', unit: index === 2 ? 'cup' : 'pcs', mode: index === 2 ? 'MAKE_TO_ORDER' : 'MAKE_TO_STOCK',
    selling_price: index === 3 ? '7000' : '15000', latest_hpp: index === 1 || index === 5 ? '0' : '9000', estimated_hpp: index === 5 ? '0' : '1100',
    current_stock: index === 2 || index === 4 ? '0' : '20', min_stock: index === 4 ? '0' : '5', yield_qty: '10', waste_pct: '0.1',
    ingredients: index === 5 ? [] : [{ id: 'ingredient', stock_id: 'stock', stock_name: 'Tepung', quantity: '1000', unit_cost: '10', subtotal_cost: '10000' }],
  }));
  const requests: number[] = [];
  let listFailure = false;
  let deleteFailure = true;
  await page.addInitScript(({ storeId }) => {
    localStorage.setItem('token', 'product-layout-test');
    localStorage.setItem('auth-storage', JSON.stringify({ state: { user: { id: 'test-user', name: 'Tester', email: 'review@example.com' }, token: 'product-layout-test', activeStoreId: storeId, activeStoreName: 'Review Bakery', permissions: [] }, version: 0 }));
  }, { storeId });
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    let data: unknown = [];
    if (url.pathname.endsWith('/stores')) data = [{ id: storeId, name: 'Review Bakery', status: 'online' }];
    else if (url.pathname.endsWith('/permissions/me')) data = { role: 'STORE_OWNER', permissions: ['menu:recipes', 'products:read', 'products:write', 'products:delete'] };
    else if (url.pathname.endsWith('/subscription/usage')) data = { effective_tier: 'FREE', status: 'ACTIVE', quotas: { products: { current: products.length, limit: 100, remaining: 100 - products.length } }, features: {}, is_in_grace_period: false };
    else if (url.pathname.endsWith('/products')) {
      if (listFailure) { await route.fulfill({ status: 500, json: { success: false, message: 'Products unavailable' } }); return; }
      const value = Number(url.searchParams.get('page') || 1);
      if (route.request().headers()['x-store-id'] !== storeId) throw new Error('Product list request has the wrong store scope');
      requests.push(value);
      data = { items: products.slice((value - 1) * 13, value * 13), total: products.length, page: value, limit: 13, total_pages: Math.ceil(products.length / 13) };
    } else if (/\/products\/product-\d+$/.test(url.pathname)) {
      const id = url.pathname.split('/').pop();
      if (route.request().method() === 'DELETE') {
        if (deleteFailure) { await route.fulfill({ status: 409, json: { success: false, message: 'Product cannot be deleted' } }); return; }
        products = products.filter((product) => product.id !== id);
      } else data = products.find((product) => product.id === id);
    }
    await route.fulfill({ json: { success: true, data } });
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/production/products');
  await page.getByRole('table', { name: 'Tabel produk' }).waitFor();
  if (!requests.includes(2)) throw new Error('Only the first API page was loaded');
  if (await page.getByRole('columnheader').count() !== 6) throw new Error('Expected six compact columns');
  await page.getByRole('button', { name: 'Total produk 26', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Perlu perhatian 4', exact: true }).waitFor();
  await page.getByText('-28,6%', { exact: true }).first().waitFor();
  if ((await page.locator('body').innerText()).includes('+-')) throw new Error('Negative margin has a redundant plus sign');
  const estimateRow = page.getByRole('row').filter({ hasText: '02 Croissant Tanpa Produksi' });
  await estimateRow.getByText('Estimasi bahan /unit', { exact: true }).waitFor();
  await estimateRow.getByText('Rp 1.100', { exact: true }).waitFor();
  await page.getByRole('combobox', { name: 'Kondisi produk' }).selectOption('low-stock');
  await page.getByRole('link', { name: /05 Donat Habis/ }).first().waitFor();
  if (await page.getByRole('row').count() !== 2) throw new Error('MTO was incorrectly marked low stock');
  await page.getByRole('combobox', { name: 'Kondisi produk' }).selectOption('no-hpp');
  await page.getByRole('row').filter({ hasText: '06 Produk Belum Ada Biaya' }).waitFor();
  if (await page.getByRole('row').count() !== 3) throw new Error('Missing actual HPP filter is incorrect');
  await page.getByRole('button', { name: 'Reset filter', exact: true }).click();
  await page.getByRole('combobox', { name: 'Kategori produk' }).selectOption('Pastry');
  await page.getByRole('link', { name: /Produk 25/ }).first().waitFor();
  await page.getByRole('button', { name: 'Reset filter', exact: true }).click();
  await page.getByRole('button', { name: 'Berikutnya', exact: true }).click();
  await page.getByText('Halaman 2 dari 3', { exact: true }).waitFor();
  await page.getByRole('combobox', { name: 'Urutkan produk' }).selectOption('price-desc');
  await page.getByText('Halaman 1 dari 3', { exact: true }).waitFor();
  await page.getByRole('textbox', { name: 'Cari produk', exact: true }).fill('03 Kopi');
  await page.getByRole('link', { name: /03 Kopi Susu Pesanan/ }).first().click();
  await page.getByRole('link', { name: 'Daftar Produk', exact: true }).waitFor();
  await page.getByRole('link', { name: 'Daftar Produk', exact: true }).click();
  await page.getByRole('textbox', { name: 'Cari produk', exact: true }).waitFor();
  if (new URL(page.url()).searchParams.get('q') !== '03 Kopi') throw new Error('List filters were lost returning from detail');
  await page.getByRole('button', { name: 'Tampilan kartu', exact: true }).click();
  await page.getByRole('article').getByText('MTO', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Reset filter', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('article').first().waitFor();
  const mobile = await page.getByRole('article').first().boundingBox();
  if (!mobile || mobile.y > 600) throw new Error('Mobile products are buried below the toolbar');
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Mobile page overflows');
  await page.getByRole('textbox', { name: 'Cari produk', exact: true }).fill('not-found-product');
  await page.getByRole('heading', { name: 'Tidak ada produk yang cocok' }).waitFor();
  if (await page.getByRole('button', { name: 'Tambah Produk Pertama' }).count()) throw new Error('No search results incorrectly offers a first product');
  await page.getByRole('button', { name: 'Total produk 26', exact: true }).click();
  listFailure = true;
  await page.getByRole('button', { name: 'Refresh produk' }).click();
  await page.getByRole('alert').getByText('Gagal memuat produk').waitFor();
  listFailure = false;
  await page.getByRole('button', { name: 'Coba lagi' }).click();
  await page.getByRole('article').first().waitFor();
  await page.getByRole('button', { name: 'Aksi untuk 01 Roti Coklat Premium Isi Belgian Dark Chocolate', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Hapus produk', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Hapus produk', exact: true }).click();
  await page.getByRole('dialog').getByRole('alert').getByText('Product cannot be deleted').waitFor();
  deleteFailure = false;
  await page.getByRole('dialog').getByRole('button', { name: 'Hapus produk', exact: true }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  await page.getByRole('button', { name: 'Total produk 25', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Berikutnya', exact: true }).click();
  await page.getByText('Halaman 2 dari 3', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Berikutnya', exact: true }).click();
  await page.getByText('Halaman 3 dari 3', { exact: true }).waitFor();
  await page.getByRole('button', { name: /Aksi untuk/ }).first().click();
  await page.getByRole('menuitem', { name: 'Hapus produk', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Hapus produk', exact: true }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  await page.getByRole('button', { name: 'Total produk 24', exact: true }).waitFor();
  await page.getByText('Halaman 2 dari 2', { exact: true }).waitFor();
});
