import { initThemeToggle } from '../../dist/theme-toggle.js';

// ---------------------------------------------------------------------------
// localStorage polyfill for Node.js 22+
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

const _lsMock = createLocalStorageMock();
Object.defineProperty(globalThis, 'localStorage', {
  value: _lsMock,
  writable: true,
  configurable: true,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearThemeCookie() {
  document.cookie = 'theme=; max-age=0';
  document.cookie = 'theme=; domain=.marketdata.app; path=/; max-age=0';
}

/**
 * Installs a matchMedia mock that captures 'change' event listeners.
 * Returns a trigger function to simulate OS preference changes.
 * @param {'dark'|'light'|'none'} initialPreference
 */
function mockMatchMediaWithCallbacks(initialPreference) {
  const listeners = [];
  window.matchMedia = vi.fn((query) => ({
    matches:
      (initialPreference === 'dark' && query === '(prefers-color-scheme: dark)') ||
      (initialPreference === 'light' && query === '(prefers-color-scheme: light)'),
    media: query,
    addEventListener: vi.fn((event, cb) => {
      listeners.push(cb);
    }),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  return {
    trigger(matches) {
      listeners.forEach((cb) => cb({ matches }));
    },
  };
}

function setLightMode() {
  document.documentElement.classList.remove('dark');
  document.documentElement.setAttribute('data-theme', 'light');
}

function setDarkMode() {
  document.documentElement.classList.add('dark');
  document.documentElement.setAttribute('data-theme', 'dark');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('initThemeToggle', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    setLightMode();
    clearThemeCookie();
    _lsMock.clear();
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('renders a button into the container', () => {
    initThemeToggle({ container });
    const button = container.querySelector('button');
    expect(button).not.toBeNull();
    expect(button.type).toBe('button');
  });

  it('applies the default button class', () => {
    initThemeToggle({ container });
    const button = container.querySelector('button');
    expect(button.className).toBe('theme-toggle-button');
  });

  it('accepts a custom button class', () => {
    initThemeToggle({ container, buttonClass: 'my-toggle' });
    const button = container.querySelector('button');
    expect(button.className).toBe('my-toggle');
  });

  it('contains two SVG icons', () => {
    initThemeToggle({ container });
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(2);
  });

  it('in light mode: shows sun icon, hides moon icon', () => {
    setLightMode();
    initThemeToggle({ container });
    const sunIcon = container.querySelector('.theme-toggle-icon-light');
    const moonIcon = container.querySelector('.theme-toggle-icon-dark');
    expect(sunIcon.style.display).toBe('block');
    expect(moonIcon.style.display).toBe('none');
  });

  it('in dark mode: shows moon icon, hides sun icon', () => {
    setDarkMode();
    initThemeToggle({ container });
    const sunIcon = container.querySelector('.theme-toggle-icon-light');
    const moonIcon = container.querySelector('.theme-toggle-icon-dark');
    expect(sunIcon.style.display).toBe('none');
    expect(moonIcon.style.display).toBe('block');
  });

  it('has correct aria-label in light mode', () => {
    setLightMode();
    initThemeToggle({ container });
    const button = container.querySelector('button');
    expect(button.getAttribute('aria-label')).toBe('Switch to dark mode');
  });

  it('has correct aria-label in dark mode', () => {
    setDarkMode();
    initThemeToggle({ container });
    const button = container.querySelector('button');
    expect(button.getAttribute('aria-label')).toBe('Switch to light mode');
  });

  it('clicking toggles from light to dark', () => {
    setLightMode();
    initThemeToggle({ container });
    const button = container.querySelector('button');
    button.click();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('clicking toggles from dark to light', () => {
    setDarkMode();
    initThemeToggle({ container });
    const button = container.querySelector('button');
    button.click();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('updates icon visibility after toggle', () => {
    setLightMode();
    initThemeToggle({ container });
    const button = container.querySelector('button');
    button.click();
    const sunIcon = container.querySelector('.theme-toggle-icon-light');
    const moonIcon = container.querySelector('.theme-toggle-icon-dark');
    expect(sunIcon.style.display).toBe('none');
    expect(moonIcon.style.display).toBe('block');
  });

  it('sets theme cookie on toggle', () => {
    setLightMode();
    initThemeToggle({ container });
    const button = container.querySelector('button');
    button.click();
    expect(document.cookie).toContain('theme=dark');
  });

  it('cleanup removes the button from DOM', () => {
    const { cleanup } = initThemeToggle({ container });
    expect(container.querySelector('button')).not.toBeNull();
    cleanup();
    expect(container.querySelector('button')).toBeNull();
  });

  it('double toggle returns to original state', () => {
    setLightMode();
    initThemeToggle({ container });
    const button = container.querySelector('button');
    button.click();
    button.click();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  // -------------------------------------------------------------------------
  // System mode tracking
  // -------------------------------------------------------------------------
  describe('system mode tracking', () => {
    it('applies dark theme on OS change when in system mode (no cookie)', () => {
      setLightMode();
      const { trigger } = mockMatchMediaWithCallbacks('light');
      initThemeToggle({ container });

      trigger(true); // OS changed to dark
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('applies light theme on OS change when in system mode (no cookie)', () => {
      setDarkMode();
      const { trigger } = mockMatchMediaWithCallbacks('dark');
      initThemeToggle({ container });

      trigger(false); // OS changed to light
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('ignores OS change when user has explicit dark preference', () => {
      setDarkMode();
      document.cookie =
        'theme=dark; domain=.marketdata.app; path=/; max-age=31536000; SameSite=Lax';
      const { trigger } = mockMatchMediaWithCallbacks('dark');
      initThemeToggle({ container });

      trigger(false); // OS changed to light, but user chose dark
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('ignores OS change when user has explicit light preference', () => {
      setLightMode();
      document.cookie =
        'theme=light; domain=.marketdata.app; path=/; max-age=31536000; SameSite=Lax';
      const { trigger } = mockMatchMediaWithCallbacks('light');
      initThemeToggle({ container });

      trigger(true); // OS changed to dark, but user chose light
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // resetToSystem
  // -------------------------------------------------------------------------
  describe('resetToSystem', () => {
    it('clears the theme cookie', () => {
      setLightMode();
      const { resetToSystem } = initThemeToggle({ container });
      const button = container.querySelector('button');
      button.click(); // sets cookie to 'dark'
      expect(document.cookie).toContain('theme=dark');

      resetToSystem();
      expect(document.cookie).not.toContain('theme=dark');
      expect(document.cookie).not.toContain('theme=light');
    });

    it('applies the current OS preference after reset', () => {
      setLightMode();
      mockMatchMediaWithCallbacks('dark');
      const { resetToSystem } = initThemeToggle({ container });
      const button = container.querySelector('button');
      button.click(); // explicitly set to dark

      // Now mock OS as light and reset
      mockMatchMediaWithCallbacks('light');
      resetToSystem();
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('OS changes are tracked again after reset', () => {
      setLightMode();
      const { trigger } = mockMatchMediaWithCallbacks('light');
      const { resetToSystem } = initThemeToggle({ container });
      const button = container.querySelector('button');

      // User explicitly sets dark
      button.click();
      trigger(false); // OS says light, but user chose dark — ignored
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      // Reset to system
      resetToSystem();
      // Now OS changes should be tracked again
      trigger(true); // OS says dark
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });
});
