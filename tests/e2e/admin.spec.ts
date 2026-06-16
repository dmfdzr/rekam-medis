import { test, expect } from '@playwright/test';

test.describe('Admin Workflow', () => {
  test('Admin should be able to view audit logs and reports', async ({ page }) => {
    // Login as admin
    await page.goto('/');
    await page.getByLabel('Email atau username').fill('admin');
    await page.locator('input[name="password"]').fill('admin123');
    await page.getByRole('button', { name: 'Masuk' }).click();
    await expect(page.getByRole('heading', { name: /Dashboard/ })).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: 'Audit Log' }).click();
    await expect(page.getByRole('heading', { name: 'Audit Log' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Aktivitas penting' })).toBeVisible();

    await page.getByRole('button', { name: 'Laporan' }).click();
    await expect(page.getByRole('heading', { name: 'Laporan', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Export PDF' })).toBeVisible();
  });
});
