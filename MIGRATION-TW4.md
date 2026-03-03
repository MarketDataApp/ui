# Tailwind v3 → v4 Migration: @marketdataapp/ui

**Priority: First** — this repo must be migrated before amember.

## Overview

The core change is moving from a JS-based preset (`preset.js`) to CSS-based theming (`css/theme.css`). The `addComponents()` plugin moves into a `@layer components {}` block in the CSS entry point. The build output (`css/components.css`) stays at the same path so Docusaurus sees no change.

## Step-by-step

### 1. Update dependencies

```bash
npm uninstall tailwindcss
npm install -D @tailwindcss/cli
```

In `package.json`:

- Remove `peerDependencies.tailwindcss` entirely (CSS-only consumers don't need it)

### 2. Create `css/theme.css`

This is the v4 replacement for `preset.js`. It contains a `@theme {}` block with all brand design tokens:

```css
@theme {
  /* Fonts */
  --font-sans:
    system-ui, -apple-system, 'Segoe UI', Roboto, Ubuntu, Cantarell, 'Noto Sans', sans-serif,
    'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
  --font-mono: SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  --font-quicksand: 'Quicksand', sans-serif;

  /* Gradients (used by buttons) */
  --background-image-gradient-orange: linear-gradient(103deg, #e83155 0%, #ffdfb9 100%);
  --background-image-gradient-blue: linear-gradient(103deg, #003286 0%, #0085f2 100%);

  /* Shadows */
  --shadow-line: 0 0 0 1px rgba(0, 26, 108, 0.2) inset;
  --shadow-darkline: 0 0 0 1px rgba(255, 255, 255, 0.4) inset;
  --shadow-diffuse: 0 20px 40px 0 rgba(232, 49, 85, 0.2);

  /* Brand colors */
  --color-marketdata-lightorange: #ffdfb9;
  --color-marketdata-darkorange: #e83155;
  --color-marketdata-lightblue: #0085f2;
  --color-marketdata-darkblue: #003286;
  --color-marketdata-bluebg: #001a6c;

  /* Semantic colors: note */
  --color-note-bg: rgb(253, 253, 254);
  --color-note-border: rgb(212, 213, 216);
  --color-note-text: rgb(71, 71, 72);
  --color-note-darkbg: rgb(71, 71, 72);
  --color-note-darkborder: rgb(212, 213, 216);
  --color-note-darktext: rgb(253, 253, 254);

  /* Semantic colors: tip */
  --color-tip-bg: rgb(230, 246, 230);
  --color-tip-border: rgb(0, 148, 0);
  --color-tip-text: rgb(0, 49, 0);
  --color-tip-darkbg: rgb(0, 49, 0);
  --color-tip-darkborder: rgb(0, 148, 0);
  --color-tip-darktext: rgb(230, 246, 230);

  /* Semantic colors: info */
  --color-info-bg: rgb(238, 249, 253);
  --color-info-border: rgb(76, 179, 212);
  --color-info-text: rgb(25, 60, 71);
  --color-info-darkbg: rgb(25, 60, 71);
  --color-info-darkborder: rgb(76, 179, 212);
  --color-info-darktext: rgb(238, 249, 253);

  /* Semantic colors: warning */
  --color-warning-bg: rgb(255, 248, 230);
  --color-warning-border: rgb(230, 167, 0);
  --color-warning-text: rgb(77, 56, 0);
  --color-warning-darkbg: rgb(77, 56, 0);
  --color-warning-darkborder: rgb(230, 167, 0);
  --color-warning-darktext: rgb(255, 248, 230);

  /* Semantic colors: danger */
  --color-danger-bg: rgb(255, 235, 236);
  --color-danger-border: rgb(225, 50, 56);
  --color-danger-text: rgb(75, 17, 19);
  --color-danger-darkbg: rgb(75, 17, 19);
  --color-danger-darkborder: rgb(225, 50, 56);
  --color-danger-darktext: rgb(255, 235, 236);
}
```

> Note: Verify the exact `@theme` variable naming conventions against the Tailwind v4 docs. The `--color-*` namespace generates `bg-*`, `text-*`, `border-*`, `fill-*` utilities. The `--font-*` namespace generates `font-*` utilities. `--shadow-*` generates `shadow-*`. `--background-image-*` generates `bg-*` for gradients.

### 3. Rewrite `css/components.input.css`

Replace the current contents:

```css
@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@500&display=swap');
@import 'tailwindcss';
@import './theme.css';

/* Support both .dark (Tailwind/Flowbite) and [data-theme="dark"] (Docusaurus) */
@custom-variant dark (&:where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *));

@layer components {
  /* ---- Buttons ---- */
  .btn-orange-to-blue {
    @apply inline-flex max-w-max no-underline text-center py-2.5 px-7 lg:px-10 lg:py-3.5 rounded-3xl;
    @apply font-quicksand text-xs lg:text-base lg:leading-none font-medium tracking-tight leading-none;
    @apply border-none bg-gradient-orange text-white;
    @apply shadow-diffuse;
    @apply hover:bg-gradient-blue hover:shadow-none;
    @apply cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-gradient-orange disabled:hover:shadow-diffuse;
    &:hover {
      text-decoration: none !important;
    }
  }

  /* ... port all remaining addComponents() classes from preset.js ... */

  /* ---- Forms ---- */
  /* ---- Radio Buttons ---- */
  /* ---- Badges ---- */
  /* ---- Grid Layout ---- */
  /* ---- Defaults ---- */
}
```

All component definitions from `preset.js` lines 106–288 move here, converted from JS object syntax to plain CSS with `@apply`.

### 4. Update build scripts in `package.json`

```json
{
  "build:css": "@tailwindcss/cli -i css/components.input.css -o css/components.css",
  "dev:css": "@tailwindcss/cli -i css/components.input.css -o css/components.css --watch"
}
```

Changes:

- `tailwindcss` → `@tailwindcss/cli`
- Remove `--config tailwind.build.config.js` (config is now in the CSS file)

### 5. Update `package.json` exports

```json
{
  "exports": {
    "./theme": "./theme.js",
    "./css/components": "./css/components.css",
    "./css/theme": "./css/theme.css"
  }
}
```

- Remove `"./preset": "./preset.js"`
- Add `"./css/theme": "./css/theme.css"` (for amember to import)

### 6. Delete old files

- `preset.js` — replaced by `css/theme.css` + `@layer components` in `components.input.css`
- `tailwind.build.config.js` — config now lives in CSS

### 7. Rebuild and verify

```bash
npm run build
```

- Diff `css/components.css` (old vs new) to check for regressions
- All existing class names must still be present: `.btn-orange-to-blue`, `.btn-blue-to-orange`, `.btn-hover-orange`, `.btn-hover-blue`, `.form-container`, `.form-input`, `.form-label`, `.form-input-disabled`, `.form-input-error`, `.form-dropdown-input`, `.form-helper-text`, `.form-helper-text-error`, `.radio-button-input`, `.radio-button-helper`, `.badge`, `.badge-*`, `.badge-pill-*`, `.grid-layout-12`, `.grid-content-container`, `.grid-content-position`, `.default`
- Dark mode selectors must cover both `.dark` and `[data-theme="dark"]`
- `npm test` passes (theme.js tests are unaffected)

### 8. Update CLAUDE.md

Update the Architecture section to reflect the new file structure (CSS-based theme instead of JS preset).

## Files changed

| Action  | File                                      |
| ------- | ----------------------------------------- |
| Create  | `css/theme.css`                           |
| Rewrite | `css/components.input.css`                |
| Rebuild | `css/components.css`                      |
| Edit    | `package.json` (deps, scripts, exports)   |
| Edit    | `CLAUDE.md` (architecture docs)           |
| Delete  | `preset.js`                               |
| Delete  | `tailwind.build.config.js`                |
| Keep    | `theme.js` (no changes)                   |
| Keep    | `css/flowbite-theme.css` (reference only) |

## Notes

- Run `npx @tailwindcss/upgrade` on a branch first to get automated renames (utility class name changes between v3 and v4), then manually complete the migration.
- The `css/flowbite-theme.css` is a separate Flowbite design system theme — it's not the same as `css/theme.css` (our brand tokens). Keep it for reference.
- `theme.js` is pure JS with zero Tailwind dependency. No changes needed.
