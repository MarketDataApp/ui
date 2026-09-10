/**
 * Wire up a rendered site header.
 *
 * Idempotent per root: calling it twice does not bind twice. Sets
 * `data-header-ready` on the root once every binding is in place.
 *
 * @param {InitHeaderOptions} [options]
 * @returns {() => void} Cleanup. Closes the drawer and every menu, restores
 *   the page's `inert` and scroll state, removes every listener and observer
 *   this call added, and tears down the controls it initialised. It never
 *   removes markup a consumer placed in a slot.
 */
export function initHeader(options?: InitHeaderOptions): () => void;
export type InitHeaderOptions = {
    /**
     * - The `<header class="site-header">`. Default: the first one in the document.
     */
    root?: HTMLElement;
    /**
     * - Options forwarded to `initUserProfile` for `#user-profile` (defaults: `dropdown: true`, `signupUrl: '/signup/'`, `signupText: 'Try For Free'`). Pass `false` when the application owns the account control; the header then never touches that element.
     */
    userProfile?: false | any;
    /**
     * - Initialise every `.theme-toggle-container` in the header. Default `true`.
     */
    themeToggle?: boolean;
    /**
     * - Selector for the page regions made inert while the drawer is open. Default `'main, footer'`. Elements inside the header, and elements already inert, are left alone.
     */
    inert?: string;
    /**
     * - Milliseconds before a hovered mega menu opens, and before it closes after the pointer leaves. Default 100.
     */
    hoverDelay?: number;
};
