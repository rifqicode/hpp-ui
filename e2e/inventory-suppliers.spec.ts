import { test, expect } from './fixtures/auth-fixture';

test.describe('Feature: Inventory & Suppliers', () => {
  test.describe('Supplier Management', () => {
    test('Displays supplier list and page header', async ({ authedPage: page }) => {
      await page.goto('/inventory/suppliers');
      await expect(page.locator('h1.text-2xl')).toContainText('Supplier & Vendor');
      await expect(page.locator('button:has-text("Tambah Supplier")')).toBeVisible();
    });

    test('Edge Case: Displays validation error when creating supplier without required name', async ({
      authedPage: page,
    }) => {
      await page.goto('/inventory/suppliers');
      await page.click('button:has-text("Tambah Supplier")');

      // The modal dialog should open
      await expect(page.getByRole('heading', { name: 'Tambah Supplier Baru' })).toBeVisible();

      // Submit without entering name
      await page.click('button[type="submit"]:has-text("Simpan Supplier")');

      // Validation error banner should appear
      const errorBanner = page.locator('div.text-destructive');
      await expect(errorBanner).toBeVisible();
      await expect(errorBanner).toContainText('Nama supplier wajib diisi');

      // Cancel / close modal
      await page.click('button:has-text("Batal")');
      await expect(page.locator('#supplier-name')).not.toBeVisible();
    });

    test('Happy Path: Successfully creates a new supplier and finds it via search', async ({
      authedPage: page,
    }) => {
      const supplierName = `Supplier Makmur ${Date.now()}`;
      const contact = `0812${Date.now().toString().slice(-8)}`;
      const address = 'Jl. Pergudangan Pangan No. 45, Jakarta';

      await page.goto('/inventory/suppliers');
      await page.click('button:has-text("Tambah Supplier")');

      await page.fill('#supplier-name', supplierName);
      await page.fill('#supplier-contact', contact);
      await page.fill('#supplier-address', address);
      await page.click('button[type="submit"]:has-text("Simpan Supplier")');

      // Verify modal closes
      await expect(page.locator('#supplier-name')).not.toBeVisible();

      // Search for the newly created supplier
      const searchInput = page.locator('input[placeholder*="Cari nama vendor"]');
      await searchInput.fill(supplierName);

      // Verify the supplier row is shown in table
      await expect(page.locator(`text=${supplierName}`)).toBeVisible();
    });
  });

  test.describe('Raw Materials & Stock Lots', () => {
    test('Displays stocks list and summary cards', async ({ authedPage: page }) => {
      await page.goto('/inventory/stocks');
      await expect(page.locator('h1.text-2xl')).toContainText('Bahan Baku & Inventaris');
      await expect(page.locator('button:has-text("Tambah Bahan Baku")')).toBeVisible();
    });

    test('Happy Path: Creates a new raw material item with FIFO inventory method', async ({
      authedPage: page,
    }) => {
      const materialName = `Tepung Terigu Premium ${Date.now()}`;

      await page.goto('/inventory/stocks');
      await page.click('button:has-text("Tambah Bahan Baku")');

      await expect(page.getByRole('heading', { name: 'Tambah Bahan Baku Baru' })).toBeVisible();
      await page.fill('#stock-name', materialName);

      // Submit creation
      await page.click('button[type="submit"]:has-text("Simpan Bahan Baku")');

      // Verify modal closes and material appears in table
      await expect(page.locator('#stock-name')).not.toBeVisible();
      const searchInput = page.locator('input[placeholder*="Cari nama bahan"]');
      await searchInput.fill(materialName);
      await expect(page.locator(`text=${materialName}`)).toBeVisible();
    });

    test('Happy Path: Records stock purchase and verifies unit cost & stock level', async ({
      authedPage: page,
    }) => {
      // First ensure a fresh material exists
      const testMatName = `Gula Kristal ${Date.now()}`;
      await page.goto('/inventory/stocks');
      await page.click('button:has-text("Tambah Bahan Baku")');
      await page.fill('#stock-name', testMatName);
      await page.click('button[type="submit"]:has-text("Simpan Bahan Baku")');
      await expect(page.locator('#stock-name')).not.toBeVisible();

      // Navigate directly to purchase page
      await page.goto('/inventory/purchase/new');
      await expect(page.locator('h1.text-2xl')).toContainText('Record Stock Purchase');

      // Target the dropdown trigger with chevron-down icon inside the material block
      const materialDropdown = page.locator('button:has(svg.lucide-chevron-down)').first();
      const selectedText = await materialDropdown.textContent();
      if (!selectedText?.includes(testMatName)) {
        await materialDropdown.click();
        await page.click(`div[role="menuitem"]:has-text("${testMatName}")`);
      }

      // Fill Quantity & Total Price
      await page.fill('#qty', '50');
      await page.fill('#price', '500000');

      // Verify calculated summary card (500,000 / 50 = 10,000)
      await expect(page.locator('text=Calculated Unit Cost:')).toBeVisible();
      await expect(page.locator('text=Rp 10.000 / kg')).toBeVisible();

      // Submit purchase
      await page.click('button[type="submit"]:has-text("Record Purchase")');

      // Verify redirect back to stock list
      await expect(page).toHaveURL(/\/inventory\/stocks/, { timeout: 10000 });

      // Verify stock level increased
      const searchInput = page.locator('input[placeholder*="Cari nama bahan"]');
      await searchInput.fill(testMatName);
      const materialRow = page.locator('tr', { hasText: testMatName });
      await expect(materialRow).toBeVisible();
      await expect(materialRow.locator('text=50 kg')).toBeVisible();
    });
  });

  test.describe('Purchase Orders Workflow', () => {
    test('Displays purchase order list and action buttons', async ({ authedPage: page }) => {
      await page.goto('/inventory/purchase-orders');
      await expect(page.locator('h1.text-2xl')).toContainText('Purchase Orders & Pengadaan');
      await expect(page.locator('a[href="/inventory/purchase-orders/new"]').first()).toBeVisible();
    });

    test('Happy Path: Creates a new purchase request, verifies in list and detail page', async ({
      authedPage: page,
    }) => {
      await page.goto('/inventory/purchase-orders/new');
      await expect(page.locator('h1.text-2xl')).toContainText('Buat Purchase Request (Pengajuan PO)');

      // Fill order notes
      const testNotes = `Pengiriman prioritas pagi hari ${Date.now()}`;
      await page.fill('#po-notes', testNotes);

      // In the item row, fill quantity and estimated unit price
      const qtyInput = page.locator('input[placeholder="0"]').first();
      await qtyInput.fill('20');

      const priceInput = page.locator('input[placeholder="0 (opsional)"]').first();
      await priceInput.fill('15000');

      // Verify subtotal preview: 20 * 15,000 = Rp 300.000
      await expect(page.locator('span:has-text("Rp 300.000")').first()).toBeVisible();

      // Submit purchase request
      await page.click('button[type="submit"]:has-text("Kirim Purchase Request")');

      // Verify redirect to purchase orders list
      await expect(page).toHaveURL(/\/inventory\/purchase-orders/, { timeout: 10000 });

      // Find the created request in the list
      await expect(page.locator('span:has-text("Request")').first()).toBeVisible();

      // Click on the first PO number link to view detail
      const poLink = page.locator('td a[href*="/inventory/purchase-orders/"]').first();
      const poNumber = await poLink.textContent();
      await poLink.click();

      // Verify PO detail page
      await expect(page).toHaveURL(/\/inventory\/purchase-orders\//);
      if (poNumber) {
        await expect(page.locator(`text=${poNumber}`)).toBeVisible();
      }
      await expect(page.locator('text=Purchase Request').first()).toBeVisible();
      await expect(page.locator(`text=${testNotes}`)).toBeVisible();
    });
  });
});
