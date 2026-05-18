import { test as setup, expect } from '@playwright/test';

const authFile = 'tests/e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  const autoLoginUrl = process.env.AMEMBER_AUTOLOGIN_URL;

  if (!autoLoginUrl) {
    throw new Error(
      'AMEMBER_AUTOLOGIN_URL environment variable is required for authenticated tests',
    );
  }

  await page.goto(autoLoginUrl);

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
