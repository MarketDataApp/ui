/**
 * Builds dist/ JS files from src/.
 *
 * For files with local imports (user-profile.js, theme-toggle.js, reviews.js):
 *   - Reads the source from src/
 *   - Finds all local `import { ... } from './foo.(templates|data).js'`
 *   - Reads the corresponding .js file from src/
 *   - Replaces each import with inlined const declarations
 *   - Writes to dist/ with a "do not edit" header
 *
 * For files without local imports (theme.js, navbar-overflow.js):
 *   - Copies from src/ to dist/ with a header
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC = resolve(ROOT, 'src');
const DIST = resolve(ROOT, 'dist');

mkdirSync(DIST, { recursive: true });

const HEADER = '// Auto-generated from src/ by scripts/build-js.js — do not edit manually\n\n';

const FILES_WITH_LOCAL_IMPORTS = ['user-profile.js', 'theme-toggle.js', 'reviews.js'];
const FILES_WITHOUT_LOCAL_IMPORTS = [
  'theme.js',
  'user.js',
  'navbar-overflow.js',
  'reviews.platform.js',
  'dark-images.js',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse `export const name = <value>;` declarations from a .js file. */
function parseExportConsts(content) {
  const exports = {};
  const re = /^export const (\w+) = (.*);$/gm;
  let m;
  while ((m = re.exec(content))) {
    exports[m[1]] = m[2]; // keep the raw value literal
  }
  return exports;
}

/** Replace all local .templates.js and .data.js imports with inlined consts. */
function inlineLocalImports(source) {
  const importRe = /import\s*\{([^}]+)\}\s*from\s*['"]\.\/(\S+\.(?:templates|data)\.js)['"];?\n?/g;
  let result = source;
  const matches = [...source.matchAll(importRe)];

  if (matches.length === 0) {
    throw new Error('Could not find any local imports to inline');
  }

  for (const match of matches) {
    const localFile = match[2];
    const localPath = resolve(SRC, localFile);
    const content = readFileSync(localPath, 'utf8');
    const exports = parseExportConsts(content);

    // Parse the import specifiers: "name" or "name as alias"
    const specifiers = match[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const lines = [];
    for (const spec of specifiers) {
      const parts = spec.split(/\s+as\s+/);
      const exportedName = parts[0].trim();
      const localName = (parts[1] || parts[0]).trim();
      const value = exports[exportedName];
      if (value === undefined) {
        throw new Error(`Export "${exportedName}" not found in ${localFile}`);
      }
      lines.push(`const ${localName} = ${value};`);
    }

    result = result.replace(match[0], lines.join('\n') + '\n');
  }

  return result;
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

for (const file of FILES_WITH_LOCAL_IMPORTS) {
  const source = readFileSync(resolve(SRC, file), 'utf8');
  const output = HEADER + inlineLocalImports(source);
  writeFileSync(resolve(DIST, file), output);
  console.log(`  dist/${file} (local imports inlined)`);
}

for (const file of FILES_WITHOUT_LOCAL_IMPORTS) {
  const source = readFileSync(resolve(SRC, file), 'utf8');
  writeFileSync(resolve(DIST, file), HEADER + source);
  console.log(`  dist/${file} (copied)`);
}
