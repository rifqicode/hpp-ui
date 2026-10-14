import { test as base, expect, type Page } from '@playwright/test';

export const TEST_USER = {
  email: 'test@gmail.com',
  password: 'Password123!',
  storeName: 'Test Bakery',
};

/**
 * Logs in the test user through the UI and ensures navigation to dashboard
 * with token and active store properly initialized in localStorage.
 */
export async function loginUser(page: Page) {
  await page.goto('/login');
  await page.fill('#email', TEST_USER.email);
  await page.fill('#password', TEST_USER.password);
  await page.click('button[type="submit"]');

  // Verify successful redirection to dashboard
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

  // Ensure active store is populated
  const authStorage = await page.evaluate(() => localStorage.getItem('auth-storage'));
  expect(authStorage).toBeTruthy();
}

/**
 * Custom Playwright test fixture that pre-authenticates before each test.
 */
export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, use) => {
    await loginUser(page);
    await use(page);
  },
});

export { expect };
