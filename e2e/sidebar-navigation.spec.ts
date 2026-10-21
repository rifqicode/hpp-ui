import { test, expect, type Page } from '@playwright/test';

const storeId = '11111111-1111-4111-8111-111111111111';
const otherStoreId = '22222222-2222-4222-8222-222222222222';

async function mockSidebar(page: Page, permissions: string[], options: { gated?: boolean; failPermissions?: boolean } = {}) {
  await page.addInitScript(({ storeId }) => {
    if (localStorage.getItem('auth-storage')) return;
    localStorage.setItem('token', 'sidebar-test');
    localStorage.setItem('auth-storage', JSON.stringify({ state: {
      user: { id: 'sidebar-user', name: 'Sidebar Tester', email: 'sidebar@example.com' },
      token: 'sidebar-test', activeStoreId: storeId, activeStoreName: 'Sidebar Test Store',
    }, version: 0 }));
  }, { storeId });
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = [];
    if (path.endsWith('/stores')) data = [
      { id: storeId, name: 'Sidebar Test Store', status: 'online' },
      { id: otherStoreId, name: 'Restricted Store', status: 'online' },
    ];
    else if (path.endsWith('/permissions/me')) {
      if (options.failPermissions) {
        await route.fulfill({ status: 503, json: { success: false, message: 'Permissions unavailable' } });
        return;
      }
      data = { role: 'STAFF', permissions: route.request().headers()['x-store-id'] === otherStoreId ? [] : permissions };
    } else if (path.endsWith('/subscription/usage')) data = {
      effective_tier: 'FREE', status: 'ACTIVE', quotas: {},
      features: { production_analytics: !options.gated }, is_in_grace_period: false,
    };
    await route.fulfill({ json: { success: true, data } });
  });
}

test('nested menus follow active routes, refresh, keyboard toggles and navigation', async ({ page }) => {
  await mockSidebar(page, ['menu:recipes', 'menu:stocks', 'stocks:create', 'orders:read']);
  await page.goto('/production/hpp/recipe-simulation');
  const nav = page.getByRole('navigation', { name: 'Menu utama' });
  const production = nav.getByRole('button', { name: 'Production', exact: true });
  const hpp = nav.getByRole('button', { name: 'HPP Calculator', exact: true });
  await expect(production).toHaveAttribute('aria-expanded', 'true');
  await expect(hpp).toHaveAttribute('aria-expanded', 'true');
  await expect(nav.getByRole('link', { name: 'Simulasi Resep Baru', exact: true })).toHaveAttribute('aria-current', 'page');
  await page.reload();
  await expect(hpp).toHaveAttribute('aria-expanded', 'true');
  await hpp.focus();
  await page.keyboard.press('Enter');
  await expect(hpp).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('Space');
  await expect(hpp).toHaveAttribute('aria-expanded', 'true');
  const inventory = nav.getByRole('button', { name: 'Inventory', exact: true });
  await inventory.click();
  await expect(nav.getByRole('link', { name: 'Bahan Baku', exact: true })).toBeVisible();
  await inventory.click();
  await expect(nav.getByRole('link', { name: 'Bahan Baku', exact: true })).toBeHidden();
  await nav.getByRole('button', { name: 'Administration', exact: true }).click();
  await nav.getByRole('link', { name: 'Account Settings', exact: true }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(nav.getByRole('button', { name: 'Administration', exact: true })).toHaveAttribute('data-active', 'true');
  await expect(nav.getByRole('link', { name: 'Account Settings', exact: true })).toHaveAttribute('aria-current', 'page');
});

test('detail routes activate their closest menu and distinguish store settings', async ({ page }) => {
  await mockSidebar(page, ['menu:stocks', 'stocks:create', 'menu:settings']);
  await page.goto('/inventory/purchase-orders/new');
  const nav = page.getByRole('navigation', { name: 'Menu utama' });
  await expect(nav.getByRole('button', { name: 'Inventory', exact: true })).toHaveAttribute('aria-expanded', 'true');
  await expect(nav.getByRole('link', { name: 'Purchase', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(nav.getByRole('link', { name: 'Bahan Baku', exact: true })).not.toHaveAttribute('aria-current', 'page');
  await page.goto('/settings/store');
  await expect(nav.getByRole('link', { name: 'Store Settings', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(nav.getByRole('link', { name: 'Account Settings', exact: true })).not.toHaveAttribute('aria-current', 'page');
});

test('permission filtering hides inaccessible leaves and empty modules', async ({ page }) => {
  await mockSidebar(page, ['orders:read']);
  await page.goto('/production/hpp/recipe-simulation');
  const nav = page.getByRole('navigation', { name: 'Menu utama' });
  await expect(nav.getByRole('button', { name: 'Order', exact: true })).toBeVisible();
  for (const name of ['Main', 'Inventory', 'Production']) {
    await expect(nav.getByRole('button', { name, exact: true })).toHaveCount(0);
  }
  await nav.getByRole('button', { name: 'Order', exact: true }).click();
  await expect(nav.getByRole('link', { name: 'POS', exact: true })).toHaveCount(0);
  await expect(nav.getByRole('link', { name: 'Transactions', exact: true })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Customers', exact: true })).toBeVisible();
});

test('empty permissions keep only unrestricted menus', async ({ page }) => {
  await mockSidebar(page, []);
  await page.goto('/production/hpp/recipe-simulation');
  const nav = page.getByRole('navigation', { name: 'Menu utama' });
  await expect(nav.getByRole('status')).toBeHidden();
  await expect(nav.getByRole('button')).toHaveCount(1);
  await nav.getByRole('button', { name: 'Administration', exact: true }).click();
  await expect(nav.getByRole('link', { name: 'Account Settings', exact: true })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Subscription', exact: true })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Store Settings', exact: true })).toHaveCount(0);
});

test('failed permission requests stay restricted and can be retried', async ({ page }) => {
  const options = { failPermissions: true };
  await mockSidebar(page, ['orders:read'], options);
  await page.goto('/production/hpp/recipe-simulation');
  const nav = page.getByRole('navigation', { name: 'Menu utama' });
  await expect(nav.getByRole('alert')).toBeVisible({ timeout: 20000 });
  await expect(nav.getByRole('button', { name: 'Order', exact: true })).toHaveCount(0);
  options.failPermissions = false;
  await nav.getByRole('button', { name: 'Coba lagi', exact: true }).click();
  await expect(nav.getByRole('button', { name: 'Order', exact: true })).toBeVisible();
});

test('subscription locks still open the upgrade dialog', async ({ page }) => {
  await mockSidebar(page, ['menu:recipes'], { gated: true });
  await page.goto('/production/hpp/recipe-simulation');
  const nav = page.getByRole('navigation', { name: 'Menu utama' });
  await nav.getByRole('button', { name: /Simulasi Resep Baru/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page).toHaveURL(/\/production\/hpp\/recipe-simulation$/);
});

test('switching store removes the previous store menus', async ({ page }) => {
  await mockSidebar(page, ['orders:read']);
  await page.goto('/production/hpp/recipe-simulation');
  const nav = page.getByRole('navigation', { name: 'Menu utama' });
  await expect(nav.getByRole('button', { name: 'Order', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Toko aktif: Sidebar Test Store/ }).click();
  await page.getByRole('menuitem', { name: 'Restricted Store', exact: true }).click();
  await expect(page.getByRole('button', { name: /Toko aktif: Restricted Store/ })).toBeVisible();
  await expect(nav.getByRole('button', { name: 'Order', exact: true })).toHaveCount(0);
});

test('mobile drawer opens nested active menus without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSidebar(page, ['menu:recipes']);
  await page.goto('/production/hpp/recipe-simulation');
  await page.getByRole('button', { name: 'Toggle Sidebar' }).click();
  const nav = page.getByRole('navigation', { name: 'Menu utama' });
  await expect(nav.getByRole('link', { name: 'Simulasi Resep Baru', exact: true })).toBeVisible();
  await expect(nav.getByRole('button', { name: 'HPP Calculator', exact: true })).toHaveAttribute('aria-expanded', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(nav).toBeHidden();
});
