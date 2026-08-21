import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Tailwind's automatic source detection scans every non-ignored file in the
// repo and cannot tell a class name from prose that happens to contain one.
// Naming a utility in a CHANGELOG sentence therefore emitted it as a real rule
// in the standalone bundle — 77 of them, about 9KB, by 5.5.0.
//
// That is worse here than in an ordinary build, because scripts/unlayer.js
// strips the `@layer` wrappers afterwards. A stray rule does not sit quietly in
// a layer the consumer outranks; it competes with the consumer's own CSS on
// specificity alone.
//
// css/components.input.css now subtracts markdown and test code. The no-reset
// bundle was always immune: it imports `tailwindcss/utilities source(none)`,
// so it only ever emitted what its explicit `@source` list named.

const FULL_BUILD = 'dist/css/components.css';
const NO_RESET_BUILD = 'dist/css/components.no-reset.css';

/**
 * Utilities that appear ONLY in this repo's prose — CHANGELOG entries and test
 * comments — and in no template, demo page, or JS module.
 *
 * Writing them here is the mechanism, not an oversight. This file is test code,
 * so `@source not` excludes it. Delete that exclusion and these names become
 * scannable again, the rules reappear, and this test fails. The canary has to
 * sit inside the excluded set to work.
 */
const PROSE_ONLY = [
  'px-10',
  'lg\\:px-10',
  'px-7',
  'min-h-11',
  'leading-5',
  'shrink-0',
  'shadow-md',
];

/** A utility the demo pages really use, to prove the exclusion did not overreach. */
const REAL_UTILITY = 'btn-orange-to-blue';

/** Match a top-level rule for one escaped class name, at any indentation. */
function hasRule(css, className) {
  return new RegExp(`^\\s*\\.${className} \\{`, 'm').test(css);
}

describe('automatic source detection in the standalone bundle', () => {
  const css = readFileSync(resolve(process.cwd(), FULL_BUILD), 'utf8');

  it.each(PROSE_ONLY)('does not emit .%s, which only ever appeared in prose', (className) => {
    expect(hasRule(css, className)).toBe(false);
  });

  it('still emits the component utilities the demo pages use', () => {
    expect(hasRule(css, REAL_UTILITY)).toBe(true);
  });

  // css/flowbite-theme.upstream.css is a byte-identical copy of Flowbite's
  // modern theme, kept so `diff -w` against our derived one shows what we
  // changed. Nothing imports it. Detection still read it and found the `rose-*`
  // names in the danger tokens we replaced with red, which pulled the whole
  // rose palette into this bundle. The theme variables are the tell — no
  // component in the kit uses rose, so one appearing means the reference file
  // became scannable again.
  it('does not emit the rose palette named only in the upstream reference copy', () => {
    expect(css).not.toMatch(/--color-rose-\d+:/);
  });
});

describe('the no-reset bundle', () => {
  const css = readFileSync(resolve(process.cwd(), NO_RESET_BUILD), 'utf8');

  // It never had the problem, and it must not acquire one.
  it.each(PROSE_ONLY)('does not emit .%s either', (className) => {
    expect(hasRule(css, className)).toBe(false);
  });

  it('still emits the component utilities consumers import it for', () => {
    expect(hasRule(css, REAL_UTILITY)).toBe(true);
  });
});
