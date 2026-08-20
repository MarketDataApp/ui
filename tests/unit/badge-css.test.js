import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BUILDS, ruleBody, nestedState } from './helpers/css.js';

// Issue #43: badges shipped as static labels only, so a badge used as a link
// had no hover affordance, kept the site's underline running through the pill,
// and rendered 18px — under WCAG 2.5.8's 24px minimum once it is clickable.
//
// The fix is automatic rather than opt-in: `:any-link` matches an <a> that has
// an href, so a linked badge styles itself and a span badge does not change.
//
// The browser-level proof lives in tests/e2e/badge-link.spec.js, which hovers
// and tabs real elements and measures delivered contrast. These assertions
// cover the structure of the built rules, and in particular the two things a
// browser test cannot easily show: that the span path is untouched, and that
// the opt-in class the issue proposed is not shipped.

/** Every colour utility, and the palette step its hover deepens to. */
const COLOURS = [
  ['badge-blue', 'blue', 200, 800],
  ['badge-gray', 'gray', 200, 600],
  ['badge-red', 'red', 200, 800],
  ['badge-green', 'green', 200, 800],
  ['badge-yellow', 'yellow', 200, 800],
  ['badge-indigo', 'indigo', 200, 800],
  ['badge-purple', 'purple', 200, 800],
  ['badge-pink', 'pink', 200, 800],
  ['badge-pill-green', 'green', 200, 800],
  ['badge-pill-blue', 'blue', 200, 800],
  ['badge-pill-red', 'red', 200, 800],
];

/** The two utilities that carry the clickable treatment. */
const CARRIERS = ['badge', 'badge-pill'];

describe.each(BUILDS)('clickable badges in %s (#43)', (buildPath) => {
  const css = readFileSync(resolve(process.cwd(), buildPath), 'utf8');

  describe.each(CARRIERS)('.%s', (name) => {
    const body = ruleBody(css, `.${name}`);
    const link = nestedState(body ?? '', ':any-link');

    it('is emitted', () => {
      expect(body).not.toBeNull();
    });

    it('drops the underline and reaches a 24px target, but only when linked', () => {
      expect(link).toMatch(/text-decoration-line:\s*none/);
      expect(link).toMatch(/min-height:\s*calc\(var\(--spacing\) \* 6\)/);
    });

    // The span path. A rule written one level too high would raise every
    // badge to 24px and quietly change every existing label in every consumer.
    it('leaves the resting badge at its original height', () => {
      const resting = body.slice(0, body.indexOf('&:any-link'));
      expect(resting).not.toMatch(/min-height/);
    });

    it('takes its hover colour from the colour utility, not from itself', () => {
      expect(link).toMatch(/background-color:\s*var\(--badge-hover-bg,/);
    });

    it('rings in the badge’s own colour, falling back to the shared token', () => {
      expect(link).toMatch(
        /--tw-ring-color:\s*var\(--badge-focus-ring,\s*var\(--color-focus-ring\)\)/,
      );
    });

    it('rings at 2px, not the 4px the buttons use', () => {
      expect(link).toMatch(/0 0 0 calc\(2px \+ var\(--tw-ring-offset-width\)\)/);
    });
  });

  describe.each(COLOURS)('.%s', (name, hue, lightStep, darkStep) => {
    const body = ruleBody(css, `.${name}`);

    it('is emitted', () => {
      expect(body).not.toBeNull();
    });

    it(`declares a hover one step deeper in light mode (${hue}-${lightStep})`, () => {
      expect(body).toMatch(new RegExp(`--badge-hover-bg:\\s*var\\(--color-${hue}-${lightStep}\\)`));
    });

    // Measured, not chosen: {hue}-700 and {hue}-400 are the one pair that
    // clears 3:1 against both the page and the chip for all eight hues.
    // Lighter shades fail in light mode for green and yellow.
    it(`rings in ${hue}-700 in light mode`, () => {
      expect(body).toMatch(new RegExp(`--badge-focus-ring:\\s*var\\(--color-${hue}-700\\)`));
    });

    it('overrides both in dark mode', () => {
      const dark = nestedState(
        body,
        ":where(.dark, .dark *, [data-theme='dark'], [data-theme='dark'] *)",
      );
      expect(dark).toMatch(new RegExp(`--badge-hover-bg:\\s*var\\(--color-${hue}-${darkStep}\\)`));
      expect(dark).toMatch(new RegExp(`--badge-focus-ring:\\s*var\\(--color-${hue}-400\\)`));
    });
  });

  // The issue proposed a `.badge-link` opt-in class and that shape was
  // deliberately not taken. Factoring the shared block into a `@utility` would
  // have reintroduced it under another name, because scripts/build-classes.js
  // emits every utility as a real class.
  it('ships no opt-in variant class', () => {
    expect(css).not.toMatch(/\.badge-link\b/);
    expect(css).not.toMatch(/\.badge-interactive\b/);
  });
});
