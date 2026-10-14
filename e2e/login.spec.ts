import { test, expect } from '@playwright/test';

test.describe('Authentication - Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test to ensure a clean session state
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
  });

  test('Happy Path: Successful Login redirects to dashboard', async ({ page }) => {
    await page.fill('#email', 'test@gmail.com');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');

    // Verify successful redirection to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('Edge Case: Empty credentials displays validation error', async ({ page }) => {
    await page.click('button[type="submit"]');

    const errorMessage = page.locator('div.text-destructive');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Email dan kata sandi wajib diisi');
  });

  test('Edge Case: Invalid password displays unauthorized error message', async ({ page }) => {
    await page.fill('#email', 'muhammadrifqi.tb@gmail.com');
    await page.fill('#password', 'wrongpass123');
    await page.click('button[type="submit"]');

    const errorMessage = page.locator('div.text-destructive');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Email atau kata sandi salah. Silakan coba lagi.');
  });

  test('Edge Case: Non-existent user displays error message', async ({ page }) => {
    await page.fill('#email', `unregistered_${Date.now()}@example.com`);
    await page.fill('#password', 'randompass123');
    await page.click('button[type="submit"]');

    const errorMessage = page.locator('div.text-destructive');
    await expect(errorMessage).toBeVisible();
  });

  test('UI Behavior: Password visibility toggle switches input type', async ({ page }) => {
    const passwordInput = page.locator('#password');
    await passwordInput.fill('secret123');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click the toggle button to reveal password
    const toggleButton = page.locator('button:has(svg.lucide-eye), button:has(svg.lucide-eye-off)');
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click again to hide password
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('Navigation Links: Forgot password link navigates to forgot-password page', async ({ page }) => {
    await page.click('a:has-text("Lupa kata sandi?")');
    await expect(page).toHaveURL(/\/forgot-password/);
  });

  test('Navigation Links: Register link navigates to register page', async ({ page }) => {
    await page.click('a:has-text("Daftar Sekarang")');
    await expect(page).toHaveURL(/\/register/);
  });
});
