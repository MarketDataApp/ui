/** @typedef {import('./user.js').User} User */
/**
 * Evaluates a single condition against the user object.
 *
 * @param {string} condition - One of: logged-in, logged-out, paid, free, trial, product:<slug>
 * @param {User | null} user - User object from fetchUser(), or null if logged out
 * @returns {boolean}
 */
export function evaluateCondition(condition: string, user: User | null): boolean;
/**
 * Resolves visibility for all `[data-user-state]` elements.
 * Elements whose conditions match get `hidden` removed; others get `hidden` set.
 *
 * @param {User | null} user - User object or null
 * @param {HTMLElement|Document} root - Scope for DOM queries
 */
export function resolveElements(user: User | null, root: HTMLElement | Document): void;
/**
 * Scans the DOM for `[data-user-state]` elements and shows/hides them
 * based on the current user's authentication and subscription state.
 *
 * Subscribes to onUserChange() so elements update if user state changes
 * (e.g. login/logout in another tab).
 *
 * @param {Object} [options]
 * @param {HTMLElement|Document} [options.root=document] - Scope for DOM queries
 * @param {string} [options.apiUrl] - Override API endpoint (for testing/demos)
 * @returns {Promise<() => void>} Cleanup function that unsubscribes and re-hides elements
 */
export function initUserState(options?: {
    root?: HTMLElement | Document;
    apiUrl?: string;
}): Promise<() => void>;
export type User = import("./user.js").User;
