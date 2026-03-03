# @marketdataapp/ui

## Purpose
Shared Tailwind CSS preset for all MarketData properties (*.marketdata.app). This is the single source of truth for brand colors, typography, shared components, and eventually shared JS (dark mode, theme toggling).

## Architecture
- `preset.js` is a Tailwind preset consumed via `presets: [require('@marketdataapp/ui/preset')]` in each property's `tailwind.config.js`
- Consuming projects add their own `content` paths and project-specific plugins (e.g. flowbite)
- No build step in this repo — it's a config package, not compiled CSS

## What belongs here
- Brand colors (marketdata.*, note, tip, info, warning, danger)
- Shared typography (font families, Google Fonts references)
- Shared gradients and shadows
- Shared component classes used across properties: buttons (btn-orange-to-blue, btn-hover-orange), forms, badges, grid layout, radio buttons
- Dark mode logic (future — shared JS for theme toggle + cookie across subdomains)

## What does NOT belong here
- Project-specific CSS (amember page overrides, quiz styles, etc.)
- Project-specific plugins (flowbite is per-project)
- Platform reset hacks (am-form-reset, am-button-reset — those are amember-specific)
- Content scanning paths (each project defines its own)

## Consuming projects
- `MarketDataApp/amember` — Amember membership dashboard
- `MarketDataApp/interview` — Data Access Quiz interview app
- `MarketDataApp/documentation` — Documentation site
- More properties will be added over time

## Installation
Projects install via GitHub URL:
```
npm install @marketdataapp/ui@github:MarketDataApp/ui
```

## License
UNLICENSED — proprietary MarketData code. Not for external use.
