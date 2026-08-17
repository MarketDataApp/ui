import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BUILDS, ruleBody, nestedState } from './helpers/css.js';

// Issue #41: three controls shipped with no usable keyboard focus indicator.
//
//   1. The login pill drew a ring in `neutral-tertiary` — the pill's own
//      background token. An exact colour match in dark mode, 0.967 against
//      0.985 in light. Tabbing to it showed nothing.
//   2. The theme toggle hid its outline on focus with no ring declared
//      beside it. The UA indicator went and nothing replaced it. WCAG 2.4.7.
//   3. Every btn-* variant rang on `:focus`, which also fires on a mouse
//      click, so a clicked CTA kept its ring until the user clicked elsewhere.
//
// The failure mode for all three is silence: the CSS is well-formed, the build
// succeeds, and the control simply has no visible focus state. Only an
// assertion catches that, so these read the built artifacts consumers link.

const RING_4 = /0 0 0 calc\(4px \+ var\(--tw-ring-offset-width\)\)/;

describe.each(BUILDS)('shared focus ring token in %s (#41)', (buildPath) => {
  const css = readFileSync(resolve(process.cwd(), buildPath), 'utf8');

  it('defines the light value as the brand blue', () => {
    expect(css).toMatch(/--color-focus-ring:\s*#0085f2/);
  });

  // #0085f2 measures 2.97:1 against the dark login pill, under the 3:1 that
  // WCAG 1.4.11 asks of a focus indicator. blue-400 measures 4.51:1 there.
  // One hex cannot serve both themes, so dark mode overrides the token.
  it('overrides the token in dark mode with a value that clears 3:1', () => {
    const dark = ruleBody(css, ".dark, [data-theme='dark']");
    expect(dark).not.toBeNull();
    expect(dark).toMatch(/--color-focus-ring:\s*var\(--color-blue-400\)/);
  });

  // Tailwind/Flowbite consumers set `.dark`; Docusaurus sets `[data-theme]`.
  // Covering only one leaves half the properties on the light-mode blue.
  it('covers both dark-mode selectors the kit supports', () => {
    expect(css).toMatch(/\.dark,\s*\[data-theme='dark'\]\s*\{/);
  });
});

describe.each(BUILDS)('login pill focus ring in %s (#41)', (buildPath) => {
  const css = readFileSync(resolve(process.cwd(), buildPath), 'utf8');
  const pill = ruleBody(css, '.user-profile-wrapper .user-profile-login-pill');

  it('emits the login pill rule', () => {
    expect(pill).not.toBeNull();
  });

  it('draws a 4px ring on keyboard focus', () => {
    const focusVisible = nestedState(pill, ':focus-visible');
    expect(focusVisible).toMatch(RING_4);
    expect(focusVisible).toMatch(/--tw-ring-color:\s*var\(--color-focus-ring\)/);
  });

  // The original bug. The ring token and the background token came from the
  // same neutral family, so the ring painted the pill's own colour onto its
  // own edge. Any neutral token here is the bug returning.
  it('rings in a colour that is not the pill background', () => {
    expect(pill).toMatch(/background-color:\s*var\(--color-neutral-secondary-medium\)/);
    expect(nestedState(pill, ':focus-visible')).not.toMatch(
      /--tw-ring-color:\s*var\(--color-neutral/,
    );
  });

  it('leaves no ring behind after a mouse click', () => {
    expect(nestedState(pill, ':focus')).not.toMatch(/--tw-ring-color/);
  });
});

describe.each(BUILDS)('theme toggle focus ring in %s (#41)', (buildPath) => {
  const css = readFileSync(resolve(process.cwd(), buildPath), 'utf8');
  const toggle = ruleBody(css, '.theme-toggle-wrapper .theme-toggle-button');

  it('emits the theme toggle rule', () => {
    expect(toggle).not.toBeNull();
  });

  // This control previously drew nothing at all on Tab.
  it('draws a 4px ring on keyboard focus', () => {
    const focusVisible = nestedState(toggle, ':focus-visible');
    expect(focusVisible).toMatch(RING_4);
    expect(focusVisible).toMatch(/--tw-ring-color:\s*var\(--color-focus-ring\)/);
  });

  // The transparent-background and body-colour declarations are resets that
  // hold off host framework button rules, so they stay on every focus,
  // keyboard or mouse — they are not indicators.
  it('keeps its host-framework resets on every focus', () => {
    const focus = nestedState(toggle, ':focus');
    expect(focus).toMatch(/background-color:\s*transparent/);
    expect(focus).toMatch(/color:\s*var\(--color-body\)/);
  });
});

// The six btn-{from}-to-{to} utilities plus the two that compose them. Named
// one by one rather than counted across the file: a variant that stops
// emitting is as much a regression as one that fires on the wrong
// pseudo-class, and only a per-variant assertion tells the two apart.
const BTN_VARIANTS = [
  '.btn-orange-to-blue',
  '.btn-blue-to-orange',
  '.btn-orange-to-outline',
  '.btn-blue-to-outline',
  '.btn-outline-to-orange',
  '.btn-outline-to-blue',
  '.btn-hover-orange',
  '.btn-hover-blue',
];

describe.each(BUILDS)('btn-* focus ring trigger in %s (#41)', (buildPath) => {
  const css = readFileSync(resolve(process.cwd(), buildPath), 'utf8');

  // Scoped to each variant's own rule, never matched across the whole file.
  // Tailwind's automatic source detection scans this repo's markdown and its
  // test files, so a utility named in a CHANGELOG sentence or in a comment
  // like this one becomes a real rule in the full bundle. A file-wide search
  // for a `:focus` ring would then fail against that prose while every button
  // is perfectly correct — which is exactly what happened while writing this.
  describe.each(BTN_VARIANTS)('%s', (selector) => {
    const body = ruleBody(css, selector);

    it('emits the variant', () => {
      expect(body).not.toBeNull();
    });

    // The colours are deliberately unchanged — pink-200 resting in light mode,
    // pink-800 in dark, brand-medium once hovered or loading. Only the trigger
    // moved, and the ring width moved with it: left on `:focus`, a mouse click
    // would paint a 4px ring in the ring utility's default colour instead.
    it('rings on keyboard focus', () => {
      const focusVisible = nestedState(body, ':focus-visible');
      expect(focusVisible).toMatch(RING_4);
      expect(focusVisible).toMatch(/--tw-ring-color:\s*var\(--btn-focus-color\)/);
    });

    it('draws no ring on a mouse click', () => {
      const focus = nestedState(body, ':focus');
      expect(focus).not.toMatch(RING_4);
      expect(focus).not.toMatch(/--tw-ring-color/);
    });
  });
});
