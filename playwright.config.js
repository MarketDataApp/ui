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

// Deliberately not 3000. That port is the default for so many dev servers that
// something else usually holds it, and a static file server is indistinguishable
// from any other server until a page 404s deep inside a test.
const LOCAL_PORT = 3101;
const LOCAL_SERVER = `http://localhost:${LOCAL_PORT}`;

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
      use: { browserName: 'chromium', baseURL: LOCAL_SERVER },
    },
    {
      // No auth dependency — the fixture stubs fetch and serves from the repo.
      name: 'user-profile-compact',
      testMatch: ['user-profile-compact.spec.js'],
      use: { browserName: 'chromium', baseURL: LOCAL_SERVER },
    },
    {
      // Same hermetic fixture pattern. Chromium only and on purpose: the specs
      // rest on Chrome's `:focus-visible` heuristic and on relative colour
      // syntax, and #41 was measured there.
      name: 'focus-ring',
      testMatch: ['focus-ring.spec.js'],
      use: { browserName: 'chromium', baseURL: LOCAL_SERVER },
    },
    {
      // Same hermetic fixture pattern, and Chromium only for the same reasons:
      // the `:focus-visible` heuristic and relative colour syntax.
      name: 'badge-link',
      testMatch: ['badge-link.spec.js'],
      use: { browserName: 'chromium', baseURL: LOCAL_SERVER },
    },
  ],
  webServer: [
    {
      // One repo-owned static server for every spec that loads a local page,
      // on a port of our own, with reuseExistingServer off.
      //
      // Both of those are load-bearing. These specs measure pixel dimensions
      // and read theme classes off the repo's own dist/, so they must serve
      // the repo and nothing else. theme-toggle used to run on :3000 with
      // reuse on, which meant Playwright skipped starting the server whenever
      // anything already held that very common port and ran the suite against
      // a stranger's app instead. That failed as five 30s click timeouts,
      // because the page 404ed and #theme-toggle never appeared — the port
      // collision was nowhere in the error. With reuse off, a busy port fails
      // immediately and says so.
      command: `npx serve . -p ${LOCAL_PORT}`,
      port: LOCAL_PORT,
      reuseExistingServer: false,
    },
  ],
});
