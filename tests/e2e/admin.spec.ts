import { test, expect } from '@playwright/test';

test.describe('Master Workflow', () => {
  test('Master should be able to view audit logs and reports', async ({ page }) => {
    // Login as master
    await page.goto('/login');
    await page.getByLabel('Email atau username').fill('master');
    await page.locator('input[name="password"]').fill('master123');
    await page.getByRole('button', { name: 'Masuk' }).click();
    await expect(page.getByRole('heading', { name: /Dashboard/ })).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: 'Audit Log' }).click();
    await expect(page.getByRole('heading', { name: 'Audit Log' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Aktivitas penting' })).toBeVisible();
    await expect(page.getByText('Total aktivitas')).toBeVisible();
    await expect(page.getByText('Sensitif', { exact: true }).first()).toBeVisible();

    if (!(await page.getByText('Belum ada audit log').isVisible())) {
      await page.getByRole('button', { name: 'Filter' }).click();
      await expect(page.getByRole('heading', { name: 'Filter audit log' })).toBeVisible();
      await expect(page.getByLabel('Risiko')).toBeVisible();
      await expect(page.getByLabel('Entity')).toBeVisible();
      await expect(page.getByLabel('Action')).toBeVisible();
      await page.getByRole('button', { name: 'Terapkan' }).click();

      await page.getByRole('button', { name: 'Detail audit' }).first().click();
      const auditDialog = page.getByRole('dialog');
      await expect(auditDialog.getByText('IP address')).toBeVisible();
      await expect(auditDialog.getByText('User agent')).toBeVisible();
      await expect(auditDialog.getByText('Data sebelum')).toBeVisible();
      await page.getByRole('button', { name: 'Tutup dialog' }).click();
    }

    await page.getByRole('button', { name: 'Laporan' }).click();
    await expect(page.getByRole('heading', { name: 'Laporan', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Export PDF' })).toBeVisible();

    const invalidReportResponse = await page.request.get('/reports/summary.json?startDate=2026-06-16&endDate=2026-06-01');
    expect(invalidReportResponse.status()).toBe(400);
    expect(await invalidReportResponse.json()).toMatchObject({ message: expect.stringContaining('Tanggal akhir') });

    await page.getByRole('button', { name: 'Filter' }).click();
    await page.getByLabel('Tanggal mulai').fill('2026-06-16');
    await page.getByLabel('Tanggal akhir').fill('2026-06-01');
    await page.getByRole('button', { name: 'Terapkan' }).click();
    await expect(page.getByRole('alert')).toContainText('Tanggal akhir tidak boleh lebih awal dari tanggal mulai.');
  });

  test('Master should be able to create and generate a medical document', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email atau username').fill('master');
    await page.locator('input[name="password"]').fill('master123');
    await page.getByRole('button', { name: 'Masuk' }).click();
    await expect(page.getByRole('heading', { name: /Dashboard/ })).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: 'Pasien' }).click();
    await page.getByRole('button', { name: 'Kelola pasien' }).click();
    await page.getByRole('button', { name: 'Tambah pasien' }).click();

    const randomNik = Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString();
    const patientName = `Dokumen Patient ${Date.now()}`;
    const documentName = `Ringkasan Dokumen ${Date.now()}`;

    await page.getByLabel('Nama lengkap').fill(patientName);
    await page.getByLabel('NIK').fill(randomNik);
    await page.getByLabel('Tanggal lahir').fill('1988-04-12');
    await page.getByLabel('Jenis kelamin').selectOption('FEMALE');
    await page.getByLabel('Nomor telepon').fill('081234567899');
    await page.getByRole('button', { name: 'Simpan pasien' }).click();
    await expect(page.getByText('berhasil dibuat')).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Tutup dialog' }).click();

    await page.getByRole('button', { name: 'Dokumen Medis' }).click();
    await page.getByRole('button', { name: 'Kelola dokumen' }).click();

    const patientSelect = page.getByLabel('Pasien');
    const patientOptionValue = await patientSelect.locator('option', { hasText: patientName }).getAttribute('value');
    expect(patientOptionValue).toBeTruthy();
    await patientSelect.selectOption(patientOptionValue!);

    await page.getByLabel('Tipe dokumen').selectOption('OTHER');
    await page.getByLabel('Nama dokumen').fill(documentName);
    await page.getByLabel('Catatan referensi').fill('Arsip fisik tersimpan di ruang rekam medis.');
    await page.getByRole('button', { name: 'Simpan dokumen' }).click();

    await expect(page.getByText('Metadata dokumen')).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Tutup dialog' }).click();

    const generatedPagePromise = page.waitForEvent('popup');
    await page.getByRole('link', { name: /Buka/ }).first().click();
    const generatedPage = await generatedPagePromise;
    await expect(generatedPage.getByText('Data Pasien')).toBeVisible({ timeout: 15000 });
    await expect(generatedPage.getByText('MedNote').first()).toBeVisible();
  });
});


test.describe('Admin Workflow', () => {
  test('Admin should be able to view audit logs and reports', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.getByLabel('Email atau username').fill('admin');
    await page.locator('input[name="password"]').fill('admin123');
    await page.getByRole('button', { name: 'Masuk' }).click();
    await expect(page.getByRole('heading', { name: /Dashboard/ })).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: 'Audit Log' }).click();
    await expect(page.getByRole('heading', { name: 'Audit Log' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Aktivitas penting' })).toBeVisible();
    await expect(page.getByText('Total aktivitas')).toBeVisible();
    await expect(page.getByText('Sensitif', { exact: true }).first()).toBeVisible();

    if (!(await page.getByText('Belum ada audit log').isVisible())) {
      await page.getByRole('button', { name: 'Filter' }).click();
      await expect(page.getByRole('heading', { name: 'Filter audit log' })).toBeVisible();
      await expect(page.getByLabel('Risiko')).toBeVisible();
      await expect(page.getByLabel('Entity')).toBeVisible();
      await expect(page.getByLabel('Action')).toBeVisible();
      await page.getByRole('button', { name: 'Terapkan' }).click();

      await page.getByRole('button', { name: 'Detail audit' }).first().click();
      const auditDialog = page.getByRole('dialog');
      await expect(auditDialog.getByText('IP address')).toBeVisible();
      await expect(auditDialog.getByText('User agent')).toBeVisible();
      await expect(auditDialog.getByText('Data sebelum')).toBeVisible();
      await page.getByRole('button', { name: 'Tutup dialog' }).click();
    }

    await page.getByRole('button', { name: 'Laporan' }).click();
    await expect(page.getByRole('heading', { name: 'Laporan', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Export PDF' })).toBeVisible();

    const invalidReportResponse = await page.request.get('/reports/summary.json?startDate=2026-06-16&endDate=2026-06-01');
    expect(invalidReportResponse.status()).toBe(400);
    expect(await invalidReportResponse.json()).toMatchObject({ message: expect.stringContaining('Tanggal akhir') });

    await page.getByRole('button', { name: 'Filter' }).click();
    await page.getByLabel('Tanggal mulai').fill('2026-06-16');
    await page.getByLabel('Tanggal akhir').fill('2026-06-01');
    await page.getByRole('button', { name: 'Terapkan' }).click();
    await expect(page.getByRole('alert')).toContainText('Tanggal akhir tidak boleh lebih awal dari tanggal mulai.');
  });

  test('Admin should be able to create and generate a medical document', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email atau username').fill('admin');
    await page.locator('input[name="password"]').fill('admin123');
    await page.getByRole('button', { name: 'Masuk' }).click();
    await expect(page.getByRole('heading', { name: /Dashboard/ })).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: 'Pasien' }).click();
    await page.getByRole('button', { name: 'Kelola pasien' }).click();
    await page.getByRole('button', { name: 'Tambah pasien' }).click();

    const randomNik = Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString();
    const patientName = `Dokumen Patient ${Date.now()}`;
    const documentName = `Ringkasan Dokumen ${Date.now()}`;

    await page.getByLabel('Nama lengkap').fill(patientName);
    await page.getByLabel('NIK').fill(randomNik);
    await page.getByLabel('Tanggal lahir').fill('1988-04-12');
    await page.getByLabel('Jenis kelamin').selectOption('FEMALE');
    await page.getByLabel('Nomor telepon').fill('081234567899');
    await page.getByRole('button', { name: 'Simpan pasien' }).click();
    await expect(page.getByText('berhasil dibuat')).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Tutup dialog' }).click();

    await page.getByRole('button', { name: 'Dokumen Medis' }).click();
    await page.getByRole('button', { name: 'Kelola dokumen' }).click();

    const patientSelect = page.getByLabel('Pasien');
    const patientOptionValue = await patientSelect.locator('option', { hasText: patientName }).getAttribute('value');
    expect(patientOptionValue).toBeTruthy();
    await patientSelect.selectOption(patientOptionValue!);

    await page.getByLabel('Tipe dokumen').selectOption('SUPPORTING_DOCUMENT');
    await page.getByLabel('Nama dokumen').fill(documentName);
    await page.getByLabel('Catatan referensi').fill('Arsip fisik tersimpan di ruang rekam medis.');
    await page.getByRole('button', { name: 'Simpan dokumen' }).click();

    await expect(page.getByText('Metadata dokumen')).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Tutup dialog' }).click();

    const generatedPagePromise = page.waitForEvent('popup');
    await page.getByRole('link', { name: /Buka/ }).first().click();
    const generatedPage = await generatedPagePromise;
    await expect(generatedPage.getByText('Data Pasien')).toBeVisible({ timeout: 15000 });
    await expect(generatedPage.getByText('MedNote').first()).toBeVisible();
  });
});
