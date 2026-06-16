import { test, expect } from '@playwright/test';

test.describe('Pharmacy Workflow', () => {
  test('Pharmacist should be able to view and process prescriptions', async ({ page }) => {
    // Login as pharmacist
    await page.goto('/');
    await page.getByLabel('Email atau username').fill('apoteker');
    await page.locator('input[name="password"]').fill('apoteker123');
    await page.getByRole('button', { name: 'Masuk' }).click();
    await expect(page.getByRole('heading', { name: /Dashboard/ })).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: 'Resep' }).click();
    await expect(page.getByRole('heading', { name: 'Resep', exact: true })).toBeVisible();

    if (await page.getByText('Belum ada resep').isVisible()) {
      await expect(page.getByText('Resep dokter akan tampil')).toBeVisible();
    } else {
      await page.getByRole('button', { name: 'Kelola resep' }).click();
      await page.getByRole('button', { name: 'Proses resep' }).click();
      await expect(page.locator('select[name="prescriptionId"]')).toBeVisible();
    }
  });
});
