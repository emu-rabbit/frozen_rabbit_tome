import { expect, test } from '@playwright/test';
import { readdirSync } from 'node:fs';

test('serves base-aware assets, hash routes and WASM on the deployed path', async ({ page, request, baseURL }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem('frozen-rabbit-tome-initialized', 'true');
    localStorage.setItem('frozen-rabbit-tome-migration-dismissed', 'true');
  });
  await page.goto('./#/settings');
  await expect(page.locator('#migration-heading')).toBeVisible();
  await page.reload();
  await expect(page.locator('#migration-heading')).toBeVisible();
  for (const img of await page.locator('img:visible').all()) {
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
  }
  for (const asset of readdirSync('dist/assets').filter(name => name.endsWith('.wasm') || name.includes('.worker-'))) {
    const response = await request.get(new URL(`assets/${asset}`, baseURL).href);
    expect(response.ok()).toBe(true);
    if (asset.endsWith('.wasm')) expect(WebAssembly.validate(await response.body())).toBe(true);
    else expect(response.headers()['content-type']).toContain('javascript');
  }
  expect(errors).toEqual([]);
});
