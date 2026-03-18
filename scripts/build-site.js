/**
 * Assembles the _site/ directory for GitHub Pages deployment.
 *
 * - Copies docs/*.html with cache-bust query params on CSS/JS imports
 * - Copies docs assets (CSS, images)
 * - Copies dist/*.js with cache-bust on inter-module imports
 * - Generates a redirect index.html
 *
 * Cache-bust value: first 7 chars of current git commit SHA,
 * or "dev" when running locally with uncommitted changes.
 *
 * Run: npm run build:site
 */

import { readFileSync, writeFileSync, mkdirSync, cpSync, readdirSync, rmSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SITE = resolve(ROOT, '_site');
const DOCS = resolve(ROOT, 'docs');
const DIST = resolve(ROOT, 'dist');

// ---------------------------------------------------------------------------
// Cache-bust value
// ---------------------------------------------------------------------------

function getCacheBust() {
  try {
    return execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim();
  } catch {
    return 'dev';
  }
}

const CACHE_BUST = getCacheBust();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Add ?v=HASH to .css" and .js'; references in file content. */
function cacheBustImports(content) {
  return content
    .replace(/\.css"/g, `.css?v=${CACHE_BUST}"`)
    .replace(/\.js';/g, `.js?v=${CACHE_BUST}';`);
}

// ---------------------------------------------------------------------------
// Assemble
// ---------------------------------------------------------------------------

// Clean and create output directories
rmSync(SITE, { recursive: true, force: true });
mkdirSync(resolve(SITE, 'docs'), { recursive: true });
mkdirSync(resolve(SITE, 'dist'), { recursive: true });

// 1. Copy and cache-bust HTML files
for (const file of readdirSync(DOCS)) {
  if (!file.endsWith('.html')) continue;
  const content = readFileSync(resolve(DOCS, file), 'utf8');
  writeFileSync(resolve(SITE, 'docs', file), cacheBustImports(content));
  console.log(`  _site/docs/${file}`);
}

// 2. Copy docs assets (CSS, images)
cpSync(resolve(DOCS, 'docs.css'), resolve(SITE, 'docs', 'docs.css'));
console.log('  _site/docs/docs.css');

for (const file of readdirSync(DOCS)) {
  if (/\.(avif|png|svg|ico)$/.test(file)) {
    cpSync(resolve(DOCS, file), resolve(SITE, 'docs', file));
    console.log(`  _site/docs/${file}`);
  }
}

// 3. Copy and cache-bust ALL dist JS files (no hardcoded list)
for (const file of readdirSync(DIST)) {
  if (!file.endsWith('.js')) continue;
  const content = readFileSync(resolve(DIST, file), 'utf8');
  writeFileSync(resolve(SITE, 'dist', file), cacheBustImports(content));
  console.log(`  _site/dist/${file}`);
}

// 4. Redirect index
writeFileSync(resolve(SITE, 'index.html'), '<meta http-equiv="refresh" content="0;url=docs/">\n');
console.log('  _site/index.html (redirect)');

console.log(`\nSite assembled in _site/ (cache-bust: ${CACHE_BUST})`);
