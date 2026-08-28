/**
 * Failing a spec on what the browser said, rather than only on what it drew.
 *
 * This suite watched nothing. Not "watched errors and missed warnings" —
 * `page.on` appeared nowhere in tests/e2e, so every console message and every
 * uncaught exception the kit produced went straight past a green run.
 *
 * That gap has a known shape. A neighbouring property shipped an `aria-hidden`
 * violation on a navbar dropdown that Chrome reports at *warning* level; their
 * checks asserted on `type === "error"` and were structurally blind to it. The
 * lesson generalises past that one message:
 *
 *   Filtering by type silences a severity. Allowlisting by substring silences
 *   a message. The first is a blanket over things nobody chose to hide.
 *
 * So this watches three sources, and narrows only by exact text:
 *
 *   1. console `error`
 *   2. console `warning`  — the level that hid the bug above
 *   3. `pageerror`        — uncaught exceptions, which reach *no* console
 *      listener at any level. A page whose JavaScript died outright would
 *      otherwise pass a check watching every console level there is.
 *
 * Two disciplines keep the allowlist from rotting into furniture:
 *
 *   - An entry that matches nothing fails the run. Otherwise entries pile up,
 *     nobody can tell which are still load-bearing, and the next person widens
 *     one instead of investigating it.
 *   - A passing run prints what it suppressed, with counts. A check that
 *     cannot distinguish "nothing was wrong" from "nothing was examined" is
 *     not yet a check.
 *
 * Usage — call once at the top of a spec, before its own hooks:
 *
 *   import { test, expect } from '@playwright/test';
 *   import { watchConsole } from './helpers/console.js';
 *
 *   watchConsole(test);
 *   watchConsole(test, { allow: ['favicon.ico - Failed to load'] });
 */

/** Console levels that fail a run. `log`, `info` and `debug` are the page talking. */
const WATCHED_LEVELS = new Set(['error', 'warning']);

/**
 * Watch the console and uncaught exceptions for every test in the calling file.
 *
 * `allow` holds substrings, not patterns: an entry silences a message when the
 * message contains it. Matching runs against the text *and* its source, joined
 * as `<text> (<url>:<line>)`, because Chrome's most common messages do not name
 * what they are about — every failed request reads "Failed to load resource:
 * the server responded with a status of 404 (Not Found)" and only the URL says
 * which. Matching on text alone would force an entry that silences every 404
 * in the suite in order to silence one.
 *
 * Scope is the file, because that is the scope on which "this entry matched
 * nothing" means something. An entry needed by one test in a file and not its
 * neighbours is still live, and is not reported stale.
 */
export function watchConsole(test, { allow = [] } = {}) {
  // Match counts survive across the file's tests so staleness is judged once,
  // against every test that ran, rather than per test.
  const matched = new Map(allow.map((entry) => [entry, 0]));
  let testsRun = 0;
  let anyTestFailed = false;
  let partialView = false;

  test.beforeEach(async ({ page }) => {
    const seen = [];

    page.on('console', (msg) => {
      if (!WATCHED_LEVELS.has(msg.type())) return;
      const { url, lineNumber } = msg.location();
      seen.push({
        text: msg.text(),
        // Chrome reports the violating element in the message body, but the
        // source line is the only pointer to the code that caused it.
        where: url ? `${url}:${lineNumber}` : null,
      });
    });

    // An uncaught exception is not a console message and arrives on its own
    // channel. Prefixed so an allowlist entry can target exceptions alone.
    page.on('pageerror', (error) => {
      seen.push({ text: `pageerror: ${error.message}`, where: null });
    });

    page.__consoleSeen = seen;
  });

  test.afterEach(async ({ page }, testInfo) => {
    testsRun += 1;
    if (testInfo.status !== testInfo.expectedStatus) anyTestFailed = true;

    // A retry runs in a fresh worker, which re-imports this file and starts the
    // match counts at zero while running only the test that failed. That worker
    // has seen a fraction of the file and cannot judge any entry dead.
    if (testInfo.retry > 0) partialView = true;

    const seen = page.__consoleSeen ?? [];
    const violations = [];

    for (const entry of seen) {
      const rendered = entry.where ? `${entry.text} (${entry.where})` : entry.text;
      const silencer = allow.find((candidate) => rendered.includes(candidate));
      if (silencer) {
        matched.set(silencer, matched.get(silencer) + 1);
        continue;
      }
      violations.push(rendered);
    }

    if (violations.length) {
      // Thrown rather than expect()ed: this is a property of the run, not an
      // assertion the test made, and the message has to carry the full text so
      // the reader can decide between fixing it and allowlisting it.
      throw new Error(
        `Browser reported ${violations.length} console error/warning or uncaught ` +
          `exception during "${testInfo.title}":\n\n  ` +
          violations.join('\n\n  ') +
          `\n\nFix it, or silence that one message with ` +
          `watchConsole(test, { allow: ['<substring>'] }).`,
      );
    }
  });

  test.afterAll(async () => {
    if (!allow.length) return;

    const suppressed = [...matched].filter(([, count]) => count > 0);
    if (suppressed.length) {
      const summary = suppressed.map(([entry, count]) => `${count}x ${entry}`).join(', ');
      console.log(`  console watch: suppressed ${summary}`);
    }

    // A run that stopped early, that was narrowed by --grep, or that is a retry
    // worker has not given every entry its chance to match. Calling an entry
    // dead on that evidence would train people to ignore this check.
    if (!testsRun || anyTestFailed || partialView) return;

    const stale = [...matched].filter(([, count]) => count === 0).map(([entry]) => entry);
    if (stale.length) {
      throw new Error(
        `Console allowlist has ${stale.length} entr${stale.length === 1 ? 'y' : 'ies'} ` +
          `that matched nothing across ${testsRun} test(s):\n\n  ` +
          stale.join('\n  ') +
          `\n\nThe message stopped appearing. Delete the entry.`,
      );
    }
  });
}
