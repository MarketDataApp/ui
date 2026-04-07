/**
 * Subscribe to user state changes.
 * The callback fires when a background revalidation detects that user data
 * has changed (including logout, where `user` will be `null`).
 *
 * @param {(user: User | null) => void} callback - Receives the new user object or null
 * @returns {() => void} Unsubscribe function
 */
export function onUserChange(callback: (user: User | null) => void): () => void;
/**
 * Fetches the current user from the MarketData API.
 *
 * Uses stale-while-revalidate with a 1-minute TTL:
 * - Cache hit within TTL → return cached, no revalidation
 * - Cache hit past TTL → return cached, revalidate in background
 * - Cache miss → wait for network
 *
 * Concurrent calls are deduplicated (only one in-flight request at a time).
 * Subscribers registered via onUserChange() are notified when user data changes.
 *
 * @param {Object} [options]
 * @param {string} [options.apiUrl] - Override the API endpoint
 * @returns {Promise<User | null>} User object or null on any error
 */
export function fetchUser(options?: {
    apiUrl?: string;
}): Promise<User | null>;
/** Clear all caches and state. Useful for testing. */
export function _clearCache(): void;
/** Returns the timestamp of the last completed fetch. Useful for testing TTL. */
export function _getLastFetchTime(): number;
export type User = {
    login?: string;
    name?: string;
    email?: string;
    paid?: boolean;
    trial?: boolean;
    products?: string[];
};
