import { test, expect } from '@playwright/test';

test.describe('Pharmacy Workflow', () => {
  test('Doctor should be able to view and process prescriptions', async ({ page }) => {
    // Login as doctor
    await page.goto('/login');
    await page.getByLabel('Email atau username').fill('dokter');
    await page.locator('input[name="password"]').fill('dokter123');
    await page.getByRole('button', { name: 'Masuk' }).click();
    await expect(page.getByRole('heading', { name: /Dashboard/ })).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: 'Resep' }).click();
    await expect(page.getByRole('heading', { name: 'Resep', exact: true })).toBeVisible();

    if (await page.getByText('Belum ada resep').isVisible()) {
      await expect(page.getByText('Resep dokter akan tampil')).toBeVisible();
    } else {
      await page.getByRole('button', { name: 'Detail' }).first().click();
      const detailDialog = page.getByRole('dialog');
      await expect(detailDialog.getByText('Item obat')).toBeVisible();
      await expect(detailDialog.getByText(/Diminta:/).first()).toBeVisible();
      await expect(detailDialog.getByText(/Stok:/).first()).toBeVisible();
      await page.getByRole('button', { name: 'Tutup dialog' }).click();

      await page.getByRole('button', { name: 'Kelola resep' }).click();
      await page.getByRole('button', { name: 'Proses resep' }).click();
      await expect(page.locator('select[name="prescriptionId"]')).toBeVisible();
      await expect(page.getByText(/sisa setelah proses/i).first()).toBeVisible();
      await page.getByRole('button', { name: 'Tutup dialog' }).click();
    }

    await page.getByRole('button', { name: 'Obat' }).click();
    await expect(page.getByRole('heading', { name: 'Obat', exact: true })).toBeVisible();
    await expect(page.getByText('Tidak bisa diresepkan')).toBeVisible();

    if (!(await page.getByText('Obat tidak ditemukan').isVisible())) {
      await page.getByRole('button', { name: 'Detail' }).first().click();
      const medicineDialog = page.getByRole('dialog');
      await expect(medicineDialog.getByText('Status resep')).toBeVisible();
      await expect(medicineDialog.getByText(/Bisa dipakai resep|Tidak bisa dipakai resep/).first()).toBeVisible();
      await expect(medicineDialog.getByText('Sinyal stok')).toBeVisible();
    }
  });
});
