import { test, expect, type Page } from '@playwright/test';
import { productionHead, productionLog } from '../tests/support/production-batch-fixture';

test.use({
  baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
  channel: 'chromium',
});

async function chooseDay(page: Page, value: string) {
  const [year, month, day] = value.split('-').map(Number);
  await page.getByRole('combobox', { name: 'Pilih tahun' }).selectOption(String(year));
  await page.getByRole('combobox', { name: 'Pilih bulan' }).selectOption(String(month - 1));
  const label = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
  await page.getByRole('button', { name: new RegExp(`, ${label}$`) }).click();
}

for (const width of [390, 1280]) {
  test(`transaction range keeps drafts local and applies the selected dates at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const requests: URL[] = [];
    await page.addInitScript(() => {
      localStorage.setItem('token', 'date-picker-test');
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            user: {
              id: 'calendar-user',
              name: 'Tester',
              email: 'calendar@example.com',
              role: 'OWNER',
              account_type: 'OWNER',
            },
            token: 'date-picker-test',
            activeStoreId: 'calendar-store',
            activeStoreName: 'Calendar Store',
          },
          version: 0,
        }),
      );
    });
    await page.route('**/api/**', async route => {
      const url = new URL(route.request().url());
      let data: unknown = [];
      if (url.pathname.endsWith('/stores'))
        data = [{ id: 'calendar-store', name: 'Calendar Store', status: 'online' }];
      else if (url.pathname.endsWith('/permissions/me'))
        data = { role: 'OWNER', permissions: ['menu:pos', 'orders:read'] };
      else if (url.pathname.endsWith('/sales/summary'))
        data = { total_revenue: 0, total_transactions: 0, gross_profit: 0 };
      else if (url.pathname.endsWith('/sales')) {
        requests.push(url);
        data = { data: [], total: 0, page: 1, per_page: 10, total_pages: 0 };
      } else if (url.pathname.endsWith('/subscription/usage'))
        data = {
          effective_tier: 'FREE',
          status: 'ACTIVE',
          quotas: {},
          features: {},
          is_in_grace_period: false,
        };
      await route.fulfill({ json: { success: true, data } });
    });
    await page.goto('/sales/history');
    await page.getByRole('button', { name: 'Pilih tanggal', exact: true }).click();
    await expect.poll(() => requests.length).toBeGreaterThan(0);
    await page.getByRole('button', { name: 'Rentang tanggal' }).click();
    await chooseDay(page, '2026-09-20');
    await expect(page.getByRole('button', { name: 'Terapkan', exact: true })).toBeDisabled();
    expect(requests.some(url => url.searchParams.get('start_date') === '2026-09-20')).toBe(false);
    await chooseDay(page, '2026-09-21');
    const popup = page.getByRole('dialog', { name: 'Pilih rentang tanggal' });
    const box = await popup.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    await popup.getByRole('button', { name: 'Selesai' }).click();
    await page.getByRole('button', { name: 'Terapkan', exact: true }).click();
    await expect.poll(() => requests.at(-1)?.searchParams.get('start_date')).toBe('2026-09-20');
    expect(requests.at(-1)?.searchParams.get('end_date')).toBe('2026-09-21');
    await expect(page.getByRole('button', { name: 'Rentang tanggal' })).toBeHidden();
  });
}

for (const width of [390, 1280]) {
  test(`production start modal selects a date and submits outlet time at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    let head = productionHead({
      status: 'QUEUED',
      started_at: null,
      target_completed_at: null,
      logs: [productionLog({ status: 'QUEUED', started_at: null, inventory_consumed_at: null })],
    });
    const starts: unknown[] = [];
    await page.addInitScript(() => {
      localStorage.setItem('token', 'production-calendar-test');
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            user: {
              id: 'calendar-user',
              name: 'Tester',
              email: 'calendar@example.com',
              role: 'OWNER',
              account_type: 'OWNER',
            },
            token: 'production-calendar-test',
            activeStoreId: 'calendar-store',
            activeStoreName: 'Calendar Store',
          },
          version: 0,
        }),
      );
    });
    await page.route('**/api/**', async route => {
      const path = new URL(route.request().url()).pathname;
      let data: unknown = [];
      if (path.endsWith('/permissions/me'))
        data = {
          role: 'STORE_OWNER',
          permissions: ['menu:recipes', 'production:read', 'production:write'],
        };
      else if (path.endsWith('/stores'))
        data = [{ id: 'calendar-store', name: 'Calendar Store', status: 'online' }];
      else if (path.endsWith('/store'))
        data = { id: 'calendar-store', name: 'Calendar Store', timezone: 'Asia/Jakarta' };
      else if (path.endsWith('/subscription/usage'))
        data = {
          effective_tier: 'GROWTH',
          status: 'ACTIVE',
          quotas: {},
          features: {},
          is_in_grace_period: false,
        };
      else if (path.endsWith(`/production/batches/${head.id}/start`)) {
        starts.push(route.request().postDataJSON());
        head = {
          ...head,
          status: 'IN_PROGRESS',
          started_at: '2026-11-01T03:00:00Z',
          logs: head.logs.map(log => ({ ...log, status: 'IN_PROGRESS' })),
        };
        data = head;
      } else if (path.endsWith('/production/batches')) data = { items: [head], total_pages: 1 };
      else if (path.endsWith('/onboarding')) data = { should_start: false, state: null };
      await route.fulfill({ json: { success: true, data } });
    });
    await page.goto('/production/batches?tab=list');
    await page.getByRole('button', { name: 'Mulai proses', exact: true }).click();
    const modal = page.getByRole('dialog', { name: 'Mulai Proses Produksi', exact: true });
    const trigger = modal.getByRole('button', {
      name: 'Target tanggal & jam selesai (Asia/Jakarta)',
    });
    await expect(modal.getByLabel('Jam', { exact: true })).toBeDisabled();
    await trigger.click();
    const calendar = page.getByRole('dialog', { name: 'Pilih tanggal', exact: true });
    await calendar.getByRole('combobox', { name: 'Pilih tahun' }).selectOption('2027');
    await calendar.getByRole('combobox', { name: 'Pilih bulan' }).click();
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(calendar.getByRole('combobox', { name: 'Pilih bulan' })).toHaveValue('2');
    await calendar.getByRole('button', { name: /, 17 Maret 2027$/ }).click();
    await expect(calendar).toBeHidden();
    await expect(trigger).toBeFocused();
    await modal.getByLabel('Jam', { exact: true }).fill('18:45');
    await trigger.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(trigger).toHaveText('18 Mar 2027');
    await expect(modal.getByLabel('Jam', { exact: true })).toHaveValue('18:45');
    await trigger.click();
    await page.keyboard.press('Escape');
    await expect(calendar).toBeHidden();
    await expect(modal).toBeVisible();
    await modal.getByRole('button', { name: 'Mulai Produksi', exact: true }).click();
    await expect(modal).toBeHidden();
    expect(starts).toEqual([{ target_completed_at: '2027-03-18T11:45:00.000Z' }]);
  });
}

test('calendar works inside a modal, validates required values, and retains local time on mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/e2e/fixtures/date-picker.html');
  await page.getByRole('button', { name: 'Simpan', exact: true }).click();
  await expect(page.getByTestId('submitted')).toBeEmpty();
  await expect(page.getByRole('dialog', { name: 'Pilih tanggal', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /, 9 September 2026$/ })).toBeDisabled();
  await chooseDay(page, '2026-09-20');
  await expect(page.getByRole('button', { name: 'Tanggal wajib' })).toBeFocused();
  await page.getByRole('button', { name: 'Simpan', exact: true }).click();
  await expect(page.getByTestId('submitted')).toHaveText('2026-09-20');
  await page.getByRole('button', { name: 'Target selesai' }).click();
  await chooseDay(page, '2026-09-21');
  await expect(page.getByTestId('target')).toHaveText('2026-09-21T14:35');
  await page.getByLabel('Jam', { exact: true }).fill('18:45');
  await expect(page.getByTestId('target')).toHaveText('2026-09-21T18:45');
  const trigger = page.getByRole('button', { name: 'Target selesai' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('target')).toHaveText('2026-09-22T18:45');
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Tanggal pembelian', exact: true })).toBeVisible();
  await expect(trigger).toBeFocused();
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await trigger.click();
  await expect(page.getByRole('grid')).toBeVisible();
  await page.screenshot({ path: '/tmp/hpp-date-picker-mobile-dark.png' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
