import { readFileSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

// Load .env file so AMEMBER_TEST_PASS (and any future vars) are available
// regardless of how Playwright is invoked (npm run test:e2e, npx playwright test, etc.)
try {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*?)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
} catch {
  // .env file is optional
}

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 1,
  use: {
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'auth-setup',
      testMatch: ['auth.setup.js'],
      use: { browserName: 'chromium' },
    },
    {
      name: 'user-profile',
      testMatch: ['user-profile.spec.js'],
      dependencies: ['auth-setup'],
      use: {
        browserName: 'chromium',
        storageState: 'e2e/.auth/user.json',
      },
    },
  ],
});
