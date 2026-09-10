import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BUILDS, ruleBody } from './helpers/css.js';
import { renderHeader } from '../../dist/header.js';

// The header ships as markup from a package module plus plain selectors in
// components.src.css. Nothing scans the module for class names, so the CSS
// must reach both build outputs unconditionally — and every class the markup
// uses must have a rule, or it renders unstyled on the consumer that links
// dist/css and on the consumer that imports components.src alike.

const css = Object.fromEntries(
  BUILDS.map((file) => [file, readFileSync(resolve(process.cwd(), file), 'utf8')]),
);

/**
 * Collapse whitespace inside selectors. Prettier wraps a long selector in the
 * source and Tailwind keeps that whitespace verbatim inside `:not(`, which is
 * valid CSS and not what these assertions are about.
 */
const compact = (s) => s.replace(/\s+/g, ' ').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');

describe.each(BUILDS)('%s', (file) => {
  const text = css[file];

  it('carries the fixed 60px bar', () => {
    const bar = ruleBody(text, '.site-header-bar');
    expect(bar).not.toBeNull();
    expect(bar).toContain('position: fixed;');
    expect(bar).toContain('height: calc(var(--spacing) * 15);');
    expect(ruleBody(text, '.site-header-spacer')).toContain('height: calc(var(--spacing) * 15);');
  });

  it('carries the first-paint seeds at 890px', () => {
    expect(text).toMatch(
      /@media \(width < 890px\) \{\s*\.site-header-row\[data-navbar-unmeasured\] \.site-header-links \{\s*display: none;/,
    );
    expect(text).toMatch(
      /@media \(width >= 890px\) \{\s*\.site-header-row\[data-navbar-unmeasured\] \.site-header-toggle \{\s*display: none;/,
    );
  });

  it('couples the hamburger, the drawer and the bar’s theme toggle to the measurement', () => {
    const flat = compact(text);
    expect(flat).toContain(
      '.site-header-row:not([data-navbar-unmeasured]):not(:has(.site-header-links[data-navbar-hidden])) .site-header-toggle {',
    );
    expect(flat).toContain(
      '.site-header:not(:has(.site-header-row[data-navbar-unmeasured])):not(:has(.site-header-links[data-navbar-hidden])) :is(.site-header-drawer, .site-header-backdrop) {',
    );
    expect(flat).toContain(
      '.site-header:has(.site-header-links[data-navbar-hidden]) .site-header-row .site-header-theme-toggle {',
    );
  });

  it('hides a [hidden] panel and accordion even without Preflight', () => {
    expect(ruleBody(text, '.site-header-panel[hidden]')).toContain('display: none;');
    expect(ruleBody(text, '.site-header-accordion[hidden]')).toContain('display: none;');
  });

  it('swaps the logo on the theme through the shared dark variant', () => {
    const light = ruleBody(text, '.site-header-logo-light');
    expect(light).toContain('visibility: visible;');
    expect(light).toMatch(/\.dark[\s\S]*visibility: hidden;/);
  });

  it('draws the arrow cursor on the mega-menu triggers where hover owns them', () => {
    expect(text).toMatch(
      /@media \(hover: hover\) and \(pointer: fine\) \{\s*\.site-header-menu-button \{\s*cursor: default;/,
    );
  });

  it('has a rule for every class the renderer emits', () => {
    // Classes the kit's other modules own; their rules live in their blocks.
    const foreign = new Set(['user-profile-container', 'theme-toggle-container']);
    const tpl = document.createElement('template');
    tpl.innerHTML = renderHeader({
      logo: { light: '/l', dark: '/d' },
      currentPath: '/pricing/',
    });
    const used = new Set();
    for (const el of tpl.content.querySelectorAll('[class]')) {
      for (const cls of el.getAttribute('class').split(/\s+/)) if (cls) used.add(cls);
    }
    const missing = [...used].filter((cls) => !foreign.has(cls) && !text.includes(`.${cls}`));
    expect(missing).toEqual([]);
  });
});
