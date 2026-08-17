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

/**
 * Give the page an explicit theme preference.
 *
 * Writes localStorage rather than clicking the toggle. The toggle persists
 * through setThemeCookie(), which scopes the cookie to domain=.marketdata.app,
 * and the browser drops that cookie on localhost — so a click leaves the page
 * in system mode here no matter what it does to the DOM. localStorage is the
 * other half of getUserThemePreference() and it does persist, so it is the one
 * store that can put these tests on the explicit-preference branch at all.
 *
 * Cookie-based persistence is covered by the unit tests in theme.test.js.
 */
async function setPreference(page, theme) {
  await page.evaluate((t) => localStorage.setItem('theme', t), theme);
}

/** Drop the explicit preference, returning the page to system mode. */
async function clearPreference(page) {
  await page.evaluate(() => {
    document.cookie = 'theme=; path=/; max-age=0';
    document.cookie = 'theme=; domain=.marketdata.app; path=/; max-age=0';
    localStorage.removeItem('theme');
  });
}

/** Read the applied theme off <html>. */
async function isDark(page) {
  return page.evaluate(() => document.documentElement.classList.contains('dark'));
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

  // The OS has to move to the value the preference DISAGREES with, or the two
  // rules predict the same DOM and the assertion cannot tell them apart. So
  // the page starts dark with a dark preference, and the OS goes light.
  test('ignores OS theme change when user has explicit preference', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(PAGE);
    await resetThemeState(page);
    await page.reload();
    await waitForDark(page, true);

    await setPreference(page, 'dark');

    // OS switches to light — must be ignored, because the user chose dark.
    // emulateScheme() returns once the page has handled the event, so there is
    // something to assert on without guessing at a delay.
    await emulateScheme(page, 'light');
    expect(await isDark(page)).toBe(true);
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
    // Start dark, from the OS, with the user's explicit choice agreeing.
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(PAGE);
    await resetThemeState(page);
    await page.reload();
    await waitForDark(page, true);

    await setPreference(page, 'dark');

    // OS changes to light — ignored, because the user chose dark. This is the
    // half that proves a preference is held; the OS and the preference
    // disagree here, so only one of them can be driving the DOM.
    await emulateScheme(page, 'light');
    expect(await isDark(page)).toBe(true);

    // Drop the preference to re-enter system mode.
    await clearPreference(page);

    // OS changes to dark — followed again. The page is already dark, so this
    // one leaves the DOM alone and waitForDark() below cannot block on it.
    // emulateScheme() waits for the event instead, which stops this change
    // from being swallowed by the next one.
    await emulateScheme(page, 'dark');
    await waitForDark(page, true);

    // OS changes to light — followed, and this one moves the DOM, so
    // waitForDark() is a real barrier and needs no help. It is also the
    // assertion that carries the test: the DOM only leaves dark if the page
    // went back to following the OS.
    await page.emulateMedia({ colorScheme: 'light' });
    await waitForDark(page, false);
  });
});
