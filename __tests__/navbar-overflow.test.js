import { initNavbarOverflow } from '../navbar-overflow.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a mock container mimicking the Docusaurus navbar structure:
 *   .navbar__inner (flex container)
 *     .navbar__items (left group — nav links, includes a "logo" sentinel)
 *     .navbar__items.navbar__items--right (right group — search, user, etc.)
 *
 * Overflow is detected by finding any grandchild where scrollWidth > offsetWidth.
 * We place a sentinel "logo" element in the left group; when `compressed` is true,
 * its scrollWidth exceeds its offsetWidth, signaling overflow.
 */
function createMockContainer({ compressed = false } = {}) {
  const container = document.createElement('div');
  container.className = 'navbar__inner';
  document.body.appendChild(container);

  const leftGroup = document.createElement('div');
  leftGroup.className = 'navbar__items';
  container.appendChild(leftGroup);

  // Sentinel element that simulates a compressed logo
  const logo = document.createElement('div');
  logo.className = 'navbar__brand';
  leftGroup.appendChild(logo);

  let _compressed = compressed;
  Object.defineProperty(logo, 'scrollWidth', {
    get: () => (_compressed ? 200 : 50),
    configurable: true,
  });
  Object.defineProperty(logo, 'offsetWidth', {
    get: () => 50,
    configurable: true,
  });

  const rightGroup = document.createElement('div');
  rightGroup.className = 'navbar__items navbar__items--right';
  container.appendChild(rightGroup);

  return {
    container,
    rightGroup,
    setCompressed(v) {
      _compressed = v;
    },
  };
}

function addItem(rightGroup, selector) {
  const el = document.createElement('span');
  if (selector.startsWith('.')) {
    el.className = selector.slice(1);
  } else {
    el.className = selector;
  }
  rightGroup.appendChild(el);
  return el;
}

// ---------------------------------------------------------------------------
// Mock ResizeObserver
// ---------------------------------------------------------------------------
let resizeCallbacks = [];

class MockResizeObserver {
  constructor(callback) {
    this._callback = callback;
    resizeCallbacks.push(callback);
  }
  observe() {}
  unobserve() {}
  disconnect() {
    resizeCallbacks = resizeCallbacks.filter((cb) => cb !== this._callback);
  }
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
beforeAll(() => {
  globalThis.ResizeObserver = MockResizeObserver;
});

beforeEach(() => {
  resizeCallbacks = [];
  while (document.body.firstChild) {
    document.body.removeChild(document.body.firstChild);
  }
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Flush helper — advances debounce (50ms) + rAF (16ms)
// ---------------------------------------------------------------------------
function flush() {
  vi.advanceTimersByTime(50);
  vi.advanceTimersByTime(16);
}

function triggerAndFlush() {
  resizeCallbacks.forEach((cb) => cb());
  flush();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('initNavbarOverflow', () => {
  it('returns a cleanup function', () => {
    const { container } = createMockContainer();
    const cleanup = initNavbarOverflow({ container, items: [] });
    expect(typeof cleanup).toBe('function');
  });

  it('returns a no-op cleanup when container is null', () => {
    const cleanup = initNavbarOverflow({ container: null, items: [] });
    expect(typeof cleanup).toBe('function');
    cleanup(); // should not throw
  });

  it('returns a no-op cleanup when items is empty', () => {
    const { container } = createMockContainer();
    const cleanup = initNavbarOverflow({ container, items: [] });
    expect(typeof cleanup).toBe('function');
  });

  it('hides the lowest-priority item when container overflows', () => {
    const { container, rightGroup } = createMockContainer({ compressed: true });

    const el1 = addItem(rightGroup, 'item-a');
    addItem(rightGroup, 'item-b');

    initNavbarOverflow({
      container,
      items: [
        { selector: '.item-a', priority: 1 },
        { selector: '.item-b', priority: 2 },
      ],
    });

    triggerAndFlush();

    expect(el1.getAttribute('data-navbar-hidden')).toBe('');
  });

  it('hides items in priority order (lowest first)', () => {
    const { container, rightGroup } = createMockContainer({ compressed: true });

    const el1 = addItem(rightGroup, 'low-pri');
    const el2 = addItem(rightGroup, 'mid-pri');
    const el3 = addItem(rightGroup, 'high-pri');

    const hideOrder = [];
    [el1, el2, el3].forEach((el) => {
      const origSetAttribute = el.setAttribute.bind(el);
      el.setAttribute = (name, value) => {
        if (name === 'data-navbar-hidden') {
          hideOrder.push(el.className);
        }
        origSetAttribute(name, value);
      };
    });

    initNavbarOverflow({
      container,
      items: [
        { selector: '.low-pri', priority: 1 },
        { selector: '.mid-pri', priority: 2 },
        { selector: '.high-pri', priority: 3 },
      ],
    });

    triggerAndFlush();

    expect(hideOrder[0]).toBe('low-pri');
    if (hideOrder.length > 1) {
      expect(hideOrder[1]).toBe('mid-pri');
    }
  });

  it('restores items on cleanup', () => {
    const { container, rightGroup } = createMockContainer({ compressed: true });

    const el1 = addItem(rightGroup, 'hidden-item');

    const cleanup = initNavbarOverflow({
      container,
      items: [{ selector: '.hidden-item', priority: 1 }],
    });

    triggerAndFlush();
    expect(el1.getAttribute('data-navbar-hidden')).toBe('');

    cleanup();
    expect(el1.hasAttribute('data-navbar-hidden')).toBe(false);
    expect(el1.style.display).toBe('');
  });

  it('does not hide items when there is no overflow', () => {
    const { container, rightGroup } = createMockContainer({ compressed: false });

    const el1 = addItem(rightGroup, 'no-hide');

    initNavbarOverflow({
      container,
      items: [{ selector: '.no-hide', priority: 1 }],
    });

    triggerAndFlush();

    expect(el1.hasAttribute('data-navbar-hidden')).toBe(false);
  });

  it('skips items whose selectors do not match any element', () => {
    const { container, rightGroup } = createMockContainer({ compressed: true });

    const el1 = addItem(rightGroup, 'exists');

    const cleanup = initNavbarOverflow({
      container,
      items: [
        { selector: '.does-not-exist', priority: 1 },
        { selector: '.exists', priority: 2 },
      ],
    });

    triggerAndFlush();

    expect(el1.getAttribute('data-navbar-hidden')).toBe('');
    cleanup();
  });

  it('disconnects ResizeObserver on cleanup', () => {
    const { container } = createMockContainer();

    const cleanup = initNavbarOverflow({
      container,
      items: [{ selector: '.x', priority: 1 }],
    });

    const callbackCountBefore = resizeCallbacks.length;
    cleanup();
    expect(resizeCallbacks.length).toBe(callbackCountBefore - 1);
  });

  it('hides items when visible grandchildren overlap (absolute-position case)', () => {
    // Simulate the mobile scenario: the search icon is absolutely positioned
    // and overlaps the logo. No compression detected, but bounding rects overlap.
    const { container, rightGroup } = createMockContainer({ compressed: false });

    const leftGroup = container.querySelector('.navbar__items');
    const logo = leftGroup.querySelector('.navbar__brand');

    const searchEl = addItem(rightGroup, 'search-icon');

    // Mock bounding rects: logo extends to 273, search starts at 253 → 20px overlap
    logo.getBoundingClientRect = () => ({
      x: 54,
      y: 8,
      width: 219,
      height: 44,
      top: 8,
      right: 273,
      bottom: 52,
      left: 54,
    });
    searchEl.getBoundingClientRect = () => ({
      x: 253,
      y: 12,
      width: 36,
      height: 36,
      top: 12,
      right: 289,
      bottom: 48,
      left: 253,
    });

    const cleanup = initNavbarOverflow({
      container,
      items: [{ selector: '.search-icon', priority: 1 }],
    });

    triggerAndFlush();

    expect(searchEl.getAttribute('data-navbar-hidden')).toBe('');
    cleanup();
  });

  it('does not treat same-group overlap as overflow', () => {
    // At ~995px the search container (absolute) and login button (static) are
    // both in the right group and naturally share space. This should NOT
    // be detected as overflow — only cross-group overlap matters.
    const { container, rightGroup } = createMockContainer({ compressed: false });

    const searchEl = addItem(rightGroup, 'search-abs');
    const loginEl = addItem(rightGroup, 'login-btn');

    // Both items in the same group with overlapping rects
    searchEl.getBoundingClientRect = () => ({
      x: 824,
      y: 12,
      width: 155,
      height: 36,
      top: 12,
      right: 979,
      bottom: 48,
      left: 824,
    });
    loginEl.getBoundingClientRect = () => ({
      x: 874,
      y: 14,
      width: 65,
      height: 32,
      top: 14,
      right: 939,
      bottom: 46,
      left: 874,
    });

    const cleanup = initNavbarOverflow({
      container,
      items: [
        { selector: '.login-btn', priority: 1 },
        { selector: '.search-abs', priority: 2 },
      ],
    });

    triggerAndFlush();

    // Neither item should be hidden — same-group overlap is not overflow
    expect(loginEl.hasAttribute('data-navbar-hidden')).toBe(false);
    expect(searchEl.hasAttribute('data-navbar-hidden')).toBe(false);
    cleanup();
  });

  it('shows items when overflow is resolved after resize', () => {
    const { container, rightGroup, setCompressed } = createMockContainer({
      compressed: true,
    });

    const el1 = addItem(rightGroup, 'toggle-item');

    const cleanup = initNavbarOverflow({
      container,
      items: [{ selector: '.toggle-item', priority: 1 }],
    });

    // Initial: compressed → hide
    triggerAndFlush();
    expect(el1.getAttribute('data-navbar-hidden')).toBe('');

    // Resize wider — no longer compressed
    setCompressed(false);
    triggerAndFlush();

    expect(el1.hasAttribute('data-navbar-hidden')).toBe(false);
    expect(el1.style.display).toBe('');
    cleanup();
  });
});
