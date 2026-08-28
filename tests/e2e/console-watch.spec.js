/**
 * Proves the console watch is still examining, rather than merely still green.
 *
 * Every other spec in this directory calls `watchConsole(test)` and passes when
 * the browser says nothing. That is indistinguishable from a browser that has
 * been quietly prevented from speaking — and there is a real, one-line way to
 * cause exactly that:
 *
 *   Chrome builds the accessibility tree lazily and skips it in a default
 *   headless launch. Without `--force-renderer-accessibility`, accessibility
 *   warnings are never emitted at all. Not filtered out — never produced.
 *
 * Drop that flag from playwright.config.js and every console assertion in this
 * suite keeps passing while seeing nothing. This spec is what makes that loud:
 * it drives a page into a state Chrome must complain about, and fails if the
 * complaint does not arrive.
 *
 * It deliberately does NOT use watchConsole. The warning here is the expected
 * result, so the file owns its own listener and asserts on presence.
 */
import { test, expect } from '@playwright/test';

const FIXTURE = '/tests/e2e/fixtures/a11y-probe.html';

/**
 * Chrome's wording. Matched loosely on the distinctive opening, because the
 * sentence after it has changed between Chrome versions and the point of this
 * test is the category, not the phrasing.
 */
const EXPECTED = 'Blocked aria-hidden on an element';

test('the browser still reports accessibility violations to the console', async ({ page }) => {
  const warnings = [];
  page.on('console', (msg) => {
    if (msg.type() === 'warning') warnings.push(msg.text());
  });

  await page.goto(FIXTURE, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('body[data-ready="true"]');

  // The tree is built off the main thread, so the warning can land a beat after
  // the attribute does.
  await expect
    .poll(() => warnings.some((text) => text.includes(EXPECTED)), {
      message:
        'Chrome produced no aria-hidden warning for a page that must provoke one. ' +
        'The accessibility tree is off, which means every console assertion in ' +
        'this suite is passing without examining anything. Check that ' +
        "launchOptions.args still carries '--force-renderer-accessibility'.",
      timeout: 5000,
    })
    .toBe(true);
});

test('console warnings reach a listener at all', async ({ page }) => {
  // The companion check. If this fails too, the problem is the listener or the
  // page, not the accessibility tree — which tells the reader where to look.
  const warnings = [];
  page.on('console', (msg) => {
    if (msg.type() === 'warning') warnings.push(msg.text());
  });

  await page.goto(FIXTURE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => console.warn('console-watch self-test'));

  await expect
    .poll(() => warnings.some((text) => text.includes('console-watch self-test')))
    .toBe(true);
});
