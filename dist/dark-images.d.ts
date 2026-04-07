/**
 * Register a light/dark image pair. When one is found in the DOM and the theme
 * doesn't match, it will be swapped for the other.
 *
 * Match type is inferred from each URL:
 * - `https://example.com/img.jpg` — matched exactly (has "://")
 * - `/folder/img.jpg` — matched exactly (starts with "/")
 * - `img.jpg` — matches any src ending with `img.jpg`
 *
 * @param {string} lightUrl - The URL (or filename/path fragment) for light mode
 * @param {string} darkUrl  - The URL (or filename/path fragment) for dark mode
 */
export function addImagePair(lightUrl: string, darkUrl: string): void;
/**
 * Initialize automatic dark/light image swapping.
 *
 * Idempotent — safe to call multiple times. Subsequent calls are no-ops that
 * return the same cleanup function. Calling cleanup allows re-initialization.
 *
 * Watches for:
 * - Theme changes via class or data-theme on <html> (Tailwind and Docusaurus)
 * - New <img> elements added to the DOM (SPA navigation, lazy loading, etc.)
 * - src attribute changes on existing <img> elements
 *
 * Runs an initial swap on call.
 *
 * @returns {() => void} Cleanup function that stops all observers.
 */
export function initDarkImages(): () => void;
