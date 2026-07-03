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
    await expect(page.getByRole('heading', { name: 'Filter laporan' })).toBeVisible();
    await expect(page.getByText('Tanggal mulai', { exact: true })).toBeVisible();
    await expect(page.getByText('Tanggal akhir', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Tutup dialog' }).click();
  });

  test('Master should be able to access medical documents', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email atau username').fill('master');
    await page.locator('input[name="password"]').fill('master123');
    await page.getByRole('button', { name: 'Masuk' }).click();
    await expect(page.getByRole('heading', { name: /Dashboard/ })).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: 'Dokumen Medis' }).click();
    await expect(page.getByRole('heading', { name: 'Dokumen Medis', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Rangkuman & Verifikasi Dokumen Medis' })).toBeVisible();
  });
});


test.describe('Admin Access Scope', () => {
  test('Admin should only see registration menus', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email atau username').fill('admin');
    await page.locator('input[name="password"]').fill('admin123');
    await page.getByRole('button', { name: 'Masuk' }).click();
    await expect(page.getByRole('heading', { name: /Dashboard/ })).toBeVisible({ timeout: 15000 });

    await expect(page.getByRole('button', { name: 'Pasien' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Kunjungan' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Audit Log' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Laporan' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Manajemen User' })).toHaveCount(0);
  });
});
