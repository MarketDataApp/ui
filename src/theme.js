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
export function getThemeCookie() {
  const match = document.cookie.match(/(?:^|;\s*)theme=(dark|light)/);
  return match ? /** @type {'dark' | 'light'} */ (match[1]) : null;
}

/**
 * Sets the theme cookie on .marketdata.app with a 1-year expiry.
 * @param {'dark' | 'light'} theme
 */
export function setThemeCookie(theme) {
  document.cookie = `theme=${theme}; domain=.marketdata.app; path=/; max-age=31536000; SameSite=Lax`;
}

/** Clears the theme cookie, reverting to system/OS preference. */
export function clearThemeCookie() {
  document.cookie = 'theme=; domain=.marketdata.app; path=/; max-age=0; SameSite=Lax';
}

/** Returns true when the user has no explicit theme preference (follows OS). */
export function isSystemMode() {
  return getUserThemePreference() === 'no-preference';
}

/**
 * Returns the user's explicitly saved preference (cookie > localStorage), or 'no-preference'.
 * @returns {'dark' | 'light' | 'no-preference'}
 */
export function getUserThemePreference() {
  const cookieTheme = getThemeCookie();
  if (cookieTheme) return cookieTheme;

  const localTheme = localStorage.getItem('theme');
  if (localTheme === 'dark' || localTheme === 'light') {
    setThemeCookie(localTheme);
    return localTheme;
  }

  return 'no-preference';
}

/**
 * Returns the browser/OS theme preference via matchMedia, or 'no-preference'.
 * @returns {'dark' | 'light' | 'no-preference'}
 */
export function getBrowserThemePreference() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  } else {
    return 'no-preference';
  }
}

/**
 * Returns the effective theme by checking cookie > localStorage > system > 'light'.
 * @returns {'dark' | 'light'}
 */
export function getEffectiveTheme() {
  const userThemePreference = getUserThemePreference();
  if (userThemePreference !== 'no-preference') {
    return userThemePreference;
  }

  const browserThemePreference = getBrowserThemePreference();
  if (browserThemePreference !== 'no-preference') {
    return browserThemePreference;
  }

  return 'light';
}

// ---------------------------------------------------------------------------
// Theme change observer
// ---------------------------------------------------------------------------

const _themeSubscribers = new Set();
let _themeObserver = null;
let _mediaQuery = null;
let _lastObservedTheme = null;

/**
 * Resolve the currently applied theme from the DOM.
 * Checks data-theme (Docusaurus) first, then the dark class (Tailwind).
 */
function _resolveTheme() {
  const dataTheme = document.documentElement.getAttribute('data-theme');
  if (dataTheme === 'dark' || dataTheme === 'light') return dataTheme;
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function _handleThemeChange() {
  const theme = _resolveTheme();
  if (theme !== _lastObservedTheme) {
    _lastObservedTheme = theme;
    for (const cb of _themeSubscribers) {
      try {
        cb(theme);
      } catch {
        // subscriber errors must not break others
      }
    }
  }
}

function _startObserving() {
  _lastObservedTheme = _resolveTheme();

  _themeObserver = new MutationObserver(_handleThemeChange);
  _themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'data-theme'],
  });

  _mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
  _mediaQuery?.addEventListener?.('change', _handleThemeChange);
}

function _stopObserving() {
  _themeObserver?.disconnect();
  _themeObserver = null;
  _mediaQuery?.removeEventListener?.('change', _handleThemeChange);
  _mediaQuery = null;
  _lastObservedTheme = null;
}

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
export function onThemeChange(callback) {
  _themeSubscribers.add(callback);
  if (_themeSubscribers.size === 1) _startObserving();
  return () => {
    _themeSubscribers.delete(callback);
    if (_themeSubscribers.size === 0) _stopObserving();
  };
}
