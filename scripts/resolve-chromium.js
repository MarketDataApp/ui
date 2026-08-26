/**
 * Finds the Chromium this machine already has, so nothing in this repo decides
 * which browser version we run.
 *
 * Playwright's `browserName: 'chromium'` is an invisible version pin: it resolves
 * to the one revision bundled with the installed @playwright/test, so the browser
 * only moves when someone bumps a devDependency and re-runs `playwright install`.
 * That makes this repo the gate on every Chromium update. We would rather test
 * against the browser our users actually run, the day their OS updates it, with
 * no commit here.
 *
 * Resolution order:
 *   1. CHROMIUM_PATH, when set — an explicit escape hatch for any binary.
 *   2. The first system browser found on this platform.
 *   3. undefined — callers fall back to Playwright's bundled build, so a fresh
 *      clone still works with nothing but `npx playwright install`.
 *
 * Trade-off, stated plainly: Playwright only guarantees the revision it bundles.
 * A system browser far ahead of it can drift on CDP behaviour. That is the price
 * of not holding updates back, and it fails loudly rather than silently.
 */

import { accessSync, constants } from 'node:fs';

const CANDIDATES = {
  linux: [
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/snap/bin/chromium',
  ],
  darwin: [
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ],
  win32: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ],
};

/**
 * @returns {string|undefined} Path to a system Chromium, or undefined to let
 *   Playwright use its own bundled build.
 */
export function resolveChromium() {
  const candidates = process.env.CHROMIUM_PATH
    ? [process.env.CHROMIUM_PATH]
    : (CANDIDATES[process.platform] ?? []);

  for (const candidate of candidates) {
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      // Not installed here; try the next one.
    }
  }
  return undefined;
}

/**
 * Which binary ran matters the moment a pixel assertion or a scrape fails, and
 * the whole point of this module is that the answer changes over time. Say so.
 *
 * @param {string|undefined} path Result of {@link resolveChromium}.
 */
export function announceChromium(path) {
  console.log(
    path
      ? `Chromium: ${path} (system)`
      : 'Chromium: bundled with @playwright/test (no system browser found)',
  );
}
