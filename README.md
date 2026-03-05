# @marketdataapp/ui

Shared Tailwind v4 theme, component CSS, and JS utilities for all MarketData properties (\*.marketdata.app).

**[Live Demo](https://dev.marketdata.app/ui/docs/)**

## Install

```bash
npm install @marketdataapp/ui@github:MarketDataApp/ui
```

## Exports

| Export                      | File                          | Description                                                                                                                         |
| --------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `./css/flowbite-tokens`     | `css/flowbite-tokens.css`     | Flowbite v4 semantic UI tokens (neutrals, text, borders, status, radius). Imported by both build entry points.                      |
| `./css/theme`               | `css/theme.css`               | `@theme {}` design tokens (colors, fonts, shadows). Import into your own Tailwind v4 build.                                         |
| `./css/components.src`      | `css/components.src.css`      | Raw `@utility` definitions. Import into your own Tailwind v4 build to use `@apply` with shared classes.                             |
| `./css/components`          | `css/components.css`          | Pre-built CSS (full Tailwind including preflight reset), unlayered. For standalone consumers.                                       |
| `./css/components.no-reset` | `css/components.no-reset.css` | Pre-built CSS without preflight reset, unlayered. For framework consumers with their own reset (e.g. Docusaurus).                   |
| `./theme`                   | `theme.js`                    | Dark/light mode JS: `getThemeCookie`, `setThemeCookie`, `getUserThemePreference`, `getBrowserThemePreference`, `getEffectiveTheme`. |
| `./navbar-overflow`         | `navbar-overflow.js`          | Priority-based auto-hide for navbar items that overflow their container.                                                            |
| `./user-profile`            | `user-profile.js`             | Gravatar avatar with optional dropdown menu. Zero dependencies.                                                                     |

## CSS Architecture

### Two Build Outputs

The build (`npm run build`) produces two CSS files from different entry points, then post-processes both with `unlayer.js`:

```
css/components.input.css  ──> css/components.css          (full build with preflight reset)
css/components.no-reset.input.css ──> css/components.no-reset.css  (no reset, framework-safe)
                                          │
                                    scripts/unlayer.js
                                    (strips @layer wrappers)
```

**`components.css`** imports the full `tailwindcss` package, which includes Tailwind's preflight reset (normalize, box-sizing, margin zeroing). Use this when you don't have another CSS framework providing a reset.

**`components.no-reset.css`** imports only `tailwindcss/theme` and `tailwindcss/utilities` with `source(none)`, deliberately excluding the preflight. It restricts utility generation to a class manifest (`components.classes`) so only component-relevant CSS is emitted. Use this when your project already has its own CSS framework (Docusaurus/Infima, etc.) and the preflight would conflict.

### Unlayering

Tailwind v4 compiles `@utility` definitions into `@layer utilities { ... }`. Per the CSS cascade spec, **layered styles always lose to unlayered styles** regardless of specificity. Since consuming projects (Docusaurus's Infima, aMember's platform CSS) ship unlayered CSS, our component classes would silently lose every specificity battle.

The `scripts/unlayer.js` post-build step strips all `@layer` declarations and unwraps `@layer` blocks, producing flat unlayered CSS that competes on specificity alone. Both build outputs contain zero `@layer` directives after this step.

### Component Definitions

Every shared component class is defined in `css/components.src.css` as an `@utility` with `@apply`:

```css
@utility btn-hover-orange {
  @apply inline-flex max-w-max no-underline text-center py-2.5 px-7 ...;
  @apply bg-transparent text-marketdata-darkblue;
  @apply shadow-line dark:shadow-darkline dark:text-white;
  @apply hover:bg-gradient-orange hover:text-white hover:shadow-diffuse;
}
```

This serves two purposes:

1. **Tailwind v4 consumers** (amember) import the source file and can `@apply btn-hover-orange` in their own CSS.
2. **Non-Tailwind consumers** (Docusaurus) use the pre-built CSS where each `@utility` compiles to a plain `.btn-hover-orange { ... }` rule.

### Dark Mode

Dark mode uses a `@custom-variant` that supports both conventions:

```css
@custom-variant dark (&:where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *));
```

- `.dark` class on `<html>` — Tailwind/Flowbite convention (used by amember)
- `[data-theme="dark"]` attribute — Docusaurus convention

The `:where()` wrapper adds **zero specificity**, preventing dark mode selectors from creating specificity inflation.

### Theme Tokens

`css/theme.css` defines all shared design tokens inside `@theme {}`:

- **Fonts**: `--font-sans`, `--font-mono`, `--font-quicksand`
- **Shadows**: `--shadow-line`, `--shadow-darkline`, `--shadow-diffuse`
- **Brand colors**: `--color-marketdata-lightorange`, `darkorange`, `lightblue`, `darkblue`, `bluebg`
- **Semantic colors**: `note`, `tip`, `info`, `warning`, `danger` (each with bg/border/text + dark variants)
- **Brand aliases**: `--color-brand-*`, `--color-fg-brand-*` (semantic aliases to blue palette, with dark mode overrides)

## How to Add New Components

When adding a component to this package, follow this pattern:

1. **Define it as `@utility` in `components.src.css`** using only `@apply` with standard Tailwind classes. Include `dark:` variants for dark mode.

```css
@utility my-component {
  @apply bg-white border border-gray-200 rounded-lg shadow-lg;
  @apply dark:bg-gray-800 dark:border-gray-600;
}
```

2. **Add all new class names to `components.classes`** — this manifest tells the no-reset build which utilities to generate.

3. **Run `npm run build`** to compile both CSS outputs and run the unlayer step.

4. **Use the class names in JS/HTML** — they work as plain CSS classes in any consumer.

Rules:

- Use standard Tailwind utility classes or Flowbite semantic tokens defined in `flowbite-tokens.css` in `@apply`. Semantic tokens like `bg-neutral-primary-medium`, `text-heading`, `text-body`, `border-default-medium`, `rounded-base`, `text-fg-danger`, `bg-danger-soft`, `bg-gray`, `text-fg-disabled` are available and handle dark mode automatically — no `dark:` prefix needed.
- Do NOT use Flowbite theme tokens that only exist when Flowbite's full CSS is loaded (e.g. brand tokens from Flowbite's generator that aren't defined in `flowbite-tokens.css` or `theme.css`).
- When using raw Tailwind colors (e.g. `bg-white`, `text-gray-900`), include `dark:` variants for dark mode support.
- Keep custom CSS to a minimum. If a property can be expressed as `@apply`, use `@apply`.
- The component must look correct using **only** `components.css` — no external CSS framework required.

## Consuming Projects

### MarketDataApp/documentation (Docusaurus)

**Imports:**

- `@marketdataapp/ui/css/components.no-reset` — pre-built CSS loaded via `<link>` tag in `headTags` (NOT via `customCss`/webpack, because Docusaurus 3.x's CSS minifier strips native CSS nesting)
- `@marketdataapp/ui/theme` — `setThemeCookie` for syncing dark mode across subdomains
- `@marketdataapp/ui/navbar-overflow` — auto-hide navbar items on overflow

**Why `components.no-reset`?** The full `components.css` includes Tailwind's preflight reset which destroys Docusaurus's Infima styles.

**Why `<link>` instead of `customCss`?** Docusaurus 3.x's built-in CSS minifier strips native CSS nesting syntax (`&:where(...)`), which breaks all dark mode and hover states. Loading the CSS as a static file via `<link>` bypasses the webpack pipeline.

**Integration pattern:**

```js
// docusaurus.config.js
headTags: [
  { tagName: 'link', attributes: { rel: 'stylesheet', href: '/docs/css/components.no-reset.css' } },
],
// Copy at build time:
// "copy:ui-css": "cp node_modules/@marketdataapp/ui/css/components.no-reset.css static/css/"
```

### MarketDataApp/amember (membership dashboard)

**Current state: still on Tailwind v3.** Uses a JS preset (`@marketdataapp/ui/preset`) which was removed from this package during the v4 migration. Amember is pinned to an older version.

**After Tailwind v4 migration, amember will import:**

- `@marketdataapp/ui/css/theme` — `@theme {}` tokens into its own Tailwind v4 build
- `@marketdataapp/ui/css/components.src` — `@utility` definitions for `@apply` in its own CSS
- `@marketdataapp/ui/theme` — JS theme functions (already in use)

**Why `components.src` instead of pre-built CSS?** Amember runs its own Tailwind build (it has Flowbite, aMember platform resets, and page-specific CSS). It needs the raw `@utility` source so it can `@apply` shared classes within its own component definitions, and Tailwind can tree-shake unused utilities.

### MarketDataApp/interview (Data Access Quiz)

Usage not yet verified.

## What's Included

### Component Classes

- **Buttons**: `.btn-orange-to-blue`, `.btn-blue-to-orange`, `.btn-hover-orange`, `.btn-hover-blue`
- **Forms**: `.form-container`, `.form-heading`, `.form-label`, `.form-input`, `.form-input-disabled`, `.form-input-error`, `.form-dropdown-input`, `.form-helper-text`, `.form-helper-text-error`
- **Badges**: `.badge .badge-{color}`, `.badge-pill-{color}`
- **Radio Buttons**: `.radio-button-input`, `.radio-button-helper`
- **Grid Layout**: `.grid-layout-12`, `.grid-content-container`, `.grid-content-position`
- **User Profile**: `.user-profile-wrapper`, `.user-profile-avatar`, `.user-profile-dropdown`, `.user-profile-dropdown-header`, `.user-profile-dropdown-name`, `.user-profile-dropdown-email`, `.user-profile-dropdown-menu`, `.user-profile-dropdown-link`, `.user-profile-dropdown-signout`, `.user-profile-placeholder`, `.user-profile-placeholder-svg`
- **Defaults**: `.default` (base text + background with dark mode)

### JS Modules

- **`theme.js`** — Cross-subdomain dark/light mode via `.marketdata.app` cookie
- **`navbar-overflow.js`** — Priority-based auto-hide for navbar items
- **`user-profile.js`** — Gravatar avatar + dropdown menu (zero deps, works with or without Flowbite)

## Known Issues and Lessons Learned

1. **`@layer` kills specificity in mixed environments.** Any CSS inside `@layer` automatically loses to unlayered CSS. This is why we run `unlayer.js` — without it, Docusaurus's Infima and aMember's platform CSS silently override our components.

2. **Docusaurus 3.x CSS minifier breaks CSS nesting.** Don't load this package's CSS through Docusaurus's `customCss` webpack pipeline. Use a `<link>` tag with a static file copy instead.

3. **Tailwind preflight conflicts with CSS frameworks.** The preflight reset (normalize + box-sizing) destroys Infima styles. Use `components.no-reset.css` when the consumer has its own framework.

4. **Only use locally-defined Flowbite tokens.** Semantic tokens defined in `flowbite-tokens.css` (e.g. `bg-neutral-primary-medium`, `text-heading`, `text-fg-danger`, `bg-danger-soft`, `rounded-base`) are safe to use — they're bundled in our builds. Do NOT use tokens that only exist in Flowbite's full CSS (e.g. brand tokens from Flowbite's generator). This package's CSS must be self-contained.

5. **Dark mode must support both `.dark` and `[data-theme="dark"]`.** The `@custom-variant dark` handles this automatically for any class using `dark:` prefix in `@apply`.

## License

UNLICENSED — proprietary MarketData code. Not for external use.
