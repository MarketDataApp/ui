import { test, expect } from '@playwright/test';

const PAGE_URL = 'https://dev.marketdata.app/ui/docs/navbar-overflow.html';

// Wide width where nothing should overflow
const WIDE = 900;
// Narrow width to trigger overflow in each demo
const NARROW = 300;
// Reflow debounce (50ms) + rAF (~16ms) + margin
const REFLOW_WAIT = 300;

test.describe('navbar-overflow detection methods', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    await page.goto(PAGE_URL);
    // Wait for JS to init and first reflow to settle
    await page.waitForTimeout(REFLOW_WAIT);
  });

  test('Check 1: compression detection hides items at narrow width', async ({ page }) => {
    const navbar = page.getByTestId('navbar-compression');
    const status = page.getByTestId('status-compression');

    // At wide width, nothing should be hidden
    await expect(status.locator('.hidden-list')).toHaveText('none');

    // Resize the navbar to a narrow width via inline style
    await navbar.evaluate((el, w) => {
      el.style.width = w + 'px';
    }, NARROW);
    await page.waitForTimeout(REFLOW_WAIT);

    // At least one item should be hidden
    await expect(status.locator('.hidden-list')).not.toHaveText('none');

    // The lowest-priority item (.signup-btn) should be hidden first
    const signupHidden = await navbar.locator('.signup-btn').getAttribute('data-navbar-hidden');
    expect(signupHidden).toBe('');

    // Restore wide width — items should come back
    await navbar.evaluate((el, w) => {
      el.style.width = w + 'px';
    }, WIDE);
    await page.waitForTimeout(REFLOW_WAIT);
    await expect(status.locator('.hidden-list')).toHaveText('none');
  });

  test('Check 2: cross-group overlap detection hides items at narrow width', async ({ page }) => {
    const navbar = page.getByTestId('navbar-overlap');
    const status = page.getByTestId('status-overlap');

    await expect(status.locator('.hidden-list')).toHaveText('none');

    await navbar.evaluate((el, w) => {
      el.style.width = w + 'px';
    }, NARROW);
    await page.waitForTimeout(REFLOW_WAIT);

    await expect(status.locator('.hidden-list')).not.toHaveText('none');

    const signupHidden = await navbar.locator('.signup-btn').getAttribute('data-navbar-hidden');
    expect(signupHidden).toBe('');

    // Restore
    await navbar.evaluate((el, w) => {
      el.style.width = w + 'px';
    }, WIDE);
    await page.waitForTimeout(REFLOW_WAIT);
    await expect(status.locator('.hidden-list')).toHaveText('none');
  });

  test('Check 3: scrollWidth fallback hides items at narrow width', async ({ page }) => {
    const navbar = page.getByTestId('navbar-scrollwidth');
    const status = page.getByTestId('status-scrollwidth');

    await expect(status.locator('.hidden-list')).toHaveText('none');

    await navbar.evaluate((el, w) => {
      el.style.width = w + 'px';
    }, NARROW);
    await page.waitForTimeout(REFLOW_WAIT);

    await expect(status.locator('.hidden-list')).not.toHaveText('none');

    const signupHidden = await navbar.locator('.signup-btn').getAttribute('data-navbar-hidden');
    expect(signupHidden).toBe('');

    // Restore
    await navbar.evaluate((el, w) => {
      el.style.width = w + 'px';
    }, WIDE);
    await page.waitForTimeout(REFLOW_WAIT);
    await expect(status.locator('.hidden-list')).toHaveText('none');
  });

  test('items are hidden in priority order (lowest first)', async ({ page }) => {
    const navbar = page.getByTestId('navbar-compression');

    // Go very narrow so multiple items must hide
    await navbar.evaluate((el) => {
      el.style.width = '200px';
    });
    await page.waitForTimeout(REFLOW_WAIT);

    // .signup-btn (priority 1) should be hidden
    const signupHidden = await navbar.locator('.signup-btn').getAttribute('data-navbar-hidden');
    expect(signupHidden).toBe('');

    // If .login-btn (priority 2) is also hidden, that's fine — but .search
    // (priority 3) should only be hidden if login is also hidden
    const loginHidden = await navbar.locator('.login-btn').getAttribute('data-navbar-hidden');
    const searchHidden = await navbar.locator('.search').getAttribute('data-navbar-hidden');

    if (searchHidden !== null) {
      // If search is hidden, login must also be hidden (lower priority goes first)
      expect(loginHidden).toBe('');
    }
  });
});
