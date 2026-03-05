/**
 * @module navbar-overflow
 * Priority-based navbar overflow utility.
 *
 * Uses ResizeObserver to monitor a container's width and dynamically hides/shows
 * items in priority order (lowest priority hidden first) to prevent wrapping.
 */

/**
 * @typedef {Object} OverflowItem
 * @property {string} selector - CSS selector to find the element
 * @property {number} priority - Lower number = hidden first
 */

/**
 * @typedef {Object} OverflowOptions
 * @property {HTMLElement} container - The navbar container to observe
 * @property {OverflowItem[]} items - Items with selectors and priority ordering
 */

/**
 * Initializes the navbar overflow handler.
 *
 * @param {OverflowOptions} options
 * @returns {() => void} Cleanup function that disconnects the observer and restores all items
 */
export function initNavbarOverflow({ container, items }) {
  if (!container || !items?.length) return () => {};

  // Resolve selectors to elements and sort by priority (lowest first = hidden first)
  const sorted = items.slice().sort((a, b) => a.priority - b.priority);

  const hiddenSet = new Set();
  let rafId = null;
  let debounceTimer = null;

  function resolveElements() {
    return sorted
      .map((item) => ({
        ...item,
        el: container.querySelector(item.selector),
      }))
      .filter((item) => item.el);
  }

  function isOverflowing() {
    // With flex-wrap: nowrap, flex items shrink instead of overflowing,
    // so scrollWidth may equal clientWidth even when items are compressed.
    // Compare the sum of children's scrollWidth to detect compression.
    let childrenWidth = 0;
    for (const child of container.children) {
      childrenWidth += child.scrollWidth;
    }
    return childrenWidth > container.clientWidth;
  }

  function hideItem(item) {
    item.el.style.display = 'none';
    item.el.setAttribute('data-navbar-hidden', '');
    hiddenSet.add(item.selector);
  }

  function showItem(item) {
    item.el.style.display = '';
    item.el.removeAttribute('data-navbar-hidden');
    hiddenSet.delete(item.selector);
  }

  function reflow() {
    const resolved = resolveElements();

    // Phase 1: hide items until no overflow (lowest priority first)
    for (const item of resolved) {
      if (!isOverflowing()) break;
      if (hiddenSet.has(item.selector)) continue;
      hideItem(item);
    }

    // Phase 2: try to restore hidden items (highest priority first)
    for (let i = resolved.length - 1; i >= 0; i--) {
      const item = resolved[i];
      if (!hiddenSet.has(item.selector)) continue;
      showItem(item);
      if (isOverflowing()) {
        hideItem(item);
        break; // No room for anything lower priority either
      }
    }
  }

  function scheduleReflow() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        reflow();
        rafId = null;
      });
    }, 50);
  }

  const observer = new ResizeObserver(scheduleReflow);
  observer.observe(container);

  // Initial check
  scheduleReflow();

  return function cleanup() {
    observer.disconnect();
    clearTimeout(debounceTimer);
    if (rafId) cancelAnimationFrame(rafId);
    // Restore all hidden items
    const resolved = resolveElements();
    for (const item of resolved) {
      if (hiddenSet.has(item.selector)) {
        showItem(item);
      }
    }
  };
}
