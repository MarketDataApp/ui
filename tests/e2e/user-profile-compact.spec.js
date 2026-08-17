/**
 * Layout tests for the user-profile login pill in a cramped navbar (#38).
 *
 * The pill used to wrap to two lines whenever the navbar flex row ran short of
 * space, which doubled the header height. The fixture reproduces that row: it
 * is 240px wide and holds far more than 240px of content, so the browser has
 * to take the width from somewhere.
 *
 * Hermetic by design — the fixture stubs fetch, so these need no session and
 * no deployed site, unlike user-profile.spec.js.
 */
import { test, expect } from '@playwright/test';

const FIXTURE = '/tests/e2e/fixtures/user-profile-compact.html';

/** WCAG 2.5.8 AAA target size, and the agreed ceiling for this control. */
const TARGET = 44;

test.beforeEach(async ({ page }) => {
  await page.goto(FIXTURE, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('body[data-ready="true"]');
});

test.describe('full login pill in a cramped navbar', () => {
  test('renders on a single line', async ({ page }) => {
    const pill = page.locator('#pill-full .user-profile-login-pill');
    const box = await pill.boundingBox();

    // Two lines of 20px leading would clear 60px. Anything at the target
    // height is one line.
    expect(box.height).toBe(TARGET);
  });

  test('keeps its icons at full size', async ({ page }) => {
    const icons = page.locator('#pill-full .user-profile-login-pill svg');
    await expect(icons).toHaveCount(2);

    for (const icon of await icons.all()) {
      const box = await icon.boundingBox();
      expect(box.width).toBe(16);
    }
  });
});

test.describe('compact login pill', () => {
  test('holds a 44x44 touch target', async ({ page }) => {
    const pill = page.locator('#pill-compact .user-profile-login-pill');
    const box = await pill.boundingBox();

    expect(box.width).toBe(TARGET);
    expect(box.height).toBe(TARGET);
  });

  test('shows no visible label or chevron', async ({ page }) => {
    const container = page.locator('#pill-compact');

    // The label keeps a 1x1 clipped box, so it is present but unreadable.
    const label = container.locator('.user-profile-login-label');
    await expect(label).toHaveCount(1);
    const labelBox = await label.boundingBox();
    expect(labelBox.width).toBeLessThanOrEqual(1);

    await expect(container.locator('.user-profile-login-chevron')).toBeHidden();
  });

  test('still announces itself as "Log in"', async ({ page }) => {
    const pill = page.locator('#pill-compact .user-profile-login-pill');
    await expect(pill).toHaveAccessibleName('Log in');
  });

  test('reserves only the width it renders', async ({ page }) => {
    const container = page.locator('#pill-compact');
    const box = await container.boundingBox();

    // The 118px floor would reserve nearly three times the pill's width.
    expect(box.width).toBe(TARGET);
  });
});

/**
 * Issue #40. The reservation exists to hold the navbar still across hydration.
 * On the height axis it reserved the avatar's 40px while an anonymous visitor
 * always lands the 44px pill, so a content-sized bar grew by 4px when the fetch
 * resolved. #pill-reserved is never initialised, so it renders the reservation
 * alone and can be measured against the pill that did hydrate.
 */
test.describe('pre-hydration height reservation', () => {
  test('reserves the height the pill renders into', async ({ page }) => {
    const box = await page.locator('#pill-reserved').boundingBox();

    expect(box.height).toBe(TARGET);
  });

  test('does not change height when the pill lands', async ({ page }) => {
    const reserved = await page.locator('#pill-reserved').boundingBox();
    const hydrated = await page.locator('#pill-full').boundingBox();

    // Any gap here is the 4px band that opened under a fixed header.
    expect(reserved.height).toBe(hydrated.height);
  });
});
