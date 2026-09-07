import { expect, test } from '@playwright/test';

const prefix = 'frozen-rabbit-tome-';
const file = {
  name: 'tome.json', mimeType: 'application/json',
  buffer: Buffer.from(JSON.stringify({ format: 'frozen-rabbit-tome-backup', version: 1, data: {
    [prefix + 'favorite-items']: JSON.stringify([{ itemId: 123, createdAt: '2026-09-07T00:00:00.000Z' }]),
    [prefix + 'lang']: 'en'
  } }))
};

test('reminder precedes onboarding and only checked dismissal persists', async ({ page }) => {
  await page.goto('./');
  const dialog = page.getByRole('dialog', { name: '我們搬家了' });
  await expect(dialog).toContainText('我們搬家了');
  await expect(dialog.getByRole('link')).toHaveAttribute('href', 'https://emu-rabbit.github.io/gleaner/');
  await dialog.getByRole('button', { name: '稍後再說' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('Traditional Chinese', { exact: true })).toBeVisible();
  await page.reload();
  await expect(dialog).toContainText('我們搬家了');
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: '稍後再說' }).click();
  await page.reload();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('Traditional Chinese', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('frozen-rabbit-tome-migration-dismissed'))).toBe('true');
});

test('imports, reloads and allows repeat import from settings', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  const dialog = page.getByRole('dialog', { name: '我們搬家了' });
  await dialog.locator('input[type=file]').setInputFiles(file);
  await expect(dialog.getByRole('status')).toContainText('收藏 1 筆');
  await dialog.getByRole('combobox').selectOption('backup');
  await dialog.getByRole('button', { name: '匯入並重新載入' }).click();
  await expect(dialog).toBeHidden();
  await page.goto('./#/settings');
  await page.locator('input[type=file]').setInputFiles(file);
  await expect(page.getByRole('status').filter({ hasText: 'favorites' })).toContainText('1 favorites');
  await page.getByRole('button', { name: 'Import and reload' }).click();
  await expect(page.getByRole('heading', { name: 'Import data from the old site' })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('frozen-rabbit-tome-favorite-items')!))).toHaveLength(1);
  expect(errors).toEqual([]);
});

for (const lang of ['tw', 'cn', 'en', 'ja']) {
  for (const dark of [false, true]) {
    test(`fits and displays errors in ${lang}, dark=${dark}`, async ({ page }, testInfo) => {
      await page.addInitScript(({ lang, dark }) => {
        localStorage.setItem('frozen-rabbit-tome-lang', lang);
        localStorage.setItem('frozen-rabbit-tome-dark-mode', String(dark));
      }, { lang, dark });
      await page.goto('./');
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect.poll(() => dialog.locator('img').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
      await dialog.locator('input[type=file]').setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{}') });
      await expect(dialog.getByRole('alert')).toBeVisible();
      const box = await dialog.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
      expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath('migration.png') });
      await dialog.locator('input[type=file]').setInputFiles(file);
      await expect(dialog.getByRole('status')).toBeVisible();
      expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath('preview.png') });
    });
  }
}
