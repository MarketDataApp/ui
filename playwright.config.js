import { readFileSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

// Load .env file so AMEMBER_AUTOLOGIN_URL (and any future vars) are available
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
  testDir: './tests/e2e',
  outputDir: './tests/results',
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
        storageState: 'tests/e2e/.auth/user.json',
      },
    },
    {
      name: 'navbar-overflow',
      testMatch: ['navbar-overflow.spec.js'],
      use: { browserName: 'chromium' },
    },
    {
      name: 'theme-toggle',
      testMatch: ['theme-toggle.spec.js'],
      use: { browserName: 'chromium', baseURL: 'http://localhost:3000' },
    },
    {
      // No auth dependency — the fixture stubs fetch and serves from the repo.
      name: 'user-profile-compact',
      testMatch: ['user-profile-compact.spec.js'],
      use: { browserName: 'chromium', baseURL: 'http://localhost:3101' },
    },
  ],
  webServer: [
    {
      command: 'npx serve . -p 3000',
      port: 3000,
      reuseExistingServer: true,
    },
    {
      // Own port, and reuseExistingServer is off: these tests assert pixel
      // dimensions against the repo's own dist/, so they must not silently
      // bind to whatever else happens to hold the port.
      command: 'npx serve . -p 3101',
      port: 3101,
      reuseExistingServer: false,
    },
  ],
});
