import { test, expect } from '@playwright/test';

const PAGE = '/docs/index.html';

/**
 * Clear the theme cookie and localStorage so the page starts in pure
 * system-following mode. Clears both domain-scoped and plain cookies.
 */
async function resetThemeState(page) {
  await page.evaluate(() => {
    document.cookie = 'theme=; path=/; max-age=0';
    document.cookie = 'theme=; domain=.marketdata.app; path=/; max-age=0';
    localStorage.removeItem('ui-demo-theme');
    localStorage.removeItem('theme');
  });
}

/** Wait for <html> to have (or not have) the 'dark' class. */
async function waitForDark(page, expected) {
  await page.waitForFunction(
    (dark) => document.documentElement.classList.contains('dark') === dark,
    expected,
    { timeout: 5000 },
  );
}

/**
 * Change the emulated OS scheme and wait until the page has PROCESSED the
 * resulting prefers-color-scheme change event.
 *
 * Needed because emulateMedia() resolves when the override is sent, not when
 * the page has reacted to it. Two calls in a row can therefore collapse: the
 * renderer goes straight to the newest value and never dispatches an event for
 * the one in between. The toggle only ever applies a theme from that event, so
 * a swallowed event means the theme is never applied.
 *
 * Normally waitForDark() covers this, because a followed OS change moves the
 * DOM. It does not cover a change that leaves the DOM where it already was —
 * there it resolves on the old state and blocks nothing. This helper is the
 * barrier for that case: it waits on the event rather than on the DOM.
 *
 * Listeners run in registration order and the toggle registers on page load,
 * so by the time the listener below fires, the toggle's has already run.
 *
 * Only for a scheme that differs from the current one. A call that matches the
 * current scheme dispatches no event and would wait until it times out.
 */
async function emulateScheme(page, scheme) {
  await page.evaluate(() => {
    if (window.__schemeSeen) return;
    window.__schemeSeen = [];
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => window.__schemeSeen.push(e.matches));
  });
  const seen = await page.evaluate(() => window.__schemeSeen.length);

  await page.emulateMedia({ colorScheme: scheme });
  await page.waitForFunction((n) => window.__schemeSeen.length > n, seen, { timeout: 5000 });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('theme toggle', () => {
  test('clicking toggle switches between light and dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(PAGE);
    await resetThemeState(page);
    await page.reload();

    await waitForDark(page, false);

    const button = page.locator('#theme-toggle button');
    await button.click();
    await waitForDark(page, true);

    await button.click();
    await waitForDark(page, false);
  });

  // Note: cookie persistence can't be tested on localhost because
  // setThemeCookie uses domain=.marketdata.app which the browser rejects.
  // Cookie read/write is covered by unit tests in theme.test.js.
});

test.describe('system mode tracking', () => {
  test('follows OS theme change when no cookie is set', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(PAGE);
    await resetThemeState(page);
    await page.reload();

    await waitForDark(page, false);

    // Simulate OS switching to dark
    await page.emulateMedia({ colorScheme: 'dark' });
    await waitForDark(page, true);

    // Simulate OS switching back to light
    await page.emulateMedia({ colorScheme: 'light' });
    await waitForDark(page, false);
  });

  test('ignores OS theme change when user has explicit preference', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(PAGE);
    await resetThemeState(page);
    await page.reload();

    // User explicitly sets dark via toggle
    const button = page.locator('#theme-toggle button');
    await button.click();
    await waitForDark(page, true);

    // OS switches to light — should be ignored since user chose dark
    await page.emulateMedia({ colorScheme: 'light' });
    // Give the listener a chance to fire (it shouldn't change anything)
    await page.waitForTimeout(200);
    const dark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(dark).toBe(true);
  });

  test('starts in dark when OS prefers dark and no cookie', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(PAGE);
    await resetThemeState(page);
    await page.reload();

    await waitForDark(page, true);
  });
});

test.describe('resetToSystem', () => {
  test('after clearing preference, OS changes are followed again', async ({ page }) => {
    // Start with dark OS preference
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(PAGE);
    await resetThemeState(page);
    await page.reload();
    await waitForDark(page, true);

    // User explicitly sets light via toggle
    const button = page.locator('#theme-toggle button');
    await button.click();
    await waitForDark(page, false);

    // OS changes to dark — should be ignored (user chose light)
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(
      false,
    );

    // Clear the cookie to re-enter system mode
    await page.evaluate(() => {
      document.cookie = 'theme=; path=/; max-age=0';
      document.cookie = 'theme=; domain=.marketdata.app; path=/; max-age=0';
    });

    // OS changes to light — should now be followed. The page is already light,
    // so this one leaves the DOM alone and waitForDark() below cannot block on
    // it. emulateScheme() waits for the event instead, which stops this change
    // from being swallowed by the next one.
    await emulateScheme(page, 'light');
    await waitForDark(page, false);

    // OS changes to dark — should also be followed. This one moves the DOM, so
    // waitForDark() is a real barrier and needs no help.
    await page.emulateMedia({ colorScheme: 'dark' });
    await waitForDark(page, true);
  });
});
