import { initNavbarOverflow } from '../navbar-overflow.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a mock container with controllable scrollWidth/clientWidth.
 */
function createMockContainer({ clientWidth = 800, scrollWidth = 800 } = {}) {
  const container = document.createElement('div');
  container.className = 'navbar__inner';
  document.body.appendChild(container);

  let _clientWidth = clientWidth;
  let _scrollWidth = scrollWidth;

  Object.defineProperty(container, 'clientWidth', {
    get: () => _clientWidth,
    configurable: true,
  });
  Object.defineProperty(container, 'scrollWidth', {
    get: () => _scrollWidth,
    configurable: true,
  });

  return {
    container,
    setWidths(cw, sw) {
      _clientWidth = cw;
      _scrollWidth = sw;
    },
  };
}

function addItem(container, selector) {
  const el = document.createElement('span');
  if (selector.startsWith('.')) {
    el.className = selector.slice(1);
  } else {
    el.className = selector;
  }
  container.appendChild(el);
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
  // Clear DOM nodes
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
    const { container } = createMockContainer({
      clientWidth: 800,
      scrollWidth: 900,
    });

    const el1 = addItem(container, 'item-a');
    addItem(container, 'item-b');

    initNavbarOverflow({
      container,
      items: [
        { selector: '.item-a', priority: 1 },
        { selector: '.item-b', priority: 2 },
      ],
    });

    triggerAndFlush();

    // Lowest-priority item should have the hidden attribute
    expect(el1.getAttribute('data-navbar-hidden')).toBe('');
  });

  it('hides items in priority order (lowest first)', () => {
    const { container } = createMockContainer({
      clientWidth: 800,
      scrollWidth: 900,
    });

    const el1 = addItem(container, 'low-pri');
    const el2 = addItem(container, 'mid-pri');
    const el3 = addItem(container, 'high-pri');

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

    // Low priority should be hidden first
    expect(hideOrder[0]).toBe('low-pri');
    if (hideOrder.length > 1) {
      expect(hideOrder[1]).toBe('mid-pri');
    }
  });

  it('restores items on cleanup', () => {
    const { container } = createMockContainer({
      clientWidth: 800,
      scrollWidth: 900,
    });

    const el1 = addItem(container, 'hidden-item');

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
    const { container } = createMockContainer({
      clientWidth: 800,
      scrollWidth: 700,
    });

    const el1 = addItem(container, 'no-hide');

    initNavbarOverflow({
      container,
      items: [{ selector: '.no-hide', priority: 1 }],
    });

    triggerAndFlush();

    expect(el1.hasAttribute('data-navbar-hidden')).toBe(false);
  });

  it('skips items whose selectors do not match any element', () => {
    const { container } = createMockContainer({
      clientWidth: 800,
      scrollWidth: 900,
    });

    const el1 = addItem(container, 'exists');

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

  it('shows items when overflow is resolved after resize', () => {
    const { container, setWidths } = createMockContainer({
      clientWidth: 800,
      scrollWidth: 900,
    });

    const el1 = addItem(container, 'toggle-item');

    const cleanup = initNavbarOverflow({
      container,
      items: [{ selector: '.toggle-item', priority: 1 }],
    });

    // Initial: overflow → hide
    triggerAndFlush();
    expect(el1.getAttribute('data-navbar-hidden')).toBe('');

    // Resize to no overflow
    setWidths(1000, 800);
    triggerAndFlush();

    // Item should be visible again
    expect(el1.hasAttribute('data-navbar-hidden')).toBe(false);
    expect(el1.style.display).toBe('');
    cleanup();
  });
});
