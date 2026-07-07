import { test, expect, type Page } from '@playwright/test';

async function selectCurrentDate(page: Page, label: string) {
  await page.getByRole('button', { name: `Pilih ${label.toLowerCase()}` }).click();
  await page.getByRole('button', { name: /^Today,/ }).click();
}

async function selectComboboxOption(page: Page, index: number, optionName: RegExp | string) {
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox').nth(index).click();
  await page.getByRole('option', { name: optionName }).click();
}

async function setSelectValue(page: Page, name: string, value: string) {
  await page.locator(`select[name="${name}"]`).evaluate((select, nextValue) => {
    const element = select as HTMLSelectElement;
    element.value = nextValue as string;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email atau username').fill('admin');
  await page.locator('input[name="password"]').fill('admin123');
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
    await selectCurrentDate(page, 'Tanggal lahir');
    await setSelectValue(page, 'gender', 'MALE');
    await page.getByLabel('Nomor telepon').fill('081234567890');
    
    await page.getByRole('button', { name: 'Simpan pasien' }).click();

    await expect(page.locator('table').getByText(patientName)).toBeVisible({ timeout: 15000 });
  });

  test('should register a new visit for a patient', async ({ page }) => {
    await page.getByRole('button', { name: 'Pasien' }).click();
    await page.getByRole('button', { name: 'Kelola pasien' }).click();
    await page.getByRole('button', { name: 'Tambah pasien' }).click();

    const randomNik = Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString();
    const patientName = `Visit Patient ${Date.now()}`;

    await page.getByLabel('Nama lengkap').fill(patientName);
    await page.getByLabel('NIK').fill(randomNik);
    await selectCurrentDate(page, 'Tanggal lahir');
    await setSelectValue(page, 'gender', 'FEMALE');
    await page.getByLabel('Nomor telepon').fill('081299988877');
    await page.getByRole('button', { name: 'Simpan pasien' }).click();
    await expect(page.locator('table').getByText(patientName)).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Tutup dialog' }).click();

    await page.getByRole('button', { name: 'Kunjungan' }).click();

    await page.getByRole('button', { name: 'Kelola kunjungan' }).click();
    await page.getByRole('button', { name: 'Buat kunjungan' }).click();

    await selectComboboxOption(page, 0, new RegExp(patientName));
    await setSelectValue(page, 'patientType', 'UMUM');
    await expect(page.locator('select[name="patientType"]')).toHaveValue('UMUM');
    await selectComboboxOption(page, 2, /Raka/);
    await selectComboboxOption(page, 3, 'Poli Umum');
    await selectCurrentDate(page, 'Tanggal masuk');

    await page.getByRole('button', { name: 'Buat kunjungan' }).last().click();

    await expect(page.getByText('berhasil dibuat')).toBeVisible({ timeout: 15000 });
  });
});
