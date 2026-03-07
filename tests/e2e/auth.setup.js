import { test as setup, expect } from '@playwright/test';

const authFile = 'tests/e2e/.auth/user.json';
const TEST_USERS = ['playwright-free', 'playwright-starter', 'playwright-affiliate'];

setup('authenticate', async ({ page }) => {
  const pass = process.env.AMEMBER_TEST_PASS;

  if (!pass) {
    throw new Error('AMEMBER_TEST_PASS environment variable is required for authenticated tests');
  }

  const user = TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];

  await page.goto('https://dashboard.marketdata.app/marketdata/login');
  await page.getByRole('textbox', { name: 'Username/Email' }).fill(user);
  await page.getByRole('textbox', { name: 'Password' }).fill(pass);
  await page.getByRole('button', { name: 'Login' }).click();

  // Wait for the amember_nr session cookie — this is the auth gate.
  // The cookie arrives before the redirect completes, so polling for it
  // is more resilient than waiting for the URL to change.
  await expect(async () => {
    const cookies = await page.context().cookies('https://dashboard.marketdata.app');
    expect(cookies.some((c) => c.name === 'amember_nr')).toBe(true);
  }).toPass({ timeout: 15_000 });

  // Save session state — cookies are on .marketdata.app so they
  // work across dashboard, www, and www-staging subdomains.
  await page.context().storageState({ path: authFile });
});
