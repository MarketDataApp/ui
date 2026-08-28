/**
 * Integration tests for the @marketdataapp/ui user-profile component.
 *
 * Verifies: avatar renders when logged in, dropdown opens with expected
 * links, and logout redirects to the dashboard login page.
 *
 * Requires: auth.setup.js to run first (storageState with session cookies).
 */
import { test, expect } from '@playwright/test';
import { watchConsole } from './helpers/console.js';

// The Gravatar 404 is deliberate, not a fault. The component requests the avatar
// with `d=404` precisely so a user without a Gravatar produces an error it can
// catch, and handleImgError swaps in the SVG placeholder. Silencing it is
// silencing a designed signal.
//
// Allowed by host prefix rather than by the full URL: the path carries a hash of
// the account's email, so a URL-exact entry would go stale the moment the test
// account changes and would say the wrong thing about why.
watchConsole(test, { allow: ['https://www.gravatar.com/avatar/'] });

const BASE_URL = 'https://dev.marketdata.app/ui/docs/user-state.html';

test.describe('User profile component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  });

  test('user profile avatar is visible when logged in', async ({ page }) => {
    const avatar = page.locator('#user-profile-live-dropdown .user-profile-avatar');
    await expect(avatar).toBeVisible({ timeout: 10_000 });
  });

  test('dropdown opens on avatar click', async ({ page }) => {
    const avatar = page.locator('#user-profile-live-dropdown .user-profile-avatar');
    await expect(avatar).toBeVisible({ timeout: 10_000 });

    await avatar.click();

    const container = page.locator('#user-profile-live-dropdown');
    const dropdown = container.locator('.user-profile-dropdown');
    await expect(dropdown).toBeVisible();

    // Verify dropdown header shows user info
    await expect(container.locator('.user-profile-dropdown-name')).toBeVisible();
    await expect(container.locator('.user-profile-dropdown-email')).toBeVisible();

    // Verify menu links
    await expect(
      container.locator('.user-profile-dropdown-link', { hasText: 'Dashboard' }),
    ).toBeVisible();
    await expect(
      container.locator('.user-profile-dropdown-link', { hasText: 'Profile' }),
    ).toBeVisible();
    await expect(
      container.locator('.user-profile-dropdown-link', {
        hasText: 'Modify My Plan',
      }),
    ).toBeVisible();
    await expect(
      container.locator('.user-profile-dropdown-signout', { hasText: 'Log out' }),
    ).toBeVisible();
  });

  test('dropdown closes on outside click', async ({ page }) => {
    const avatar = page.locator('#user-profile-live-dropdown .user-profile-avatar');
    await expect(avatar).toBeVisible({ timeout: 10_000 });

    await avatar.click();
    const dropdown = page.locator('#user-profile-live-dropdown .user-profile-dropdown');
    await expect(dropdown).toBeVisible();

    // Click outside the dropdown
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await expect(dropdown).not.toBeVisible();
  });

  test('dropdown closes on Escape key', async ({ page }) => {
    const avatar = page.locator('#user-profile-live-dropdown .user-profile-avatar');
    await expect(avatar).toBeVisible({ timeout: 10_000 });

    await avatar.click();
    const dropdown = page.locator('#user-profile-live-dropdown .user-profile-dropdown');
    await expect(dropdown).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dropdown).not.toBeVisible();
  });

  test('logout redirects to dashboard login', async ({ page }) => {
    const avatar = page.locator('#user-profile-live-dropdown .user-profile-avatar');
    await expect(avatar).toBeVisible({ timeout: 10_000 });

    await avatar.click();

    const container = page.locator('#user-profile-live-dropdown');
    const logoutLink = container.locator('.user-profile-dropdown-signout', {
      hasText: 'Log out',
    });
    await expect(logoutLink).toBeVisible();
    await logoutLink.click();

    // Should redirect to the dashboard login page
    await page.waitForURL(/dashboard\.marketdata\.app/, { timeout: 15_000 });
  });
});
