import { test, expect, type Page } from '@playwright/test';

async function scrollWorkflow(page: Page, progress: number) {
  await page.locator('.tour-scroll-track').evaluate((track: HTMLDivElement, progress) => {
    const top = window.scrollY + track.getBoundingClientRect().top;
    const stickyTop = Number.parseFloat(track.style.getPropertyValue('--tour-sticky-top'));
    const frameHeight = Number.parseFloat(track.style.getPropertyValue('--tour-sticky-height'));
    window.scrollTo({ top: top - stickyTop + (track.offsetHeight - frameHeight) * progress, behavior: 'instant' });
  }, progress);
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

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
  await page.route('**/config/landing', (route) => route.fulfill({ json: { success: true, data: { whatsapp: null } } }));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Tahu Modalnya[\s\S]*Atur Harganya[\s\S]*Jaga Untungnya/);
});

test('navigation, all feature previews, and FAQ remain usable at this viewport', async ({ page }, testInfo) => {
  await expectContentFits(page);
  await expect(page.locator('#fitur-lengkap')).toHaveCount(0);
  await expect(page.locator('#fitur button[aria-controls="feature-preview"]:visible')).toHaveCount(4);
  await expect(page.getByRole('button', { name: 'Buka Menu' })).toHaveCount(0);
  await expect(page.locator('header').getByRole('link', { name: 'Masuk', exact: true })).toBeVisible();
  await expect(page.locator('header').getByRole('link', { name: 'Mulai Gratis', exact: true })).toBeVisible();
  const groups = [
    { name: 'Resep & Produksi', titles: ['Biaya resep & harga jual', 'Coba resep & rencana produksi', 'Biaya overhead', 'Catat hasil produksi'] },
    { name: 'Stok & Kasir', titles: ['Kontrol stok FIFO & FEFO', 'Belanja bahan & pemasok', 'Kasir & laba penjualan', 'Catatan pelanggan'] },
    { name: 'Laporan & Pengelolaan', titles: ['Ringkasan usaha', 'Kelola beberapa toko', 'Atur akses karyawan', 'Asisten Bisnis AI'] },
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
  const question = page.getByRole('button', { name: 'Apakah akses kasir, dapur, dan pemilik bisa dibedakan?' });
  await question.click();
  await expect(question).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('region', { name: 'Apakah akses kasir, dapur, dan pemilik bisa dibedakan?' })).toBeVisible();
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
  await expect(page.getByRole('heading', { name: 'Pesanan masuk, usaha tetap teratur.' })).toBeInViewport();
});

test('hero artwork loops automatically and respects reduced motion', async ({ page }) => {
  const opening = await page.evaluate(() => ({
    viewportHeight: window.innerHeight,
    heroBottom: document.querySelector('#hero')!.getBoundingClientRect().bottom,
    workflowTop: document.querySelector('#alur-kerja')!.getBoundingClientRect().top,
  }));
  if (page.viewportSize()!.width >= 640) {
    expect(opening.heroBottom).toBeGreaterThanOrEqual(opening.viewportHeight - 1);
  }
  expect(opening.workflowTop).toBeGreaterThanOrEqual(opening.heroBottom - 1);
  const illustration = page.locator('#hero .hero-slide-cashier');
  const kitchen = page.locator('#hero .hero-slide-kitchen');
  await expect.poll(() => illustration.evaluate((element: HTMLImageElement) => element.currentSrc)).toMatch(/ekatra-hero-cashier(?:-mobile)?\.webp$/);
  await expect(illustration).toHaveCSS('opacity', '1');
  await expect(kitchen).toHaveCSS('opacity', '0');
  await expect(page.locator('#hero button')).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(illustration).toHaveCSS('animation-iteration-count', 'infinite');
  for (const [time, cashierOpacity, kitchenOpacity] of [[0, '1', '0'], [3000, '0', '1'], [6000, '1', '0']] as const) {
    await page.locator('#hero img').evaluateAll((images, currentTime) => {
      for (const image of images) {
        for (const animation of image.getAnimations()) {
          animation.pause();
          animation.currentTime = currentTime;
        }
      }
    }, time);
    await expect(illustration).toHaveCSS('opacity', cashierOpacity);
    await expect(kitchen).toHaveCSS('opacity', kitchenOpacity);
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(illustration).toHaveCSS('animation-name', 'none');
  await expect(illustration).toHaveCSS('opacity', '1');
  await expect(kitchen).toHaveCSS('opacity', '0');
  await expectContentFits(page);
});

test('free and paid plans preserve their registration destinations', async ({ page }) => {
  await expect(page.locator('#pricing').getByRole('button', { name: 'Mulai Gratis', exact: true })).toBeVisible();
  await page.locator('#pricing').getByRole('button', { name: 'Mulai Gratis', exact: true }).click();
  await expect(page).toHaveURL(/\/register$/);
  await page.goto('/');
  await page.getByRole('button', { name: 'Pilih Paket Growth', exact: true }).click();
  await expect(page).toHaveURL(/\/register\?tier=GROWTH$/);
});


test('workflow follows scrolling and does not replay after the full tour is passed', async ({ page }) => {
  await expect(page.locator('#workflow-example')).toHaveCount(0);
  await scrollWorkflow(page, 0.15);
  const example = page.locator('#workflow-example');
  await expect(example).toContainText('Rp 50.000');
  await scrollWorkflow(page, 0.55);
  await expect(example).toContainText('Rp 12.000');
  await expect(example).toContainText('Rp 24.000');
  await scrollWorkflow(page, 0.75);
  await expect(example).toContainText('Makanan siap untuk pelanggan.');
  await scrollWorkflow(page, 0.95);
  await expect(page.getByRole('button', { name: 'Lihat tahap 5: Laporan', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(example).toContainText('Rp 26.000');
  await scrollWorkflow(page, 1.03);
  await expect(page.locator('.tour-scroll-track')).toHaveClass(/tour-scroll-complete/);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.locator('.tour-map').scrollIntoViewIfNeeded();
  await expect(example).toHaveCount(0);
  await expectContentFits(page);
  await page.getByRole('link', { name: 'Hitung resep pertama', exact: true }).last().click();
  await expect(page).toHaveURL(/\/register$/);
});


test('mobile shortcuts clear the sticky header and hotspots move to their scroll stage', async ({ page }) => {
  const mobileNav = page.getByRole('navigation', { name: 'Navigasi halaman', exact: true });
  if (page.viewportSize()!.width >= 1024) {
    await expect(mobileNav).toBeHidden();
    return;
  }
  await mobileNav.getByRole('link', { name: 'Harga', exact: true }).click();
  await expect(page).toHaveURL(/#pricing$/);
  const headerBottom = await page.locator('header').evaluate((element) => element.getBoundingClientRect().bottom);
  const pricingTop = await page.locator('#pricing').evaluate((element) => element.getBoundingClientRect().top);
  expect(pricingTop).toBeGreaterThanOrEqual(headerBottom);
  await mobileNav.getByRole('link', { name: 'Cara kerja', exact: true }).click();
  const step = page.getByRole('button', { name: 'Lihat tahap 3: Bahan & biaya', exact: true });
  await step.scrollIntoViewIfNeeded();
  await step.click();
  await expect(step).toHaveAttribute('aria-pressed', 'true');
  const frameTop = await page.locator('.tour-scroll-sticky').evaluate(element => element.getBoundingClientRect().top);
  expect(frameTop).toBeGreaterThanOrEqual(headerBottom);
  await expectContentFits(page);
});

test('recipe example uses the same HPP and gross profit across screen sizes', async ({ page }) => {
  await expect(page).toHaveTitle(/Ekatra POS/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'id');
  await expect(page.locator('main')).toHaveCount(1);
  await page.locator('#fitur').scrollIntoViewIfNeeded();
  const preview = page.locator('#feature-preview');
  await expect(preview).toContainText('Rp 6.100');
  await expect(preview).toContainText('Rp 11.900');
  await expect(preview).not.toContainText('Laba Bersih');
});

test('WhatsApp CTA floats while scrolling and uses public configuration', async ({ page }) => {
  const url = 'https://wa.me/628123456789?text=Halo%20HPP%20Tracker';
  await page.route('**/config/landing', (route) => route.fulfill({
    json: { success: true, data: { whatsapp: { label: 'WhatsApp kami', url } } },
  }));
  await page.reload();
  const links = page.getByRole('link', { name: 'WhatsApp kami', exact: true });
  await expect(links).toHaveCount(1);
  for (const link of await links.all()) {
    await expect(link).toHaveAttribute('href', url);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    const bounds = await link.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  }
  await expect(links.first()).toHaveCSS('position', 'fixed');
  await expect(links.first()).toBeInViewport();
  await page.locator('footer').scrollIntoViewIfNeeded();
  await expect(links.first()).toBeInViewport();
  await expectContentFits(page);

  await page.route('**/config/landing', (route) => route.fulfill({
    json: { success: true, data: { whatsapp: { label: 'Tanya tim kami', url: 'https://wa.me/628999999999' } } },
  }));
  await page.reload();
  await expect(page.getByRole('link', { name: 'Tanya tim kami', exact: true })).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'WhatsApp kami', exact: true })).toHaveCount(0);
});

test('WhatsApp CTA stays hidden when disabled or configuration is unavailable', async ({ page }) => {
  await expect(page.locator('a[href^="https://wa.me/"]')).toHaveCount(0);
  await page.route('**/config/landing', (route) => route.fulfill({ status: 500, json: { success: false } }));
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Tahu Modalnya[\s\S]*Atur Harganya[\s\S]*Jaga Untungnya/);
  await expect(page.locator('a[href^="https://wa.me/"]')).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
});
