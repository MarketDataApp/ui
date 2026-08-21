import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BUILDS, ruleBody, nestedState } from './helpers/css.js';

// Issue #44: the search group — a text field with a submit button joined to its
// trailing edge — was hand-rolled in the consumer on 66 pages. Three things
// went wrong there that a kit utility has to make impossible:
//
//   1. The field's boundary was invisible. The consumer reached for
//      `border-default-medium` beside `bg-default-medium` — the same token, so
//      the border painted the fill colour and drew nothing. 1.24:1 against the
//      panel in light, 1.42:1 in dark, both under the 3:1 WCAG 1.4.11 asks of a
//      UI component boundary.
//   2. Chromium's search clear "×" landed flush against the attached button and
//      collided with the query text. Preflight resets
//      ::-webkit-search-decoration and not this one.
//   3. The two halves drifted apart in height, because each carried its own
//      padding and only one of them carried a border.
//
// These read the built artifacts consumers link, not the `@apply` source. A
// utility that never emitted would pass a source-string check and still ship
// broken to every property.

const RING_1 = /0 0 0 calc\(1px \+ var\(--tw-ring-offset-width\)\)/;
const RING_4 = /0 0 0 calc\(4px \+ var\(--tw-ring-offset-width\)\)/;

/** Join every `&:where(.dark …)` block inside an extracted rule body. */
function darkBlocks(body) {
  const out = [];
  const needle = '&:where(.dark';
  let from = 0;
  for (;;) {
    const start = body.indexOf(needle, from);
    if (start === -1) break;
    const open = body.indexOf('{', start);
    let depth = 0;
    let i = open;
    for (; i < body.length; i++) {
      if (body[i] === '{') depth++;
      else if (body[i] === '}' && --depth === 0) break;
    }
    out.push(body.slice(open + 1, i));
    from = i;
  }
  return out.join('\n');
}

describe.each(BUILDS)('search-input-group in %s (#44)', (buildPath) => {
  const css = readFileSync(resolve(process.cwd(), buildPath), 'utf8');
  const group = ruleBody(css, '.search-input-group');

  it('emits the group rule', () => {
    expect(group).not.toBeNull();
  });

  // The two halves have to sit on one line and fill the bar they live in.
  it('lays the two halves out in a row across the full width', () => {
    expect(group).toMatch(/display:\s*flex/);
    expect(group).toMatch(/width:\s*100%/);
  });
});

describe.each(BUILDS)('search-input in %s (#44)', (buildPath) => {
  const css = readFileSync(resolve(process.cwd(), buildPath), 'utf8');
  const field = ruleBody(css, '.search-input');

  it('emits the field rule', () => {
    expect(field).not.toBeNull();
  });

  // The field composes .form-input rather than restating a field style, so a
  // search field and a plain field stay the same control. gray-50 is
  // form-input's fill and is the cheapest proof the composition emitted.
  it("carries form-input's fill, so the two field styles cannot drift", () => {
    expect(field).toMatch(/var\(--color-gray-50\)/);
    expect(darkBlocks(field)).toMatch(/var\(--color-gray-700\)/);
  });

  // Boundary contrast. form-input's own border sits under 3:1 in both themes.
  // Measured on the demo panel, gray-500/gray-400 clear it: 4.84:1 light and
  // 5.64:1 dark. Any lighter token here is issue #44 returning.
  it('draws a boundary that clears 3:1 in both themes', () => {
    expect(field).toMatch(/border-color:\s*var\(--color-gray-500\)/);
    expect(darkBlocks(field)).toMatch(/border-color:\s*var\(--color-gray-400\)/);
  });

  // The button supplies the shared edge. Without border-e-0 the join carries
  // two strokes and reads as a gap between two controls.
  it('gives up its trailing edge to the button', () => {
    expect(field).toMatch(/border-inline-end-width:\s*0px/);
    expect(field).toMatch(/border-start-end-radius:\s*0/);
    expect(field).toMatch(/border-end-end-radius:\s*0/);
  });

  // Chromium's clear "×" is mouse-only, has no accessible name, and lands on
  // top of the attached button.
  it('removes the webkit search decorations', () => {
    expect(field).toMatch(/&::-webkit-search-cancel-button/);
    expect(field).toMatch(/&::-webkit-search-results-button/);
  });

  // The ring is form-input's, inherited, not a second focus treatment: 1px in
  // --color-brand. The kit's brand is blue; a consumer that remaps it to red
  // gets a red ring by its own choice.
  it("rings on focus in the kit's field colour, at the kit's field width", () => {
    const focus = nestedState(field, ':focus');
    expect(focus).toMatch(RING_1);
    expect(focus).toMatch(/--tw-ring-color:\s*var\(--color-brand\)/);
  });

  // The ring paints outside the border box, so the button — later in the DOM —
  // covers it at the join unless the focused half lifts itself out.
  it('lifts itself above the button so the ring survives the join', () => {
    const focus = nestedState(field, ':focus');
    expect(focus).toMatch(/position:\s*relative/);
    expect(focus).toMatch(/z-index:\s*1/);
  });
});

describe.each(BUILDS)('search-input-button in %s (#44)', (buildPath) => {
  const css = readFileSync(resolve(process.cwd(), buildPath), 'utf8');
  const button = ruleBody(css, '.search-input-button');

  it('emits the button rule', () => {
    expect(button).not.toBeNull();
  });

  it('fills in the brand and labels in white', () => {
    expect(button).toMatch(/background-color:\s*var\(--color-brand-strong\)/);
    expect(button).toMatch(/color:\s*var\(--color-white\)/);
  });

  it('squares off the edge it shares with the field', () => {
    expect(button).toMatch(/border-start-start-radius:\s*0/);
    expect(button).toMatch(/border-end-start-radius:\s*0/);
    expect(button).toMatch(/border-start-end-radius:\s*var\(--radius-base\)/);
    expect(button).toMatch(/border-end-end-radius:\s*var\(--radius-base\)/);
  });

  // Height lock. The field is 20px line + 20px padding + 2px border = 42px. The
  // button matches only if it carries the same vertical padding AND a border of
  // its own — a borderless button lands 2px short and the join steps.
  it('matches the field height by carrying the same padding and a border', () => {
    expect(button).toMatch(/padding-block:\s*calc\(var\(--spacing\) \* 2\.5\)/);
    expect(button).toMatch(/border-style:\s*var\(--tw-border-style\)/);
    expect(button).toMatch(/border-width:\s*1px/);
    expect(button).toMatch(/line-height:\s*var\(--leading-5\)/);
  });

  // A 4px halo in brand-medium, not the field's 1px ring. The fill IS
  // brand-strong, one step from brand, so a ring-brand ring measured 1.29:1
  // against it and rest and focused were the same picture in both themes.
  // brand-medium is theme-aware on its own — blue-200 light, blue-900 dark —
  // so a dark-mode override here would be a bug, not a gap.
  it('rings with a 4px halo in brand-medium', () => {
    const focus = nestedState(button, ':focus-visible');
    expect(focus).toMatch(RING_4);
    expect(focus).toMatch(/--tw-ring-color:\s*var\(--color-brand-medium\)/);
    expect(focus).not.toMatch(RING_1);
  });

  // :focus-visible, not :focus. :focus also fires on a mouse click, so a
  // clicked submit button would keep its ring until the user clicked elsewhere.
  // Every button in the kit made this same move — see issue #41.
  it('rings on keyboard focus only', () => {
    expect(button).toMatch(/&:focus-visible/);
    expect(nestedState(button, ':focus')).not.toMatch(RING_1);
  });

  it('lifts itself above the field so the ring survives the join', () => {
    const focus = nestedState(button, ':focus-visible');
    expect(focus).toMatch(/position:\s*relative/);
    expect(focus).toMatch(/z-index:\s*1/);
  });

  // The field is w-full inside a flex row, so an unprotected button gets
  // squeezed to its text and then below it.
  it('holds its width against the full-width field', () => {
    expect(button).toMatch(/flex-shrink:\s*0/);
  });
});

describe.each(BUILDS)('search-input-button-compact in %s (#44)', (buildPath) => {
  const css = readFileSync(resolve(process.cwd(), buildPath), 'utf8');
  const compact = ruleBody(css, '.search-input-button-compact');

  it('emits the icon-only variant', () => {
    expect(compact).not.toBeNull();
  });

  // Icon-only, so the label's side padding would leave the glyph adrift. The
  // variant composes the base, so both px values emit and the later one wins —
  // asserting on the last occurrence is what "the override took" means here.
  it('tightens the side padding, and the override is the one that lands', () => {
    const inline = [...compact.matchAll(/padding-inline:\s*calc\(var\(--spacing\) \* ([\d.]+)\)/g)];
    expect(inline.at(-1)?.[1]).toBe('3');
  });

  // It composes the base rather than sitting beside it, so a consumer cannot
  // apply the modifier alone and lose the button. The height comes with it.
  it('carries the base button, so the height survives', () => {
    expect(compact).toMatch(/padding-block:\s*calc\(var\(--spacing\) \* 2\.5\)/);
    expect(compact).toMatch(/background-color:\s*var\(--color-brand-strong\)/);
  });
});
