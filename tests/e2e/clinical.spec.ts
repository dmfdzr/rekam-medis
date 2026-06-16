import { test, expect } from '@playwright/test';

test.describe('Clinical Workflow', () => {
  test('Nurse should be able to record vitals', async ({ page }) => {
    // Login as nurse
    await page.goto('/');
    await page.getByLabel('Email atau username').fill('perawat');
    await page.locator('input[name="password"]').fill('perawat123');
    await page.getByRole('button', { name: 'Masuk' }).click();
    await expect(page.getByRole('heading', { name: /Dashboard/ })).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: 'Tanda Vital' }).click();
    await expect(page.getByRole('heading', { name: 'Tanda Vital' })).toBeVisible();
    await page.getByRole('button', { name: 'Simpan tanda vital' }).click();

    if (await page.getByText('Belum ada kunjungan untuk tanda vital').isVisible()) {
      await expect(page.getByText('Buat kunjungan terlebih dahulu')).toBeVisible();
    } else {
      // Fill vitals
      await page.getByLabel('Tekanan darah').fill('120/80');
      await page.getByLabel('Suhu tubuh').fill('36.5');
      await page.getByLabel('Nadi').fill('75');
      await page.getByLabel('Respirasi').fill('18');
      await page.getByLabel('Berat badan').fill('65');
      await page.getByLabel('Tinggi badan').fill('170');

      await page.getByRole('button', { name: 'Simpan tanda vital' }).click();
      await expect(page.getByText('berhasil disimpan')).toBeVisible({ timeout: 15000 });
    }
  });

  test('Doctor should be able to record medical record', async ({ page }) => {
    // Login as doctor
    await page.goto('/');
    await page.getByLabel('Email atau username').fill('dokter');
    await page.locator('input[name="password"]').fill('dokter123');
    await page.getByRole('button', { name: 'Masuk' }).click();
    await expect(page.getByRole('heading', { name: /Dashboard/ })).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: 'Rekam Medis' }).click();
    await expect(page.getByRole('heading', { name: 'Rekam Medis', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Finalisasi rekam medis' }).click();

    if (await page.getByText('Belum ada pasien pemeriksaan').isVisible()) {
      await expect(page.getByText('Pasien akan muncul setelah tanda vital')).toBeVisible();
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
});
