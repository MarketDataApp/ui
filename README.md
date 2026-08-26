# @marketdataapp/ui

Shared Tailwind v4 theme, component CSS, and JS utilities for all MarketData properties (\*.marketdata.app).

**[Live Demo](https://dev.marketdata.app/ui/docs/)**

## Install

```bash
npm install @marketdataapp/ui@github:MarketDataApp/ui
```

## Exports

| Export                      | File                               | Description                                                                                                                                                                                                                                  |
| --------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `./css/theme`               | `css/theme.css`                    | All design tokens: brand colors, fonts, shadows, Flowbite semantic UI tokens (neutrals, text, borders, status). Import into your own Tailwind v4 build.                                                                                      |
| `./css/components.src`      | `css/components.src.css`           | Raw `@utility` definitions. Import into your own Tailwind v4 build to use `@apply` with shared classes.                                                                                                                                      |
| `./css/components`          | `dist/css/components.css`          | Pre-built CSS (full Tailwind including preflight reset), unlayered. For standalone consumers.                                                                                                                                                |
| `./css/components.no-reset` | `dist/css/components.no-reset.css` | Pre-built CSS without preflight reset, unlayered. For framework consumers with their own reset (e.g. Docusaurus).                                                                                                                            |
| `./theme`                   | `dist/theme.js`                    | Dark/light mode JS: `getThemeCookie`, `setThemeCookie`, `clearThemeCookie`, `isSystemMode`, `getUserThemePreference`, `getBrowserThemePreference`, `getEffectiveTheme`, `onThemeChange`, `syncThemeCookie`, `migrateLocalStoragePreference`. |
| `./theme-toggle`            | `dist/theme-toggle.js`             | Sun/moon toggle button for switching dark/light mode. Uses `./theme` for cookie persistence.                                                                                                                                                 |
| `./dark-images`             | `dist/dark-images.js`              | Automatic dark/light image swapping. Convention-based (`-light`/`-dark` suffix) or explicit pairs via `addImagePair()`.                                                                                                                      |
| `./reviews`                 | `dist/reviews.js`                  | Review rating widget with build-time data. Renders large or small variant via `initResenaWidget()`.                                                                                                                                          |
| `./navbar-overflow`         | `dist/navbar-overflow.js`          | Priority-based auto-hide for navbar items that overflow their container.                                                                                                                                                                     |
| `./user`                    | `dist/user.js`                     | Shared user state: `fetchUser` (stale-while-revalidate cache, dedup, retries), `onUserChange` (subscriber pattern).                                                                                                                          |
| `./user-profile`            | `dist/user-profile.js`             | Gravatar avatar with optional dropdown menu. Zero dependencies.                                                                                                                                                                              |
| `./user-state`              | `dist/user-state.js`               | Declarative show/hide for elements based on user auth and subscription state.                                                                                                                                                                |
| `./copy-button`             | `dist/copy-button.js`              | Auto-init copy-to-clipboard input + button. `initCopyButton({ root })` scans the DOM for `[data-copy-input-group]` wrappers and wires each one. Returns a cleanup fn.                                                                        |

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
@utility btn-outline-to-orange {
  @apply inline-flex items-center gap-2 max-w-max no-underline text-center py-2.5 px-7 ...;
  @apply bg-transparent text-marketdata-darkblue;
  @apply shadow-line dark:shadow-darkline dark:text-white;
  @apply hover:bg-gradient-orange hover:text-white hover:shadow-diffuse;
}
```

This serves two purposes:

1. **Tailwind v4 consumers** (amember) import the source file and can `@apply btn-outline-to-orange` in their own CSS.
2. **Non-Tailwind consumers** (Docusaurus) use the pre-built CSS where each `@utility` compiles to a plain `.btn-outline-to-orange { ... }` rule.

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

Every consuming page must include an **inline `<script>` as the first element in `<head>`** (before any `<link>` or `<style>` tags) that reads the theme cookie and applies the theme class/attribute before the browser's first paint:

```html
<head>
  <script data-cfasync="false">
    (function () {
      var match = document.cookie.match(/(?:^|;\s*)theme=(dark|light)/);
      var saved = match ? match[1] : null;
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var dark = saved === 'dark' || (!saved && prefersDark);
      document.documentElement.classList.add(dark ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    })();
  </script>
</head>
```

Both branches run on every load, so `.dark` / `.light` and `[data-theme="dark"]` / `[data-theme="light"]` are always set symmetrically. Consumers can rely on any of those four selectors at initial paint and after every toggle.

> **Note:** The `data-cfasync="false"` attribute prevents Cloudflare Rocket Loader from deferring this script. Without it, Rocket Loader may rewrite the tag to `type="text/rocketscript"`, causing a flash of wrong theme on first paint.

This mirrors the preference hierarchy from `theme.js`: **cookie > OS preference > light (default)**.

Then, later in the page (typically at the end of `<body>`), load the toggle as a module:

```html
<script data-cfasync="false" type="module">
  import { initThemeToggle } from '@marketdataapp/ui/theme-toggle';
  initThemeToggle({ container: document.getElementById('theme-toggle') });
</script>
```

The inline script handles initial render; the module handles user interaction and cookie persistence.

#### Cross-subdomain cookie sync for external toggles (Docusaurus, etc.)

When the consuming site uses its own theme toggle (e.g. Docusaurus's built-in switcher, which flips `data-theme` on `<html>` directly), our cross-subdomain cookie won't update automatically — the external toggle doesn't know about it. Call `syncThemeCookie()` once on page load to bridge the gap:

```js
import { syncThemeCookie } from '@marketdataapp/ui/theme';
syncThemeCookie();
```

`syncThemeCookie()` subscribes a `MutationObserver` to `<html>` (reusing the shared one from `onThemeChange`) and writes the theme cookie whenever the applied theme changes. It has a **system-mode safeguard**: if no cookie exists (meaning the user is following OS preference), it will not write one, so OS-following users stay OS-following. It also runs `migrateLocalStoragePreference()` on subscribe, copying any legacy `localStorage.theme` value into the cookie on first load.

`theme-toggle.js` (our own sun/moon toggle) writes the cookie on click and does **not** need `syncThemeCookie()`. Only external toggles do.

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

The `reviews` module renders a star-rating widget using data baked in from `src/reviews.data.js`. Available in two sizes:

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

**Refreshing the data.** The rating/count live in the committed `src/reviews.data.js`, and `npm run build` bakes that snapshot into `dist/reviews.js` — it does **not** scrape the platform. Fetching is a deliberate, local maintenance step:

```sh
npm run reviews:update   # scrape the platform, rebuild dist/reviews.js, then commit the diff
```

This is intentionally **not** wired into `npm run build` / CI: GitHub Actions has no Playwright browser installed for the build, and the platform's anti-bot can rate-limit datacenter IPs — so a CI-side scrape silently fell back to stale data. Running it locally (residential IP, real browser) and committing `src/reviews.data.js` keeps both the docs site and the published package fresh, and keeps CI builds deterministic. `reviews:update` exits non-zero if the scrape fails, so stale data is never shipped silently. If the platform ever fingerprint-blocks headless Chromium, swap in a stealth browser (e.g. camoufox) for the scrape.

### User State Visibility

The `user-state` module provides declarative show/hide for any HTML element based on the current user's authentication and subscription state. It builds on the shared `fetchUser()` cache and `onUserChange()` subscriber pattern from `user.js` — no separate fetching or caching.

#### Usage

Mark elements with `data-user-state` and the native `hidden` attribute. Call `initUserState()` to resolve visibility:

```html
<div data-user-state="logged-in" hidden>Welcome back!</div>
<div data-user-state="logged-out" hidden>Please log in</div>
<div data-user-state="paid" hidden>Premium content</div>
<div data-user-state="free" hidden>Upgrade now</div>
<div data-user-state="trial" hidden>Your trial ends soon</div>
<div data-user-state="product:quant" hidden>Quant-only feature</div>

<script data-cfasync="false" type="module">
  import { initUserState } from '@marketdataapp/ui/user-state';
  initUserState();
</script>
```

After `fetchUser()` resolves, matching elements have `hidden` removed. Non-matching elements stay hidden. No custom CSS is needed — the native `hidden` attribute handles everything.

#### Conditions

| Condition        | Matches when                        |
| ---------------- | ----------------------------------- |
| `logged-in`      | User is authenticated               |
| `logged-out`     | User is not authenticated (null)    |
| `paid`           | `user.paid === true`                |
| `free`           | Logged in and `user.paid === false` |
| `trial`          | `user.trial === true`               |
| `product:<slug>` | `user.products` includes the slug   |

All comparisons are **case-insensitive**. Product slugs are lowercase with hyphens (e.g. `starter-trial`, `free-forever`).

**OR logic:** Space-separated conditions are evaluated with OR — the element is shown if **any** condition matches:

```html
<div data-user-state="paid trial" hidden>All non-free users</div>
```

#### Options

```js
initUserState({
  root: document.getElementById('my-section'), // scope DOM queries (default: document)
  apiUrl: 'https://...', // override API endpoint (for testing/demos)
  skipCorsSafetyCheck: false, // request even off a marketdata.app host (default: false)
});
```

#### CORS safety check

`fetchUser()` reads `location.hostname` before it requests the default endpoint. It sends the request only from `marketdata.app` or a `*.marketdata.app` subdomain. On any other host — `localhost`, `127.0.0.1`, a preview URL — it resolves to `null` at once and makes no request.

The endpoint is `https://dashboard.marketdata.app/api/user/` and the request carries `credentials: 'include'`. From any other site that request is cross-site, so CORS rejects it. The rejection surfaces as a network error, which used to trigger two retries at 1s and 2s. Every such page paid about 3 seconds to arrive at the `null` it now gets on the first frame.

The allowed domain is derived from the endpoint constant, so it follows the endpoint if that ever moves.

To force the request anyway, pass `skipCorsSafetyCheck: true`. It works on `fetchUser()`, `initUserState()`, and `initUserProfile()`:

```js
initUserProfile({ container, skipCorsSafetyCheck: true });
```

An explicit `apiUrl` is never gated. Demos and tests point it at a mock — see `docs/simulator.js`, which serves `data:application/json,…` URLs — and a mock has no CORS problem to avoid.

#### How it stays in sync

`initUserState()` subscribes to `onUserChange()`, so elements automatically re-evaluate if user state changes (e.g. login/logout in another tab, plan upgrade detected by background revalidation). The cleanup function unsubscribes and re-hides all elements:

```js
const cleanup = await initUserState();
// later...
cleanup(); // unsubscribes, re-hides all [data-user-state] elements
```

#### API response shape

The `/api/user/` endpoint returns pre-computed fields — no client-side mapping needed:

```json
{
  "login": "cparksch2",
  "name": "Christopher Parks",
  "email": "christopher.parks@gmail.com",
  "products": ["quant"],
  "paid": true,
  "trial": false,
  "expires": "2026-03-20"
}
```

### Compact Login Pill

The logged-out login pill measures about 120px wide. Add the width of a logo,
a hamburger, and a theme toggle, and the navbar row needs roughly 444px — more
than any common phone gives it. The logged-in avatar is 40px and always fits;
only the logged-out states overflow.

Add `.user-profile-compact` to the same element you pass as `container`. The
pill then renders the person icon alone in a 44×44 box, and the container's
118px reservation drops to 44px to match:

```html
<div id="user-profile" class="user-profile-container user-profile-compact"></div>
```

The package ships no media query for this, because each property collapses its
navbar at a different width — Docusaurus at 996px, marketdata.app at 640px.
Toggle the class at whatever width your own navbar uses:

```css
@media (max-width: 639px) {
  /* your navbar's breakpoint, not ours */
}
```

Behavior that does not change:

- The dropdown still opens and still positions correctly. The menu is where the
  wording lives at this width.
- The button still announces "Log in". The label becomes the accessible name
  rather than being removed, hidden with `clip-path: inset(50%)` instead of the
  usual `overflow: hidden` recipe — the latter makes `scrollHeight` exceed
  `clientHeight`, which automated mobile audits flag as clipped text.
- Style the label and the chevron through `.user-profile-login-label` and
  `.user-profile-login-chevron`. Do not target them by child order; the
  template can change.

The full pill never wraps at any width. It carries `whitespace-nowrap` and
`shrink-0`, so a crowded navbar row cannot compress it into two lines. Both
variants hold a 44px minimum height for the WCAG 2.5.8 target.

### Clickable Badges

A badge that carries a link styles itself as one. There is no opt-in class:

```html
<!-- clickable: gains a hover, drops the underline, reaches a 24px target -->
<a class="badge badge-blue" href="/topics/options">options</a>

<!-- a label: unchanged in every way -->
<span class="badge badge-blue">options</span>
```

The behaviour keys off `:any-link`, which matches an `<a>` (or `<area>`) that has an `href`. An anchor without one is not clickable and stays a label. It works the same on `.badge-pill` and the `.badge-pill-{color}` variants.

What a linked badge gets:

- **A hover background** one step deeper than its resting colour, transitioned over 200ms. This follows Flowbite's own badges-as-links block, which changes the background rather than adding an underline or a filter.
- **No underline**, so a site-wide `a { text-decoration: underline }` does not run a rule through the middle of a filled pill.
- **A 24px minimum height**, the WCAG 2.5.8 target size. A resting badge is 18px, which is fine for a label and too small for a control. `inline-flex` and `items-center` centre the text in the taller box.
- **A 2px focus ring in its own colour** — `blue-700` in light, `blue-400` in dark, and the matching pair for every other hue. Buttons ring at 4px; a 24px chip cannot carry that without the ring reading as the component.

Those shades are measured, not picked. A focus indicator has to clear 3:1 against what sits beside it (WCAG 1.4.11), which for a chip means both the page behind it and the chip's own background. `{hue}-700` in light and `{hue}-400` in dark is the one pair that clears both for all eight hues — green and yellow reject every lighter shade in light mode, where `green-600` reaches only 2.93:1 against the page.

**Two custom properties carry the colours**, because the hover and focus rules live on `.badge` while the palette lives on `.badge-{color}`:

| Property             | Set by           | Read by                         |
| -------------------- | ---------------- | ------------------------------- |
| `--badge-hover-bg`   | `.badge-{color}` | `.badge:any-link:hover`         |
| `--badge-focus-ring` | `.badge-{color}` | `.badge:any-link:focus-visible` |

An uncoloured `.badge` link declares neither, so it falls back to a neutral hover and to the shared `--color-focus-ring`. This is the same cascade-signal pattern described under "Nested Component Contrast" below, and it is required rather than stylistic: a descendant selector could not join the two rules once a consumer flattens both classes into one of their own with `@apply`.

### Theme Tokens

The token set comes from Flowbite v4's **modern** theme, which upstream ships as `src/themes/default.css` — there is no `modern.css`. Three files, in import order:

| file                              | what it is                                                                                                           |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `css/flowbite-theme.upstream.css` | A byte-identical copy of the upstream file (flowbite@4.0.2). Never imported, nothing builds from it. Do not edit it. |
| `css/flowbite-theme.css`          | The same theme with our changes applied **in place**.                                                                |
| `css/theme.css`                   | Adds the MarketData tokens Flowbite does not provide. Overrides nothing.                                             |

We change Flowbite's theme in exactly three ways, and the reference copy makes that checkable in one command:

```
diff -w css/flowbite-theme.upstream.css css/flowbite-theme.css
```

1. **`danger` is Tailwind's red, not Flowbite's rose** — ten `--color-danger-*` and four `--color-fg-danger-*` tokens, both themes.
2. **The font stack is system fonts, not Inter** — the kit ships no webfont, so naming Inter would resolve to whatever the consumer happens to have.
3. **The theme block is `@theme static`, not `@theme`** — one keyword, no token values touched. See [Token parity across themes](#token-parity-across-themes).

**Brand tokens are Flowbite's, unmodified** — `--color-brand`, `-softer`, `-soft`, `-medium`, `-strong`, `-subtle`, `-light` and the `--color-fg-brand-*` set all carry upstream's values in both themes.

Changing the values in place rather than overriding them downstream means there is no second place to keep in step. Use `-w`: Prettier reindents the derived file and rewraps the font stacks, so a plain `diff` reports every line.

To refresh Flowbite: replace `flowbite-theme.upstream.css` wholesale, diff the two, and reapply the three changes above to the derived file.

#### Token parity across themes

Every `--color-*` token is declared for both themes, and the build ships both halves. If a token resolves in dark mode, it resolves in light mode.

This needs saying because it was not true before 5.9.2. Tailwind tree-shakes `@theme`, emitting only the tokens some generated utility references. The `.dark` block at the foot of `flowbite-theme.css` is a plain CSS rule, so nothing shakes it and it always ships whole. A token that no component class in this repo happened to use therefore survived in dark and vanished in light — 49 of them.

The failure was silent and theme-shaped. A consumer writing `var(--color-neutral-secondary-strong)` got a working colour in dark and an undefined custom property in light, so the browser dropped the whole declaration: no console warning, no visual error, and correct in whichever theme the developer had open. See [#50](https://github.com/MarketDataApp/ui/issues/50).

Both theme blocks are `@theme static`, which exempts them from tree-shaking. The cost is about 450 bytes gzipped. `tests/unit/theme-token-parity-css.test.js` compares the two halves of each build output, so a token added to one theme and forgotten in the other fails there rather than at a consumer.

Note what this does **not** change: the utility classes. `dist/css/` carries only the utilities this repo's own source uses. A consumer of the pre-built CSS who writes `bg-neutral-secondary-strong` still gets no rule, in either theme, because that class was never generated. Use the tokens through your own Tailwind build (`@import "@marketdataapp/ui/css/theme.css"`) to get the utilities, or read the custom properties directly in hand-written CSS.

Two guards keep the reference copy honest. It is in `.prettierignore`, so formatting cannot drift it off byte-identical. And `css/components.input.css` subtracts it with `@source not` — automatic source detection read the `rose-*` names in the danger tokens we replaced and emitted the entire rose palette into the standalone bundle. `tests/unit/source-detection-css.test.js` asserts it stays out.

`css/theme.css` then defines the MarketData tokens inside `@theme {}`:

- **Fonts**: `--font-quicksand` (the display face; `--font-sans`, `--font-body` and `--font-mono` come from `flowbite-theme.css`)
- **Shadows**: `--shadow-line`, `--shadow-darkline`, `--shadow-diffuse`
- **Brand colors**: `--color-marketdata-lightorange`, `darkorange`, `lightblue`, `darkblue`, `bluebg`
- **Docusaurus admonition colors**: `note`, `tip`, `info`, `warning`, `danger` (each with bg/border/text + dark variants)
- **Neutral surfaces**: `--color-neutral-primary-*`, `secondary-*`, `tertiary-*`, `quaternary-*`, `--color-gray` (Flowbite semantic tokens with dark mode overrides)
- **Text / foreground**: `--color-heading`, `--color-body`, `--color-body-subtle`, `--color-fg-*` (success, danger, warning, etc.)
- **Borders**: `--color-buffer-*`, `--color-muted`, `--color-light-*`, `--color-default-*`, `--color-dark-*`
- **Status backgrounds**: `--color-success-*`, `--color-danger-*`, `--color-warning-*` (danger uses red, not Flowbite's default rose)
- **Brand aliases**: `--color-brand-*`, `--color-fg-brand-*` (semantic aliases to blue palette, with dark mode overrides)
- **Focus ring**: `--color-focus-ring` (see below)

#### Focus Ring

`--color-focus-ring` is the one colour for every keyboard focus indicator the kit draws on a neutral surface — currently the login pill and the theme toggle. Use it as `focus-visible:ring-4 focus-visible:ring-focus-ring`.

It is the brand blue (`#0085f2`) in light mode and `--color-blue-400` in dark. One value cannot serve both: against the dark login pill the brand blue measures 2.97:1, under the 3:1 that WCAG 1.4.11 asks of a focus indicator. The dark override lives in a plain `.dark, [data-theme='dark']` rule at the end of `theme.css` rather than in a `dark:` variant, because a token override has to reach every element and `theme.css` is imported before a consumer declares the variant.

Gradient buttons do **not** use this token. They keep `--btn-focus-color`, which transitions from pink to brand alongside the gradient itself.

Buttons and button-like controls ring on `:focus-visible`, not `:focus`, so a mouse click leaves no ring behind. Form controls are the deliberate exception and keep `:focus` — text inputs, selects, radios, and checkboxes stay the active control after a click, and the ring says which one has the caret.

## Development

After cloning, run `npm install`, then `npm run setup` once. `npm run setup` installs the local git hooks (husky → `pre-commit` formatting via lint-staged).

### Which browser the tests run

The e2e suite runs against **whatever Chromium the machine already has** — `/usr/bin/chromium` on Linux, `Chromium.app`/`Google Chrome.app` on macOS — not against a build this repo pins. `scripts/resolve-chromium.js` picks it, and both `playwright.config.js` and `npm run reviews:fetch` use that one resolver.

This is deliberate. `browserName: 'chromium'` is an invisible version pin: it resolves to the single revision bundled with the installed `@playwright/test`, so the browser under test only moves when someone bumps a devDependency and re-runs `playwright install`. That would make this repo the gate on every Chromium update. The specs measure real rendering — pixel dimensions, `:focus-visible`, relative colour syntax — so they should see the browser our users run, the day their OS updates it, with no commit here.

- Every run prints the binary it chose (`Chromium: /usr/bin/chromium (system)`). Read that line first when a pixel assertion fails.
- Set `CHROMIUM_PATH=/path/to/binary` to force a specific browser.
- With no system browser found, it falls back to Playwright's bundled build, so a fresh clone still works after `npx playwright install chromium`. CI keeps that install step as its safety net.
- Trade-off: Playwright only guarantees the revision it bundles, so a system browser far ahead of it can drift on CDP behaviour. That is the price of not holding updates back, and it fails loudly rather than silently.

This package ships a prebuilt `dist/` and deliberately has **no** `prepare`/`postinstall` lifecycle script. Consumers install it as a git dependency (`github:MarketDataApp/ui#vX.Y.Z`), and pnpm 10/11 refuse to install a git-hosted package that declares a `prepare` script unless it's allowlisted under `allowBuilds` — even when the script does no building. Keeping the manifest free of install-time lifecycle scripts is what lets `pnpm install` work on pnpm 9/10/11 with no allowlist. **Do not add a `prepare` script back** — set up dev-only tooling through `npm run setup` instead. See CHANGELOG 5.2.1 / issue #36.

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

- **Buttons**: `.btn-orange-to-blue`, `.btn-blue-to-orange`, `.btn-outline-to-orange`, `.btn-outline-to-blue`, `.btn-orange-to-outline`, `.btn-blue-to-outline` (all named as `btn-{from}-to-{to}`). Deprecated aliases: `.btn-hover-orange` → `.btn-outline-to-orange`, `.btn-hover-blue` → `.btn-outline-to-blue`.
- **Forms**: `.form-container`, `.form-heading`, `.form-label`, `.form-input`, `.form-input-disabled`, `.form-input-error`, `.form-dropdown-input`, `.form-helper-text`, `.form-helper-text-error`
  - **`.form-input` works on `<input>`, `<select>` and `<textarea>`.** There is no `.form-textarea` — the element carrying the class decides, so a multi-line field cannot drift from the single-line ones beside it, and height stays `rows`. A textarea resizes vertically (not the browser default `both`, which breaks the form's column; override with `resize-none`), drops the `read-only` not-allowed cursor since read-only text is still scrolled and selected, and drops Chrome's autofill repaint, which it never triggers.
  - **`.form-input-group` + `.form-icon-*` gives a field a leading icon**, both classes on the wrapper: `.form-icon-envelope`, `-user`, `-lock`, `-phone`, `-search`. No icon markup — the glyph is a `mask-image` on the wrapper's `::before`, so no `<svg>` to paste and no `aria-hidden` to remember. The glyphs are **solid**, matching the kit's icon language (the theme toggle's sun and moon, the user profile's person, the admonition icons); a mask reads alpha, so a filled path is opaque and everything outside it transparent. The icon class sets `--form-icon` and `--form-input-ps`, and `.form-input` reads the latter, so the room for the glyph arrives as an inherited value rather than a `ps-9` competing with `p-2.5` at equal specificity. A bare `.form-input-group` is just a relative wrapper. For an unlisted glyph, set both properties inline on the wrapper.
- **Search Input**: a text field with a submit button joined to its trailing edge, the two reading as one control. `.search-input-group` on the `<form>`, `.search-input` on the field, and one of three buttons — `.search-input-button` (label), `.search-input-button-icon` (glyph + label), `.search-input-button-compact` (glyph only). No JS.
  - **The class picks the button, not the markup.** All three take the same content: `<button class="…">Search</button>`. The magnifier is a `mask-image` on `::before`, the way `.copy-icon` carries its clipboard, so there is no SVG to paste and it follows `currentColor`. The compact variant collapses the label with `font-size: 0` rather than removing it, so the text remains the accessible name — no `aria-label`, and no `aria-hidden` on a glyph, because a pseudo-element is already decorative to assistive tech.
  - **The field mirrors Flowbite's search input**: `bg-neutral-secondary-medium` and `border-default-medium`, not `form-input`'s raw `gray-*` pairs. Both tokens are theme-aware, so there is no `dark:` variant to keep in step. It still composes `.form-input` for behaviour — focus ring, autofill repaint, disabled and read-only states.
  - **Both halves render 42px** and each lifts itself with `z-index` on focus so its ring survives the join. The field rings in `--color-brand` like every other field; the button takes a 4px `brand-medium` halo instead, because its own fill is `brand-strong` and a `brand` ring against it measures 1.29:1 and disappears.
  - **The boundary does not clear WCAG 1.4.11's 3:1, and that is settled.** It measures 1.18:1 light and 1.42:1 dark against its own fill. The kit follows Flowbite's design system here; [#45](https://github.com/MarketDataApp/ui/issues/45) is closed as won't-fix. A version clearing 3:1 shipped first and was rejected on appearance. In dark the fill equals `card-surface`, so on a raised panel the field has no edge.
- **Copy Input**: `.copy-input-group`, `.copy-input`, `.copy-input-compact`, `.copy-input-button` (text variant), `.copy-input-icon-button` + `.copy-input-action` + `.copy-input-tooltip` (icon-only variant with hover tooltip), `.copy-icon` + `.copy-icon-clipboard` / `.copy-icon-check` (mask-image icons). Paired with `dist/copy-button.js`.
- **Spinner**: `.spinner` — indeterminate loading indicator with neutral track + brand-colored rotating arc, both rendered via `mask-image` (no SVG in consumer markup). Arc color follows `currentColor` (`text-*`); track color overridable via the `--spinner-track` custom property.
- **Badges**: `.badge .badge-{color}`, `.badge-pill-{color}` — clickable automatically when used on a link, see "Clickable Badges"
- **Radio Buttons**: `.radio-button-input`, `.radio-button-helper`
- **Card Surface**: `.card-surface` (shared visual base: background, border, padding, shadow, rounded corners)
- **Grid Layout**: `.grid-layout-12`, `.grid-content-container`, `.grid-content-position`
- **User Profile**: `.user-profile-container`, `.user-profile-compact`, `.user-profile-wrapper`, `.user-profile-avatar`, `.user-profile-avatar--img`, `.user-profile-avatar--placeholder`, `.user-profile-login-pill`, `.user-profile-login-label`, `.user-profile-login-chevron`, `.user-profile-dropdown`, `.user-profile-dropdown-header`, `.user-profile-dropdown-name`, `.user-profile-dropdown-email`, `.user-profile-dropdown-menu`, `.user-profile-dropdown-link`, `.user-profile-dropdown-signout`, `.user-profile-dropdown-subtext`, `.user-profile-dropdown-divider-above`, `.user-profile-dropdown-divider-below`
- **Theme Toggle**: `.theme-toggle-button`, `.theme-toggle-icon-light`, `.theme-toggle-icon-dark`
- **Defaults**: `.default` (base text + background with dark mode)

### JS Modules (build outputs in `dist/`)

- **`dist/theme.js`** — Cross-subdomain dark/light mode via `.marketdata.app` cookie + `onThemeChange()` subscriber
- **`dist/theme-toggle.js`** — Sun/moon toggle button with cookie persistence
- **`dist/dark-images.js`** — Automatic dark/light image swapping (convention + explicit pairs)
- **`dist/reviews.js`** — Review rating widget (large/small variants, build-time data, zero deps)
- **`dist/navbar-overflow.js`** — Priority-based auto-hide for navbar items. Measures synchronously before `initNavbarOverflow()` returns, so there is no unmeasured window to paint around and no pre-measurement CSS default to invent. Re-measures once `document.fonts.ready` settles, because a webfont swap changes text width without resizing the container or mutating the DOM — neither observer sees it. Later passes stay debounced at 50ms.
- **`dist/user.js`** — Shared user state management (fetch, cache, subscribe)
- **`dist/user-profile.js`** — Gravatar avatar + dropdown menu (zero deps, templates inlined)
- **`dist/user-state.js`** — Declarative show/hide based on user auth and subscription state
- **`dist/copy-button.js`** — Auto-init copy-to-clipboard input + button (scans `[data-copy-input-group]`; supports text and icon-only variants with tooltip)

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
