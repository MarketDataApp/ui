import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BUILDS, ruleBody } from './helpers/css.js';

// The theme toggle restates its resting colours on `:active` and `:focus`.
// Those are resets that hold off host framework button rules (aMember), not
// states of their own. They share the hover rule's specificity, so source
// order alone decides which one paints when both match.
//
// They used to come after the hover. A mouse click leaves the button focused
// in Chrome, Edge and Firefox, so after one click the focus reset painted over
// every later hover until the user clicked somewhere else; every press flashed
// the hover off for the same reason. tests/e2e/theme-toggle-states.spec.js
// proves the behaviour in a browser. This is the fast guard on the order that
// causes it, run on every pull request.

const TOGGLE = '.theme-toggle-wrapper .theme-toggle-button';

/**
 * Every nested `&<suffix>` block in a rule body, with where it starts and ends.
 * Tailwind emits one block per `@apply` line, so a state can appear more than
 * once, and their positions are the cascade order.
 */
function blocks(body, suffix) {
  const out = [];
  const needle = `&${suffix} {`;
  for (let from = 0; ; ) {
    const start = body.indexOf(needle, from);
    if (start === -1) return out;
    let depth = 0;
    let end = body.indexOf('{', start);
    for (; end < body.length; end++) {
      if (body[end] === '{') depth++;
      else if (body[end] === '}' && --depth === 0) break;
    }
    out.push({ start, end, text: body.slice(start, end + 1) });
    from = end;
  }
}

/** A block that sets the background or the text colour. */
const PAINTS = /(^|[\s{;])(background-color|color):/;

describe.each(BUILDS)('theme toggle hover order in %s', (buildPath) => {
  const css = readFileSync(resolve(process.cwd(), buildPath), 'utf8');
  const toggle = ruleBody(css, TOGGLE);

  it('emits the theme toggle rule', () => {
    expect(toggle).not.toBeNull();
  });

  const hovers = toggle ? blocks(toggle, ':hover').filter((b) => PAINTS.test(b.text)) : [];
  const resets = toggle
    ? [...blocks(toggle, ':active'), ...blocks(toggle, ':focus')].filter((b) => PAINTS.test(b.text))
    : [];

  // Without both sides the order assertion below would compare nothing and
  // pass. These pin that there is a hover to protect and a reset to keep.
  it('paints a hover background', () => {
    expect(hovers.some((b) => /background-color:/.test(b.text))).toBe(true);
  });

  it('keeps its host-framework resets on press and on focus', () => {
    const active = resets.filter((b) => b.text.startsWith('&:active'));
    const focus = resets.filter((b) => b.text.startsWith('&:focus'));
    expect(active.some((b) => /background-color:\s*transparent/.test(b.text))).toBe(true);
    expect(focus.some((b) => /background-color:\s*transparent/.test(b.text))).toBe(true);
  });

  it('declares its hover after every reset, so hover wins on a focused or pressed button', () => {
    const lastReset = Math.max(...resets.map((b) => b.end));
    const firstHover = Math.min(...hovers.map((b) => b.start));
    expect(firstHover).toBeGreaterThan(lastReset);
  });

  // The order puts hover above the resets, so the media gate is now the only
  // thing between a tap and a background that stays on after it.
  it('gates every hover on a pointer that can hover', () => {
    for (const hover of hovers) {
      expect(hover.text).toMatch(/@media \(hover: hover\)/);
    }
  });
});
