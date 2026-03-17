# @marketdataapp/ui

Shared Tailwind v4 theme, component CSS, and JS utilities for all MarketData properties (\*.marketdata.app).

**[Live Demo](https://dev.marketdata.app/ui/docs/)**

## Install

```bash
npm install @marketdataapp/ui@github:MarketDataApp/ui
```

## Exports

| Export                      | File                               | Description                                                                                                                                             |
| --------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `./css/theme`               | `css/theme.css`                    | All design tokens: brand colors, fonts, shadows, Flowbite semantic UI tokens (neutrals, text, borders, status). Import into your own Tailwind v4 build. |
| `./css/components.src`      | `css/components.src.css`           | Raw `@utility` definitions. Import into your own Tailwind v4 build to use `@apply` with shared classes.                                                 |
| `./css/components`          | `dist/css/components.css`          | Pre-built CSS (full Tailwind including preflight reset), unlayered. For standalone consumers.                                                           |
| `./css/components.no-reset` | `dist/css/components.no-reset.css` | Pre-built CSS without preflight reset, unlayered. For framework consumers with their own reset (e.g. Docusaurus).                                       |
| `./theme`                   | `dist/theme.js`                    | Dark/light mode JS: `getThemeCookie`, `setThemeCookie`, `getUserThemePreference`, `getBrowserThemePreference`, `getEffectiveTheme`.                     |
| `./theme-toggle`            | `dist/theme-toggle.js`             | Sun/moon toggle button for switching dark/light mode. Uses `./theme` for cookie persistence.                                                            |
| `./dark-images`             | `dist/dark-images.js`              | Automatic dark/light image swapping. Convention-based (`-light`/`-dark` suffix) or explicit pairs via `addImagePair()`.                                 |
| `./reviews`                 | `dist/reviews.js`                  | Review rating widget with build-time data. Renders large or small variant via `initResenaWidget()`.                                                     |
| `./navbar-overflow`         | `dist/navbar-overflow.js`          | Priority-based auto-hide for navbar items that overflow their container.                                                                                |
| `./user-profile`            | `dist/user-profile.js`             | Gravatar avatar with optional dropdown menu. Zero dependencies.                                                                                         |

## CSS Architecture

### Build Pipeline

`npm run build` runs three stages:

```
1. build:templates   src/templates/**/*.html ──> src/*.templates.js (intermediate, gitignored)
2. build:js          src/*.js + src/*.templates.js ──> dist/*.js (templates inlined)
3. build:css         css/*.input.css ──> dist/css/components.css, dist/css/components.no-reset.css
                                              │
                                        scripts/unlayer.js
                                        (strips @layer wrappers)
```

All JS source lives in `src/`. Files in `dist/` are build outputs with HTML templates inlined — do not edit them directly.

### Two CSS Outputs

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

### Grid Layout and Content Positioning

`.grid-layout-12` creates a 12-column grid with `gap-4` gutters between columns. The grid itself is edge-to-edge — it has no padding or margin, so columns 1 and 12 sit flush against the container.

Two utilities handle content positioning within the grid. Both include built-in horizontal margin on small screens (`mx-4` / `md:mx-6`) so content never touches the viewport edge. At `xl`+ the margin is removed because the grid columns provide the centering:

- **`.grid-content-position`** — Position only. Spans all 12 columns on mobile, narrows to 10 at `xl`, and 8 at `2xl`. Use this when you want centered placement without any visual styling.
- **`.grid-content-container`** — Same positioning as above, plus `card-surface` visual treatment (background, border, padding, shadow, rounded corners). Use this for content cards.

Consumers don't need to add their own margin or padding — these utilities handle viewport-edge spacing automatically.

**`.card-surface`** is the shared visual base used by both `.grid-content-container` and `.form-container`. It provides `bg-neutral-primary-medium`, `border-neutral-quaternary`, responsive padding (`p-4 sm:p-6 xl:p-8`), `rounded-lg`, and `shadow-md`.

### Dark Mode

Dark mode uses a `@custom-variant` that supports both conventions:

```css
@custom-variant dark (&:where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *));
```

- `.dark` class on `<html>` — Tailwind/Flowbite convention (used by amember)
- `[data-theme="dark"]` attribute — Docusaurus convention

The `:where()` wrapper adds **zero specificity**, preventing dark mode selectors from creating specificity inflation.

#### Setup: Preventing Flash of Wrong Theme

ES modules (`<script type="module">`) are **always deferred** by the browser — they execute after the HTML is fully parsed, even when placed in `<head>`. This means `theme.js` cannot prevent a flash of wrong theme (FOWT) on its own.

Every consuming page must include an **inline `<script>` in `<head>`** that reads the theme cookie and applies the `dark` class before the browser's first paint:

```html
<head>
  <script>
    (function () {
      var match = document.cookie.match(/(?:^|;\s*)theme=(dark|light)/);
      var saved = match ? match[1] : null;
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (saved === 'dark' || (!saved && prefersDark)) {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    })();
  </script>
</head>
```

This mirrors the preference hierarchy from `theme.js`: **cookie > OS preference > light (default)**.

Then, later in the page (typically at the end of `<body>`), load the toggle as a module:

```html
<script type="module">
  import { initThemeToggle } from '@marketdataapp/ui/theme-toggle';
  initThemeToggle({ container: document.getElementById('theme-toggle') });
</script>
```

The inline script handles initial render; the module handles user interaction and cookie persistence.

### Dark Image Swapping

The `dark-images` module automatically swaps images between light and dark variants based on the current theme. Two approaches:

#### Convention-based (automatic)

Name your images with `-light` or `-dark` before the extension. The module detects them automatically and probes for the alternate version:

```
logo-light.png  ↔  logo-dark.png
hero-light.jpg  ↔  hero-dark.jpg
icon-light.svg  ↔  icon-dark.svg
```

```js
import { initDarkImages } from '@marketdataapp/ui/dark-images';

const cleanup = initDarkImages();
// cleanup() stops all observers
```

If the alternate image 404s, the original stays. The browser's native HTTP cache handles repeat requests.

#### Explicit pairs

For images that don't follow the `-light`/`-dark` naming convention, register pairs manually:

```js
import { initDarkImages, addImagePair } from '@marketdataapp/ui/dark-images';

// Register pairs BEFORE calling initDarkImages()
addImagePair('chart.png', 'chart-inverted.png'); // suffix match — matches any src ending with these
addImagePair('/images/photo.jpg', '/images/photo-bw.jpg'); // exact match — absolute paths match exactly
addImagePair('https://cdn.example.com/a.png', 'https://cdn.example.com/b.png'); // exact match — full URLs match exactly

const cleanup = initDarkImages();
```

The first argument is the light variant, the second is the dark variant. Match type is inferred from the URL:

- Full URLs (contains `://`) → exact match
- Absolute paths (starts with `/`) → exact match
- Bare filenames → suffix match (matches any `src` ending with that string)

#### Behavior

- Runs an initial swap on all images in the DOM
- Watches for theme changes (`.dark` class toggled on `<html>`)
- Watches for new images added to the DOM (SPA navigation, lazy loading)
- Probes alternate URLs via `new Image()` — if the alternate 404s, no swap occurs
- Idempotent — safe to call `initDarkImages()` multiple times; subsequent calls return the same cleanup function
- Calling `cleanup()` stops all observers and allows re-initialization

### Review Widget

The `reviews` module renders a star-rating widget using data fetched at build time. Available in two sizes:

```js
import { initResenaWidget } from '@marketdataapp/ui/reviews';

// Large variant (default)
const cleanup = initResenaWidget({ container: document.getElementById('reviews') });

// Small variant
const cleanup = initResenaWidget({ container: el, version: 'small' });

// cleanup() removes the widget from the DOM
```

The module also re-exports the raw data for consumers who need just the numbers:

```js
import { reviewRating, reviewCount, reviewLabel } from '@marketdataapp/ui/reviews';
```

Build-time data is refreshed by `npm run build:fetch-reviews`, which runs as part of `npm run build`.

### Theme Tokens

`css/theme.css` defines all shared design tokens inside `@theme {}`:

- **Fonts**: `--font-sans`, `--font-mono`, `--font-quicksand`
- **Shadows**: `--shadow-line`, `--shadow-darkline`, `--shadow-diffuse`
- **Brand colors**: `--color-marketdata-lightorange`, `darkorange`, `lightblue`, `darkblue`, `bluebg`
- **Docusaurus admonition colors**: `note`, `tip`, `info`, `warning`, `danger` (each with bg/border/text + dark variants)
- **Neutral surfaces**: `--color-neutral-primary-*`, `secondary-*`, `tertiary-*`, `quaternary-*`, `--color-gray` (Flowbite semantic tokens with dark mode overrides)
- **Text / foreground**: `--color-heading`, `--color-body`, `--color-body-subtle`, `--color-fg-*` (success, danger, warning, etc.)
- **Borders**: `--color-buffer-*`, `--color-muted`, `--color-light-*`, `--color-default-*`, `--color-dark-*`
- **Status backgrounds**: `--color-success-*`, `--color-danger-*`, `--color-warning-*` (danger uses red, not Flowbite's default rose)
- **Brand aliases**: `--color-brand-*`, `--color-fg-brand-*` (semantic aliases to blue palette, with dark mode overrides)

## How to Add New Components

When adding a component to this package, follow this pattern:

1. **Define it as `@utility` in `components.src.css`** using `@apply` with Flowbite semantic tokens where possible, falling back to standard Tailwind classes with `dark:` variants when no token exists.

```css
@utility my-component {
  @apply bg-neutral-primary-medium border border-default-medium rounded-lg shadow-lg;
  @apply text-heading;
}
```

Semantic tokens (defined in `theme.css`) handle dark mode automatically — no `dark:` prefix needed. Only use `dark:` when there's no matching token.

2. **Add all new class names to `components.classes`** — this manifest tells the no-reset build which utilities to generate.

3. **Run `npm run build`** to compile templates, JS, and both CSS outputs.

4. **Use the class names in JS/HTML** — they work as plain CSS classes in any consumer.

Rules:

- Use standard Tailwind utility classes or Flowbite semantic tokens defined in `theme.css` in `@apply`. Semantic tokens like `bg-neutral-primary-medium`, `text-heading`, `text-body`, `border-default-medium`, `rounded-base`, `text-fg-danger`, `bg-danger-soft`, `bg-gray`, `text-fg-disabled` are available and handle dark mode automatically — no `dark:` prefix needed.
- Do NOT use Flowbite theme tokens that only exist when Flowbite's full CSS is loaded (e.g. tokens from Flowbite's generator that aren't defined in `theme.css`).
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

- `@marketdataapp/ui/css/theme` — all design tokens (brand + semantic UI) into its own Tailwind v4 build
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
- **Card Surface**: `.card-surface` (shared visual base: background, border, padding, shadow, rounded corners)
- **Grid Layout**: `.grid-layout-12`, `.grid-content-container`, `.grid-content-position`
- **User Profile**: `.user-profile-container`, `.user-profile-wrapper`, `.user-profile-avatar`, `.user-profile-avatar--img`, `.user-profile-avatar--placeholder`, `.user-profile-login-pill`, `.user-profile-dropdown`, `.user-profile-dropdown-header`, `.user-profile-dropdown-name`, `.user-profile-dropdown-email`, `.user-profile-dropdown-menu`, `.user-profile-dropdown-link`, `.user-profile-dropdown-signout`, `.user-profile-dropdown-subtext`, `.user-profile-dropdown-divider-above`, `.user-profile-dropdown-divider-below`
- **Theme Toggle**: `.theme-toggle-button`, `.theme-toggle-icon-light`, `.theme-toggle-icon-dark`
- **Defaults**: `.default` (base text + background with dark mode)

### JS Modules (build outputs in `dist/`)

- **`dist/theme.js`** — Cross-subdomain dark/light mode via `.marketdata.app` cookie
- **`dist/theme-toggle.js`** — Sun/moon toggle button with cookie persistence
- **`dist/dark-images.js`** — Automatic dark/light image swapping (convention + explicit pairs)
- **`dist/reviews.js`** — Review rating widget (large/small variants, build-time data, zero deps)
- **`dist/navbar-overflow.js`** — Priority-based auto-hide for navbar items
- **`dist/user-profile.js`** — Gravatar avatar + dropdown menu (zero deps, templates inlined)

## Known Issues and Lessons Learned

1. **`@layer` kills specificity in mixed environments.** Any CSS inside `@layer` automatically loses to unlayered CSS. This is why we run `unlayer.js` — without it, Docusaurus's Infima and aMember's platform CSS silently override our components.

2. **Docusaurus 3.x CSS minifier breaks CSS nesting.** Don't load this package's CSS through Docusaurus's `customCss` webpack pipeline. Use a `<link>` tag with a static file copy instead.

3. **Tailwind preflight conflicts with CSS frameworks.** The preflight reset (normalize + box-sizing) destroys Infima styles. Use `components.no-reset.css` when the consumer has its own framework.

4. **Only use locally-defined Flowbite tokens.** Semantic tokens defined in `theme.css` (e.g. `bg-neutral-primary-medium`, `text-heading`, `text-fg-danger`, `bg-danger-soft`, `rounded-base`) are safe to use — they're bundled in our builds. Do NOT use tokens that only exist in Flowbite's full CSS (e.g. tokens from Flowbite's generator that aren't in `theme.css`). This package's CSS must be self-contained.

5. **Dark mode must support both `.dark` and `[data-theme="dark"]`.** The `@custom-variant dark` handles this automatically for any class using `dark:` prefix in `@apply`.

6. **Class-name selectors break with `@apply`.** When a consumer writes `@apply form-container`, the `form-container` class name never appears in the DOM — Tailwind inlines the properties at build time. This means descendant selectors like `.form-container .radio-group-container` will never match. Use CSS custom properties as cascade signals instead (see below).

### Nested Component Contrast via CSS Custom Properties

Components that nest inside other components (e.g. radio groups inside forms) need different background tiers depending on their context. The naive approach — descendant selectors like `.form-container .radio-group-container` — breaks when consumers use `@apply` because class names don't appear in the DOM.

**Solution: parent components set CSS custom properties that child components consume with fallbacks.**

```css
/* Parent sets cascade signals */
@utility form-container {
  --nested-component-bg: var(--color-neutral-tertiary-medium);
  --nested-input-bg: var(--color-neutral-quaternary-medium);
  @apply bg-neutral-primary-medium /* ...rest */;
}

/* Child reads signal, falls back to standalone default */
@utility radio-group-container {
  background-color: var(--nested-component-bg, var(--color-neutral-secondary-medium));
}

@utility radio-button-input {
  background-color: var(--nested-input-bg, var(--color-neutral-tertiary-medium));
}
```

**Why this works:** `@apply form-container` inlines the custom property declarations onto the DOM element. Custom properties cascade through the DOM tree (parent → child), not through CSS selectors. So any descendant that reads `--nested-component-bg` gets the value regardless of how the parent was styled.

**Behavior:**

- **Inside a form** (class or `@apply`): custom properties cascade down, deeper tiers are used
- **Standalone**: properties aren't set, `var()` fallbacks provide the default tier

**When to use this pattern:** Any time a component's appearance needs to shift based on its nesting context. Define `--nested-*` variables in the parent utility; consume them with fallbacks in the child utility.

## License

UNLICENSED — proprietary MarketData code. Not for external use.
