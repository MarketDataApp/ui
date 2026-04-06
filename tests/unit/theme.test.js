import {
  getThemeCookie,
  setThemeCookie,
  clearThemeCookie,
  isSystemMode,
  getUserThemePreference,
  getBrowserThemePreference,
  getEffectiveTheme,
  onThemeChange,
} from '../../dist/theme.js';

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
// DOM helpers for onThemeChange tests
// ---------------------------------------------------------------------------

function setDarkClass() {
  document.documentElement.classList.add('dark');
}

function setLightClass() {
  document.documentElement.classList.remove('dark');
}

function setDataTheme(value) {
  document.documentElement.setAttribute('data-theme', value);
}

function clearDataTheme() {
  document.documentElement.removeAttribute('data-theme');
}

/** Flush microtasks so MutationObserver callbacks fire. */
async function flush() {
  await new Promise((r) => setTimeout(r, 0));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Clear all theme-related cookies. The setThemeCookie function sets cookies
 * with domain=.marketdata.app, but in jsdom (url: https://www.marketdata.app/)
 * a plain `document.cookie = 'theme=; max-age=0'` won't clear domain-scoped
 * cookies. We must include the same domain and path attributes.
 */
function resetCookies() {
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
  resetCookies();
  // Reset localStorage
  localStorage.clear();
  // Reset DOM theme state
  setLightClass();
  clearDataTheme();
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

// ---------------------------------------------------------------------------
// clearThemeCookie
// ---------------------------------------------------------------------------
describe('clearThemeCookie', () => {
  it('clears an existing theme cookie', () => {
    setThemeCookie('dark');
    expect(getThemeCookie()).toBe('dark');
    resetCookies();
    expect(getThemeCookie()).toBeNull();
  });

  it('does not throw when no cookie exists', () => {
    expect(() => clearThemeCookie()).not.toThrow();
    expect(getThemeCookie()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// isSystemMode
// ---------------------------------------------------------------------------
describe('isSystemMode', () => {
  it('returns true when no cookie and no localStorage', () => {
    expect(isSystemMode()).toBe(true);
  });

  it('returns false when cookie is set to dark', () => {
    setThemeCookie('dark');
    expect(isSystemMode()).toBe(false);
  });

  it('returns false when cookie is set to light', () => {
    setThemeCookie('light');
    expect(isSystemMode()).toBe(false);
  });

  it('returns false when localStorage has a valid theme (migration sets cookie)', () => {
    localStorage.setItem('theme', 'dark');
    expect(isSystemMode()).toBe(false);
  });

  it('returns true when localStorage has an invalid value', () => {
    localStorage.setItem('theme', 'blue');
    expect(isSystemMode()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// onThemeChange
// ---------------------------------------------------------------------------
describe('onThemeChange', () => {
  it('fires callback when dark class is added', async () => {
    const cb = vi.fn();
    const unsub = onThemeChange(cb);

    setDarkClass();
    await flush();

    expect(cb).toHaveBeenCalledWith('dark');
    expect(cb).toHaveBeenCalledTimes(1);
    unsub();
  });

  it('fires callback when dark class is removed', async () => {
    setDarkClass();
    const cb = vi.fn();
    const unsub = onThemeChange(cb);

    setLightClass();
    await flush();

    expect(cb).toHaveBeenCalledWith('light');
    expect(cb).toHaveBeenCalledTimes(1);
    unsub();
  });

  it('fires callback when data-theme changes to dark', async () => {
    const cb = vi.fn();
    const unsub = onThemeChange(cb);

    setDataTheme('dark');
    await flush();

    expect(cb).toHaveBeenCalledWith('dark');
    expect(cb).toHaveBeenCalledTimes(1);
    unsub();
  });

  it('fires callback when data-theme changes from dark to light', async () => {
    setDataTheme('dark');
    const cb = vi.fn();
    const unsub = onThemeChange(cb);

    setDataTheme('light');
    await flush();

    expect(cb).toHaveBeenCalledWith('light');
    expect(cb).toHaveBeenCalledTimes(1);
    unsub();
  });

  it('does not fire when theme has not actually changed', async () => {
    const cb = vi.fn();
    const unsub = onThemeChange(cb);

    // Add an unrelated class — theme is still light
    document.documentElement.classList.add('some-other-class');
    await flush();

    expect(cb).not.toHaveBeenCalled();
    document.documentElement.classList.remove('some-other-class');
    unsub();
  });

  it('returns an unsubscribe function that stops callbacks', async () => {
    const cb = vi.fn();
    const unsub = onThemeChange(cb);

    unsub();

    setDarkClass();
    await flush();

    expect(cb).not.toHaveBeenCalled();
  });

  it('supports multiple subscribers', async () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const unsub1 = onThemeChange(cb1);
    const unsub2 = onThemeChange(cb2);

    setDarkClass();
    await flush();

    expect(cb1).toHaveBeenCalledWith('dark');
    expect(cb2).toHaveBeenCalledWith('dark');
    unsub1();
    unsub2();
  });

  it('unsubscribing one does not affect others', async () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const unsub1 = onThemeChange(cb1);
    const unsub2 = onThemeChange(cb2);

    unsub1();

    setDarkClass();
    await flush();

    expect(cb1).not.toHaveBeenCalled();
    expect(cb2).toHaveBeenCalledWith('dark');
    unsub2();
  });

  it('subscriber errors do not break other subscribers', async () => {
    const bad = vi.fn(() => {
      throw new Error('boom');
    });
    const good = vi.fn();
    const unsub1 = onThemeChange(bad);
    const unsub2 = onThemeChange(good);

    setDarkClass();
    await flush();

    expect(bad).toHaveBeenCalled();
    expect(good).toHaveBeenCalledWith('dark');
    unsub1();
    unsub2();
  });

  it('data-theme takes precedence over class', async () => {
    const cb = vi.fn();
    const unsub = onThemeChange(cb);

    // First, go dark via class
    setDarkClass();
    await flush();
    expect(cb).toHaveBeenCalledWith('dark');

    // Now set data-theme='light' — should override the dark class
    cb.mockClear();
    setDataTheme('light');
    await flush();

    expect(cb).toHaveBeenCalledWith('light');
    unsub();
  });

  it('can re-subscribe after all subscribers unsubscribe', async () => {
    const cb1 = vi.fn();
    const unsub1 = onThemeChange(cb1);
    unsub1(); // observer torn down

    const cb2 = vi.fn();
    const unsub2 = onThemeChange(cb2); // fresh observer

    setDarkClass();
    await flush();

    expect(cb2).toHaveBeenCalledWith('dark');
    unsub2();
  });
});
