import { initThemeToggle } from '../theme-toggle.js';

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

  it('in light mode: shows moon icon, hides sun icon', () => {
    setLightMode();
    initThemeToggle({ container });
    const sunIcon = container.querySelector('.theme-toggle-icon-light');
    const moonIcon = container.querySelector('.theme-toggle-icon-dark');
    expect(sunIcon.style.display).toBe('none');
    expect(moonIcon.style.display).toBe('block');
  });

  it('in dark mode: shows sun icon, hides moon icon', () => {
    setDarkMode();
    initThemeToggle({ container });
    const sunIcon = container.querySelector('.theme-toggle-icon-light');
    const moonIcon = container.querySelector('.theme-toggle-icon-dark');
    expect(sunIcon.style.display).toBe('block');
    expect(moonIcon.style.display).toBe('none');
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
    expect(sunIcon.style.display).toBe('block');
    expect(moonIcon.style.display).toBe('none');
  });

  it('sets theme cookie on toggle', () => {
    setLightMode();
    initThemeToggle({ container });
    const button = container.querySelector('button');
    button.click();
    expect(document.cookie).toContain('theme=dark');
  });

  it('cleanup removes the button from DOM', () => {
    const cleanup = initThemeToggle({ container });
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
});
