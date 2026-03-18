/**
 * @module user-state
 * Declarative show/hide for elements based on user authentication and subscription state.
 *
 * Mark elements with `data-user-state` and the `hidden` attribute.
 * After fetchUser() resolves, matching elements have `hidden` removed.
 *
 * Supported conditions (space-separated = OR logic):
 *   logged-in, logged-out, paid, free, trial, product:<slug>
 *
 * @example
 * <div data-user-state="logged-in" hidden>Welcome back!</div>
 * <div data-user-state="logged-out" hidden>Please log in</div>
 * <div data-user-state="paid" hidden>Premium content</div>
 * <div data-user-state="product:quant" hidden>Quant features</div>
 */

import { fetchUser, onUserChange } from './user.js';

// ---------------------------------------------------------------------------
// Condition evaluation
// ---------------------------------------------------------------------------

/**
 * Evaluates a single condition against the user object.
 *
 * @param {string} condition - One of: logged-in, logged-out, paid, free, trial, product:<slug>
 * @param {Object|null} user - User object from fetchUser(), or null if logged out
 * @returns {boolean}
 */
export function evaluateCondition(condition, user) {
  const c = condition.toLowerCase().trim();

  if (c === 'logged-in') return user !== null;
  if (c === 'logged-out') return user === null;
  if (c === 'paid') return user?.paid === true;
  if (c === 'free') return user !== null && user.paid === false;
  if (c === 'trial') return user?.trial === true;

  if (c.startsWith('product:')) {
    const slug = c.slice('product:'.length);
    if (!user?.products) return false;
    return user.products.some((p) => p.toLowerCase() === slug);
  }

  return false;
}

// ---------------------------------------------------------------------------
// DOM visibility
// ---------------------------------------------------------------------------

/**
 * Resolves visibility for all `[data-user-state]` elements.
 * Elements whose conditions match get `hidden` removed; others get `hidden` set.
 *
 * @param {Object|null} user - User object or null
 * @param {HTMLElement|Document} root - Scope for DOM queries
 */
function resolveElements(user, root) {
  const elements = root.querySelectorAll('[data-user-state]');
  for (const el of elements) {
    const conditions = el.getAttribute('data-user-state').split(/\s+/).filter(Boolean);
    const match = conditions.some((c) => evaluateCondition(c, user));

    if (match) {
      el.removeAttribute('hidden');
    } else {
      el.setAttribute('hidden', '');
    }
  }
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

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
export async function initUserState(options = {}) {
  const { root = document, apiUrl } = options;

  const user = await fetchUser(apiUrl ? { apiUrl } : {});
  resolveElements(user, root);

  const unsubscribe = onUserChange((updatedUser) => {
    resolveElements(updatedUser, root);
  });

  return function cleanup() {
    unsubscribe();
    // Re-hide all elements on cleanup
    const elements = root.querySelectorAll('[data-user-state]');
    for (const el of elements) {
      el.setAttribute('hidden', '');
    }
  };
}
