# @marketdataapp/ui

## Purpose

Shared Tailwind CSS preset for all MarketData properties (\*.marketdata.app). This is the single source of truth for brand colors, typography, shared components, and eventually shared JS (dark mode, theme toggling).

## Architecture

- `preset.js` is a Tailwind preset consumed via `presets: [require('@marketdataapp/ui/preset')]` in each property's `tailwind.config.js`
- Consuming projects add their own `content` paths and project-specific plugins (e.g. flowbite)
- `css/components.css` is a built artifact (from `components.input.css`) — must stay committed because consuming projects import it directly
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
- `@marketdataapp/ui/preset` — Tailwind preset for brand colors, typography, component classes (`tailwind.config.js:3`)
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
