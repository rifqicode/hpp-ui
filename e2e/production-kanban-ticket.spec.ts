import { test, expect, type Page } from '@playwright/test';
import { productionHead, productionLog } from '../tests/support/production-batch-fixture';

const storeId = 'kanban-ticket-store';
async function setup(page: Page) {
  const now = Date.now();
  const log = (id: string, name: string, status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED') =>
    productionLog({
      id,
      status,
      target_quantity: '120',
      good_quantity: '118',
      waste_quantity: '2',
      recipe_snapshot: {
        product_name: 'Brownies panggang',
        variant_name: name,
        product_unit: 'pcs',
        items: [],
      },
    });
  const heads = [
    productionHead({
      id: 'queued',
      batch_number: 'PB-CONTOH-ANTRE',
      status: 'QUEUED',
      started_at: null,
      target_completed_at: new Date(now + 120000).toISOString(),
      logs: [log('q-original', 'Original', 'QUEUED')],
    }),
    productionHead({
      id: 'running',
      batch_number: 'PB-CONTOH-PROSES',
      status: 'IN_PROGRESS',
      notes: 'Data contoh untuk pengujian tampilan. Pisahkan kemasan keju.',
      target_completed_at: new Date(now - 480000).toISOString(),
      logs: [
        log('r-original', 'Original', 'IN_PROGRESS'),
        log('r-keju', 'Keju', 'COMPLETED'),
        log('r-almond', 'Almond', 'IN_PROGRESS'),
        log('r-extra', 'Cokelat', 'IN_PROGRESS'),
      ],
    }),
    productionHead({
      id: 'completed',
      batch_number: 'PB-CONTOH-SELESAI',
      status: 'COMPLETED',
      completed_at: new Date(now - 60000).toISOString(),
      logs: [log('c-original', 'Original', 'COMPLETED')],
    }),
  ];
  await page.addInitScript(
    ({ storeId }) => {
      localStorage.setItem('token', 'kanban-ticket-test');
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            user: { id: 'ticket-user', name: 'Ticket test', email: 'ticket@example.test' },
            token: 'kanban-ticket-test',
            activeStoreId: storeId,
            activeStoreName: 'Data contoh pengujian',
            permissions: [],
          },
          version: 0,
        }),
      );
    },
    { storeId },
  );
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = [];
    if (path.endsWith('/stores'))
      data = [
        { id: storeId, name: 'Data contoh pengujian', timezone: 'Asia/Jakarta', status: 'online' },
      ];
    else if (path.endsWith('/permissions/me'))
      data = {
        role: 'OWNER',
        permissions: ['menu:recipes', 'production:read', 'production:write'],
      };
    else if (path.endsWith('/subscription/usage'))
      data = {
        tier: 'GROWTH',
        effective_tier: 'GROWTH',
        status: 'ACTIVE',
        features: {},
        quotas: {},
      };
    else if (path.endsWith('/store'))
      data = {
        id: storeId,
        name: 'Data contoh pengujian',
        timezone: 'Asia/Jakarta',
        kitchen_settings: {
          enable_manual_timer_alert: true,
          enable_kds_timer_alert: true,
          manual_warning_lead_minutes: 15,
        },
      };
    else if (path.endsWith('/production/batches')) data = { items: heads, total_pages: 1 };
    await route.fulfill({ json: { success: true, data } });
  });
  await page.goto('/production/batches?tab=kanban');
  await expect(page.getByText('PB-CONTOH-PROSES')).toBeVisible();
}

test('ticket grouping, stable urgency, keyboard process controls and drag transitions', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await setup(page);
  const running = page.locator('[data-batch-id="running"]');
  const queued = page.locator('[data-batch-id="queued"]');
  await expect(running.getByRole('heading', { name: 'Brownies panggang' })).toHaveCount(1);
  await expect(running.getByText('1/4 varian selesai')).toBeVisible();
  await expect(running.getByRole('link', { name: 'Keju' })).toHaveAttribute(
    'href',
    '/production/batches/running?variant=r-keju',
  );
  await expect(running.getByRole('link', { name: 'Keju' })).not.toHaveCSS(
    'text-decoration-line',
    'line-through',
  );
  await expect(running.getByRole('checkbox')).toHaveCount(3);
  await expect(
    running.getByRole('checkbox', { name: 'Selesaikan Brownies panggang - Keju' }),
  ).toBeChecked();
  await expect(
    running.getByRole('checkbox', { name: 'Selesaikan Brownies panggang - Keju' }),
  ).toBeDisabled();
  const original = running.getByRole('checkbox', {
    name: 'Selesaikan Brownies panggang - Original',
  });
  await original.focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('dialog')).toContainText('Brownies panggang · Original');
  await expect(page.getByRole('dialog')).not.toContainText('Brownies panggang · Almond');
  await expect(page.getByRole('dialog')).not.toContainText('Brownies panggang · Keju');
  await page.keyboard.press('Escape');
  await expect(original).not.toBeChecked();
  await expect(running).toHaveCSS('animation-name', 'none');
  expect(await running.evaluate(el => getComputedStyle(el, '::before').animationName)).toBe('none');
  const late = running.getByText(/Terlambat \d+ menit/);
  await expect(late).not.toHaveCSS('animation-name', 'none');
  await expect(queued.getByText(/Sisa \d+ menit/)).toHaveCSS('animation-name', 'none');
  await running.getByRole('button', { name: 'Selesaikan', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toContainText('Selesaikan Produksi');
  await expect(page.getByRole('dialog')).not.toContainText('Brownies panggang · Keju');
  await page.keyboard.press('Escape');
  await queued.getByRole('button', { name: 'Mulai produksi' }).click();
  await expect(page.getByRole('dialog')).toContainText('Mulai Proses Produksi');
  await page.keyboard.press('Escape');
  await queued.dragTo(page.locator('[data-column-id="IN_PROGRESS"]'));
  await expect(page.getByRole('dialog')).toContainText('Mulai Proses Produksi');
  await page.keyboard.press('Escape');
  await running.dragTo(page.locator('[data-column-id="COMPLETED"]'));
  await expect(page.getByRole('dialog')).toContainText('Selesaikan Produksi');
  await page.keyboard.press('Escape');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(late).toHaveCSS('animation-name', 'none');
});

test('cards reflow at narrow widths and in dark mode', async ({ page }) => {
  await setup(page);
  const board = page.getByLabel('Papan Kanban Dapur Produksi');
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
    const overflow = await board
      .locator('[data-batch-id]')
      .evaluateAll(cards => cards.some(card => card.scrollWidth > card.clientWidth));
    expect(overflow).toBe(false);
  }
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await expect(board.locator('[data-batch-id]')).toHaveCount(3);
  await board
    .locator('[data-batch-id="running"]')
    .getByRole('button', { name: 'Selesaikan', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
});
