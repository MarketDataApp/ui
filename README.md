# @marketdataapp/ui

Shared Tailwind CSS preset for [MarketData](https://www.marketdata.app) properties.

## Install

```bash
npm install @marketdataapp/ui@github:MarketDataApp/ui
```

## Usage

In your project's `tailwind.config.js`:

```js
module.exports = {
  presets: [require('@marketdataapp/ui/preset')],
  content: [
    // your project-specific content paths
  ],
  plugins: [
    // your project-specific plugins (e.g. flowbite)
  ],
}
```

The preset provides:

- **Theme** — Brand colors, font families, gradients, shadows
- **Components** — Buttons, forms, badges, radio buttons, grid layout

Each consuming project adds its own `content` paths and any project-specific plugins or components on top.

## What's included

### Colors
- `marketdata.*` — Brand palette (darkorange, lightorange, darkblue, lightblue, bluebg)
- `note.*`, `tip.*`, `info.*`, `warning.*`, `danger.*` — Semantic colors with light/dark variants

### Components
- `.btn-orange-to-blue`, `.btn-hover-orange` — Brand buttons
- `.form-container`, `.form-heading`, `.form-label`, `.form-input`, `.form-input-disabled`, `.form-input-error`, `.form-dropdown-input`, `.form-helper-text`, `.form-helper-text-error` — Form elements
- `.badge`, `.badge-{color}`, `.badge-pill`, `.badge-pill-{color}` — Badges
- `.radio-button-input`, `.radio-button-helper` — Radio buttons
- `.grid-layout-12`, `.grid-content-container`, `.grid-content-position` — Page layout grid
