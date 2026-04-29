# Changelog

## 4.8.0

### New

- **Admonition components** — `.admonition` plus type modifiers (`.admonition-note`, `.admonition-tip`, `.admonition-info`, `.admonition-warning`, `.admonition-danger`) and sub-components (`.admonition-heading`, `.admonition-icon`, `.admonition-content`). Type modifiers set `--admonition-bg`/`--border`/`--text`/`--icon` custom properties that cascade into the heading and icon, so consumers using `@apply admonition admonition-note` on their own classes get the full styling without descendant selectors. Icons are masked with `currentColor` using the exact SVG paths from Docusaurus's classic theme, so they always match the active text color. Supports custom titles, multiple paragraphs, lists, links, inline code, and a heading-less variant. The "Semantic Colors" preview in [docs/index.html](docs/index.html) is now a real token-swatch reference and is followed by a new Admonitions section demonstrating each variation.

## 4.6.1

### Fixes

- **Button labels no longer wrap in narrow containers.** Added `whitespace-nowrap` to all six `btn-*` utilities (`btn-orange-to-blue`, `btn-blue-to-orange`, `btn-outline-to-orange`, `btn-outline-to-blue`, `btn-orange-to-outline`, `btn-blue-to-outline`) so labels stay on a single line by default. Consumers that were locally patching this with a wrapper class can drop the workaround on next package bump.

## 4.6.0

### Changed

- **Renamed outlined-default buttons to follow the `btn-{from}-to-{to}` matrix.** `btn-hover-orange` → `btn-outline-to-orange` and `btn-hover-blue` → `btn-outline-to-blue`. The "hover" naming predates the full matrix and isn't descriptive now that every button changes on hover; the new names describe the starting and ending states symmetrically, matching the rest of the button family (`btn-orange-to-blue`, `btn-blue-to-orange`, `btn-orange-to-outline`, `btn-blue-to-outline`).

### Deprecated

- **`btn-hover-orange` and `btn-hover-blue`** — kept as aliases that fully inline the new utilities' properties, so existing consumers continue to work without any change. Prefer the new names in new code. The aliases may be removed in a future major version.

## 4.5.0

### New

- **`btn-orange-to-outline`** — new primary-CTA button utility that starts as an orange-filled button with the pink drop shadow and transitions to an outlined button with an inset line border on hover. Completes the `btn-hover-orange` pair in reverse (that one starts outlined and fills in; this one starts filled and de-emphasizes). Designed for in-page primary CTAs like "Send Message", "Contact Sales", and hero calls-to-action.
- **`btn-blue-to-outline`** — symmetric blue-filled → outlined variant, added for matrix completeness alongside the orange counterpart.
- **Icon-ready button utilities** — all six `btn-*` utilities now include `items-center gap-2` in their base layout. Consumers can drop an icon child next to the text without manually patching alignment. Previously, `inline-flex` without `items-center` defaulted to baseline alignment and icons sat slightly above the text.

Closes #15.

## 4.4.0

### Fixes

- **Override Flowbite's broken `--leading-none: 1px` token.** Flowbite v4.0.1 ships a typo in its default theme (`--leading-none: 1px` instead of unitless `1`) that crushes line-height to a single pixel on every button utility (`btn-orange-to-blue`, `btn-blue-to-orange`, `btn-hover-orange`, `btn-hover-blue`), since they all `@apply leading-none`. Added `--leading-none: 1` to [css/theme.css](css/theme.css) so the override propagates to any consumer that imports our theme after Flowbite's default. Also fixed the same typo in [css/flowbite-theme.css](css/flowbite-theme.css) (a reference copy of upstream) to kill the latent trap if a future consumer ever imports it directly.

Closes #14.

## 4.3.0

### New

- **Symmetric theme DOM contract** — `applyTheme()` and the inline FOUC snippets now write both `.dark` / `.light` classes and `[data-theme="dark"]` / `[data-theme="light"]` attributes symmetrically in both branches. All four selectors are present from first paint and after every toggle, so consumers can write rules like `html.light { … }` or `html[data-theme="light"] { … }` reliably.
- **`syncThemeCookie()`** export from `@marketdataapp/ui/theme` — subscribes the cross-subdomain theme cookie to live DOM theme changes via the shared `onThemeChange` observer. Intended for consumers whose theme toggle flips DOM attributes directly (e.g. Docusaurus's built-in switcher) and therefore can't call `setThemeCookie()` themselves. Includes a **system-mode safeguard**: only writes the cookie when one already exists, so users following OS preference (no cookie) stay OS-following even when their OS flips dark. Returns an unsubscribe function.
- **`migrateLocalStoragePreference()`** export from `@marketdataapp/ui/theme` — one-shot migration of any legacy `localStorage.theme` value into the cross-subdomain cookie. No-op if a cookie already exists. `syncThemeCookie()` calls it automatically on subscribe, so most consumers don't need to call it directly.

### Changed

- **`getUserThemePreference()` is now a pure getter.** It previously had a surprising side effect of writing a cookie during a read, when falling back to `localStorage`. The migration logic moved to the new `migrateLocalStoragePreference()` function. Consumers who relied on the implicit migration should call `syncThemeCookie()` (or `migrateLocalStoragePreference()` directly) on page load.

### Fixes

- **[docs/navbar-overflow.html](docs/navbar-overflow.html)** was missing the inline FOUC theme-init snippet, causing a flash of wrong theme on first paint. Added.

### Compatibility

- Adding the `.light` class is additive — existing consumers using `html.dark` selectors or Tailwind `dark:` variants are unaffected.
- `theme.js`'s internal `_resolveTheme()` already reads `data-theme` first with a fallback to the `.dark` class, so existing reactive consumers of `onThemeChange()` keep working.

Closes #13.

## 4.2.0

### New

- **TypeScript type declarations** — every JS module entry point (`./theme`, `./navbar-overflow`, `./user`, `./user-profile`, `./user-state`, `./theme-toggle`, `./reviews`, `./dark-images`) now ships with a `.d.ts` file alongside its `.js`. TypeScript consumers can import named exports cleanly without `as any` casts, and get full autocomplete and parameter type checking.
- Type declarations are generated from the existing JSDoc comments via `tsc --allowJs --emitDeclarationOnly`, so they stay in sync with the implementation automatically.
- **`User` type** exported from `@marketdataapp/ui/user` — describes the user object shape (`login`, `name`, `email`, `paid`, `trial`, `products`).

### Fixes

- Corrected several JSDoc annotations that either had non-standard syntax or did not match runtime behavior:
  - `onThemeChange()` callback parameter type
  - `initThemeToggle()` return type (actually returns `{ cleanup, resetToSystem }`, was documented as `() => void`)
  - `getThemeCookie()`, `getEffectiveTheme()`, `getUserThemePreference()`, `getBrowserThemePreference()` now declare their literal union return types

Closes #12.

## 4.0.0

### Breaking Changes

- **`fetchUser()` and `_clearCache()` are no longer exported from `@marketdataapp/ui/user-profile`**. Import them from `@marketdataapp/ui/user` instead.
- **`fetchUser()` no longer accepts an `onInvalidate` callback**. Use `onUserChange()` from `@marketdataapp/ui/user` to subscribe to user state changes (including logout).
- **`fetchUser()` now has a 1-minute TTL cache**. Calls within 60 seconds of the last fetch return cached data without triggering a background revalidation. Previously, every call with cached data triggered a background fetch.

### New

- **`@marketdataapp/ui/user` module** — standalone user state management, decoupled from the user-profile UI component. Multiple components can share user state without redundant API calls.
- **`onUserChange(callback)`** — subscribe to user state changes. Returns an unsubscribe function. Callbacks receive the new user object or `null` on logout.
- **Request deduplication** — concurrent `fetchUser()` calls share a single in-flight request.

### Migration

```js
// Before
import { fetchUser, _clearCache } from '@marketdataapp/ui/user-profile';

// After
import { fetchUser, _clearCache, onUserChange } from '@marketdataapp/ui/user';

// Before (onInvalidate callback)
const user = await fetchUser({ onInvalidate: renderLoggedOut });

// After (subscriber pattern)
const unsub = onUserChange((user) => {
  if (!user) renderLoggedOut();
});
const user = await fetchUser();
```

## 3.2.0

### New

- **`.card-surface` utility** — shared visual base (background, border, responsive padding, shadow, rounded corners) used by `.grid-content-container` and `.form-container`. Available standalone for custom card layouts.
- **`.grid-content-position` now includes edge spacing** — adds `mx-4` / `md:mx-6` on small screens and removes it at `xl`+, matching `.grid-content-container`. Consumers no longer need to manage their own horizontal margin or padding to keep content off the viewport edges.

### Changed

- **`.grid-content-container`** — removes horizontal margin at `xl`+ so the container's outer edge aligns flush with `.grid-content-position`. Upgraded from `shadow` to `shadow-md`. Now composes `card-surface` internally.
- **`.form-container`** — now composes `card-surface` internally. Background and border use semantic tokens (`bg-neutral-primary-medium`, `border-neutral-quaternary`) instead of raw color values. Padding step-up changed from `p-4 lg:p-8` to `p-4 sm:p-6 xl:p-8` for consistency.

### Migration

- If you were adding your own horizontal margin/padding around `.grid-content-position` or `.grid-content-container` on small screens, you can remove it — edge spacing is now built in.
- `.form-container` padding now starts stepping up at `sm` instead of staying at `p-4` until `lg`. If you relied on the tighter padding at medium screen sizes, you may need to adjust.

## 3.0.0

### Breaking Changes

- `initThemeToggle()` now returns `{ cleanup, resetToSystem }` instead of a bare cleanup function. Update calls from `const cleanup = initThemeToggle(...)` to `const { cleanup } = initThemeToggle(...)`.

### New

- `clearThemeCookie()` export from `theme.js` — deletes the theme cookie, reverting to system/OS preference.
- `isSystemMode()` export from `theme.js` — returns `true` when the user has no explicit theme preference.
- `resetToSystem()` method on the `initThemeToggle()` return object — clears the cookie and re-applies the current OS theme.

### Fixed

- OS theme changes are now followed live when the user has no explicit preference (system mode). Previously, the `matchMedia` change listener only updated toggle icons without applying the theme.
