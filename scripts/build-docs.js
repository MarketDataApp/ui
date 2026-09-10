/**
 * Renders the docs pages that carry server-rendered markup.
 *
 * docs/header.html demonstrates the site header the way consumers ship it:
 * rendered to HTML at build time by `renderHeader()` and present in the
 * initial document, not injected after paint. The page is a template in
 * docs/src/ with one placeholder; this writes the finished page next to the
 * other docs, where scripts/build-site.js and the e2e server pick it up.
 *
 * The output is a build artifact and is gitignored, like docs/docs.css.
 *
 * Runs after build:js because it imports from dist/, so the page shows what
 * the package ships rather than what src/ contains.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const { renderHeader } = await import(resolve(ROOT, 'dist/header.js'));

const template = readFileSync(resolve(ROOT, 'docs/src/header.html'), 'utf8');
const marker = '<!-- @header -->';
if (!template.includes(marker)) {
  throw new Error(`docs/src/header.html has no ${marker} placeholder`);
}

const header = renderHeader({
  // The 320px derivatives the package ships, served from the same site as
  // the docs. Consumers with an image pipeline run the PNG originals through
  // it instead; see README "Site Header".
  logo: {
    light: '../assets/brand/logo-on-light-320.webp',
    dark: '../assets/brand/logo-on-dark-320.webp',
  },
  // The docs are static files, so the page's own path is the current one.
  currentPath: '/pricing/',
});

writeFileSync(resolve(ROOT, 'docs/header.html'), template.replace(marker, header));
console.log('  docs/header.html');
