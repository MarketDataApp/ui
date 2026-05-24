/**
 * Pre-build script: regenerates css/components.classes from the @utility
 * declarations in css/components.src.css.
 *
 * The no-reset CSS build (css/components.no-reset.input.css) uses
 * `source(none)` to disable Tailwind's automatic content detection, then
 * relies on `@source "./components.classes"` as an explicit allowlist of
 * which utility selectors to emit. Without this script, the allowlist
 * had to be maintained by hand — and silently drifted from the actual
 * @utility definitions (.spinner was missing from 4.10.0 onward, .card-surface
 * never shipped, most copy-input variants were absent in the no-reset bundle).
 *
 * Parsing the @utility names from components.src.css and writing them as
 * the allowlist makes drift impossible: every utility you define ships to
 * every consumer automatically.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const srcPath = resolve(__dirname, '../css/components.src.css');
const outPath = resolve(__dirname, '../css/components.classes');

const css = readFileSync(srcPath, 'utf8');
const names = [...css.matchAll(/^@utility\s+([a-zA-Z][a-zA-Z0-9_-]*)\s*\{/gm)].map((m) => m[1]);

const seen = new Set();
const unique = names.filter((n) => (seen.has(n) ? false : seen.add(n)));

writeFileSync(outPath, unique.join(' ') + '\n');
console.log(`Wrote ${unique.length} @utility names to css/components.classes`);
