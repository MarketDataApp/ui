import { test, expect } from '@playwright/test';
import { watchConsole } from './helpers/console.js';

// Drives docs/header.html, which scripts/build-docs.js renders at build time
// with renderHeader() — the same markup a consumer ships — and which
// initHeader() wires on load. Everything measured here is real rendering:
// which control the measurement kept, where the wide panel lands, what the
// drawer does to the page behind it.
watchConsole(test);

const PAGE = '/docs/header.html';
const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 375, height: 800 };

// The overflow utility debounces its reflow (50ms + a frame).
const REFLOW = 300;

async function open(page, viewport) {
  await page.setViewportSize(viewport);
  await page.goto(PAGE, { waitUntil: 'domcontentloaded' });
  await page.locator('.site-header[data-header-ready]').waitFor({ state: 'attached' });
  await page.waitForTimeout(REFLOW);
}

const linksDropped = (page) =>
  page.evaluate(() => document.getElementById('navbar-links').hasAttribute('data-navbar-hidden'));

const display = (page, selector) =>
  page.evaluate((s) => getComputedStyle(document.querySelector(s)).display, selector);

const drawerOpen = (page) =>
  page.evaluate(() => !document.getElementById('navbar-main').hasAttribute('inert'));

// ---------------------------------------------------------------------------
// Desktop
// ---------------------------------------------------------------------------
test.describe('site header at desktop width', () => {
  test.beforeEach(async ({ page }) => open(page, DESKTOP));

  test('keeps the links in the row, hides the hamburger and the drawer, and holds the bar at 60px', async ({
    page,
  }) => {
    expect(await linksDropped(page)).toBe(false);
    expect(await display(page, '#navbar-toggle')).toBe('none');
    expect(await display(page, '#navbar-main')).toBe('none');
    expect(await display(page, '#theme-toggle')).not.toBe('none');

    const bar = await page.locator('.site-header-bar').boundingBox();
    const spacer = await page.locator('.site-header-spacer').boundingBox();
    expect(bar.height).toBe(60);
    expect(spacer.height).toBe(60);
    expect(await page.locator('.site-header-logo-light').first().boundingBox()).toMatchObject({
      width: 160,
    });
  });

  test('hover opens a mega menu, keeps the wide panel off both edges by the row gutter, and a click does not close it', async ({
    page,
  }) => {
    const trigger = page.locator('#mega-menu-products-button');
    const panel = page.locator('#mega-menu-products');

    await trigger.hover();
    await expect(panel).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    const box = await panel.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(16);
    expect(box.x + box.width).toBeLessThanOrEqual(DESKTOP.width - 16);

    // A pointer click on the word being read must not take the menu away.
    await trigger.click();
    await expect(panel).toBeVisible();

    // Moving to another trigger swaps panels.
    await page.locator('#mega-menu-data-button').hover();
    await expect(page.locator('#mega-menu-data')).toBeVisible();
    await expect(panel).toBeHidden();

    // Leaving the bar closes what is open.
    await page.mouse.move(700, 600);
    await expect(page.locator('#mega-menu-data')).toBeHidden();
    await expect(page.locator('#mega-menu-data-button')).toHaveAttribute('aria-expanded', 'false');
  });

  test('the narrow panels sit centred under their trigger', async ({ page }) => {
    const trigger = page.locator('#mega-menu-learn-button');
    await trigger.hover();
    const panel = page.locator('#mega-menu-learn');
    await expect(panel).toBeVisible();
    const t = await trigger.boundingBox();
    const p = await panel.boundingBox();
    expect(Math.abs(t.x + t.width / 2 - (p.x + p.width / 2))).toBeLessThan(2);
    expect(p.y).toBeGreaterThan(t.y + t.height);
  });

  test('keyboard: Enter opens, Tab reaches the rows, Escape closes and returns focus to the trigger', async ({
    page,
  }) => {
    const trigger = page.locator('#mega-menu-learn-button');
    const panel = page.locator('#mega-menu-learn');

    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(panel).toBeVisible();

    await page.keyboard.press('Tab');
    await expect(panel.locator('a').first()).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('the mega-menu triggers show the arrow cursor, not the hand', async ({ page }) => {
    const cursor = await page
      .locator('#mega-menu-products-button')
      .evaluate((el) => getComputedStyle(el).cursor);
    expect(cursor).toBe('default');
  });
});

// ---------------------------------------------------------------------------
// Phone
// ---------------------------------------------------------------------------
test.describe('site header at phone width', () => {
  test.beforeEach(async ({ page }) => open(page, PHONE));

  test('drops the links, shows the hamburger, and keeps exactly one theme toggle', async ({
    page,
  }) => {
    expect(await linksDropped(page)).toBe(true);
    expect(await display(page, '#navbar-toggle')).not.toBe('none');
    expect(await display(page, '#theme-toggle')).toBe('none');
    expect(await display(page, '#navbar-main')).not.toBe('none');
  });

  test('the drawer opens over an inert, scroll-locked page and closes on Escape with focus on the hamburger', async ({
    page,
  }) => {
    await page.locator('#navbar-toggle').click();
    expect(await drawerOpen(page)).toBe(true);
    await expect(page.locator('#navbar-close')).toBeFocused();
    await expect(page.locator('#navbar-toggle')).toHaveAttribute('aria-expanded', 'true');

    const locked = await page.evaluate(() => ({
      overflow: document.body.style.overflow,
      main: document.querySelector('main').hasAttribute('inert'),
      footer: document.querySelector('footer').hasAttribute('inert'),
    }));
    expect(locked).toEqual({ overflow: 'hidden', main: true, footer: true });

    // Only the drawer's theme toggle is on screen now.
    await expect(page.locator('#theme-toggle-drawer .theme-toggle-button')).toBeVisible();

    // The drawer is on screen: its left edge is at 0 after the transition.
    await expect.poll(async () => (await page.locator('#navbar-main').boundingBox()).x).toBe(0);

    await page.keyboard.press('Escape');
    expect(await drawerOpen(page)).toBe(false);
    await expect(page.locator('#navbar-toggle')).toBeFocused();
    const released = await page.evaluate(() => ({
      overflow: document.body.style.overflow,
      main: document.querySelector('main').hasAttribute('inert'),
    }));
    expect(released).toEqual({ overflow: '', main: false });
  });

  test('accordions open in the drawer, and the current page is marked', async ({ page }) => {
    await page.locator('#navbar-toggle').click();
    const button = page.locator('#mega-menu-data-mobile-button');
    const panel = page.locator('#mega-menu-data-mobile');
    await expect(panel).toBeHidden();
    await button.click();
    await expect(panel).toBeVisible();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(panel.locator('a')).toHaveCount(6);

    // No announcement rows in the drawer.
    await expect(page.locator('#navbar-main')).not.toContainText('Coming Soon');

    // docs/build-docs.js renders the page as /pricing/.
    await expect(page.locator('#navbar-main [aria-current="page"]')).toHaveText('Pricing');
  });

  test('widening the viewport while the drawer is open closes it and releases the page', async ({
    page,
  }) => {
    await page.locator('#navbar-toggle').click();
    expect(await drawerOpen(page)).toBe(true);

    await page.setViewportSize(DESKTOP);
    await expect.poll(() => linksDropped(page)).toBe(false);
    await expect.poll(() => drawerOpen(page)).toBe(false);
    const released = await page.evaluate(() => ({
      overflow: document.body.style.overflow,
      main: document.querySelector('main').hasAttribute('inert'),
    }));
    expect(released).toEqual({ overflow: '', main: false });
  });
});
