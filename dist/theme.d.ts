/**
 * @module theme
 * Cross-domain dark/light theme cookie management for *.marketdata.app.
 *
 * Preference hierarchy: cookie > localStorage > system preference > light (default).
 * The cookie is set on .marketdata.app so the theme persists across subdomains.
 *
 * This module handles preference detection and theme change observation.
 * Each property (Amember, Docusaurus, etc.) applies the theme its own way.
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
 * @returns {'dark' | 'light' | 'no-preference'}
 */
export function getUserThemePreference(): "dark" | "light" | "no-preference";
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
