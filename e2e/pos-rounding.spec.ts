import { expect, test } from '@playwright/test';

for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  test(`POS cash and non-cash checkout at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const paymentConfig = { enable_cash: true, enable_qris: true, enable_edc: true, enable_bank_transfer: true, qris_image_url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100"/%3E%3C/svg%3E', qris_merchant_name: 'POS Test Store', bank_accounts: [], edc_supported_banks: ['BCA'], payment_instruction: '' };
    const store = { id: 'pos-test-store', name: 'POS Test Store', status: 'online', role: 'OWNER', payment_config: paymentConfig };
    const user = { id: 'pos-test-user', name: 'Cashier Test', role: 'OWNER', account_type: 'OWNER', email: 'cashier@example.test' };
    const variant = { id: 'pos-test-variant', product_id: 'pos-test-product', variant_name: 'Regular', sku: 'POS-TEST', unit: 'pcs', selling_price: '102689.9988', current_stock: '10', latest_hpp: '40000', min_stock: '0', target_margin: '50', is_default: true, is_active: true };
    const product = { id: 'pos-test-product', name: 'Produk Tes Pembulatan', category: 'Test', mode: 'MAKE_TO_STOCK', variants: [variant] };
    const payloads: Record<string, unknown>[] = [];
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ user, store }) => {
      localStorage.setItem('token', 'pos-browser-test-token');
      localStorage.setItem('auth-storage', JSON.stringify({ state: { user, token: 'pos-browser-test-token', activeStoreId: store.id, activeStoreName: store.name }, version: 0 }));
    }, { user, store });
    await page.route('**/api/**', async route => {
      const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');
      let data: unknown = [];
      if (path === '/store') data = store;
      else if (path === '/stores') data = [store];
      else if (path === '/permissions/me') data = { permissions: ['menu:pos', 'products:read', 'orders:create'], role: 'OWNER' };
      else if (path === '/products') data = { items: [product], total_pages: 1 };
      else if (path === '/subscription/usage') data = { tier: 'GROWTH', effective_tier: 'GROWTH', status: 'ACTIVE', features: {}, quotas: {}, is_in_grace_period: false };
      else if (path === '/subscription/plans') data = [];
      else if (path === '/auth/me') data = user;
      else if (path === '/sales' && route.request().method() === 'POST') {
        const payload = route.request().postDataJSON() as Record<string, unknown>;
        payloads.push(payload);
        const cash = payload.payment_method === 'CASH';
        data = { id: 'pos-test-sale', invoice_number: 'POS-TEST-001', status: 'COMPLETED', payment_method: payload.payment_method, total_amount: cash ? '102700' : '102689.9988', cash_rounding_adjustment: cash ? '10.0012' : '0', cash_received: cash ? payload.cash_received : undefined, cash_change: cash ? String(Number(payload.cash_received) - 102700) : undefined, customer_name: 'Guest', items: [{ id: 'pos-test-item', product_name: product.name, variant_name: 'Regular', quantity: '1', price_at_sale: '102689.9988', subtotal: '102689.9988', modifiers: [] }] };
      }
      await route.fulfill({ json: { success: true, data } });
    });

    await page.goto('/sales/pos');
    const addProduct = page.getByRole('button', { name: 'Pilih Produk', exact: true });
    await expect(addProduct).toBeVisible();
    await addProduct.click();
    if (viewport.width < 1024) await page.getByRole('button', { name: 'Keranjang', exact: false }).first().click();
    await page.getByRole('button', { name: 'Bayar / Proses Pesanan', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Pembayaran Transaksi' });
    await expect(dialog.getByText('Total yang Harus Dibayar').locator('..')).toContainText('102.700');
    await expect(dialog.getByRole('button', { name: 'Rp 100.000', exact: true })).toHaveCount(0);
    await dialog.getByRole('button', { name: 'Rp 110.000', exact: true }).click();
    await expect(dialog.getByText('Kembalian:').locator('..')).toContainText('7.300');

    for (const method of ['QRIS', 'EDC / Kartu', 'Transfer Bank']) {
      await dialog.getByRole('button', { name: method, exact: true }).click();
      await expect(dialog.getByText('Total yang Harus Dibayar').locator('..')).toContainText('102.690');
      await expect(dialog.getByRole('textbox', { name: 'Uang diterima' })).toHaveCount(0);
      await expect(dialog.getByText('Kembalian:')).toHaveCount(0);
    }
    await dialog.getByRole('button', { name: 'Tunai (Cash)', exact: true }).click();
    await dialog.getByRole('button', { name: 'Uang Pas', exact: true }).click();
    await expect(dialog.getByRole('textbox', { name: 'Uang diterima' })).toHaveValue('102.700');
    await dialog.getByRole('button', { name: 'Selesaikan Transaksi', exact: true }).click();
    const receipt = page.getByRole('dialog', { name: 'Transaksi Berhasil Disimpan!' });
    await expect(receipt).toBeVisible();
    await expect(receipt.getByText('TOTAL:', { exact: true }).locator('..')).toContainText('102.700');
    expect(payloads[0]).toMatchObject({ payment_method: 'CASH', cash_received: 102700, cash_rounding_adjustment: 10.0012 });
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  });
}
