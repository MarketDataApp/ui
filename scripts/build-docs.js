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

const { renderHeader, defaultNavigation } = await import(resolve(ROOT, 'dist/header.js'));

const template = readFileSync(resolve(ROOT, 'docs/src/header.html'), 'utf8');
const marker = '<!-- @header -->';
const offSiteMarker = '<!-- @off-site -->';
for (const m of [marker, offSiteMarker]) {
  if (!template.includes(m)) throw new Error(`docs/src/header.html has no ${m} placeholder`);
}

// The 320px derivatives the package ships, served from the same site as the
// docs. Consumers with an image pipeline run the PNG originals through it
// instead; see README "Site Header".
const logo = {
  light: '../assets/brand/logo-on-light-320.webp',
  dark: '../assets/brand/logo-on-dark-320.webp',
};

const header = renderHeader({
  logo,
  // The docs are static files, so the page's own path is the current one.
  currentPath: '/pricing/',
});

// Where each external link opens, read back from what renderHeader() wrote
// for the website and for the board, so the rows cannot drift from the code.
const BOARD = 'https://roadmap.marketdata.app';
const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const tabsIn = (html) => {
  const tabs = new Map();
  for (const [tag] of html.matchAll(/<a\b[^>]*>/g)) {
    const href = tag
      .match(/\bhref="([^"]*)"/)?.[1]
      ?.replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
    if (href) tabs.set(href, /\btarget="_blank"/.test(tag) ? 'new tab' : 'same tab');
  }
  return tabs;
};
const onWebsite = tabsIn(header);
const onBoard = tabsIn(renderHeader({ logo, currentOrigin: BOARD }));
const externals = defaultNavigation
  .flatMap((item) =>
    item.type === 'dropdown' ? [...item.columns, item.aside ?? { links: [] }] : [],
  )
  .flatMap((section) => section.links)
  .filter((link) => link.external && !link.disabled);
const offSite =
  `<div class="overflow-x-auto"><table class="w-full text-sm">` +
  `<thead><tr class="border-b border-gray-200 dark:border-gray-700">` +
  `<th class="text-start py-2 px-3">Link</th><th class="text-start py-2 px-3">href</th>` +
  `<th class="text-start py-2 px-3">On www.marketdata.app</th>` +
  `<th class="text-start py-2 px-3">On roadmap.marketdata.app</th></tr></thead>` +
  `<tbody class="divide-y divide-gray-100 dark:divide-gray-800">` +
  externals
    .map(
      (link) =>
        `<tr><td class="py-2 px-3">${esc(link.label)}</td>` +
        `<td class="py-2 px-3 font-mono text-xs">${esc(link.href)}</td>` +
        `<td class="py-2 px-3">${onWebsite.get(link.href)}</td>` +
        `<td class="py-2 px-3">${onBoard.get(link.href)}</td></tr>`,
    )
    .join('') +
  `</tbody></table></div>`;

writeFileSync(
  resolve(ROOT, 'docs/header.html'),
  template.replace(marker, header).replace(offSiteMarker, offSite),
);
console.log('  docs/header.html');
