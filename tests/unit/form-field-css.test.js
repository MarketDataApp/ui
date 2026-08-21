import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BUILDS, ruleBody, nestedState } from './helpers/css.js';

// Issue #47: the kit had no component for two field shapes, so both were
// assembled from .form-input plus a local utility on the marketing site — the
// pattern #44 existed to end.
//
//   1. A multi-line field. `<textarea>` appeared nowhere in css/, docs/ or
//      tests/. .form-input already worked on one, but nothing said so and
//      nothing pinned it, and it carried two rules that are meaningless or
//      wrong there: the :-webkit-autofill repaint and read-only:cursor-not-allowed.
//   2. A field with a leading icon, which needed a wrapper, a hand-picked
//      `ps-9` against form-input's `p-2.5`, an SVG, and an aria-hidden on it.
//
// The answer to (1) is that the element carrying the class decides, so
// `<textarea class="form-input">` just works and cannot drift from the
// single-line fields beside it.

describe.each(BUILDS)('form-input across element types in %s (#47)', (buildPath) => {
  const css = readFileSync(resolve(process.cwd(), buildPath), 'utf8');
  const field = ruleBody(css, '.form-input');

  it('emits the field rule', () => {
    expect(field).not.toBeNull();
  });

  // An element-scoped nested rule rather than a descendant selector or a
  // second class: `&` re-binds when a consumer flattens the utility with
  // `@apply`, so their own class name gets the same `:where(textarea)` rule.
  // A descendant selector would break there — see "Nested Component
  // Contrast" in the README.
  it('scopes the multi-line behaviour to the element, not to a second class', () => {
    expect(field).toMatch(/&:where\(textarea\)/);
    expect(nestedState(field, ':where(textarea)')).toMatch(/resize:\s*vertical/);
  });

  // `:where()`, not `:is()`. `:is()` takes its argument's specificity, so
  // `.form-input:is(textarea)` is (0,1,1) and outranks the `resize-none`
  // utility at (0,1,0) — the documented opt-out silently did nothing. Every
  // assertion above still passed; only a browser check found it.
  it('keeps the element rule overridable by a plain utility', () => {
    expect(field).not.toMatch(/&:is\(textarea\)/);
  });

  // Equal specificity means source order decides. Where the bundle carries
  // both rules — the standalone build — the utility has to come after the
  // component. Verified in a browser: a textarea carrying
  // `form-input resize-none` computes `resize: none`.
  //
  // The no-reset bundle is `source(none)` plus an allowlist of @utility names,
  // so it ships no `resize-none` at all and its consumers get one from their
  // own Tailwind build. Nothing to order here, and asserting otherwise would
  // be asserting that bundle had stopped being restricted.
  it('orders the resize utility after the component, where it ships one', () => {
    const component = css.search(/^\s*\.form-input \{/m);
    const utility = css.search(/^\s*\.resize-none \{/m);
    expect(component).toBeGreaterThan(-1);
    if (buildPath.includes('no-reset')) {
      expect(utility).toBe(-1);
      return;
    }
    expect(utility).toBeGreaterThan(component);
  });

  it('does not emit a separate .form-textarea class', () => {
    expect(ruleBody(css, '.form-textarea')).toBeNull();
  });

  // `vertical`, not the browser default `both`. Horizontal dragging breaks the
  // form's column, and nothing else in the kit lets a control set its own width.
  it('never leaves resize at the browser default', () => {
    expect(field).not.toMatch(/resize:\s*(both|horizontal)/);
  });

  // Chrome does not autofill a textarea, and the repaint is eight declarations
  // of dead weight there. More to the point, it forces -webkit-text-fill-color,
  // which would be wrong on a control the consumer may have coloured.
  it('scopes the autofill repaint to the elements that can autofill', () => {
    const autofill = field.match(/&[^{]*:-webkit-autofill[^{]*\{/g) ?? [];
    expect(autofill.length).toBeGreaterThan(0);
    for (const selector of autofill) {
      expect(selector, `unscoped autofill selector: ${selector}`).toMatch(
        /:is\(\s*input,\s*select\s*\)/,
      );
    }
  });

  // Read-only means "you cannot edit this", not "you cannot use this". A
  // read-only textarea is still scrolled and selected, and not-allowed over
  // text someone is reading is wrong. Input and select keep it — there is
  // nothing to scroll and the cursor is the only affordance saying it is inert.
  it('keeps the read-only cursor off a textarea', () => {
    expect(field).toMatch(/:is\(\s*input,\s*select\s*\)[^{]*\{[^}]*cursor:\s*not-allowed/s);
    expect(nestedState(field, ':is(textarea)')).not.toMatch(/cursor:\s*not-allowed/);
  });

  // The read-only *background* still applies everywhere — only the cursor was
  // element-scoped. Losing the fill would make a read-only textarea look
  // editable.
  it('still greys a read-only field of any type', () => {
    expect(nestedState(field, ':read-only')).toMatch(/background-color/);
  });
});

describe.each(BUILDS)('form-input leading padding in %s (#47)', (buildPath) => {
  const css = readFileSync(resolve(process.cwd(), buildPath), 'utf8');
  const field = ruleBody(css, '.form-input');

  // The consumer used to pick this, as `ps-9` next to form-input's `p-2.5` —
  // two utilities at equal specificity settled by Tailwind's internal order.
  // It now comes from the group as an inherited custom property, which is a
  // value rather than a competing declaration.
  it('takes its leading padding from a cascade signal with a matching fallback', () => {
    expect(field).toMatch(
      /padding-inline-start:\s*var\(--form-input-ps,\s*calc\(var\(--spacing\) \* 2\.5\)\)/,
    );
  });

  // The fallback has to equal what p-2.5 already gave it, or every field
  // outside a group silently shifts.
  it('declares the signal after the shorthand, so it is the one that lands', () => {
    const shorthand = field.indexOf('padding: calc(var(--spacing) * 2.5)');
    const signal = field.indexOf('padding-inline-start: var(--form-input-ps');
    expect(shorthand).toBeGreaterThan(-1);
    expect(signal).toBeGreaterThan(shorthand);
  });
});

describe.each(BUILDS)('form-input-group in %s (#47)', (buildPath) => {
  const css = readFileSync(resolve(process.cwd(), buildPath), 'utf8');
  const group = ruleBody(css, '.form-input-group');

  it('emits the group rule', () => {
    expect(group).not.toBeNull();
  });

  it('anchors the glyph it positions', () => {
    expect(group).toMatch(/position:\s*relative/);
  });

  // The glyph is the wrapper's own ::before, so there is no markup for it: no
  // <svg> to paste and no aria-hidden to remember, because a pseudo-element is
  // already decorative to assistive technology.
  it('carries the glyph itself rather than asking for icon markup', () => {
    expect(group).toMatch(/&::before/);
    expect(group).toMatch(/mask-image:\s*var\(\s*--form-icon/);
    expect(group).toMatch(/content:\s*''/);
  });

  // A bare group has to stay a plain wrapper. Absolute positioning is what
  // makes an unset --form-icon cost nothing: the pseudo-element paints no mask
  // and takes no space, so the field keeps its normal padding.
  it('costs nothing when no icon class is applied', () => {
    const before = nestedState(group, '::before');
    expect(before).toMatch(/position:\s*absolute/);
    expect(group).not.toMatch(/--form-input-ps:/);
  });

  // The mask needs an empty-SVG fallback, not a bare var(). An unset custom
  // property makes the declaration invalid at computed-value time, so
  // mask-image falls back to its initial `none` — and no mask means nothing is
  // masked out, so the pseudo-element painted a solid 16px square over the
  // start of every un-iconed field. Masking with an empty SVG is zero alpha
  // everywhere, which is the "paint nothing" this needs. Every assertion here
  // passed while that square was on screen.
  it('masks with an empty SVG when no icon is set, rather than not masking', () => {
    const before = nestedState(group, '::before');
    const masks = before.match(/mask-image:[^;]+;/g) ?? [];
    expect(masks.length).toBeGreaterThan(0);
    for (const declaration of masks) {
      expect(declaration, `mask without a fallback: ${declaration}`).toMatch(
        /var\(\s*--form-icon,\s*url\("data:image\/svg\+xml/,
      );
    }
  });

  // Matching the placeholder's token, so the two read as one piece of chrome
  // and dark mode needs no second value.
  it('tints the glyph with the same token the placeholder uses', () => {
    expect(nestedState(group, '::before')).toMatch(/background-color:\s*var\(--color-body\)/);
  });

  // A glyph that swallowed clicks would stop the field focusing when a user
  // clicks the icon, which reads as a dead control.
  it('lets clicks through to the field', () => {
    expect(nestedState(group, '::before')).toMatch(/pointer-events:\s*none/);
  });

  // Logical property, so the icon moves to the right edge in RTL rather than
  // sitting on top of the text.
  it('positions the glyph logically, not to the left', () => {
    const before = nestedState(group, '::before');
    expect(before).toMatch(/inset-inline-start/);
    expect(before).not.toMatch(/(^|\s)left:/);
  });
});

describe.each(BUILDS)('form-icon-* presets in %s (#47)', (buildPath) => {
  const css = readFileSync(resolve(process.cwd(), buildPath), 'utf8');
  const ICONS = ['envelope', 'user', 'lock', 'phone', 'search'];

  it.each(ICONS)('.form-icon-%s emits', (name) => {
    expect(ruleBody(css, `.form-icon-${name}`)).not.toBeNull();
  });

  // Both properties, every time. The glyph without the padding puts the icon
  // on top of the text; the padding without the glyph leaves a 36px gap. They
  // are one decision and a preset that sets only one of them is broken.
  it.each(ICONS)('.form-icon-%s sets both the glyph and the room for it', (name) => {
    const icon = ruleBody(css, `.form-icon-${name}`);
    expect(icon).toMatch(/--form-icon:\s*url\("data:image\/svg\+xml/);
    expect(icon).toMatch(/--form-input-ps:\s*calc\(var\(--spacing\) \* 9\)/);
  });

  // Each preset is a pair of custom properties and nothing else — no padding,
  // no colour, no positioning. Those belong to the group, which is what lets a
  // consumer supply an unlisted glyph with the same two properties inline.
  it.each(ICONS)('.form-icon-%s declares nothing but those two properties', (name) => {
    const icon = ruleBody(css, `.form-icon-${name}`);
    const declarations = icon
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean);
    expect(declarations.length).toBe(2);
  });
});
