# Changelog

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
