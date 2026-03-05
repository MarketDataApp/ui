import { initNavbarOverflow } from '../navbar-overflow.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a mock container mimicking the Docusaurus navbar structure:
 *   .navbar__inner (flex container)
 *     .navbar__items (left group — nav links)
 *     .navbar__items.navbar__items--right (right group — search, user, etc.)
 *
 * The overflow check sums children's scrollWidth vs container clientWidth.
 * We control the left group's scrollWidth (fixed) and the right group's
 * scrollWidth (dynamic, based on visible items) to simulate overflow.
 */
function createMockContainer({ clientWidth = 800, leftWidth = 300, rightWidth = 600 } = {}) {
  const container = document.createElement('div');
  container.className = 'navbar__inner';
  document.body.appendChild(container);

  const leftGroup = document.createElement('div');
  leftGroup.className = 'navbar__items';
  container.appendChild(leftGroup);

  const rightGroup = document.createElement('div');
  rightGroup.className = 'navbar__items navbar__items--right';
  container.appendChild(rightGroup);

  let _clientWidth = clientWidth;
  let _leftWidth = leftWidth;
  let _rightWidth = rightWidth;

  Object.defineProperty(container, 'clientWidth', {
    get: () => _clientWidth,
    configurable: true,
  });
  Object.defineProperty(leftGroup, 'scrollWidth', {
    get: () => _leftWidth,
    configurable: true,
  });
  Object.defineProperty(rightGroup, 'scrollWidth', {
    get: () => _rightWidth,
    configurable: true,
  });

  return {
    container,
    rightGroup,
    setWidths(cw, rw) {
      _clientWidth = cw;
      _rightWidth = rw;
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
    // left=300 + right=600 = 900 > clientWidth=800 → overflow
    const { container, rightGroup } = createMockContainer({
      clientWidth: 800,
      leftWidth: 300,
      rightWidth: 600,
    });

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
    const { container, rightGroup } = createMockContainer({
      clientWidth: 800,
      leftWidth: 300,
      rightWidth: 600,
    });

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
    const { container, rightGroup } = createMockContainer({
      clientWidth: 800,
      leftWidth: 300,
      rightWidth: 600,
    });

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
    // left=300 + right=400 = 700 < clientWidth=800 → no overflow
    const { container, rightGroup } = createMockContainer({
      clientWidth: 800,
      leftWidth: 300,
      rightWidth: 400,
    });

    const el1 = addItem(rightGroup, 'no-hide');

    initNavbarOverflow({
      container,
      items: [{ selector: '.no-hide', priority: 1 }],
    });

    triggerAndFlush();

    expect(el1.hasAttribute('data-navbar-hidden')).toBe(false);
  });

  it('skips items whose selectors do not match any element', () => {
    const { container, rightGroup } = createMockContainer({
      clientWidth: 800,
      leftWidth: 300,
      rightWidth: 600,
    });

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

  it('shows items when overflow is resolved after resize', () => {
    const { container, rightGroup, setWidths } = createMockContainer({
      clientWidth: 800,
      leftWidth: 300,
      rightWidth: 600,
    });

    const el1 = addItem(rightGroup, 'toggle-item');

    const cleanup = initNavbarOverflow({
      container,
      items: [{ selector: '.toggle-item', priority: 1 }],
    });

    // Initial: overflow → hide
    triggerAndFlush();
    expect(el1.getAttribute('data-navbar-hidden')).toBe('');

    // Resize wider so no overflow (300 + 400 = 700 < 1000)
    setWidths(1000, 400);
    triggerAndFlush();

    expect(el1.hasAttribute('data-navbar-hidden')).toBe(false);
    expect(el1.style.display).toBe('');
    cleanup();
  });
});
