/**
 * Keyboard focus indicators for the header controls and the CTA buttons (#41).
 *
 * The unit tests in tests/unit/focus-ring-css.test.js assert that the built
 * CSS carries the right rules. These assert that a browser actually paints
 * them, which is a different claim: `:focus-visible` only matches when the
 * browser judges the focus to be keyboard-driven, and the contrast the issue
 * measured is a property of the resolved colours, not of the source tokens.
 *
 * Method, copied from the issue: real `Tab` presses. `el.focus()` does NOT
 * match `:focus-visible` for links and buttons in Chrome, so a test built on
 * it would pass against the broken CSS.
 *
 * The colour probing lives in helpers/color.js, shared with badge-link.spec.js.
 *
 * Hermetic by design — the fixture stubs fetch, so these need no session and
 * no deployed site.
 */
import { test, expect } from '@playwright/test';
import { watchConsole } from './helpers/console.js';
import { readStyles, ringShadow, contrast } from './helpers/color.js';

watchConsole(test);

const FIXTURE = '/tests/e2e/fixtures/focus-ring.html';

/** WCAG 1.4.11 asks 3:1 of a focus indicator against what sits next to it. */
const MIN_CONTRAST = 3;

/** The header controls and the buttons all ring at 4px. */
const RING_SHADOW = ringShadow(4);

/**
 * Load the fixture already in one theme.
 *
 * The theme rides in on the query string, and the fixture applies it in <head>
 * before the first paint. It cannot be switched on a live page: the kit
 * transitions `--btn-focus-color` over 0.5s, so a flip-then-read would sample
 * the animation instead of the result.
 */
async function open(page, theme) {
  await page.goto(`${FIXTURE}?theme=${theme}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('body[data-ready="true"]');
}

/**
 * Press Tab until `selector` holds focus.
 *
 * Sequential keyboard navigation is what sets the browser's focus-visible
 * flag, so the walk is the point — a test cannot shortcut to the control.
 */
async function tabTo(page, selector) {
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    if (await page.locator(selector).evaluate((el) => el === document.activeElement)) return;
  }
  throw new Error(`Tab never reached ${selector}`);
}

for (const theme of ['light', 'dark']) {
  test.describe(`${theme} mode`, () => {
    test.beforeEach(async ({ page }) => {
      await open(page, theme);
    });

    // The pill used to ring in its own background token: an exact colour
    // match in dark mode, 0.967 against 0.985 in light. Nothing was visible.
    test('login pill rings against its own background', async ({ page }) => {
      const pill = '.user-profile-login-pill';
      await tabTo(page, pill);

      const { ring, surface } = await readStyles(page, pill);
      expect(ring).not.toBeNull();
      expect(contrast(ring, surface)).toBeGreaterThanOrEqual(MIN_CONTRAST);
    });

    // The toggle used to draw nothing at all: it hid its outline on focus
    // with no ring declared beside it.
    test('theme toggle rings against the page behind it', async ({ page }) => {
      const toggle = '.theme-toggle-button';
      await tabTo(page, toggle);

      const { ring, surface } = await readStyles(page, toggle);
      expect(ring).not.toBeNull();
      expect(contrast(ring, surface)).toBeGreaterThanOrEqual(MIN_CONTRAST);
    });

    // The button colours are deliberately untouched by #41, so this asserts
    // only that the ring still paints on a keyboard focus.
    test('gradient CTA still rings on keyboard focus', async ({ page }) => {
      await tabTo(page, '#cta');

      const { shadow } = await readStyles(page, '#cta');
      expect(shadow).toMatch(RING_SHADOW);
    });
  });
}

test.describe('mouse clicks leave no ring', () => {
  test.beforeEach(async ({ page }) => {
    await open(page, 'light');
  });

  // The whole point of moving from `:focus` to `:focus-visible`. A clicked
  // control used to keep its ring until the user clicked something else.
  for (const [name, selector] of [
    ['login pill', '.user-profile-login-pill'],
    ['theme toggle', '.theme-toggle-button'],
    ['gradient CTA', '#cta'],
  ]) {
    test(`${name} draws no ring when clicked`, async ({ page }) => {
      await page.locator(selector).click();

      // The control still holds focus — this is about the indicator, not
      // about focus moving elsewhere.
      await expect(page.locator(selector)).toBeFocused();

      const { shadow } = await readStyles(page, selector);
      expect(shadow).not.toMatch(RING_SHADOW);
    });
  }
});
