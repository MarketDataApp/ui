import {
  getThemeCookie,
  setThemeCookie,
  getUserThemePreference,
  getBrowserThemePreference,
  getEffectiveTheme,
} from '../theme.js';

// ---------------------------------------------------------------------------
// localStorage polyfill for Node.js 22+ which has a built-in localStorage
// that shadows jsdom's Storage. We replace it with a simple in-memory mock.
// ---------------------------------------------------------------------------
function createLocalStorageMock() {
  let store = {};
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    },
    clear() {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key(index) {
      return Object.keys(store)[index] || null;
    },
  };
}

// Replace the global before anything runs
const _lsMock = createLocalStorageMock();
Object.defineProperty(globalThis, 'localStorage', {
  value: _lsMock,
  writable: true,
  configurable: true,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Clear all theme-related cookies. The setThemeCookie function sets cookies
 * with domain=.marketdata.app, but in jsdom (url: https://www.marketdata.app/)
 * a plain `document.cookie = 'theme=; max-age=0'` won't clear domain-scoped
 * cookies. We must include the same domain and path attributes.
 */
function clearThemeCookie() {
  document.cookie = 'theme=; max-age=0';
  document.cookie = 'theme=; domain=.marketdata.app; path=/; max-age=0';
}

/**
 * Installs a minimal matchMedia mock on the window object.
 * @param {string} preference - 'dark', 'light', or 'none'
 */
function mockMatchMedia(preference) {
  window.matchMedia = vi.fn((query) => ({
    matches:
      (preference === 'dark' && query === '(prefers-color-scheme: dark)') ||
      (preference === 'light' && query === '(prefers-color-scheme: light)'),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

beforeEach(() => {
  // Reset cookies (both plain and domain-scoped)
  clearThemeCookie();
  // Reset localStorage
  localStorage.clear();
  // Restore all mocks
  vi.restoreAllMocks();
  // Default matchMedia that matches nothing
  mockMatchMedia('none');
});

// ---------------------------------------------------------------------------
// getThemeCookie
// ---------------------------------------------------------------------------
describe('getThemeCookie', () => {
  it('returns "dark" when the theme cookie is dark', () => {
    document.cookie = 'theme=dark';
    expect(getThemeCookie()).toBe('dark');
  });

  it('returns "light" when the theme cookie is light', () => {
    document.cookie = 'theme=light';
    expect(getThemeCookie()).toBe('light');
  });

  it('returns null when the theme cookie is absent', () => {
    document.cookie = 'other=value';
    expect(getThemeCookie()).toBeNull();
  });

  it('returns correct value when theme cookie is among other cookies', () => {
    document.cookie = 'foo=bar';
    document.cookie = 'theme=dark';
    document.cookie = 'baz=qux';
    expect(getThemeCookie()).toBe('dark');
  });

  it('returns null when cookie value is not dark or light', () => {
    document.cookie = 'theme=blue';
    expect(getThemeCookie()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// setThemeCookie
// ---------------------------------------------------------------------------
describe('setThemeCookie', () => {
  it('sets a cookie with the correct theme value and attributes', () => {
    const spy = vi.spyOn(document, 'cookie', 'set');
    setThemeCookie('dark');
    expect(spy).toHaveBeenCalledWith(
      'theme=dark; domain=.marketdata.app; path=/; max-age=31536000; SameSite=Lax',
    );
  });

  it('sets light theme cookie', () => {
    const spy = vi.spyOn(document, 'cookie', 'set');
    setThemeCookie('light');
    expect(spy).toHaveBeenCalledWith(
      'theme=light; domain=.marketdata.app; path=/; max-age=31536000; SameSite=Lax',
    );
  });

  it('makes the cookie readable via getThemeCookie', () => {
    setThemeCookie('dark');
    expect(getThemeCookie()).toBe('dark');
  });
});

// ---------------------------------------------------------------------------
// getUserThemePreference
// ---------------------------------------------------------------------------
describe('getUserThemePreference', () => {
  it('returns the cookie value when a theme cookie exists', () => {
    document.cookie = 'theme=dark';
    expect(getUserThemePreference()).toBe('dark');
  });

  it('falls back to localStorage when no cookie exists', () => {
    localStorage.setItem('theme', 'light');
    expect(getUserThemePreference()).toBe('light');
  });

  it('migrates localStorage value to a cookie when used as fallback', () => {
    localStorage.setItem('theme', 'dark');
    getUserThemePreference();
    // After migration the cookie should be readable
    expect(getThemeCookie()).toBe('dark');
  });

  it('returns "no-preference" when neither cookie nor localStorage is set', () => {
    expect(getUserThemePreference()).toBe('no-preference');
  });

  it('returns "no-preference" when localStorage has an invalid value', () => {
    localStorage.setItem('theme', 'blue');
    expect(getUserThemePreference()).toBe('no-preference');
  });

  it('prefers cookie over localStorage', () => {
    document.cookie = 'theme=light';
    localStorage.setItem('theme', 'dark');
    expect(getUserThemePreference()).toBe('light');
  });
});

// ---------------------------------------------------------------------------
// getBrowserThemePreference
// ---------------------------------------------------------------------------
describe('getBrowserThemePreference', () => {
  it('returns "dark" when browser prefers dark', () => {
    mockMatchMedia('dark');
    expect(getBrowserThemePreference()).toBe('dark');
  });

  it('returns "light" when browser prefers light', () => {
    mockMatchMedia('light');
    expect(getBrowserThemePreference()).toBe('light');
  });

  it('returns "no-preference" when matchMedia matches neither', () => {
    mockMatchMedia('none');
    expect(getBrowserThemePreference()).toBe('no-preference');
  });

  it('returns "no-preference" when matchMedia is not available', () => {
    window.matchMedia = undefined;
    expect(getBrowserThemePreference()).toBe('no-preference');
  });
});

// ---------------------------------------------------------------------------
// getEffectiveTheme
// ---------------------------------------------------------------------------
describe('getEffectiveTheme', () => {
  it('returns the user preference when set (cookie)', () => {
    document.cookie = 'theme=dark';
    mockMatchMedia('light');
    expect(getEffectiveTheme()).toBe('dark');
  });

  it('returns the user preference from localStorage over browser pref', () => {
    localStorage.setItem('theme', 'light');
    mockMatchMedia('dark');
    expect(getEffectiveTheme()).toBe('light');
  });

  it('falls back to browser preference when user has none', () => {
    mockMatchMedia('dark');
    expect(getEffectiveTheme()).toBe('dark');
  });

  it('defaults to "light" when no preferences exist at all', () => {
    mockMatchMedia('none');
    expect(getEffectiveTheme()).toBe('light');
  });
});
