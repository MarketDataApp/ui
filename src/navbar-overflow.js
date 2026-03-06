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
    // Check 1: Detect flex-item compression.
    // With flex-wrap: nowrap, flex items shrink instead of overflowing,
    // so container.scrollWidth may equal clientWidth even when items are
    // compressed. Detect compression by checking if any element's natural
    // content width (scrollWidth) exceeds its rendered width (offsetWidth).
    for (const group of container.children) {
      for (const item of group.children) {
        if (item.scrollWidth > item.offsetWidth + 1) return true;
      }
    }

    // Check 2: Detect cross-group overlap.
    // Absolutely-positioned items (e.g. Docusaurus search at mobile widths)
    // don't cause compression — they float over siblings without affecting
    // flow. Detect overflow by checking if visible items from DIFFERENT
    // groups have overlapping bounding rects. We only compare across groups
    // because items within the same group (e.g. an absolute-positioned
    // search icon and a static login button) naturally share space.
    const groups = [];
    for (const group of container.children) {
      const rects = [];
      for (const item of group.children) {
        const r = item.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) rects.push(r);
      }
      if (rects.length) groups.push(rects);
    }
    for (let g1 = 0; g1 < groups.length; g1++) {
      for (let g2 = g1 + 1; g2 < groups.length; g2++) {
        for (const a of groups[g1]) {
          for (const b of groups[g2]) {
            if (
              a.right > b.left + 1 &&
              b.right > a.left + 1 &&
              a.bottom > b.top + 1 &&
              b.bottom > a.top + 1
            )
              return true;
          }
        }
      }
    }

    // Check 3: Detect container-level horizontal overflow.
    // Catches any overflow that Checks 1 and 2 miss — e.g. when the
    // container allows wrapping (no flex-wrap: nowrap) and overlapping
    // items are in the same group. A simple scrollWidth > clientWidth
    // on the container itself is the most robust fallback.
    if (container.scrollWidth > container.clientWidth) return true;

    return false;
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
