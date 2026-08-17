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
 * Hermetic by design — the fixture stubs fetch, so these need no session and
 * no deployed site.
 */
import { test, expect } from '@playwright/test';

const FIXTURE = '/tests/e2e/fixtures/focus-ring.html';

/** WCAG 1.4.11 asks 3:1 of a focus indicator against what sits next to it. */
const MIN_CONTRAST = 3;

/**
 * The ring the kit draws: 4px, spread only, no blur and no offset.
 *
 * The colour is matched as any CSS colour function, not as `rgb()`. Chrome
 * serialises a computed box-shadow in the space the colour was authored in,
 * and the kit's tokens are `oklch()`, which comes back as `oklab()`.
 */
const RING_SHADOW = /[a-z]+\([^)]*\)\s+0px 0px 0px 4px/;

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

/**
 * Read the ring colour and the surface behind it, both as sRGB channels in 0-1.
 *
 * Chrome serialises a computed colour in the space it was authored in, so the
 * kit hands back `oklab()` for its tokens and `rgb()` for the brand hex.
 * Relative colour syntax pushes either one through a probe element and into
 * sRGB, which is the one space a contrast calculation can work in.
 */
async function readRing(page, selector) {
  return page.evaluate(
    ([sel, colorPattern]) => {
      const toSrgb = (value) => {
        const probe = document.createElement('span');
        probe.style.color = `rgb(from ${value} r g b)`;
        // An unsupported syntax is dropped silently, and the probe would then
        // report its inherited colour — making every comparison 1:1 and every
        // assertion pass or fail for the wrong reason.
        if (!probe.style.color) throw new Error(`relative colour syntax rejected: ${value}`);
        document.body.appendChild(probe);
        const out = getComputedStyle(probe).color;
        probe.remove();

        // Chrome answers `color(srgb r g b)` with 0-1 channels when the source
        // was authored wide-gamut, and `rgb(r, g, b)` with 0-255 channels when
        // it was already sRGB. The kit produces both.
        const scale = out.startsWith('color(') ? 1 : 255;
        return out
          .match(/[-\d.]+/g)
          .slice(0, 3)
          .map((v) => Math.min(1, Math.max(0, Number(v) / scale)));
      };

      const el = document.querySelector(sel);
      const shadow = getComputedStyle(el).boxShadow;
      const ring = shadow.match(new RegExp(`(${colorPattern})\\s+0px 0px 0px 4px`));

      let behind = getComputedStyle(el).backgroundColor;
      // A transparent control rings against whatever it sits on.
      if (behind === 'rgba(0, 0, 0, 0)') behind = getComputedStyle(document.body).backgroundColor;

      return { shadow, ring: ring && toSrgb(ring[1]), surface: toSrgb(behind) };
    },
    [selector, '[a-z]+\\([^)]*\\)'],
  );
}

/** WCAG relative luminance from sRGB channels in 0-1. */
function luminance([r, g, b]) {
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio between two sRGB channel triples. */
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
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

      const { ring, surface } = await readRing(page, pill);
      expect(ring).not.toBeNull();
      expect(contrast(ring, surface)).toBeGreaterThanOrEqual(MIN_CONTRAST);
    });

    // The toggle used to draw nothing at all: it hid its outline on focus
    // with no ring declared beside it.
    test('theme toggle rings against the page behind it', async ({ page }) => {
      const toggle = '.theme-toggle-button';
      await tabTo(page, toggle);

      const { ring, surface } = await readRing(page, toggle);
      expect(ring).not.toBeNull();
      expect(contrast(ring, surface)).toBeGreaterThanOrEqual(MIN_CONTRAST);
    });

    // The button colours are deliberately untouched by #41, so this asserts
    // only that the ring still paints on a keyboard focus.
    test('gradient CTA still rings on keyboard focus', async ({ page }) => {
      await tabTo(page, '#cta');

      const { shadow } = await readRing(page, '#cta');
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

      const { shadow } = await readRing(page, selector);
      expect(shadow).not.toMatch(RING_SHADOW);
    });
  }
});
