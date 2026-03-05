/**
 * Post-build script: strips all @layer wrappers from compiled CSS.
 *
 * Tailwind v4 compiles @utility definitions into @layer utilities { ... }.
 * Layered styles lose to unlayered styles in the cascade, which breaks
 * non-Tailwind consumers (e.g. Docusaurus) where our component classes
 * need to win over foreign CSS.
 *
 * This script removes @layer declarations and unwraps @layer blocks,
 * producing a flat, unlayered stylesheet.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function unlayer(css) {
  let result = '';
  let i = 0;

  while (i < css.length) {
    // Check for @layer at current position
    if (css[i] === '@' && css.slice(i, i + 7) === '@layer ') {
      // Find the end of the @layer statement — either ';' (declaration) or '{' (block)
      let j = i + 7;
      while (j < css.length && css[j] !== ';' && css[j] !== '{') {
        j++;
      }

      if (css[j] === ';') {
        // @layer declaration (e.g. "@layer theme, base, components, utilities;")
        // Skip it entirely, including trailing newline
        j++;
        if (j < css.length && css[j] === '\n') j++;
        i = j;
        continue;
      }

      if (css[j] === '{') {
        // @layer block — unwrap: keep contents, remove the wrapper
        j++; // skip opening brace
        let depth = 1;
        let start = j;

        while (j < css.length && depth > 0) {
          if (css[j] === '{') depth++;
          else if (css[j] === '}') depth--;
          j++;
        }

        // Extract contents (everything between the braces)
        const contents = css.slice(start, j - 1);
        result += contents;

        // Skip trailing newline after closing brace
        if (j < css.length && css[j] === '\n') j++;
        i = j;
        continue;
      }
    }

    result += css[i];
    i++;
  }

  return result;
}

// Run as CLI script — process all compiled CSS files
const cssFiles = ['components.css', 'components.no-reset.css'];
for (const file of cssFiles) {
  const cssPath = resolve(__dirname, '../css', file);
  const css = readFileSync(cssPath, 'utf8');
  writeFileSync(cssPath, unlayer(css));
}
