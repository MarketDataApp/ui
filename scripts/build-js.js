/**
 * Builds root-level JS files from src/.
 *
 * For files with templates (user-profile.js, theme-toggle.js):
 *   - Reads the source from src/
 *   - Reads the corresponding .templates.js from src/
 *   - Replaces the `import { ... } from './foo.templates.js'` with inlined
 *     const declarations
 *   - Writes to root with a "do not edit" header
 *
 * For files without templates (theme.js, navbar-overflow.js):
 *   - Copies from src/ to root with a header
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC = resolve(ROOT, 'src');

const HEADER = '// Auto-generated from src/ by scripts/build-js.js — do not edit manually\n\n';

const FILES_WITH_TEMPLATES = ['user-profile.js', 'theme-toggle.js'];
const FILES_WITHOUT_TEMPLATES = ['theme.js', 'navbar-overflow.js'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse `export const name = <json>;` declarations from a .templates.js file. */
function parseTemplateExports(content) {
  const exports = {};
  const re = /^export const (\w+) = (.*);$/gm;
  let m;
  while ((m = re.exec(content))) {
    exports[m[1]] = m[2]; // keep the raw JSON string literal
  }
  return exports;
}

/** Replace the templates import with inlined const declarations. */
function inlineTemplates(source, templateExports) {
  // Match single-line or multi-line: import { ... } from './foo.templates.js';
  const importRe = /import\s*\{([^}]+)\}\s*from\s*['"]\.\/\S+\.templates\.js['"];?\n?/;
  const match = source.match(importRe);
  if (!match) {
    throw new Error('Could not find templates import in source');
  }

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
    const value = templateExports[exportedName];
    if (value === undefined) {
      throw new Error(`Template export "${exportedName}" not found`);
    }
    lines.push(`const ${localName} = ${value};`);
  }

  return source.replace(match[0], lines.join('\n') + '\n');
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

for (const file of FILES_WITH_TEMPLATES) {
  const source = readFileSync(resolve(SRC, file), 'utf8');
  const tplFile = file.replace(/\.js$/, '.templates.js');
  const tplContent = readFileSync(resolve(SRC, tplFile), 'utf8');
  const tplExports = parseTemplateExports(tplContent);

  const output = HEADER + inlineTemplates(source, tplExports);
  writeFileSync(resolve(ROOT, file), output);
  console.log(`  ${file} (templates inlined)`);
}

for (const file of FILES_WITHOUT_TEMPLATES) {
  const source = readFileSync(resolve(SRC, file), 'utf8');
  writeFileSync(resolve(ROOT, file), HEADER + source);
  console.log(`  ${file} (copied)`);
}
