import { test, expect } from '@playwright/test';

test.describe('Clinical Workflow', () => {
  test('Doctor should be able to record laboratory results', async ({ page }) => {
    // Login as doctor
    await page.goto('/login');
    await page.getByLabel('Email atau username').fill('dokter');
    await page.locator('input[name="password"]').fill('dokter123');
    await page.getByRole('button', { name: 'Masuk' }).click();
    await expect(page.getByRole('heading', { name: /Dashboard/ })).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: 'Laboratorium' }).click();
    await expect(page.getByRole('heading', { name: 'Input Laboratorium' })).toBeVisible();
    await page.getByRole('button', { name: 'Simpan hasil lab' }).click();

    if (await page.getByText('Belum ada pasien siap laboratorium').isVisible()) {
      await expect(page.getByText('Pasien akan muncul setelah asesmen disimpan')).toBeVisible();
    } else {
      await page.getByLabel('Hemoglobin (g/dl)').fill('14.0');
      await page.getByLabel('Leukosit (micro/l)').fill('9000');
      await page.getByLabel('GDS/GDP (mg/dl)').fill('110');
      await page.getByLabel('CRP (mg/dl)').fill('0.5');

      await page.getByRole('button', { name: 'Simpan laboratorium' }).click();
      await expect(page.getByText('berhasil disimpan')).toBeVisible({ timeout: 15000 });
    }
  });

  test('Doctor should be able to record medical record', async ({ page }) => {
    // Login as doctor
    await page.goto('/login');
    await page.getByLabel('Email atau username').fill('dokter');
    await page.locator('input[name="password"]').fill('dokter123');
    await page.getByRole('button', { name: 'Masuk' }).click();
    await expect(page.getByRole('heading', { name: /Dashboard/ })).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: 'CPPT' }).click();
    await expect(page.getByRole('heading', { name: 'CPPT', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Finalisasi CPPT' }).click();

    if (await page.getByText('Belum ada pasien untuk pemeriksaan').isVisible()) {
      await expect(page.getByText('Kunjungan aktif akan muncul setelah pasien didaftarkan')).toBeVisible();
    } else {
      // Fill SOAP
      await page.getByLabel('Subjective').fill('Sakit kepala berdenyut');
      await page.getByLabel('Objective').fill('TD 120/80, Nadi 80x/m');
      await page.getByLabel('Assessment').fill('Tension type headache');
      await page.getByLabel('Plan').fill('Istirahat, analgesik');

      await page.getByRole('button', { name: 'Simpan draft' }).click();
      await expect(page.getByText('berhasil disimpan')).toBeVisible({ timeout: 15000 });
    }
  });

  test('Doctor should be able to inspect medical record history detail', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email atau username').fill('dokter');
    await page.locator('input[name="password"]').fill('dokter123');
    await page.getByRole('button', { name: 'Masuk' }).click();
    await expect(page.getByRole('heading', { name: /Dashboard/ })).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: 'CPPT' }).click();
    await expect(page.getByRole('heading', { name: 'CPPT', exact: true })).toBeVisible();

    if (await page.getByText('Belum ada CPPT').isVisible()) {
      await expect(page.getByText('Draft dan finalisasi CPPT')).toBeVisible();
      return;
    }

    await page.getByRole('button', { name: 'Detail CPPT' }).first().click();
    const detailDialog = page.getByRole('dialog');
    await expect(detailDialog.getByText('Subjective')).toBeVisible();
    await expect(detailDialog.getByText('Diagnosa', { exact: true })).toBeVisible();
    await expect(detailDialog.getByText('Tindakan', { exact: true })).toBeVisible();

    await expect(detailDialog.getByText('Resep')).toBeVisible();
  });
});
