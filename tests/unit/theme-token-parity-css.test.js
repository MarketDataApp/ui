import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BUILDS } from './helpers/css.js';

// Issue #50: 49 colour tokens shipped declared for dark and undefined for
// light. Nobody wrote them that way. Both theme blocks declare every token in
// both themes; the build took the light half away.
//
// Tailwind tree-shakes `@theme`, emitting only the tokens some generated
// utility references. The `.dark` block at the foot of flowbite-theme.css is a
// plain CSS rule, so it is never shaken and always ships whole. A token no
// component class happened to use therefore survived in dark and vanished in
// light. `var(--color-neutral-secondary-strong)` then resolved in one theme and
// dropped its whole declaration in the other — no console warning, no visual
// error, and correct in whichever theme the developer had open. The reporter
// lost an active state and shipped white-on-gray-50 text at 1.05:1 to it.
//
// The fix is `@theme static` on both blocks, which exempts them from shaking.
// These assertions are the guard: they compare the two halves of each build
// rather than checking any single token, so a future token added to one theme
// and forgotten in the other fails here instead of at a consumer.

/** Every `--color-*` name declared in `css`, ignoring `var()` references. */
function colourTokens(css) {
  return new Set(css.match(/--color-[\w-]+(?=\s*:)/g) ?? []);
}

/**
 * Top-level rules that scope tokens to dark mode, as emitted.
 *
 * Two reach the build: Flowbite's own `.dark` block, and theme.css's
 * `.dark, [data-theme='dark']` pair for the focus ring. Both are matched at
 * column 0, which is what separates them from the hundreds of indented
 * `.dark\:bg-gray-800` variant utilities that are not token declarations.
 */
const DARK_SCOPE =
  /^(?:\.dark|\[data-theme=['"]dark['"]\])(?:\s*,\s*(?:\.dark|\[data-theme=['"]dark['"]\]))*\s*\{/gm;

/**
 * Split a build into its dark-mode overrides and everything else.
 *
 * The dark half is those rules, emitted verbatim from source. The light half is
 * every other declaration in the file, which is where the shaken `@theme`
 * lands — so "declared for light" means "named outside every dark scope".
 */
function halves(css) {
  const dark = [];
  let light = css;
  for (const match of css.matchAll(DARK_SCOPE)) {
    let depth = 0;
    const open = css.indexOf('{', match.index);
    let i = open;
    for (; i < css.length; i++) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}' && --depth === 0) break;
    }
    const body = css.slice(open + 1, i);
    dark.push(body);
    light = light.replace(body, '');
  }
  if (dark.length === 0) throw new Error('no dark-scoped rule in build output');
  return { dark: dark.join('\n'), light };
}

describe.each(BUILDS)('theme token parity in %s (#50)', (buildPath) => {
  const css = readFileSync(resolve(process.cwd(), buildPath), 'utf8');
  const { dark, light } = halves(css);
  const darkTokens = colourTokens(dark);
  const lightTokens = colourTokens(light);

  it('declares every dark-mode colour token for light mode too', () => {
    const darkOnly = [...darkTokens].filter((t) => !lightTokens.has(t)).sort();
    expect(darkOnly).toEqual([]);
  });

  it('still ships the dark overrides the light values pair with', () => {
    // Parity is satisfiable by emitting nothing at all, so pin the dark half
    // as well. The count is Flowbite's full override set plus our focus ring.
    expect(darkTokens.size).toBeGreaterThan(75);
  });

  // The token from the report, named outright. Parity above would catch it,
  // but a failure here says which token and which theme without arithmetic.
  it.each([
    'neutral-secondary-strong',
    'neutral-secondary-strongest',
    'success-strong',
    'warning-strong',
    'danger-strong',
    'muted',
  ])('resolves --color-%s in both themes', (name) => {
    expect(light).toContain(`--color-${name}:`);
    expect(dark).toContain(`--color-${name}:`);
  });
});
