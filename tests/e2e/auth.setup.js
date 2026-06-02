import { test as setup, expect } from '@playwright/test';

const authFile = 'tests/e2e/.auth/user.json';

// The autologin flow occasionally drops the session cookie on the first
// round-trip (amember slowness, network blip, etc.). Polling alone
// doesn't help — if the response didn't carry the Set-Cookie header,
// no amount of waiting will conjure one. Re-navigate the autologin URL
// to trigger a fresh login attempt instead. The URL is long-lived, so
// hitting it again is safe.
const MAX_ATTEMPTS = 3;
const PER_ATTEMPT_TIMEOUT_MS = 8_000;

setup('authenticate', async ({ page }) => {
  const autoLoginUrl = process.env.AMEMBER_AUTOLOGIN_URL;

  if (!autoLoginUrl) {
    throw new Error(
      'AMEMBER_AUTOLOGIN_URL environment variable is required for authenticated tests',
    );
  }

  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await page.goto(autoLoginUrl);
      // Wait for the amember_nr session cookie — this is the auth gate.
      // The cookie arrives before the redirect completes, so polling for
      // it is more resilient than waiting for the URL to change.
      await expect(async () => {
        const cookies = await page.context().cookies('https://dashboard.marketdata.app');
        expect(cookies.some((c) => c.name === 'amember_nr')).toBe(true);
      }).toPass({ timeout: PER_ATTEMPT_TIMEOUT_MS });
      lastError = null;
      break;
    } catch (err) {
      lastError = err;
      console.warn(
        `auth.setup: attempt ${attempt}/${MAX_ATTEMPTS} did not receive amember_nr cookie within ${PER_ATTEMPT_TIMEOUT_MS}ms — ${err.message.split('\n')[0]}`,
      );
      if (attempt < MAX_ATTEMPTS) {
        // Clear cookies so the next attempt isn't confused by partial
        // state from a failed handshake.
        await page.context().clearCookies();
      }
    }
  }
  if (lastError) throw lastError;

  // Save session state — cookies are on .marketdata.app so they
  // work across dashboard, www, and www-staging subdomains.
  await page.context().storageState({ path: authFile });
});
