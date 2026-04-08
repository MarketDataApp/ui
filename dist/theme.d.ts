/**
 * @module theme
 * Cross-domain dark/light theme cookie management for *.marketdata.app.
 *
 * Preference hierarchy: cookie > localStorage > system preference > light (default).
 * The cookie is set on .marketdata.app so the theme persists across subdomains.
 *
 * This module handles preference detection and theme change observation.
 * Each property (Amember, Docusaurus, etc.) applies the theme its own way.
 *
 * For consumers whose theme toggle flips <html> attributes directly (e.g.
 * Docusaurus), call syncThemeCookie() once on page load to keep our
 * cross-subdomain cookie in sync with whatever writes to the DOM.
 */
/**
 * Reads the theme cookie value.
 * @returns {'dark' | 'light' | null}
 */
export function getThemeCookie(): "dark" | "light" | null;
/**
 * Sets the theme cookie on .marketdata.app with a 1-year expiry.
 * @param {'dark' | 'light'} theme
 */
export function setThemeCookie(theme: "dark" | "light"): void;
/** Clears the theme cookie, reverting to system/OS preference. */
export function clearThemeCookie(): void;
/** Returns true when the user has no explicit theme preference (follows OS). */
export function isSystemMode(): boolean;
/**
 * Returns the user's explicitly saved preference (cookie > localStorage), or 'no-preference'.
 *
 * This is a pure getter. Call migrateLocalStoragePreference() (or
 * syncThemeCookie(), which wraps it) if you want a legacy localStorage value
 * promoted into the cookie.
 * @returns {'dark' | 'light' | 'no-preference'}
 */
export function getUserThemePreference(): "dark" | "light" | "no-preference";
/**
 * One-shot migration: if a legacy localStorage `theme` value exists and no
 * cookie is set, copy it into the cookie. Safe to call repeatedly — a no-op
 * once the cookie is present.
 * @returns {'dark' | 'light' | null} the migrated value, or null if nothing to migrate
 */
export function migrateLocalStoragePreference(): "dark" | "light" | null;
/**
 * Returns the browser/OS theme preference via matchMedia, or 'no-preference'.
 * @returns {'dark' | 'light' | 'no-preference'}
 */
export function getBrowserThemePreference(): "dark" | "light" | "no-preference";
/**
 * Returns the effective theme by checking cookie > localStorage > system > 'light'.
 * @returns {'dark' | 'light'}
 */
export function getEffectiveTheme(): "dark" | "light";
/**
 * Subscribe to theme changes. The callback fires whenever the applied theme
 * changes — via the `class` attribute (Tailwind `dark` class), the `data-theme`
 * attribute (Docusaurus), or a `prefers-color-scheme` media query change.
 *
 * Internally manages a single shared MutationObserver (created on first
 * subscriber, disconnected when the last unsubscribes).
 *
 * @param {(theme: 'dark' | 'light') => void} callback
 * @returns {() => void} Unsubscribe function
 */
export function onThemeChange(callback: (theme: "dark" | "light") => void): () => void;
/**
 * Subscribe the cross-subdomain theme cookie to live theme changes. Writes
 * the cookie whenever the applied theme changes — but ONLY if the user
 * already has an explicit preference (cookie already set). This preserves
 * "system mode" for users without a cookie: their DOM can follow OS changes
 * without silently getting promoted out of system mode.
 *
 * Also runs migrateLocalStoragePreference() once on subscribe so consumers
 * with a legacy localStorage value get migrated to the cookie automatically.
 *
 * Intended for consumers whose theme toggle flips DOM attributes directly
 * (e.g. Docusaurus) and therefore can't call setThemeCookie() themselves.
 * Our own theme-toggle.js writes the cookie on click and does not need this.
 *
 * @returns {() => void} Unsubscribe function
 */
export function syncThemeCookie(): () => void;
