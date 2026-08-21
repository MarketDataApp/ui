import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BUILDS, ruleBody, nestedState } from './helpers/css.js';

/**
 * Count how many top-level rules a class emits.
 *
 * Composing a utility that itself composes another makes Tailwind emit the
 * class twice — once with its own overrides and once as a bare copy of the
 * base — and the bare copy wins, being second. ruleBody() reads the FIRST,
 * so every assertion here passed while the browser rendered the other one.
 * That is the failure this guards, and it is invisible to any check that
 * looks at one rule.
 */
function ruleCount(css, className) {
  return css.split('\n').filter((l) => l.trim() === `.${className} {`).length;
}

// Issue #44: the search group — a text field with a submit button joined to its
// trailing edge — was hand-rolled in the consumer on 66 pages. Two things went
// wrong there that a kit utility has to make impossible:
//
//   1. Chromium's search clear "×" landed flush against the attached button and
//      collided with the query text. Preflight resets
//      ::-webkit-search-decoration and not this one.
//   2. The two halves drifted apart in height, because each carried its own
//      padding and only one of them carried a border.
//
// The issue also asked for a boundary clearing 3:1, and the component shipped
// one. The owner then compared it against Flowbite's own search input and chose
// Flowbite's colours instead, which do not clear 3:1 — see the note in
// components.src.css. These assertions therefore pin the mirroring, not the
// contrast: the point is that the values are Flowbite's and stay Flowbite's.
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

  // It still composes .form-input, for the behaviour rather than the colours:
  // the autofill repaint is the cheapest proof the composition emitted, and it
  // is the part a hand-written field would most likely omit.
  it("carries form-input's behaviour, not just its look", () => {
    expect(field).toMatch(/:-webkit-autofill/);
    expect(field).toMatch(/cursor:\s*not-allowed/);
  });

  // Surface colours mirror Flowbite's own search input. Both tokens are
  // theme-aware on their own, so a `dark:` variant for either would be a bug —
  // a second value to keep in step with the one that already moves.
  it("mirrors Flowbite's surface tokens rather than form-input's raw grays", () => {
    expect(field).toMatch(/background-color:\s*var\(--color-neutral-secondary-medium\)/);
    expect(field).toMatch(/border-color:\s*var\(--color-default-medium\)/);
  });

  // The subtle part, and the reason this assertion exists at all. Composing
  // .form-input still emits its `dark:bg-gray-700` / `dark:border-gray-600`
  // into this rule. Those land at the SAME specificity as our plain
  // declarations — the dark variant compiles to `&:where(.dark, …)` and
  // :where() contributes nothing — so the cascade is settled by source order
  // alone, and ours only wins because it comes last.
  //
  // Reordering the @apply lines above would silently hand dark mode back to
  // form-input's grays, with no build error and nothing visibly wrong in light
  // mode. Verified in a browser at the time of writing: the field resolves to
  // #f9fafb/#e5e7eb in light and #1e2939/#364153 in dark, which are Flowbite's
  // own values measured from their live docs.
  it('declares its surface colours last, which is the only reason they win', () => {
    const after = (ours, inherited) => {
      const a = field.lastIndexOf(ours);
      const b = field.lastIndexOf(inherited);
      expect(a, `missing: ${ours}`).toBeGreaterThan(-1);
      expect(b, `missing: ${inherited}`).toBeGreaterThan(-1);
      expect(a).toBeGreaterThan(b);
    };
    after(
      'background-color: var(--color-neutral-secondary-medium)',
      'background-color: var(--color-gray-700)',
    );
    after('border-color: var(--color-default-medium)', 'border-color: var(--color-gray-600)');
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

describe.each(BUILDS)('search-input-button-icon in %s (#44)', (buildPath) => {
  const css = readFileSync(resolve(process.cwd(), buildPath), 'utf8');
  const icon = ruleBody(css, '.search-input-button-icon');

  it('emits the icon variant', () => {
    expect(icon).not.toBeNull();
  });

  // The glyph comes from CSS, like .copy-icon's clipboard. The point is not
  // tidiness: an inline <svg> reaches the accessible name unless a consumer
  // marks it aria-hidden by hand, and a pseudo-element never does. So the
  // button's accessible name is its own label in every variant, by
  // construction, with nothing for a consumer to remember.
  // Solid, matching the kit's other icons — the theme toggle, the person, the
  // admonitions. This shipped stroked in 5.8.0 and looked foreign beside them.
  it('uses a filled glyph, like the rest of the kit', () => {
    expect(icon).toMatch(/fill='black'/);
    expect(icon, 'stroked outline — the kit uses solid icons').not.toMatch(/stroke='black'/);
  });

  it('carries its own glyph as a mask-image on ::before', () => {
    expect(icon).toMatch(/&::before/);
    expect(icon).toMatch(/--search-icon:\s*url\("data:image\/svg\+xml/);
    expect(icon).toMatch(/mask-image:\s*var\(--search-icon\)/);
    expect(icon).toMatch(/content:\s*''/);
  });

  // Follows the text colour rather than declaring one, so hover and the
  // disabled state cannot leave the glyph a different colour from the label.
  it('tints the glyph from currentColor', () => {
    expect(icon).toMatch(/background-color:\s*currentColor/);
  });

  it('composes the base button, so the height and halo come with it', () => {
    expect(icon).toMatch(/padding-block:\s*calc\(var\(--spacing\) \* 2\.5\)/);
    expect(icon).toMatch(/background-color:\s*var\(--color-brand-strong\)/);
  });
});

describe.each(BUILDS)('search-input-button-compact in %s (#44)', (buildPath) => {
  const css = readFileSync(resolve(process.cwd(), buildPath), 'utf8');
  const compact = ruleBody(css, '.search-input-button-compact');

  it('emits the icon-only variant', () => {
    expect(compact).not.toBeNull();
  });

  // The regression that prompted this: composing search-input-button-icon —
  // itself a composition — emitted this class twice, and the second, bare copy
  // won. font-size: 0, gap-0 and px-3 were all discarded and the button
  // rendered as icon-plus-label, while every assertion below still passed
  // because they read the first rule. Every variant is checked, not just this
  // one, so the next composition that goes three deep fails here.
  it.each(['search-input-button', 'search-input-button-icon', 'search-input-button-compact'])(
    '.%s emits exactly one rule, so no bare copy can outrank it',
    (className) => {
      expect(ruleCount(css, className)).toBe(1);
    },
  );

  // Icon-only is a presentation choice, so the label stays in the DOM and stays
  // the accessible name — only its glyphs collapse. font-size: 0 is the whole
  // mechanism; without it the variant would need aria-label in every consumer's
  // markup, which is the thing this design set out to remove.
  it('collapses the label visually while leaving it in the accessible name', () => {
    expect(compact).toMatch(/font-size:\s*0/);
  });

  // The height survives font-size: 0 only because leading-5 is a length rather
  // than a multiple — the text still generates a 20px line box at zero font
  // size. A unitless line-height here would collapse the button and step the
  // join, and nothing else in the rule would look wrong.
  it('keeps a line-height that does not depend on the font size', () => {
    expect(compact).toMatch(/line-height:\s*var\(--leading-5\)/);
    expect(compact).not.toMatch(/line-height:\s*(1|normal)\s*;/);
  });

  // A zero-width label still gets pushed off-centre by the base button's 8px
  // gap, so the glyph would not sit in the middle of its own button.
  it('drops the gap the label would otherwise leave behind', () => {
    const gaps = [...compact.matchAll(/gap:\s*calc\(var\(--spacing\) \* ([\d.]+)\)/g)];
    expect(gaps.at(-1)?.[1]).toBe('0');
  });

  it('carries the glyph through from the icon variant', () => {
    expect(compact).toMatch(/mask-image:\s*var\(--search-icon\)/);
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
