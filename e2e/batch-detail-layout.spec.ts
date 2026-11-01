import { test, expect, type Page } from '@playwright/test';
import { productionHead, productionLog } from '../tests/support/production-batch-fixture';
import type { ProductionHead } from '../src/features/production/services/production-batch-service';

const storeId = 'batch-layout-store';
const previewHead = () =>
  productionHead({
    batch_number: 'PB-CONTOH-LAYOUT',
    notes: 'Data contoh untuk pengujian tampilan.',
    logs: [
      productionLog({
        recipe_snapshot: {
          product_name: 'Brownies panggang',
          variant_name: 'Original',
          product_unit: 'pcs',
          items: [],
        },
      }),
      {
        ...productionLog({
          id: 'log-2',
          status: 'COMPLETED',
          good_quantity: '9',
          waste_quantity: '1',
          hpp_per_unit: '1234.56',
          total_cost: '11111.04',
          recipe_snapshot: {
            product_name: 'Brownies panggang',
            variant_name: 'Keju',
            product_unit: 'pcs',
            items: [],
          },
        }),
        overheads: [{ name: 'Gas', amount: '20' }],
      },
      productionLog({
        id: 'log-3',
        status: 'QUEUED',
        recipe_snapshot: {
          product_name: 'Brownies panggang',
          variant_name: 'Kacang',
          product_unit: 'pcs',
          items: [],
        },
      }),
    ],
  });

async function setup(page: Page, head: ProductionHead, write = true) {
  await page.addInitScript(
    ({ storeId }) => {
      localStorage.setItem('token', 'batch-layout-test');
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            user: { id: 'layout-user', name: 'Layout test', email: 'layout@example.test' },
            token: 'batch-layout-test',
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
        permissions: ['menu:recipes', 'production:read', ...(write ? ['production:write'] : [])],
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
        kitchen_settings: { enable_manual_timer_alert: false, enable_kds_timer_alert: false },
      };
    else if (path.endsWith(`/production/batches/${head.id}`)) data = head;
    await route.fulfill({ json: { success: true, data } });
  });
  await page.goto(`/production/batches/${head.id}`);
  await expect(page.getByRole('heading', { name: head.batch_number, exact: true })).toBeVisible();
}

async function expectNoOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const detail = page.getByRole('region', { name: 'Detail varian' });
  expect(await detail.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
}

test('desktop variant navigation, keyboard actions and mobile selection', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await setup(page, previewHead());
  const nav = page.getByRole('navigation', { name: 'Varian produksi' });
  await nav.getByRole('button', { name: /Keju/ }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('HPP per unit', { exact: true })).toBeVisible();
  await expect(page.getByText('Rp 1.234,56')).toBeVisible();
  await expectNoOverflow(page);
  await nav.getByRole('button', { name: /Original/ }).click();
  await expect(page.getByRole('button', { name: 'Selesaikan varian', exact: true })).toHaveCount(0);
  await page
    .getByRole('region', { name: 'Detail varian' })
    .getByRole('button', { name: 'Action', exact: true })
    .click();
  await page.getByRole('menuitem', { name: 'Selesaikan varian', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Brownies panggang · Original');
  await page.keyboard.press('Escape');
  await page
    .getByRole('region', { name: 'Detail varian' })
    .getByRole('button', { name: 'Action', exact: true })
    .click();
  await page.getByRole('menuitem', { name: 'Batalkan varian' }).click();
  await expect(
    page.getByRole('dialog').getByRole('button', { name: 'Batalkan & Pulihkan Stok' }),
  ).toBeDisabled();
  await page.keyboard.press('Escape');
  await page
    .getByLabel('Informasi batch')
    .getByRole('button', { name: 'Action', exact: true })
    .click();
  await page.getByRole('menuitem', { name: 'Mulai varian antre' }).click();
  await expect(page.getByRole('dialog')).toContainText('Mulai Proses Produksi');
  await page.keyboard.press('Escape');
  await page
    .getByLabel('Informasi batch')
    .getByRole('button', { name: 'Action', exact: true })
    .click();
  await page.getByRole('menuitem', { name: 'Batalkan batch' }).click();
  await expect(page.getByRole('dialog')).toContainText('Batalkan Produksi?');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Selesaikan produksi', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Selesaikan Produksi');
  await page.keyboard.press('Escape');
  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(nav).toBeHidden();
    await page.getByLabel('Pilih varian', { exact: true }).selectOption('log-2');
    await expect(page.getByRole('heading', { name: 'Brownies panggang - Keju' })).toBeVisible();
    await expectNoOverflow(page);
    await expect(page.getByRole('region', { name: 'Biaya seluruh batch' })).toHaveCount(0);
  }
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await expectNoOverflow(page);
});

test('single queued variant, start action and empty ingredients', async ({ page }) => {
  const head = productionHead({
    status: 'QUEUED',
    started_at: null,
    target_completed_at: null,
    logs: [
      productionLog({
        status: 'QUEUED',
        started_at: null,
        consumptions: [],
        recipe_snapshot: {
          product_name: 'Data contoh',
          variant_name: 'Original',
          product_unit: 'pcs',
          items: [],
        },
      }),
    ],
  });
  await setup(page, head);
  await expect(page.getByRole('region', { name: 'Biaya seluruh batch' })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Rincian biaya' })).toHaveCount(0);
  await expect(
    page.getByRole('navigation', { name: 'Varian produksi' }).getByRole('button'),
  ).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Varian produksi' })).toHaveCount(0);
  await expect(page.getByText('HPP per unit')).toHaveCount(0);
  await expect(page.getByText('Belum ada rincian bahan untuk varian ini.')).toBeVisible();
  await page.getByRole('button', { name: 'Mulai proses' }).click();
  await expect(page.getByRole('dialog')).toContainText('Target tanggal & jam selesai');
  await page.keyboard.press('Escape');
  await page
    .getByLabel('Informasi batch')
    .getByRole('button', { name: 'Action', exact: true })
    .click();
  await expect(page.getByRole('menuitem', { name: 'Edit produksi' })).toBeVisible();
});

test('long names and monetary values fit narrow screens with read-only permissions', async ({
  page,
}) => {
  const head = productionHead({
    status: 'COMPLETED',
    logs: [
      productionLog({
        status: 'COMPLETED',
        hpp_per_unit: '1234567890123.45',
        bom_cost: '1234567890123.45',
        total_cost: '1234567890123.45',
        recipe_snapshot: {
          product_name: 'NamaProdukSangatPanjangTanpaSpasiUntukMengujiLebarLayar',
          variant_name: 'Varian dengan nama panjang',
          product_unit: 'pcs',
          items: [
            {
              stock_id: 'x',
              stock_name: 'NamaBahanSangatPanjangTanpaSpasiUntukPengujian',
              unit: 'kg',
              quantity: '0.1',
            },
          ],
        },
        consumptions: [
          { stock_id: 'x', quantity: '123456789.123', subtotal_cost: '1234567890123.45' },
        ],
      }),
    ],
  });
  await page.setViewportSize({ width: 320, height: 844 });
  await setup(page, head, false);
  await expect(page.getByRole('region', { name: 'Biaya seluruh batch' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Rincian biaya' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Action', exact: true })).toHaveCount(0);
  await expectNoOverflow(page);
});
