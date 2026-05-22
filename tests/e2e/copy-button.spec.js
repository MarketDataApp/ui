import { test, expect } from '@playwright/test';

const PAGE_URL = 'https://dev.marketdata.app/ui/docs/#copy-input';

test.describe('copy-button', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ context, page }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(PAGE_URL);
    await page.locator('#copy-input').scrollIntoViewIfNeeded();
  });

  test('clicking the button copies the input value and shows success state', async ({ page }) => {
    const group = page.locator('#copy-input [data-copy-input-group]').first();
    const input = group.locator('[data-copy-input]');
    const button = group.locator('[data-copy-button]');
    const defaultEl = group.locator('[data-copy-default]');
    const successEl = group.locator('[data-copy-success]');

    // Initial state
    await expect(defaultEl).toBeVisible();
    await expect(successEl).toBeHidden();

    const expected = await input.inputValue();
    await button.click();

    // Success state
    await expect(defaultEl).toBeHidden();
    await expect(successEl).toBeVisible();

    // Clipboard contains the input value
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toBe(expected);

    // Reset after ~2s
    await expect(defaultEl).toBeVisible({ timeout: 3000 });
    await expect(successEl).toBeHidden();
  });

  test('data-copy-value override copies the override, not the input value', async ({ page }) => {
    const group = page.locator('#copy-input [data-copy-input-group]').nth(2);
    const input = group.locator('[data-copy-input]');
    const button = group.locator('[data-copy-button]');

    const visible = await input.inputValue();
    const override = await button.getAttribute('data-copy-value');
    expect(override).not.toBe(visible);

    await button.click();
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toBe(override);
  });
});
