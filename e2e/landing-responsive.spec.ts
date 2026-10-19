import { test, expect, type Page } from '@playwright/test';

async function expectContentFits(page: Page) {
  // Check actual content bounds too: overflow clipping can hide a broken layout.
  const outside = await page.locator('header a, header button, h1, #feature-preview, #alur-kerja button, #alur-kerja dd, #pricing button, footer a')
    .evaluateAll((elements) => elements.filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && (rect.left < -1 || rect.right > window.innerWidth + 1 || (element.matches("a, button, input") && element.scrollWidth > element.clientWidth + 1));
    }).map((element) => element.textContent?.trim() || element.getAttribute('aria-label')));
  expect(outside).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Tahu biaya tiap menu.');
});

test('navigation, all feature previews, and FAQ remain usable at this viewport', async ({ page }, testInfo) => {
  await expectContentFits(page);
  await expect(page.locator('#fitur-lengkap')).toHaveCount(0);
  await expect(page.locator('#fitur button[aria-controls="feature-preview"]:visible')).toHaveCount(4);
  await expect(page.getByRole('button', { name: 'Buka Menu' })).toHaveCount(0);
  await expect(page.locator('header').getByRole('link', { name: 'Masuk', exact: true })).toBeVisible();
  await expect(page.locator('header').getByRole('link', { name: 'Mulai Gratis', exact: true })).toBeVisible();
  const groups = [
    { name: 'Biaya & Produksi', titles: ['Kalkulasi Resep & HPP', 'Simulasi Resep & Produksi', 'Tenaga Kerja & Overhead', 'Batch Produksi & Waste'] },
    { name: 'Stok & Penjualan', titles: ['Kontrol Stok FIFO & FEFO', 'Pembelian & Supplier', 'POS Kasir & Analisis Laba', 'Data & Riwayat Pelanggan'] },
    { name: 'Manajemen Usaha', titles: ['Dashboard Operasional & HPP', 'Kelola Beberapa Toko', 'Tim & Hak Akses Staf', 'Asisten AI untuk Data Toko'] },
  ];
  for (const group of groups) {
    const category = page.getByRole('group', { name: 'Kategori fitur' }).getByRole('button', { name: group.name, exact: true });
    await category.click();
    await expect(category).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#fitur button[aria-controls="feature-preview"]:visible')).toHaveCount(4);
    for (const title of group.titles) {
      const control = page.locator('#fitur').getByRole('button', { name: title }).filter({ visible: true });
      await control.click();
      await expect(control).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByRole('region', { name: title })).toBeVisible();
      await expectContentFits(page);
    }
  }
  const question = page.getByRole('button', { name: 'Apakah data transaksi dan resep rahasia saya aman?' });
  await question.click();
  await expect(question).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('region', { name: 'Apakah data transaksi dan resep rahasia saya aman?' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('landing.png'), fullPage: true, animations: 'disabled' });
});

test('workflow replaces the simulator directly after the hero', async ({ page }) => {
  await expect(page.locator('#simulator')).toHaveCount(0);
  await expect(page.locator('a[href="#simulator"]')).toHaveCount(0);
  await expect(page.locator('#alur-kerja')).toHaveCount(1);
  const sections = await page.locator('section[id]').evaluateAll((elements) => elements.map((element) => element.id));
  expect(sections.indexOf('alur-kerja')).toBeLessThan(sections.indexOf('fitur'));
  await page.getByRole('link', { name: 'Lihat cara kerja', exact: true }).click();
  await expect(page).toHaveURL(/#alur-kerja$/);
  await expect(page.getByRole('heading', { name: 'Dari bahan masuk, sampai tahu untungnya.' })).toBeInViewport();
});

test('free and paid plans preserve their registration destinations', async ({ page }) => {
  await expect(page.locator('#pricing').getByRole('button', { name: 'Mulai Gratis', exact: true })).toBeVisible();
  await page.locator('#pricing').getByRole('button', { name: 'Mulai Gratis', exact: true }).click();
  await expect(page).toHaveURL(/\/register$/);
  await page.goto('/');
  await page.getByRole('button', { name: 'Pilih Paket Growth', exact: true }).click();
  await expect(page).toHaveURL(/\/register\?tier=GROWTH$/);
});


test('workflow connects production costs to stock and gross profit', async ({ page }) => {
  await page.getByRole('button', { name: '3. Mulai produksi', exact: true }).click();
  const example = page.locator('#workflow-example');
  await expect(example).toContainText('Rp 80.000');
  await expect(example).toContainText('Rp 15.000 + Rp 5.000');
  await expect(example).toContainText('20 potong brownies');
  await expect(example).toContainText('HPP aktual per potong');
  await expect(example).toContainText('Rp 5.000');
  await example.getByRole('button', { name: 'Berikutnya' }).click();
  await expect(page.getByRole('button', { name: '4. Pantau hasil & laba', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(example).toContainText('8 potong brownies');
  await expect(example).toContainText('Rp 60.000');
  await expect(example.getByRole('button', { name: 'Berikutnya' })).toBeDisabled();
  await example.getByRole('button', { name: 'Sebelumnya' }).click();
  await expect(example.getByRole('heading', { level: 3 })).toHaveText('Selesai produksi, biaya aktual tercatat.');
  await expectContentFits(page);
  await page.getByRole('link', { name: 'Coba alurnya gratis', exact: true }).click();
  await expect(page).toHaveURL(/\/register$/);
});
