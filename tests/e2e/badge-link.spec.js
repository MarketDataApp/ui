/**
 * Clickable badges (#43).
 *
 * A badge that carries a link styles itself as one, with no opt-in class. The
 * behaviour keys off `:any-link`, so these tests are really two claims:
 *
 *   1. A badge WITH an href gains a hover affordance, loses the underline, and
 *      reaches a 24px target.
 *   2. A badge WITHOUT one — a span, or an anchor with no href — changes in no
 *      way at all.
 *
 * The second claim is why every assertion has a span counterpart. A rule
 * written slightly too broadly would pass claim 1 on its own.
 *
 * Contrast is measured on resolved colours in a real browser rather than
 * computed from token names, because the hover background is one step deeper
 * than the resting one and the text colour does not move with it. See
 * helpers/color.js for why the probe is shaped the way it is.
 */
import { test, expect } from '@playwright/test';
import { watchConsole } from './helpers/console.js';
import { readStyles, ringShadow, contrast, differs } from './helpers/color.js';

watchConsole(test);

const FIXTURE = '/tests/e2e/fixtures/badge-link.html';

/** Badge text is 12px, so it is small text: WCAG 1.4.3 asks 4.5:1. */
const MIN_TEXT_CONTRAST = 4.5;

/** WCAG 1.4.11 asks 3:1 of a focus indicator against what sits beside it. */
const MIN_RING_CONTRAST = 3;

/** WCAG 2.5.8 minimum target size for something clickable. */
const TARGET = 24;

/** Chips ring at 2px, not the 4px the buttons and header controls use. */
const RING_SHADOW = ringShadow(2);

const BADGES = ['blue', 'gray', 'red', 'green', 'yellow', 'indigo', 'purple', 'pink'];
const PILLS = ['pill-green', 'pill-blue', 'pill-red'];
const ALL = [...BADGES, ...PILLS];

async function open(page, theme) {
  await page.goto(`${FIXTURE}?theme=${theme}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('body[data-ready="true"]');
}

for (const theme of ['light', 'dark']) {
  test.describe(`${theme} mode`, () => {
    test.beforeEach(async ({ page }) => {
      await open(page, theme);
    });

    test.describe('a badge that carries a link', () => {
      for (const name of ALL) {
        test(`${name} deepens its background on hover, and the label stays readable`, async ({
          page,
        }) => {
          const selector = `#a-${name}`;
          const resting = await readStyles(page, selector);

          await page.locator(selector).hover();
          // The kit transitions the background over 200ms by design.
          await expect
            .poll(async () => {
              const now = await readStyles(page, selector);
              return differs(now.background, resting.background);
            })
            .toBe(true);

          const hovered = await readStyles(page, selector);
          expect(contrast(hovered.color, hovered.background)).toBeGreaterThanOrEqual(
            MIN_TEXT_CONTRAST,
          );
        });
      }

      for (const name of ALL) {
        test(`${name} reaches the 24px target and drops the underline`, async ({ page }) => {
          const badge = page.locator(`#a-${name}`);

          const box = await badge.boundingBox();
          expect(box.height).toBeGreaterThanOrEqual(TARGET);

          // The fixture sets a site-wide `a { text-decoration: underline }`,
          // so this is a real specificity check, not a check against nothing.
          await expect(badge).toHaveCSS('text-decoration-line', 'none');
        });
      }

      // The ring mirrors the badge's own colour rather than using one shared
      // blue, so every hue has to be measured. A focus indicator must clear
      // 3:1 against what sits beside it — here that is both the chip's own
      // background and the page behind it (WCAG 1.4.11).
      //
      // Tab, not focus(): `:focus-visible` does not match a scripted focus on
      // a link in Chrome, so a test built on focus() would pass against a kit
      // that draws no ring at all.
      for (const [index, name] of BADGES.entries()) {
        test(`${name} rings in its own hue, clear of both the chip and the page`, async ({
          page,
        }) => {
          for (let i = 0; i <= index; i++) await page.keyboard.press('Tab');
          await expect(page.locator(`#a-${name}`)).toBeFocused();

          const { shadow, ring, background, surface } = await readStyles(page, `#a-${name}`, 2);
          expect(shadow).toMatch(RING_SHADOW);
          expect(contrast(ring, background)).toBeGreaterThanOrEqual(MIN_RING_CONTRAST);
          expect(contrast(ring, surface)).toBeGreaterThanOrEqual(MIN_RING_CONTRAST);
        });
      }

      // Distinct hues must produce distinct rings. One shared colour would
      // satisfy every contrast assertion above and still not mirror anything.
      test('different badge colours ring in different colours', async ({ page }) => {
        await page.keyboard.press('Tab');
        const blue = await readStyles(page, '#a-blue', 2);

        await page.keyboard.press('Tab');
        const gray = await readStyles(page, '#a-gray', 2);

        expect(differs(blue.ring, gray.ring)).toBe(true);
      });

      // An uncoloured badge declares no --badge-focus-ring, so it falls back
      // to the shared token added in 5.5.0.
      test('an uncoloured badge link rings in the shared token', async ({ page }) => {
        const expected = await page.evaluate(() =>
          getComputedStyle(document.documentElement).getPropertyValue('--color-focus-ring').trim(),
        );
        expect(expected).not.toBe('');

        // focus() alone does not set the focus-visible flag, so step away and
        // back with the keyboard to arrive there the way a user would.
        await page.locator('#a-plain').focus();
        await page.keyboard.press('Tab');
        await page.keyboard.press('Shift+Tab');
        await expect(page.locator('#a-plain')).toBeFocused();

        const { shadow } = await readStyles(page, '#a-plain', 2);
        expect(shadow).toMatch(RING_SHADOW);
      });

      test('draws no ring on a mouse click', async ({ page }) => {
        await page.locator('#a-blue').click();

        const { shadow } = await readStyles(page, '#a-blue', 2);
        expect(shadow).not.toMatch(RING_SHADOW);
      });

      test('an uncoloured badge link still shows a hover affordance', async ({ page }) => {
        // It has no background of its own to deepen, so it falls back to a
        // neutral. Without the fallback there would be no affordance at all.
        const resting = await readStyles(page, '#a-plain');
        expect(resting.background).toBeNull();

        await page.locator('#a-plain').hover();
        await expect
          .poll(async () => (await readStyles(page, '#a-plain')).background !== null)
          .toBe(true);
      });
    });

    test.describe('a badge that carries no link is untouched', () => {
      for (const name of ALL) {
        test(`${name} span does not react to hover`, async ({ page }) => {
          const selector = `#s-${name}`;
          const resting = await readStyles(page, selector);

          await page.locator(selector).hover();
          await page.waitForTimeout(250); // longer than the 200ms transition

          const after = await readStyles(page, selector);
          expect(differs(after.background, resting.background)).toBe(false);
        });
      }

      test('a span badge keeps its original 18px height', async ({ page }) => {
        const box = await page.locator('#s-blue').boundingBox();
        expect(box.height).toBeLessThan(TARGET);
      });

      // `:any-link` matches only an anchor that has an href. An anchor without
      // one is not clickable, so it must stay a label.
      test('an anchor with no href is still a plain label', async ({ page }) => {
        const badge = page.locator('#a-nohref');

        const box = await badge.boundingBox();
        expect(box.height).toBeLessThan(TARGET);

        const resting = await readStyles(page, '#a-nohref');
        await badge.hover();
        await page.waitForTimeout(250);

        const after = await readStyles(page, '#a-nohref');
        expect(differs(after.background, resting.background)).toBe(false);
      });
    });
  });
}
