import { test, expect } from '@playwright/test';

test.describe('Authentication - Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test to ensure a clean session state
    await page.goto('/register');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
  });

  test('Happy Path: Full 2-Step Registration redirects to dashboard', async ({ page }) => {
    const timestamp = Date.now();
    const uniqueEmail = `test_owner_${timestamp}@example.com`;
    const uniqueStore = `Bakery Delight ${timestamp}`;

    // Step 1: Fill Account Details
    await page.fill('#reg-name', 'John Doe Baker');
    await page.fill('#reg-email', uniqueEmail);
    await page.fill('#reg-password', 'P@ssw0rd123');
    await page.fill('#reg-confirm', 'P@ssw0rd123');
    await page.check('#agreeTerms');

    await page.click('button[type="submit"]:has-text("Lanjut ke Profil Usaha")');

    // Step 2: Verify Step 2 is active
    await expect(page.locator('text=Setup Toko / Usaha Pertama')).toBeVisible();

    // Fill Store Details
    await page.fill('#storeName', uniqueStore);
    await page.selectOption('#store-category', 'Bakery & Pastry');
    await page.fill('#storeLocation', 'Jl. Kemang Raya No. 12, Jakarta Selatan');
    await page.fill('#phone', '081234567890');

    await page.click('button[type="submit"]:has-text("Selesaikan Pendaftaran")');

    // Step 3: Verify celebration state appears
    await expect(page.locator('text=Toko Berhasil Disiapkan!')).toBeVisible({ timeout: 10000 });

    // Verify final redirection to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('Step 1 Edge Case: Empty fields displays validation error', async ({ page }) => {
    await page.click('button[type="submit"]:has-text("Lanjut ke Profil Usaha")');

    const errorMessage = page.locator('div.text-destructive');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Nama lengkap, email, dan kata sandi wajib diisi.');
  });

  test('Step 1 Edge Case: Short password (< 6 chars) displays error', async ({ page }) => {
    await page.fill('#reg-name', 'Short Pass User');
    await page.fill('#reg-email', `shortpass_${Date.now()}@example.com`);
    await page.fill('#reg-password', '12345');
    await page.fill('#reg-confirm', '12345');
    await page.check('#agreeTerms');

    await page.click('button[type="submit"]:has-text("Lanjut ke Profil Usaha")');

    const errorMessage = page.locator('div.text-destructive');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Kata sandi minimal 6 karakter.');
  });

  test('Step 1 Edge Case: Password mismatch displays error', async ({ page }) => {
    await page.fill('#reg-name', 'Mismatch User');
    await page.fill('#reg-email', `mismatch_${Date.now()}@example.com`);
    await page.fill('#reg-password', 'P@ssw0rd123');
    await page.fill('#reg-confirm', 'DifferentPassword456');
    await page.check('#agreeTerms');

    await page.click('button[type="submit"]:has-text("Lanjut ke Profil Usaha")');

    const errorMessage = page.locator('div.text-destructive');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Konfirmasi kata sandi tidak cocok.');
  });

  test('Step 1 Edge Case: Terms not agreed displays error', async ({ page }) => {
    await page.fill('#reg-name', 'No Terms User');
    await page.fill('#reg-email', `noterms_${Date.now()}@example.com`);
    await page.fill('#reg-password', 'P@ssw0rd123');
    await page.fill('#reg-confirm', 'P@ssw0rd123');
    // Keep #agreeTerms unchecked

    await page.click('button[type="submit"]:has-text("Lanjut ke Profil Usaha")');

    const errorMessage = page.locator('div.text-destructive');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Anda harus menyetujui Ketentuan Layanan & Kebijakan Privasi.');
  });

  test('Step 2 Edge Case: Back navigation returns to Step 1 and retains input values', async ({ page }) => {
    const testName = 'Persisted User';
    const testEmail = `persisted_${Date.now()}@example.com`;

    // Fill Step 1 and advance
    await page.fill('#reg-name', testName);
    await page.fill('#reg-email', testEmail);
    await page.fill('#reg-password', 'P@ssw0rd123');
    await page.fill('#reg-confirm', 'P@ssw0rd123');
    await page.check('#agreeTerms');

    await page.click('button[type="submit"]:has-text("Lanjut ke Profil Usaha")');
    await expect(page.locator('text=Setup Toko / Usaha Pertama')).toBeVisible();

    // Click back to step 1
    await page.click('button:has-text("Kembali ke Akun")');

    // Verify Step 1 is active and input values are retained
    await expect(page.locator('text=Buat Akun Bisnis Baru')).toBeVisible();
    await expect(page.locator('#reg-name')).toHaveValue(testName);
    await expect(page.locator('#reg-email')).toHaveValue(testEmail);
  });

  test('Step 2 Edge Case: Missing store name, category, or location displays error', async ({ page }) => {
    // Fill Step 1 and advance to Step 2
    await page.fill('#reg-name', 'Validation Test User');
    await page.fill('#reg-email', `storeval_${Date.now()}@example.com`);
    await page.fill('#reg-password', 'P@ssw0rd123');
    await page.fill('#reg-confirm', 'P@ssw0rd123');
    await page.check('#agreeTerms');
    await page.click('button[type="submit"]:has-text("Lanjut ke Profil Usaha")');

    await expect(page.locator('text=Setup Toko / Usaha Pertama')).toBeVisible();

    // 1. Submit with empty store name
    await page.click('button[type="submit"]:has-text("Selesaikan Pendaftaran")');
    let errorMessage = page.locator('div.text-destructive');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Nama toko atau unit usaha wajib diisi.');

    // 2. Fill store name, submit without category
    await page.fill('#storeName', 'My Awesome Cafe');
    await page.click('button[type="submit"]:has-text("Selesaikan Pendaftaran")');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Kategori bisnis wajib dipilih.');

    // 3. Select category, submit without location
    await page.selectOption('#store-category', 'Cafe & Coffee Shop');
    await page.click('button[type="submit"]:has-text("Selesaikan Pendaftaran")');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Lokasi atau alamat toko wajib diisi.');
  });

  test('Backend Conflict Edge Case: Duplicate email displays conflict error', async ({ page }) => {
    // Fill Step 1 using already registered email
    await page.fill('#reg-name', 'Duplicate User');
    await page.fill('#reg-email', 'muhammadrifqi.tb@gmail.com');
    await page.fill('#reg-password', 'P@ssw0rd123');
    await page.fill('#reg-confirm', 'P@ssw0rd123');
    await page.check('#agreeTerms');
    await page.click('button[type="submit"]:has-text("Lanjut ke Profil Usaha")');

    await expect(page.locator('text=Setup Toko / Usaha Pertama')).toBeVisible();

    // Fill Step 2 details and submit
    await page.fill('#storeName', 'Conflict Bakery');
    await page.selectOption('#store-category', 'Bakery & Pastry');
    await page.fill('#storeLocation', 'Jl. Sudirman No. 1');
    await page.fill('#phone', '08111222333');
    await page.click('button[type="submit"]:has-text("Selesaikan Pendaftaran")');

    // Verify backend conflict error message is displayed
    const errorMessage = page.locator('div.text-destructive');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('Navigation Link: Link to login page navigates to /login', async ({ page }) => {
    await page.click('a:has-text("Masuk Sekarang")');
    await expect(page).toHaveURL(/\/login/);
  });
});
