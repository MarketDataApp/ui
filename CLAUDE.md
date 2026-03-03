# @marketdataapp/ui

## Purpose

Shared Tailwind CSS theme and components for all MarketData properties (\*.marketdata.app). This is the single source of truth for brand colors, typography, shared components, and shared JS (dark mode, theme toggling).

## Architecture

- **Tailwind v4** with CSS-first configuration (no JS config files)
- `css/theme.css` defines brand design tokens via `@theme {}` — consumed by projects that run their own Tailwind build via `@import "@marketdataapp/ui/css/theme.css"`
- `css/components.input.css` is the build entry point — imports theme, defines `@custom-variant dark`, gradient utilities, and all shared component classes in `@layer components {}`
- `css/components.css` is the built artifact (from `components.input.css`) — must stay committed because consuming projects import it directly
- `theme.js` exports shared JS for dark/light theme cookie and preference management

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
- `@marketdataapp/ui/css/components` — imports built CSS directly (`docusaurus.config.js:53` in customCss array)
- `@marketdataapp/ui/theme` — imports `setThemeCookie` for dark/light mode sync (`src/clientModules/themeCookieSync.js:1`)

### MarketDataApp/amember (membership dashboard)
- `@marketdataapp/ui/css/theme` — imports shared `@theme {}` tokens into its Tailwind v4 CSS build
- `@marketdataapp/ui/theme` — re-exports all theme functions: `getThemeCookie`, `setThemeCookie`, `getUserThemePreference`, `getBrowserThemePreference`, `getEffectiveTheme` (`src/theme.js:5`)
- Does NOT import `css/components` — defines its own component CSS locally

### MarketDataApp/interview (Data Access Quiz)
- Usage not yet verified

## Installation

Projects install via GitHub URL:

```
npm install @marketdataapp/ui@github:MarketDataApp/ui
```

## License

UNLICENSED — proprietary MarketData code. Not for external use.
