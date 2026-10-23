/**
 * The theme toggle's background across hover, focus, press and tap.
 *
 * The toggle restates its resting colours on `:active` and `:focus` to hold
 * off host framework button rules (aMember). Those resets used to come AFTER
 * the hover rule, at the same specificity, so they won whenever both matched.
 * A mouse click leaves the button focused in Chrome, Edge and Firefox, so after
 * one click the hover background stopped painting until the user clicked
 * somewhere else. Reported from www.marketdata.app and the feedback board.
 *
 * So these are three claims, each with the state that would break it:
 *
 *   1. Focus does not change what hover paints. Measured against the same
 *      hover with nothing focused, in the same theme.
 *   2. A tap on a touch screen leaves no hover background behind.
 *   3. Inside aMember's content area the toggle paints what it paints outside
 *      it, in every state — the resets still hold.
 *
 * The keyboard ring is focus-ring.spec.js's claim and is not repeated here.
 *
 * Hermetic: the fixture loads only dist/, and needs no session.
 */
import { test, expect } from '@playwright/test';
import { watchConsole } from './helpers/console.js';
import { readStyles, differs } from './helpers/color.js';

watchConsole(test);

const FIXTURE = '/tests/e2e/fixtures/theme-toggle-states.html';
const PLAIN = '#plain .theme-toggle-button';
const HOST = '#host .theme-toggle-button';

/** A point inside the fixture's body padding: empty page, no control. */
const BLANK = { x: 8, y: 8 };

/**
 * Load the fixture already in one theme, with the pointer on empty page.
 *
 * The pointer is placed explicitly so no test inherits a hover from wherever
 * the previous one left it.
 */
async function open(page, theme) {
  await page.goto(`${FIXTURE}?theme=${theme}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('body[data-ready="true"]');
  await page.mouse.move(BLANK.x, BLANK.y);
}

/** Two readStyles() backgrounds agree. `null` is transparent. */
function sameBackground(a, b) {
  if (a === null || b === null) return a === b;
  return !differs(a, b);
}

/**
 * Read a toggle once its colours have stopped moving.
 *
 * The kit transitions the background over 0.15s. Reading the first frame after
 * a hover would sample the fade, which is how a contrast defect once shipped
 * under a green badge test. So this polls every 200ms — longer than the whole
 * transition — and returns only when two reads in a row agree. Two reads that
 * far apart cannot both land inside one fade.
 */
async function settled(page, selector) {
  let previous = null;
  let result = null;
  await expect
    .poll(
      async () => {
        const now = await readStyles(page, selector);
        const still =
          previous !== null &&
          sameBackground(now.background, previous.background) &&
          !differs(now.color, previous.color);
        previous = now;
        if (still) result = now;
        return still;
      },
      { intervals: [200], timeout: 5_000 },
    )
    .toBe(true);
  return result;
}

/**
 * Put one element in `:hover` through the DevTools protocol, whatever the
 * pointer is doing. The forced state lasts as long as the returned session,
 * so the caller holds it until the reads are done.
 */
async function forceHover(page, selector) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');
  const { root } = await cdp.send('DOM.getDocument');
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
  await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['hover'] });
  return cdp;
}

for (const theme of ['light', 'dark']) {
  test.describe(`${theme} mode`, () => {
    test.beforeEach(async ({ page }) => {
      await open(page, theme);
    });

    // The reported defect. A click toggles the theme, so the hover after it is
    // measured in the other theme — and the control is measured there too,
    // after a click on empty page has taken focus away. The two runs of this
    // test between them measure the hover in both themes.
    test('a hover after a mouse click paints the same as a hover with nothing focused', async ({
      page,
    }) => {
      const toggle = page.locator(PLAIN);
      await toggle.click();
      // The precondition of the defect. Safari on macOS does not focus a
      // button on click; Chrome does, and so the defect showed there.
      await expect(toggle).toBeFocused();

      await page.mouse.move(BLANK.x, BLANK.y);
      expect((await settled(page, PLAIN)).background).toBeNull();

      await toggle.hover();
      const focusedHover = await settled(page, PLAIN);
      await expect(toggle).toBeFocused();

      await page.mouse.click(BLANK.x, BLANK.y);
      await expect(toggle).not.toBeFocused();
      await toggle.hover();
      const control = await settled(page, PLAIN);

      expect(control.background).not.toBeNull();
      expect(focusedHover.background).toEqual(control.background);
    });

    // Same specificity, same cause: the `:active` reset used to paint over the
    // hover for the length of every press, so the background flashed off under
    // the pointer. Flowbite's own toggle declares no active state at all.
    test('a press keeps the hover background', async ({ page }) => {
      const toggle = page.locator(PLAIN);
      await toggle.hover();
      const hover = await settled(page, PLAIN);

      await page.mouse.down();
      const pressed = await settled(page, PLAIN);

      expect(hover.background).not.toBeNull();
      expect(pressed.background).toEqual(hover.background);
    });
  });
}

test.describe('touch', () => {
  // hasTouch alone makes Chromium report `(hover: none)`, which is what a
  // phone reports. The kit's hover rule is gated on `(hover: hover)`.
  test.use({ hasTouch: true });

  for (const theme of ['light', 'dark']) {
    test(`a tap in ${theme} mode leaves no hover background behind`, async ({ page }) => {
      await open(page, theme);
      // Without this, a context that still reports a hover-capable pointer
      // would make the assertion below pass for the wrong reason.
      expect(await page.evaluate(() => matchMedia('(hover: none)').matches)).toBe(true);

      const toggle = page.locator(PLAIN);
      await toggle.tap();
      await expect(toggle).toBeFocused();

      // A phone leaves the tapped element in `:hover` until the next tap lands
      // somewhere else. Chromium's touch emulation does not — measured, the
      // button reads `:hover` false after a tap and during a held touch — so
      // the test puts it there, the way the DevTools `:hov` panel does. That
      // is focus plus hover, the very state a mouse click leaves, so only the
      // `(hover: hover)` gate can be what holds the background off.
      const cdp = await forceHover(page, PLAIN);
      expect(await toggle.evaluate((el) => el.matches(':hover'))).toBe(true);

      expect((await settled(page, PLAIN)).background).toBeNull();
      await cdp.detach();
    });
  }
});

/**
 * Each state as a way in and a way out, so both toggles can be measured on one
 * page in one theme. `leave` never releases the mouse over a toggle: a release
 * there is a click, and a click would change the theme between the two reads.
 */
const STATES = {
  rest: {
    enter: async () => {},
    leave: async () => {},
  },
  hover: {
    enter: (toggle) => toggle.hover(),
    leave: (page) => page.mouse.move(BLANK.x, BLANK.y),
  },
  // `focus()` gives `:focus` without `:focus-visible` for a button in Chrome,
  // which is the state a mouse click leaves, without the click's theme change.
  focus: {
    enter: (toggle) => toggle.focus(),
    leave: async () => {},
  },
  'focus and hover': {
    enter: async (toggle) => {
      await toggle.focus();
      await toggle.hover();
    },
    leave: (page) => page.mouse.move(BLANK.x, BLANK.y),
  },
  press: {
    enter: async (toggle, page) => {
      await toggle.hover();
      await page.mouse.down();
    },
    leave: async (page) => {
      await page.mouse.move(BLANK.x, BLANK.y);
      await page.mouse.up();
    },
  },
};

for (const theme of ['light', 'dark']) {
  test.describe(`inside aMember's content area, ${theme} mode`, () => {
    test.beforeEach(async ({ page }) => {
      await open(page, theme);
    });

    // The fixture paints every hovered, pressed or focused button there
    // #4e80a6 with white text, as aMember does. The toggle must paint exactly
    // what the same toggle paints outside it.
    for (const [name, { enter, leave }] of Object.entries(STATES)) {
      test(`${name}: the toggle paints what it paints outside it`, async ({ page }) => {
        await enter(page.locator(PLAIN), page);
        const plain = await settled(page, PLAIN);
        await leave(page);

        await enter(page.locator(HOST), page);
        const host = await settled(page, HOST);

        expect(host.background).toEqual(plain.background);
        expect(host.color).toEqual(plain.color);
      });
    }
  });
}
