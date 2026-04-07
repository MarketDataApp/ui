# Changelog

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
