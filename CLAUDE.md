# @marketdataapp/ui

## Purpose

Shared Tailwind CSS theme and components for all MarketData properties (\*.marketdata.app). This is the single source of truth for brand colors, typography, shared components, and shared JS (dark mode, theme toggling).

## Architecture

- **Tailwind v4** with CSS-first configuration (no JS config files)
- All JS source lives in `src/` — edit source there, never edit `dist/` files directly
- `dist/` contains all **build outputs** committed for consumers: 4 JS files + `dist/css/` with 2 CSS files
- `src/templates/` contains HTML/SVG templates; `scripts/build-templates.js` compiles them to intermediate `src/*.templates.js` files (gitignored), then `scripts/build-js.js` inlines them into `dist/` JS outputs
- Build pipeline: `npm run build` runs three stages: `build:templates` → `build:js` → `build:css`
- `css/theme.css` is the active design system entry point. It `@import`s `css/flowbite-theme.css` (full Flowbite Design System token set: radius scale, neutrals, brand, status, dark-mode overrides — generated via the Flowbite MCP theme generator) and then overrides only the font stack to use system fonts. It also adds MarketData-specific tokens that Flowbite does not provide: brand hexes, Docusaurus admonition colors, and custom shadows. Consumed by projects that run their own Tailwind build.
- `css/components.src.css` defines all shared component classes as `@utility` with `@apply` — the single source of truth
- Two CSS build outputs in `dist/css/`, both unlayered (see README.md for details):
  - `dist/css/components.css` — full build with preflight reset (for standalone consumers)
  - `dist/css/components.no-reset.css` — no preflight reset (for framework consumers like Docusaurus)
- `scripts/unlayer.js` strips `@layer` wrappers post-build so our CSS wins specificity battles against unlayered foreign CSS
- Built artifacts (`dist/`) must stay committed because consuming projects import them directly
- Tests live in `tests/` — `tests/unit/` for vitest unit tests, `tests/e2e/` for Playwright e2e tests
- Component classes should prefer Flowbite semantic tokens from `theme.css` (e.g. `bg-neutral-primary-medium`, `text-heading`, `border-gray`, `text-fg-danger`) — they handle dark mode automatically. Fall back to standard Tailwind utilities with `dark:` variants when no token exists. Do NOT use Flowbite tokens that aren't defined in `theme.css`.

## Nested Component Contrast Pattern

When a component needs different styling based on its nesting context (e.g. radio groups inside forms), do NOT use descendant selectors like `.form-container .radio-group-container` — they break when consumers use `@apply` because class names never appear in the DOM.

Instead, use **CSS custom properties as cascade signals**:

- **Parent utility** sets `--nested-*` custom properties declaring which tiers nested components should use
- **Child utility** reads those properties via `var(--nested-*, <fallback>)`, where the fallback is the standalone default

This works because `@apply` inlines custom property declarations onto the DOM element, and custom properties cascade through the DOM tree regardless of class names. See README.md "Nested Component Contrast" section for full details and examples.

## What belongs here

- Brand colors (marketdata.\*, note, tip, info, warning, danger)
- Flowbite semantic UI tokens (neutral surfaces, text/foreground, borders, status backgrounds with dark mode overrides) — imported wholesale from `flowbite-theme.css`
- Shared typography (font families, Google Fonts references)
- Shared gradients and shadows
- Shared component classes used across properties: buttons (btn-orange-to-blue, btn-outline-to-orange, and other btn-{from}-to-{to} variants), forms, badges, grid layout, radio buttons
- Dark mode logic (shared JS for theme toggle + cookie across subdomains)

## What does NOT belong here

- Project-specific CSS (amember page overrides, quiz styles, etc.)
- Project-specific plugins (flowbite is per-project)
- Platform reset hacks (am-form-reset, am-button-reset — those are amember-specific)
- Content scanning paths (each project defines its own)

## Consuming projects

### MarketDataApp/documentation (Docusaurus site)

- `@marketdataapp/ui/css/components.no-reset` — pre-built CSS loaded via `<link>` tag in `headTags` (NOT via `customCss`/webpack — Docusaurus 3.x CSS minifier strips native CSS nesting). Copied to `static/css/` at build time.
- `@marketdataapp/ui/theme` — imports `setThemeCookie` for dark/light mode sync
- `@marketdataapp/ui/navbar-overflow` — auto-hide navbar items on overflow

### MarketDataApp/amember (membership dashboard)

- **Currently on Tailwind v3** — uses the old JS preset (`@marketdataapp/ui/preset`, now removed from exports). Pinned to an older version.
- `@marketdataapp/ui/theme` — all theme functions: `getThemeCookie`, `setThemeCookie`, `getUserThemePreference`, `getBrowserThemePreference`, `getEffectiveTheme`
- After v4 migration, will import `./css/theme` and `./css/components.src` into its own Tailwind build

### MarketDataApp/interview (Data Access Quiz)

- Usage not yet verified

## Deployment

The docs/demo site deploys to https://dev.marketdata.app/ui/docs/ on push to main.

## Installation

Projects install via GitHub URL:

```
npm install @marketdataapp/ui@github:MarketDataApp/ui
```

## License

UNLICENSED — proprietary MarketData code. Not for external use.
