/**
 * Helpers for asserting against the BUILT CSS in dist/css.
 *
 * These tests read the build outputs, not the `@apply` source, because
 * dist/css is what consumers link. A rule that never emitted would pass a
 * source-string check and still ship broken to every property.
 */

/** The two build outputs every component rule has to reach. */
export const BUILDS = ['dist/css/components.css', 'dist/css/components.no-reset.css'];

/**
 * Extract one rule's declaration block by brace matching.
 *
 * Brace matching, not a regex, because Tailwind v4 emits native nesting — a
 * component rule holds `&:hover`, `&:focus-visible` and `@media` blocks, so
 * the first `}` is never the end of the rule.
 *
 * @param {string} css full stylesheet text
 * @param {string} selector exact selector text, as emitted
 * @returns {string | null} the declaration block, or null if the rule is absent
 */
export function ruleBody(css, selector) {
  const needle = `${selector} {`;
  for (let from = 0; ; ) {
    const at = css.indexOf(needle, from);
    if (at === -1) return null;

    // Only accept a match that opens its own line. Utility rules are indented
    // (they were nested in `@layer` before scripts/unlayer.js flattened them),
    // so an exact `\n<selector>` test would miss every one of them — and a
    // bare indexOf would happily match `.btn-blue` inside `.btn-blue-to-orange`.
    const lineStart = css.lastIndexOf('\n', at) + 1;
    if (css.slice(lineStart, at).trim() === '') {
      let depth = 0;
      for (let i = at; i < css.length; i++) {
        if (css[i] === '{') depth++;
        else if (css[i] === '}' && --depth === 0) return css.slice(css.indexOf('{', at) + 1, i);
      }
      return null;
    }
    from = at + 1;
  }
}

/**
 * Extract the nested `&<suffix>` blocks inside an already-extracted rule body.
 *
 * Tailwind emits one block per `@apply` directive rather than merging them, so
 * a rule can hold several `&:focus-visible` blocks. This returns all of them
 * joined, which is what an assertion about "the focus-visible state" means.
 *
 * @param {string} body a declaration block from ruleBody()
 * @param {string} suffix e.g. ':focus-visible'
 * @returns {string} the joined contents of every matching nested block
 */
export function nestedState(body, suffix) {
  const out = [];
  const needle = `&${suffix} {`;
  let from = 0;
  for (;;) {
    const start = body.indexOf(needle, from);
    if (start === -1) break;
    let depth = 0;
    let i = body.indexOf('{', start);
    const open = i;
    for (; i < body.length; i++) {
      if (body[i] === '{') depth++;
      else if (body[i] === '}' && --depth === 0) break;
    }
    out.push(body.slice(open + 1, i));
    from = i;
  }
  return out.join('\n');
}
