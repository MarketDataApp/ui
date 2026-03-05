# @marketdataapp/ui

## Purpose

Shared Tailwind CSS theme and components for all MarketData properties (\*.marketdata.app). This is the single source of truth for brand colors, typography, shared components, and shared JS (dark mode, theme toggling).

## Architecture

- **Tailwind v4** with CSS-first configuration (no JS config files)
- `css/theme.css` defines brand design tokens via `@theme {}` — consumed by projects that run their own Tailwind build
- `css/components.src.css` defines all shared component classes as `@utility` with `@apply` — the single source of truth
- Two build outputs, both unlayered (see README.md for details):
  - `css/components.css` — full build with preflight reset (for standalone consumers)
  - `css/components.no-reset.css` — no preflight reset (for framework consumers like Docusaurus)
- `scripts/unlayer.js` strips `@layer` wrappers post-build so our CSS wins specificity battles against unlayered foreign CSS
- Built CSS artifacts must stay committed because consuming projects import them directly
- `theme.js` exports shared JS for dark/light theme cookie and preference management
- Component classes must only use standard Tailwind utilities in `@apply` — never Flowbite theme tokens (they aren't available in all consumers)

## What belongs here

- Brand colors (marketdata.\*, note, tip, info, warning, danger)
- Shared typography (font families, Google Fonts references)
- Shared gradients and shadows
- Shared component classes used across properties: buttons (btn-orange-to-blue, btn-hover-orange), forms, badges, grid layout, radio buttons
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
- `@marketdataapp/ui/theme` — re-exports all theme functions: `getThemeCookie`, `setThemeCookie`, `getUserThemePreference`, `getBrowserThemePreference`, `getEffectiveTheme` (`src/theme.js:5`)
- After v4 migration, will import `./css/theme` and `./css/components.src` into its own Tailwind build

### MarketDataApp/interview (Data Access Quiz)

- Usage not yet verified

## Installation

Projects install via GitHub URL:

```
npm install @marketdataapp/ui@github:MarketDataApp/ui
```

## License

UNLICENSED — proprietary MarketData code. Not for external use.
