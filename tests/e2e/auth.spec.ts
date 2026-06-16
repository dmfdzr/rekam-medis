import { test, expect, type Page } from '@playwright/test';

async function login(page: Page, username: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email atau username').fill(username);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page.getByRole('heading', { name: /Dashboard/ })).toBeVisible({ timeout: 15000 });
}

test.describe('Authentication', () => {
  test('should show public landing page before login', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /MedNote membantu klinik/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Masuk aplikasi/ }).first()).toHaveAttribute('href', '/login');
  });

  test('should show login page and allow login', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Masuk ke MedNote' })).toBeVisible();

    await login(page, 'admin', 'admin123');
    await expect(page.getByRole('heading', { name: /Dashboard/ })).toBeVisible();
  });

  test('should allow logout', async ({ page }) => {
    await login(page, 'admin', 'admin123');

    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page.getByRole('heading', { name: 'Keluar dari aplikasi?' })).toBeVisible();
    await page.getByRole('button', { name: 'Keluar' }).last().click();

    await expect(page.getByRole('heading', { name: 'Masuk ke MedNote' })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email atau username').fill('admin');
    await page.locator('input[name="password"]').fill('wrongpassword');
    await page.getByRole('button', { name: 'Masuk' }).click();

    await expect(page.locator('form')).toContainText('tidak sesuai', { timeout: 15000 });
  });
});
