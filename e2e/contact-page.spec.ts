import { test, expect } from '@playwright/test';

const contactConfig = { success: true, data: { whatsapp: { label: 'WhatsApp kami', url: 'https://wa.me/628123456789' } } };

test('contact form prepares the selected topic and question for WhatsApp', async ({ page }) => {
  await page.route('**/config/landing', route => route.fulfill({ json: contactConfig }));
  await page.goto('/hubungi-kami');
  await page.getByLabel('Nama (opsional)').fill('Rani');
  await page.getByLabel('Topik pertanyaan').selectOption('Pilihan paket');
  await page.getByLabel('Pertanyaan Anda').fill('Paket untuk usaha katering?');
  await page.evaluate(() => {
    window.open = (url) => { document.body.dataset.openedContact = String(url); return null; };
  });
  await page.getByRole('button', { name: 'Lanjut ke WhatsApp' }).click();
  const opened = await page.locator('body').getAttribute('data-opened-contact');
  const url = new URL(opened!);
  expect(url.origin + url.pathname).toBe('https://wa.me/628123456789');
  expect(url.searchParams.get('text')).toContain('saya Rani.');
  expect(url.searchParams.get('text')).toContain('Topik: Pilihan paket');
  expect(url.searchParams.get('text')).toContain('Paket untuk usaha katering?');
});

test('contact settings can be retried and unavailable contact cannot be submitted', async ({ page }) => {
  let attempts = 0;
  await page.route('**/config/landing', route => {
    attempts += 1;
    return attempts === 1
      ? route.fulfill({ status: 503, json: { success: false } })
      : route.fulfill({ json: { success: true, data: { whatsapp: null } } });
  });
  await page.goto('/hubungi-kami');
  await page.getByRole('button', { name: 'Muat ulang kontak' }).click();
  await expect(page.getByText(/Kontak WhatsApp sedang tidak tersedia/)).toBeVisible();
  await page.getByLabel('Pertanyaan Anda').fill('Saya ingin bertanya.');
  await expect(page.getByRole('button', { name: 'Lanjut ke WhatsApp' })).toBeDisabled();
});

test('mobile contact navigation reaches FAQ and returns to the top of the contact page', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.route('**/config/landing', route => route.fulfill({ json: contactConfig }));
  await page.goto('/hubungi-kami');
  await expect(page.getByRole('heading', { name: 'Bicarakan kebutuhan usaha Anda.' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('link', { name: 'Lihat pertanyaan umum', exact: true }).click();
  await expect(page).toHaveURL('/#faq');
  await expect.poll(() => page.locator('#faq').evaluate(el => Math.abs(el.getBoundingClientRect().top - document.querySelector('header')!.getBoundingClientRect().height - 12))).toBeLessThan(3);
  await page.locator('section[aria-labelledby="contact-invitation-heading"]').getByRole('link', { name: 'Hubungi Kami' }).click();
  await expect(page.getByRole('heading', { name: 'Bicarakan kebutuhan usaha Anda.' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
});
