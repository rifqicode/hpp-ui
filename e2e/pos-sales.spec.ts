import { test, expect } from './fixtures/auth-fixture';

test.describe('Feature: POS, Transactions & Customers', () => {
  test.describe('Customer Relationship Management', () => {
    test('Displays customer list page', async ({ authedPage: page }) => {
      await page.goto('/sales/customers');
      await expect(page.locator('h1.text-2xl')).toContainText('Manajemen Pelanggan');
      await expect(page.locator('button:has-text("Tambah Pelanggan")')).toBeVisible();
    });

    test('Edge Case: Displays validation when adding customer with empty inputs', async ({
      authedPage: page,
    }) => {
      await page.goto('/sales/customers');
      await page.click('button:has-text("Tambah Pelanggan")');
      await expect(page.getByRole('heading', { name: 'Tambah Pelanggan Baru' })).toBeVisible();

      // Submit without filling required inputs
      await page.click('button[type="submit"]:has-text("Simpan Pelanggan")');

      // The required name input prevents closing
      const nameInput = page.locator('input[placeholder="Contoh: Budi Santoso"]');
      await expect(nameInput).toBeVisible();

      // Cancel modal
      await page.click('button:has-text("Batal")');
      await expect(nameInput).not.toBeVisible();
    });

    test('Happy Path: Creates a new customer, verifies search and table record', async ({
      authedPage: page,
    }) => {
      const customerName = `Siti Bakery Lover ${Date.now()}`;
      const customerPhone = `0812${Date.now().toString().slice(-8)}`;

      await page.goto('/sales/customers');
      await page.click('button:has-text("Tambah Pelanggan")');

      await page.fill('input[placeholder="Contoh: Budi Santoso"]', customerName);
      await page.fill('input[placeholder="Contoh: 081234567890"]', customerPhone);
      await page.fill('input[placeholder="Contoh: budi@gmail.com"]', `siti_${Date.now()}@test.com`);
      await page.fill('input[placeholder="Contoh: Jl. Melati No. 12, Jakarta"]', 'Jl. Kenanga No. 5');

      await page.click('button[type="submit"]:has-text("Simpan Pelanggan")');
      await expect(page.locator('input[placeholder="Contoh: Budi Santoso"]')).not.toBeVisible();

      // Search customer
      const searchInput = page.locator('input[placeholder*="Cari nama, nomor HP"]');
      await searchInput.fill(customerName);
      await expect(page.locator(`text=${customerName}`)).toBeVisible();
      await expect(page.locator(`text=${customerPhone}`)).toBeVisible();
    });
  });

  test.describe('POS Cashier Workspace & Receipt Generation', () => {
    test('Displays POS cashier workspace with catalog and cart', async ({ authedPage: page }) => {
      await page.goto('/sales/pos');
      await expect(page.locator('h1:has-text("Kasir & Transaksi POS")')).toBeVisible();
      await expect(page.locator('text=Keranjang Masih Kosong')).toBeVisible();
    });

    test('Happy Path: Adds item to cart, enters customer, completes cash payment, and verifies receipt', async ({
      authedPage: page,
    }) => {
      await page.goto('/sales/pos');
      await expect(page.locator('h1:has-text("Kasir & Transaksi POS")')).toBeVisible();

      // Add product to cart (Croissant Artisan Fresh which is configured as MTO)
      const chooseProductBtn = page.locator('div.group:has(h3:has-text("Croissant Artisan Fresh")) button:has-text("Pilih Produk")').first();
      await expect(chooseProductBtn).toBeVisible({ timeout: 15000 });
      await chooseProductBtn.click();

      // Verify cart has item and checkout button is enabled
      await expect(page.locator('text=Total Tagihan')).toBeVisible();
      const checkoutBtn = page.locator('button:has-text("Bayar")');
      await expect(checkoutBtn).toBeEnabled();

      // Enter customer phone and name
      const custPhone = `0855${Date.now().toString().slice(-8)}`;
      const custName = `Customer Walkin ${Date.now()}`;
      await page.fill('input[placeholder="No. HP / WA Pelanggan"]', custPhone);
      await page.fill('input[placeholder="Nama Pelanggan (opsional)"]', custName);

      // Open Payment Dialog
      await checkoutBtn.click();
      await expect(page.getByRole('heading', { name: 'Pembayaran Transaksi' })).toBeVisible();

      // Select Quick Cash (Uang Pas)
      await page.click('button:has-text("Uang Pas")');
      await expect(page.locator('text=Kembalian:')).toBeVisible();

      // Complete Transaction
      await page.click('button:has-text("Selesaikan Transaksi")');

      // Thermal receipt modal should appear
      const thermalReceipt = page.locator('#thermal-receipt');
      await expect(thermalReceipt).toBeVisible({ timeout: 15000 });
      await expect(thermalReceipt).toContainText('No. Invoice:');
      await expect(thermalReceipt).toContainText(custName);

      // Close receipt
      await page.click('button:has-text("Transaksi Baru")');
      await expect(thermalReceipt).not.toBeVisible();
    });
  });

  test.describe('Sales Transactions & History Audit', () => {
    test('Displays transaction history and opens invoice receipt dialog', async ({ authedPage: page }) => {
      await page.goto('/sales/history');
      await expect(page.locator('h1.text-2xl')).toContainText('Dashboard Transaksi Penjualan');

      // Verify at least one transaction appears in the table
      const receiptBtn = page.locator('button:has-text("Struk")').first();
      await expect(receiptBtn).toBeVisible({ timeout: 15000 });

      // Click to open transaction receipt modal
      await receiptBtn.click();
      await expect(page.locator('text=Detail Transaksi')).toBeVisible();

      // Close modal by pressing Escape
      await page.keyboard.press('Escape');
      await expect(page.locator('text=Detail Transaksi')).not.toBeVisible();
    });
  });
});
