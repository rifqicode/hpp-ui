import { test, expect } from './fixtures/auth-fixture';

test.describe('Feature: Products, Overhead, Batches & HPP', () => {
  test.describe('Overhead Costs Management', () => {
    test('Displays overhead costs list page', async ({ authedPage: page }) => {
      await page.goto('/production/overheads');
      await expect(page.locator('h1.text-2xl')).toContainText('Biaya Overhead & Operasional');
      await expect(page.locator('button:has-text("Tambah Biaya")')).toBeVisible();
    });

    test('Edge Case: Displays validation error when creating overhead without name', async ({
      authedPage: page,
    }) => {
      await page.goto('/production/overheads');
      await page.click('button:has-text("Tambah Biaya")');

      // The modal dialog should open
      await expect(page.getByRole('heading', { name: 'Tambah Biaya Overhead Baru' })).toBeVisible();

      // Submit without entering name
      await page.click('button[type="submit"]:has-text("Tambah Biaya Overhead")');

      // Validation error message should appear
      await expect(page.locator('text=Nama biaya overhead wajib diisi')).toBeVisible();

      // Close modal
      await page.click('button:has-text("Batal")');
      await expect(page.locator('#name')).not.toBeVisible();
    });

    test('Happy Path: Successfully creates an overhead cost item and verifies in list', async ({
      authedPage: page,
    }) => {
      const overheadName = `Gas & Listrik Oven ${Date.now()}`;
      const defaultAmount = '75000';

      await page.goto('/production/overheads');
      await page.click('button:has-text("Tambah Biaya")');

      await page.fill('#name', overheadName);
      await page.fill('#amount', defaultAmount);
      await page.fill('#notes', 'Alokasi biaya energi per proses pemanggangan');

      // Submit form
      await page.click('button[type="submit"]:has-text("Tambah Biaya Overhead")');

      // Verify modal closes
      await expect(page.locator('#name')).not.toBeVisible();

      // Search or verify item in table
      const searchInput = page.locator('input[placeholder*="Cari nama biaya"]');
      await searchInput.fill(overheadName);
      await expect(page.locator(`text=${overheadName}`)).toBeVisible();
    });
  });

  test.describe('Products & Recipe Formulation', () => {
    test('Displays products catalog list page', async ({ authedPage: page }) => {
      await page.goto('/production/products');
      await expect(page.locator('h1.text-2xl')).toContainText('Katalog Produk & Formula Resep');
      await expect(page.locator('button:has-text("Tambah Produk")')).toBeVisible();
    });

    test('Happy Path: Creates a new product with recipe BOM, verifies margin and detail page', async ({
      authedPage: page,
    }) => {
      const productName = `Roti Coklat Keju Artisan ${Date.now()}`;

      // First ensure at least one raw material exists to pick in recipe
      await page.goto('/inventory/stocks');
      await page.click('button:has-text("Tambah Bahan Baku")');
      const matName = `Coklat Batang ${Date.now()}`;
      await page.fill('#stock-name', matName);
      await page.click('button[type="submit"]:has-text("Simpan Bahan Baku")');
      await expect(page.locator('#stock-name')).not.toBeVisible();

      // Navigate to create product page
      await page.goto('/production/products/new');
      await expect(page.locator('h1.text-2xl')).toContainText('Buat Produk & Resep Baru');

      // Wait for materials to finish loading
      await expect(page.locator('text=Memuat daftar bahan baku dari gudang...')).not.toBeVisible({
        timeout: 15000,
      });

      // Fill Product Name
      await page.fill('#name', productName);

      // Add Recipe Ingredient
      await page.click('button:has-text("Tambah Bahan")');

      // Fill ingredient quantity using placeholder "Takaran"
      const qtyInput = page.locator('input[placeholder="Takaran"]').first();
      await expect(qtyInput).toBeVisible();
      await qtyInput.fill('15');

      // Submit product & recipe
      await page.click('button[type="submit"]:has-text("Simpan Produk & Resep")');

      // Verify redirection to product detail page
      await expect(page).toHaveURL(/\/production\/products\/[a-zA-Z0-9-]+/, { timeout: 15000 });
      await expect(page.locator(`text=${productName}`).first()).toBeVisible({ timeout: 15000 });

      // Navigate back to products list to test search & row navigation
      await page.goto('/production/products');
      const searchInput = page.locator('input[placeholder*="Cari nama produk"]');
      await searchInput.fill(productName);
      await expect(page.locator(`text=${productName}`)).toBeVisible();

      // Click on product to inspect detail page
      await page.click(`text=${productName}`);
      await expect(page).toHaveURL(/\/production\/products\//);
      await expect(page.locator(`text=${productName}`).first()).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Production Batches', () => {
    test('Displays production batch list page', async ({ authedPage: page }) => {
      await page.goto('/production/batches');
      await expect(page.locator('h1.text-2xl')).toContainText('Dapur Produksi & Batch HPP');
      await expect(page.locator('button:has-text("Mulai Batch Baru")')).toBeVisible();
    });

    test('Happy Path: Starts a new kitchen production batch, verifies in detail page', async ({
      authedPage: page,
    }) => {
      await page.goto('/production/batches/new');
      await expect(page.locator('h1.text-2xl')).toContainText('Mulai Batch Produksi Baru');

      // Ensure product card is selected
      const firstProductCard = page.locator('div:has(> div > h4.font-bold)').first();
      await firstProductCard.click();

      // Fill target batch quantity
      const targetQtyInput = page.locator('input[type="number"][min="1"]').first();
      await targetQtyInput.fill('25');

      // Start cooking in kitchen
      await page.click('button:has-text("Mulai Masak di Dapur")');

      // Verify redirect to batch detail
      await expect(page).toHaveURL(/\/production\/batches\//, { timeout: 15000 });
      await expect(page.locator('text=Sedang Diproduksi').first()).toBeVisible({ timeout: 15000 });
      await expect(page.locator('text=25 pcs').first()).toBeVisible();
    });
  });

  test.describe('HPP Recipe Calculator Simulation', () => {
    test('Happy Path: Enters simulation parameters and verifies reactive cost calculations', async ({
      authedPage: page,
    }) => {
      await page.goto('/production/hpp/recipe-simulation');
      await expect(page.locator('h1.text-2xl')).toContainText('Simulasi Resep Baru');

      // Fill product name and yield units
      const nameInput = page.locator('input[placeholder="Contoh: Roti Manis Coklat Keju"]').first();
      await nameInput.fill('Croissant Butter Simulation');

      const yieldInput = page.locator('input[placeholder="Contoh: 10"]').first();
      await yieldInput.fill('10');

      // Fill first ingredient: Butter
      const ingNameInput = page.locator('input[placeholder="Contoh: Tepung Terigu"]').first();
      await ingNameInput.fill('Butter Wijsman');

      // Package price: Rp 100,000 for 1000g
      const packagePriceInput = page.locator('input.pl-7').first();
      await packagePriceInput.fill('100000');

      // Used quantity: 500g
      const usedQtyInput = page.locator('input.w-20').first();
      await usedQtyInput.fill('500');

      // Verify calculated batch material cost: 500/1000 * 100,000 = Rp 50.000
      // And per unit (yield = 10): Rp 5.000
      await expect(page.locator('text=Rp 50.000').first()).toBeVisible();
      await expect(page.locator('text=Rp 5.000').first()).toBeVisible();

      // Verify selling price derived from 50% target margin (Rp 5,000 / 0.5 = Rp 10.000)
      await expect(page.locator('text=Rp 10.000').first()).toBeVisible();
    });
  });
});
