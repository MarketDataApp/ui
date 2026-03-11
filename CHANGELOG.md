# Changelog

## 3.0.0

### Breaking Changes

- `initThemeToggle()` now returns `{ cleanup, resetToSystem }` instead of a bare cleanup function. Update calls from `const cleanup = initThemeToggle(...)` to `const { cleanup } = initThemeToggle(...)`.

### New

- `clearThemeCookie()` export from `theme.js` — deletes the theme cookie, reverting to system/OS preference.
- `isSystemMode()` export from `theme.js` — returns `true` when the user has no explicit theme preference.
- `resetToSystem()` method on the `initThemeToggle()` return object — clears the cookie and re-applies the current OS theme.

### Fixed

- OS theme changes are now followed live when the user has no explicit preference (system mode). Previously, the `matchMedia` change listener only updated toggle icons without applying the theme.
