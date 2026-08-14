// Auto-generated from src/ by scripts/build-js.js — do not edit manually

/**
 * @module user
 * Shared user state management for *.marketdata.app.
 *
 * Provides fetchUser() with stale-while-revalidate caching (1-minute TTL),
 * request deduplication, and a subscriber pattern so multiple UI components
 * can share a single user state without redundant API calls.
 */

/**
 * @typedef {Object} User
 * @property {string} [login]
 * @property {string} [name]
 * @property {string} [email]
 * @property {boolean} [paid]
 * @property {boolean} [trial]
 * @property {string[]} [products]
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_API_URL = 'https://dashboard.marketdata.app/api/user/';
const CACHE_KEY = 'marketdata_user';
const CACHE_TTL = 60_000; // 1 minute

// Registrable domain of the default endpoint: 'dashboard.marketdata.app' -> 'marketdata.app'.
// Derived so DEFAULT_API_URL stays the only place the domain is written.
const API_BASE_DOMAIN = new URL(DEFAULT_API_URL).hostname.split('.').slice(-2).join('.');

// ---------------------------------------------------------------------------
// CORS safety check
// ---------------------------------------------------------------------------

/**
 * True when the current page can send a credentialed request to the default
 * endpoint without tripping CORS — that is, when it is served from the API's
 * own registrable domain.
 *
 * The '.' prefix on the suffix test is load-bearing: a bare
 * endsWith(API_BASE_DOMAIN) would accept 'marketdata.app.evil.com' and
 * 'notmarketdata.app'.
 */
function _isSameSite() {
  const hostname = globalThis.location?.hostname ?? '';
  return hostname === API_BASE_DOMAIN || hostname.endsWith('.' + API_BASE_DOMAIN);
}

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------

let _memoryCache = null;
let _lastFetchTime = 0;
let _inflight = null;
const _subscribers = new Set();

// ---------------------------------------------------------------------------
// Subscriber pattern
// ---------------------------------------------------------------------------

/**
 * Subscribe to user state changes.
 * The callback fires when a background revalidation detects that user data
 * has changed (including logout, where `user` will be `null`).
 *
 * @param {(user: User | null) => void} callback - Receives the new user object or null
 * @returns {() => void} Unsubscribe function
 */
export function onUserChange(callback) {
  _subscribers.add(callback);
  return () => _subscribers.delete(callback);
}

function _notifySubscribers(user) {
  for (const cb of _subscribers) {
    try {
      cb(user);
    } catch {
      // subscriber errors must not break others
    }
  }
}

// ---------------------------------------------------------------------------
// Fetch and cache
// ---------------------------------------------------------------------------

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
 * On a page that is not served from the API's own domain, the request is
 * cross-site and CORS rejects it. Rather than pay three failed attempts and
 * ~3s of retry backoff to arrive at null, this resolves to null immediately.
 * Pass skipCorsSafetyCheck to force the request anyway.
 *
 * @param {Object} [options]
 * @param {string} [options.apiUrl] - Override the API endpoint
 * @param {boolean} [options.skipCorsSafetyCheck=false] - Request even off the API's domain
 * @returns {Promise<User | null>} User object or null on any error
 */
export async function fetchUser(options = {}) {
  const apiUrl = options.apiUrl || DEFAULT_API_URL;

  // Custom apiUrl bypasses cache/dedup entirely (used for demos and testing)
  if (options.apiUrl) {
    try {
      const res = await fetch(apiUrl, { credentials: 'include' });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  // Off the API's own domain the request cannot succeed. Resolve to logged out
  // now, touching neither the cache nor the subscribers.
  if (!options.skipCorsSafetyCheck && !_isSameSite()) return null;

  // Try memory cache first, then sessionStorage
  let cached = _memoryCache;
  if (!cached) {
    try {
      const stored = sessionStorage.getItem(CACHE_KEY);
      if (stored) {
        cached = JSON.parse(stored);
        _memoryCache = cached;
      }
    } catch {
      // sessionStorage unavailable or corrupt — continue without cache
    }
  }

  if (cached) {
    // Fresh within TTL — return immediately, no revalidation
    if (Date.now() - _lastFetchTime < CACHE_TTL) {
      return cached;
    }
    // Stale — return cached, revalidate in background
    _revalidate(apiUrl);
    return cached;
  }

  // No cache — must wait for network
  return _revalidate(apiUrl);
}

/**
 * Deduplicating wrapper — if a fetch is already in-flight, return that promise.
 */
function _revalidate(apiUrl) {
  if (!_inflight) {
    _inflight = _fetchAndCache(apiUrl).finally(() => {
      _inflight = null;
    });
  }
  return _inflight;
}

async function _fetchAndCache(apiUrl, retries = 2, delay = 1000) {
  try {
    const res = await fetch(apiUrl, { credentials: 'include' });
    if (!res.ok) {
      const previous = _memoryCache;
      _memoryCache = null;
      _lastFetchTime = Date.now();
      try {
        sessionStorage.removeItem(CACHE_KEY);
      } catch {}
      if (previous !== null) _notifySubscribers(null);
      return null;
    }
    const user = await res.json();
    const changed = !_memoryCache || JSON.stringify(_memoryCache) !== JSON.stringify(user);
    _memoryCache = user;
    _lastFetchTime = Date.now();
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(user));
    } catch {
      // Storage full or unavailable
    }
    if (changed) _notifySubscribers(user);
    return user;
  } catch {
    // Network error — retry with exponential backoff
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, delay));
      return _fetchAndCache(apiUrl, retries - 1, delay * 2);
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// Test utilities
// ---------------------------------------------------------------------------

/** Clear all caches and state. Useful for testing. */
export function _clearCache() {
  _memoryCache = null;
  _lastFetchTime = 0;
  _inflight = null;
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}

/** Returns the timestamp of the last completed fetch. Useful for testing TTL. */
export function _getLastFetchTime() {
  return _lastFetchTime;
}
