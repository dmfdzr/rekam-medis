import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email atau username').fill('pendaftaran');
  await page.locator('input[name="password"]').fill('pendaftaran123');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page.getByRole('heading', { name: /Dashboard/ })).toBeVisible({ timeout: 15000 });
});

test.describe('Registration Workflow', () => {
  test('should create a new patient', async ({ page }) => {
    await page.getByRole('button', { name: 'Pasien' }).click();

    await page.getByRole('button', { name: 'Kelola pasien' }).click();
    await page.getByRole('button', { name: 'Tambah pasien' }).click();

    const randomNik = Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString();
    const patientName = `Test Patient ${Date.now()}`;

    await page.getByLabel('Nama lengkap').fill(patientName);
    await page.getByLabel('NIK').fill(randomNik);
    await page.getByLabel('Tanggal lahir').fill('1990-01-01');
    await page.getByLabel('Jenis kelamin').selectOption('MALE');
    await page.getByLabel('Nomor telepon').fill('081234567890');
    
    await page.getByRole('button', { name: 'Simpan pasien' }).click();

    await expect(page.getByText('berhasil dibuat')).toBeVisible({ timeout: 15000 });
  });

  test('should register a new visit for a patient', async ({ page }) => {
    await page.getByRole('button', { name: 'Pasien' }).click();
    await page.getByRole('button', { name: 'Kelola pasien' }).click();
    await page.getByRole('button', { name: 'Tambah pasien' }).click();

    const randomNik = Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString();
    const patientName = `Visit Patient ${Date.now()}`;

    await page.getByLabel('Nama lengkap').fill(patientName);
    await page.getByLabel('NIK').fill(randomNik);
    await page.getByLabel('Tanggal lahir').fill('1992-02-02');
    await page.getByLabel('Jenis kelamin').selectOption('FEMALE');
    await page.getByLabel('Nomor telepon').fill('081299988877');
    await page.getByRole('button', { name: 'Simpan pasien' }).click();
    await expect(page.getByText('berhasil dibuat')).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Tutup dialog' }).click();

    await page.getByRole('button', { name: 'Kunjungan' }).click();

    await page.getByRole('button', { name: 'Kelola kunjungan' }).click();
    await page.getByRole('button', { name: 'Buat kunjungan' }).click();

    const patientSelect = page.getByLabel('Pasien');
    const patientOptionValue = await patientSelect.locator('option', { hasText: patientName }).getAttribute('value');
    expect(patientOptionValue).toBeTruthy();
    await patientSelect.selectOption(patientOptionValue!);

    const doctorSelect = page.getByLabel('Dokter');
    await doctorSelect.selectOption({ index: 1 });

    await page.getByLabel('Layanan / poli').fill('Poli Umum');
    await page.getByLabel('Keluhan utama').fill('Sakit kepala sejak 2 hari yang lalu');

    await page.getByRole('button', { name: 'Buat kunjungan' }).last().click();

    await expect(page.getByText('berhasil dibuat')).toBeVisible({ timeout: 15000 });
  });
});
