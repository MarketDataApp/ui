/**
 * @module header
 * The marketdata.app site header, rendered to an HTML string.
 *
 * Server-safe: nothing here touches `document` or `window`, so it runs in an
 * Astro frontmatter block, on a Cloudflare Worker, in Node, or in a browser.
 * The behaviour — overflow measurement, the drawer, the mega menus, the theme
 * toggles and the account control — lives in `header-client.js`, which a
 * consumer loads once on the client and points at the rendered markup.
 *
 * Every string a caller passes as text or as an attribute value is escaped.
 * Two things are trusted application markup and are emitted verbatim:
 * `slots.*` and a `NavLink.icon` that starts with `<svg`. Never feed either
 * from user input.
 *
 * Extracted from MarketDataApp/website `src/components/Header.astro`. The
 * markup is that header's, one class per role, so both sites render one
 * header from one file. Styles: `css/components.src.css`, "Site Header".
 */

import { partials as icons } from './header.templates.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * One row in a menu.
 *
 * @typedef {Object} NavLink
 * @property {string} label
 * @property {string} href
 * @property {string} [icon] - A built-in icon name (see `headerIconNames`) or a raw `<svg …>` string. Raw SVG is trusted markup.
 * @property {boolean} [external] - Opens in a new tab with `rel="noopener noreferrer"`.
 * @property {boolean} [disabled] - An announcement, not a link. Shown in the mega menu, dropped from the drawer.
 * @property {string} [disabledLabel] - Suffix after a disabled label, e.g. "(coming soon)".
 * @property {string} [description] - Second line under the label. Only the `cards` layout draws it.
 */

/**
 * A titled group of rows inside a dropdown.
 *
 * @typedef {Object} NavSection
 * @property {string} [title]
 * @property {string} [titleHref] - Makes the title a link.
 * @property {string} [titleIcon] - Drawer only: a linked title is a row like the ones under it and needs their icon to line up.
 * @property {NavLink[]} links
 */

/**
 * A top-level item that opens a mega menu on desktop and an accordion in the drawer.
 *
 * @typedef {Object} NavDropdown
 * @property {'dropdown'} type
 * @property {string} id - Stable slug; element ids derive from it (`mega-menu-${id}`).
 * @property {string} label
 * @property {NavSection[]} columns
 * @property {NavSection} [aside] - The darker right-hand column.
 * @property {'list'|'cards'} [layout] - `cards` is the two-column Products grid with descriptions. Default `list`.
 */

/**
 * A top-level item that is a plain link.
 *
 * @typedef {Object} NavDirectLink
 * @property {'link'} type
 * @property {string} label
 * @property {string} href
 */

/** @typedef {NavDropdown | NavDirectLink} NavItem */

/**
 * One entry of the shared data catalogue.
 *
 * @typedef {Object} DataCatalogEntry
 * @property {string} key - Stable identifier, e.g. `mutual-funds`.
 * @property {string} title - Display name, e.g. "Mutual Funds".
 * @property {string} icon - Built-in icon name.
 * @property {string} [href] - Canonical page. Absent while `comingSoon`.
 * @property {boolean} comingSoon
 */

/**
 * An image source for the logo.
 *
 * @typedef {string | { src: string, srcset?: string, sizes?: string }} LogoSource
 */

/**
 * @typedef {Object} HeaderLogo
 * @property {LogoSource} light
 * @property {LogoSource} dark
 * @property {string} [alt] - Default "MarketData".
 * @property {number} [width] - Intrinsic width attribute. Default 160.
 * @property {number} [height] - Intrinsic height attribute. Default 32.
 */

/**
 * @typedef {Object} HeaderSlots
 * @property {string} [logo] - Replaces both logo markups. Trusted HTML.
 * @property {string} [auth] - Replaces the account-control container. Keep `id="user-profile"` on its outer element so the overflow pass and `initHeader` can find it. Trusted HTML.
 * @property {string} [drawerStart] - HTML placed at the top of the drawer body, above the navigation. Trusted HTML.
 * @property {string} [drawerEnd] - HTML placed at the bottom of the drawer body. Trusted HTML.
 */

/**
 * @typedef {Object} RenderHeaderOptions
 * @property {HeaderLogo} [logo] - Required unless `slots.logo` is given.
 * @property {string} [currentPath] - The page's pathname. Marks the matching drawer row with `aria-current="page"`.
 * @property {NavItem[]} [navigation] - Default `defaultNavigation`.
 * @property {string} [homeHref] - Default "/".
 * @property {string} [skipLinkHref] - Default "#main-content".
 * @property {string} [loginUrl] - Drawer fallback link. Default dashboard login.
 * @property {string} [loginText] - Default "Log In".
 * @property {string} [signupUrl] - Drawer fallback link. Default "/signup/".
 * @property {string} [signupText] - Default "Try For Free".
 * @property {boolean} [fixed] - `true` (default): a fixed 60px bar plus a 60px spacer. `false`: an in-flow bar and no spacer.
 * @property {HeaderSlots} [slots]
 */

// ---------------------------------------------------------------------------
// Shared data
// ---------------------------------------------------------------------------

/**
 * The data types marketdata.app offers, in display order.
 *
 * This is the one list behind the Data menu. The website derives the cards on
 * its home, /api and /data pages from the same shape, so it should build them
 * from this catalogue and keep only its own copy (descriptions) beside it —
 * see README "Site Header › Data catalogue".
 *
 * @type {ReadonlyArray<DataCatalogEntry>}
 */
export const dataCatalog = Object.freeze([
  { key: 'stocks', title: 'Stocks', icon: 'stocks', href: '/data/stocks/', comingSoon: false },
  { key: 'options', title: 'Options', icon: 'options', href: '/data/options/', comingSoon: false },
  { key: 'etfs', title: 'ETFs', icon: 'etfs', href: '/data/stocks/', comingSoon: false },
  {
    key: 'mutual-funds',
    title: 'Mutual Funds',
    icon: 'mutual-funds',
    href: '/data/funds/',
    comingSoon: false,
  },
  {
    key: 'closed-end-funds',
    title: 'Closed-End Funds',
    icon: 'closed-end-funds',
    href: '/data/stocks/',
    comingSoon: false,
  },
  { key: 'indices', title: 'Indices', icon: 'indices', comingSoon: true },
  { key: 'futures', title: 'Futures', icon: 'futures', comingSoon: true },
  { key: 'currencies', title: 'Currencies', icon: 'currencies', comingSoon: true },
  { key: 'crypto', title: 'Crypto', icon: 'crypto', comingSoon: true },
  { key: 'bonds', title: 'Bonds', icon: 'bonds', comingSoon: true },
  {
    key: 'economic-indicators',
    title: 'Economic Indicators',
    icon: 'economic-indicators',
    comingSoon: true,
  },
]);

/** @type {NavLink[]} */
const liveDataLinks = dataCatalog
  .filter((d) => !d.comingSoon)
  .map((d) => ({ label: d.title, href: d.href ?? '#', icon: d.icon }));

/** @type {NavLink[]} */
const comingSoonDataLinks = dataCatalog
  .filter((d) => d.comingSoon)
  .map((d) => ({ label: d.title, href: '#', icon: d.icon, disabled: true }));

/**
 * The navigation every property shows: the website's live nav as of the
 * extraction. It links marketdata.app pages only. Nothing here points at an
 * application that is not meant to be discovered.
 *
 * @type {ReadonlyArray<NavItem>}
 */
export const defaultNavigation = Object.freeze([
  {
    type: 'dropdown',
    label: 'Data',
    id: 'data',
    columns: [
      {
        title: 'Explore Our Data',
        titleHref: '/data/',
        titleIcon: 'database',
        links: liveDataLinks,
      },
    ],
    aside: { title: 'Coming Soon', links: comingSoonDataLinks },
  },
  {
    type: 'dropdown',
    label: 'Products',
    id: 'products',
    layout: 'cards',
    columns: [
      {
        links: [
          {
            label: 'Market Data API',
            href: '/api/',
            icon: 'code',
            description: 'Unparalleled Ease-of-Use. Get Data Anywhere You Need It.',
          },
          {
            label: 'Custom API Development',
            href: '/custom-development/',
            icon: 'settings',
            description: 'Affordable, Scalable, and Tailored to Your Needs.',
          },
          {
            label: 'Google Sheets Add-on',
            href: '/sheets/',
            icon: 'sheet',
            description: 'Easily Download Data Into Your Spreadsheets Using Simple Formulas.',
          },
          {
            label: 'Excel Add-in',
            href: '#',
            icon: 'excel',
            disabled: true,
            disabledLabel: '(coming soon)',
            description: 'Support for Microsoft Excel is Planned For Late 2026.',
          },
        ],
      },
    ],
    aside: {
      title: 'Updates',
      links: [
        { label: 'Changelog', href: '/changelog/', icon: 'changelog' },
        {
          label: 'Product Roadmap',
          href: 'https://roadmap.marketdata.app/',
          icon: 'roadmap',
          external: true,
        },
        {
          label: 'Feature Requests',
          href: 'https://roadmap.marketdata.app/features',
          icon: 'feature-requests',
          external: true,
        },
      ],
    },
  },
  {
    type: 'dropdown',
    label: 'Learn',
    id: 'learn',
    columns: [
      {
        title: 'Documentation',
        links: [
          { label: 'Tutorials', href: '/tutorials/', icon: 'book-open' },
          { label: 'Market Data API', href: '/docs/api', icon: 'code' },
          { label: 'SDKs', href: '/docs/sdk', icon: 'sdk' },
          { label: 'Google Sheets', href: '/docs/sheets', icon: 'sheet' },
          { label: 'Account & Billing', href: '/docs/account', icon: 'dollar' },
        ],
      },
    ],
    aside: {
      title: 'Resources',
      links: [
        { label: 'Blog', href: '/tutorials/', icon: 'blog' },
        { label: 'Swagger', href: 'https://api.marketdata.app/', icon: 'swagger', external: true },
        { label: 'Service Status', href: '/status/', icon: 'status' },
      ],
    },
  },
  { type: 'link', label: 'Pricing', href: '/pricing/' },
  {
    type: 'dropdown',
    label: 'Company',
    id: 'company',
    columns: [
      {
        links: [
          { label: 'About Market Data', href: '/about/', icon: 'braces' },
          { label: 'Custom API Development', href: '/custom-development/', icon: 'settings' },
          {
            label: 'Customer Reviews',
            href: 'https://www.trustpilot.com/review/www.marketdata.app',
            icon: 'star',
            external: true,
          },
          { label: 'News', href: '/news/', icon: 'newspaper' },
        ],
      },
    ],
  },
]);

/** Names accepted by `NavLink.icon`, `NavSection.titleIcon` and `DataCatalogEntry.icon`. */
export const headerIconNames = Object.freeze(Object.keys(icons));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Escape a string for text content or a double-quoted attribute value. */
function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Serialise attributes. `null`, `undefined` and `false` drop the attribute;
 * `true` emits it bare. Every value is escaped.
 */
function attrs(map) {
  let out = '';
  for (const [name, value] of Object.entries(map)) {
    if (value === null || value === undefined || value === false) continue;
    out += value === true ? ` ${name}` : ` ${name}="${esc(value)}"`;
  }
  return out;
}

/**
 * An inline SVG for `name`, sized by `className`.
 *
 * A name is looked up in the bundled set. A string that starts with `<svg` is
 * a consumer's own icon and is emitted verbatim, with the class, `aria-hidden`
 * and `fill` added to its root so it behaves like the bundled ones. Unknown
 * names throw: an icon that silently renders as nothing is a defect found in
 * production, and this runs at build time where a throw is cheap.
 */
function icon(name, className) {
  const svg = /^\s*<svg\b/i.test(name) ? name.trim() : icons[name];
  if (!svg) {
    throw new Error(
      `@marketdataapp/ui/header: unknown icon "${name}". Use one of ${headerIconNames.join(', ')} or pass an inline <svg> string.`,
    );
  }
  return svg.replace(
    /^<svg\b/i,
    `<svg class="${esc(className)}" aria-hidden="true" focusable="false" fill="currentColor"`,
  );
}

/** `target`/`rel` for a link that opens off-site. */
function externalAttrs(link) {
  return link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {};
}

/** A trailing-slash-insensitive pathname, so `/pricing` and `/pricing/` are one page. */
function normalizePath(path) {
  return path.replace(/\/+$/, '') || '/';
}

/**
 * Whether `href` is the page being rendered.
 *
 * Placeholders and off-site links are never current. Compared without trailing
 * slashes: Astro's `trailingSlash: "always"` renders `/pricing/` while an entry
 * may be written either way.
 */
function makeIsCurrent(currentPath) {
  if (!currentPath) return () => false;
  const here = normalizePath(currentPath);
  return (href) => {
    if (!href || href === '#' || /^[a-z]+:/i.test(href)) return false;
    return normalizePath(href) === here;
  };
}

/**
 * The sections of a dropdown with every disabled row removed, and every
 * section that emptied out removed with it.
 *
 * The drawer lists only what a visitor can tap. A "coming soon" row is an
 * announcement, and an announcement you cannot follow is pure height on a
 * phone. The mega menu keeps them: there is room across its columns.
 *
 * @param {NavDropdown} item
 * @returns {NavSection[]}
 */
export function tappableSections(item) {
  return [...item.columns, ...(item.aside ? [item.aside] : [])]
    .map((section) => ({ ...section, links: section.links.filter((link) => !link.disabled) }))
    .filter((section) => section.links.length > 0);
}

// ---------------------------------------------------------------------------
// Fragments
// ---------------------------------------------------------------------------

/** One `<img>` for the logo. */
function logoImage(source, variant, { alt, width, height }) {
  const src = typeof source === 'string' ? { src: source } : source;
  if (!src || !src.src) {
    throw new Error(
      `@marketdataapp/ui/header: logo.${variant} needs a URL string or { src, srcset?, sizes? }.`,
    );
  }
  return `<img${attrs({
    class: `site-header-logo-${variant}`,
    src: src.src,
    srcset: src.srcset,
    sizes: src.sizes,
    width,
    height,
    alt,
    loading: 'eager',
    decoding: 'async',
  })}>`;
}

/**
 * The light/dark logo pair. Both ship in the HTML; CSS shows the one that
 * matches the theme, so a theme switch costs no request and no layout.
 */
function logoMarkup(logo, slots) {
  if (slots.logo) return slots.logo;
  if (!logo || !logo.light || !logo.dark) {
    throw new Error(
      '@marketdataapp/ui/header: renderHeader needs `logo: { light, dark }` (URLs or { src, srcset, sizes }) or `slots.logo`. ' +
        'The originals ship as @marketdataapp/ui/assets/brand/logo-on-light.png and logo-on-dark.png; ' +
        '320px webp derivatives sit beside them.',
    );
  }
  const meta = {
    alt: logo.alt ?? 'MarketData',
    width: logo.width ?? 160,
    height: logo.height ?? 32,
  };
  return `<span class="site-header-logo">${logoImage(logo.light, 'light', meta)}${logoImage(logo.dark, 'dark', meta)}</span>`;
}

/** Title of a mega-menu column or aside: a link when it has somewhere to go. */
function panelTitle(section) {
  if (!section.title) return '';
  return section.titleHref
    ? `<a${attrs({ href: section.titleHref, class: 'site-header-panel-title' })}>${esc(section.title)}</a>`
    : `<span class="site-header-panel-title">${esc(section.title)}</span>`;
}

/** One row of a mega-menu column. */
function panelRow(link, cards) {
  const iconHtml = link.icon ? icon(link.icon, 'site-header-panel-icon') : '';
  const description = link.description
    ? `<span class="site-header-panel-description">${esc(link.description)}</span>`
    : '';
  const linkClass = [
    'site-header-panel-link',
    link.description && 'site-header-panel-link--described',
  ]
    .filter(Boolean)
    .join(' ');

  if (link.disabled) {
    const soon = link.disabledLabel
      ? `<span class="site-header-panel-soon">${esc(link.disabledLabel)}</span>`
      : '';
    return (
      `<li class="site-header-panel-item${cards ? ' site-header-panel-item--card' : ''} site-header-panel-item--disabled">` +
      `<span class="${linkClass} site-header-panel-link--disabled">` +
      `<span class="site-header-panel-label">${iconHtml}${esc(link.label)}${soon}</span>${description}</span></li>`
    );
  }

  return (
    `<li class="site-header-panel-item${cards ? ' site-header-panel-item--card' : ''}">` +
    `<a${attrs({ href: link.href, class: linkClass, ...externalAttrs(link) })}>` +
    `<span class="site-header-panel-label">${iconHtml}${esc(link.label)}</span>${description}</a></li>`
  );
}

/** One row of the darker aside column. */
function asideRow(link) {
  const iconHtml = link.icon ? icon(link.icon, 'site-header-panel-icon') : '';
  if (link.disabled) {
    return `<li><span class="site-header-panel-aside-link site-header-panel-aside-link--disabled">${iconHtml}${esc(link.label)}</span></li>`;
  }
  return `<li><a${attrs({ href: link.href, class: 'site-header-panel-aside-link', ...externalAttrs(link) })}>${iconHtml}${esc(link.label)}</a></li>`;
}

/** The desktop mega menu for a dropdown item. */
function megaMenu(item) {
  const cards = item.layout === 'cards';
  const panelId = `mega-menu-${item.id}`;
  const buttonId = `${panelId}-button`;

  const columns = item.columns
    .map(
      (section) =>
        `<div class="site-header-panel-column${cards ? ' site-header-panel-column--cards' : ''}">` +
        panelTitle(section) +
        `<ul class="${cards ? 'site-header-panel-grid' : 'site-header-panel-list'}" aria-labelledby="${buttonId}">` +
        section.links.map((link) => panelRow(link, cards)).join('') +
        `</ul></div>`,
    )
    .join('');

  const aside = item.aside
    ? `<div class="site-header-panel-aside">${panelTitle(item.aside)}<ul class="site-header-panel-aside-list">${item.aside.links.map(asideRow).join('')}</ul></div>`
    : '';

  return (
    `<li class="site-header-item site-header-menu">` +
    `<button${attrs({
      id: buttonId,
      type: 'button',
      class: 'site-header-menu-button',
      'aria-expanded': 'false',
      'aria-controls': panelId,
      'data-site-header-menu': panelId,
    })}>${esc(item.label)}${icon('triangle', 'site-header-caret')}</button>` +
    `<div id="${panelId}" class="site-header-panel${cards ? ' site-header-panel--cards' : ''}" hidden>` +
    `<div class="site-header-panel-inner">${columns}${aside}</div></div></li>`
  );
}

/** The desktop row of top-level items. */
function desktopLinks(navigation) {
  return navigation
    .map((item) =>
      item.type === 'link'
        ? `<li class="site-header-item"><a${attrs({ href: item.href, class: 'site-header-link' })}>${esc(item.label)}</a></li>`
        : megaMenu(item),
    )
    .join('');
}

/** A drawer row: a link with the current-page marker when it is the page. */
function drawerRow(className, link, isCurrent, iconName) {
  const current = isCurrent(link.href);
  const iconHtml = iconName ? icon(iconName, 'site-header-drawer-icon') : '';
  return `<a${attrs({
    href: link.href,
    class: className,
    'aria-current': current ? 'page' : null,
    ...externalAttrs(link),
  })}>${iconHtml}${esc(link.label)}</a>`;
}

/** The accordion a dropdown becomes inside the drawer. */
function accordion(item, isCurrent) {
  const panelId = `mega-menu-${item.id}-mobile`;
  const buttonId = `${panelId}-button`;

  const sections = tappableSections(item)
    .map((section) => {
      let heading = '';
      if (section.title) {
        heading = section.titleHref
          ? drawerRow(
              'site-header-drawer-section-link',
              { label: section.title, href: section.titleHref },
              isCurrent,
              section.titleIcon,
            )
          : `<span class="site-header-drawer-section-title">${esc(section.title)}</span>`;
      }
      const rows = section.links
        .map(
          (link) =>
            `<li>${drawerRow('site-header-drawer-sublink', link, isCurrent, link.icon)}</li>`,
        )
        .join('');
      return `<div class="site-header-drawer-section">${heading}<ul class="site-header-drawer-sublist">${rows}</ul></div>`;
    })
    .join('');

  return (
    `<li>` +
    `<button${attrs({
      id: buttonId,
      type: 'button',
      class: 'site-header-accordion-button',
      'aria-expanded': 'false',
      'aria-controls': panelId,
      'data-site-header-accordion': panelId,
    })}>${esc(item.label)}<span class="site-header-chevron-chip">${icon('chevron-right', 'site-header-chevron')}</span></button>` +
    `<div id="${panelId}" class="site-header-accordion" hidden>` +
    `<div class="site-header-accordion-inner"><div class="site-header-accordion-sections">${sections}</div></div></div></li>`
  );
}

/** The drawer's list of top-level items, plus the account fallback links. */
function drawerList(navigation, isCurrent, opts) {
  const items = navigation
    .map((item) =>
      item.type === 'link'
        ? `<li>${drawerRow('site-header-drawer-link', item, isCurrent)}</li>`
        : accordion(item, isCurrent),
    )
    .join('');

  // initNavbarOverflow hides #user-profile when the row cannot hold it, which
  // is every phone width while the visitor is logged out. These two links keep
  // both actions reachable; they mirror the control's own dropdown.
  const auth =
    `<li class="site-header-drawer-auth"><div class="site-header-drawer-auth-links">` +
    `<a${attrs({ href: opts.loginUrl, class: 'site-header-drawer-auth-link' })}>${esc(opts.loginText)}</a>` +
    `<a${attrs({ href: opts.signupUrl, class: 'site-header-drawer-auth-link' })}>${esc(opts.signupText)}</a>` +
    `</div></li>`;

  return `<ul class="site-header-drawer-list">${items}${auth}</ul>`;
}

// ---------------------------------------------------------------------------
// renderHeader
// ---------------------------------------------------------------------------

/**
 * Render the site header to an HTML string.
 *
 * Emit it as-is in the initial HTML — Astro: `<Fragment set:html={html} />` —
 * then call `initHeader()` from `@marketdataapp/ui/header-client` once on the
 * client. The output is one `<header class="site-header">` (skip link, fixed
 * bar, backdrop, drawer) followed by a spacer the height of the bar.
 *
 * @param {RenderHeaderOptions} [options]
 * @returns {string}
 */
export function renderHeader(options = {}) {
  const {
    logo,
    currentPath,
    navigation = defaultNavigation,
    homeHref = '/',
    skipLinkHref = '#main-content',
    loginUrl = 'https://dashboard.marketdata.app/marketdata/login',
    loginText = 'Log In',
    signupUrl = '/signup/',
    signupText = 'Try For Free',
    fixed = true,
    slots = {},
  } = options;

  const isCurrent = makeIsCurrent(currentPath);
  const logoHtml = logoMarkup(logo, slots);
  const authHtml = slots.auth ?? '<div id="user-profile" class="user-profile-container"></div>';

  return (
    `<header class="site-header">` +
    // The <header> is the banner landmark and the skip link's home: without
    // it the link sat outside every landmark and a screen reader navigating
    // by landmark could not reach it.
    `<a${attrs({ href: skipLinkHref, class: 'site-header-skip' })}>Skip to main content</a>` +
    // Fixed height, not content height. The bar is fixed and the spacer below
    // stands in for it, and the two agree only if the bar's height is pinned:
    // its tallest child changes while the account control loads.
    `<nav aria-label="Primary" class="site-header-bar${fixed ? '' : ' site-header-bar--static'}">` +
    `<div class="site-header-inner">` +
    // data-navbar-unmeasured seeds the first paint (see the CSS); initHeader
    // removes it and hands the row to initNavbarOverflow.
    `<div id="navbar-row" class="site-header-row" data-navbar-unmeasured>` +
    `<div class="site-header-start">` +
    `<button id="navbar-toggle" type="button" class="site-header-toggle" aria-controls="navbar-main" aria-expanded="false" aria-label="Open main menu">${icon('menu', 'site-header-toggle-icon')}</button>` +
    `<a${attrs({ href: homeHref, class: 'site-header-brand' })}>${logoHtml}</a>` +
    `<ul id="navbar-links" class="site-header-links">${desktopLinks(navigation)}</ul>` +
    `</div>` +
    `<div class="site-header-end">${authHtml}<div id="theme-toggle" class="theme-toggle-container site-header-theme-toggle"></div></div>` +
    `</div></div></nav>` +
    // The drawer lives outside the bar so it can overlay the page without
    // inheriting the bar's stacking. Closed = translated off-screen + inert,
    // so it is neither tabbable nor announced yet can still animate.
    `<div id="navbar-backdrop" class="site-header-backdrop"></div>` +
    `<nav id="navbar-main" aria-label="Main menu" class="site-header-drawer" inert>` +
    `<div class="site-header-drawer-bar">` +
    `<a${attrs({ href: homeHref, class: 'site-header-drawer-brand' })}>${logoHtml}</a>` +
    `<div class="site-header-drawer-actions">` +
    `<div id="theme-toggle-drawer" class="theme-toggle-container site-header-theme-toggle"></div>` +
    `<button id="navbar-close" type="button" class="site-header-close" aria-label="Close main menu">${icon('x', 'site-header-close-icon')}</button>` +
    `</div></div>` +
    `<div class="site-header-drawer-body">${slots.drawerStart ?? ''}${drawerList(navigation, isCurrent, { loginUrl, loginText, signupUrl, signupText })}${slots.drawerEnd ?? ''}</div>` +
    `</nav></header>` +
    (fixed ? `<div class="site-header-spacer"></div>` : '')
  );
}
