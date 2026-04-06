import { onThemeChange } from './theme.js';

/**
 * @module dark-images
 * Automatic dark/light image swapping for *.marketdata.app.
 *
 * Two ways to use:
 *
 * 1. **Convention-based** — images with `-light` or `-dark` before the file
 *    extension (e.g. `logo-light.png`, `hero-dark.jpg`) are swapped
 *    automatically. The alternate URL is probed via Image prefetch.
 *
 * 2. **Explicit pairs** — call `addImagePair(lightUrl, darkUrl)` to register
 *    arbitrary URLs as a light/dark pair. Pairs can be full URLs or partial
 *    paths (e.g. `'123.jpg'` matches any src ending with `123.jpg`).
 *
 * Only fetches the alternate image when the current theme doesn't match.
 * Browser HTTP cache handles repeat requests natively.
 */

const SUFFIX_RE = /(-light|-dark)(\.[a-z0-9]+)$/i;

// ---------------------------------------------------------------------------
// Image pairs registry
// ---------------------------------------------------------------------------

/**
 * Registered pairs. Each entry: { light, dark }.
 * Match type is inferred per-URL: full URLs (has "://") and absolute paths
 * (starts with "/") match exactly; bare filenames match as a suffix.
 */
const pairs = [];

/** A URL matches exactly if it's a full URL or an absolute path. */
function isExact(url) {
  return url.includes('://') || url.startsWith('/');
}

/**
 * Register a light/dark image pair. When one is found in the DOM and the theme
 * doesn't match, it will be swapped for the other.
 *
 * Match type is inferred from each URL:
 * - `https://example.com/img.jpg` — matched exactly (has "://")
 * - `/folder/img.jpg` — matched exactly (starts with "/")
 * - `img.jpg` — matches any src ending with `img.jpg`
 *
 * @param {string} lightUrl - The URL (or filename/path fragment) for light mode
 * @param {string} darkUrl  - The URL (or filename/path fragment) for dark mode
 */
export function addImagePair(lightUrl, darkUrl) {
  pairs.push({ light: lightUrl, dark: darkUrl });
}

/** Check if a src matches a pair URL based on the URL's inferred type. */
function pairMatch(src, pairUrl) {
  return isExact(pairUrl) ? src === pairUrl : src.endsWith(pairUrl);
}

/**
 * Build the alternate URL from a matched src.
 * Exact URLs return the target directly. Partial URLs replace the matched
 * suffix in the original src so the path structure is preserved.
 */
function buildAlternate(src, from, to) {
  if (isExact(to)) return to;
  const idx = src.lastIndexOf(from);
  return src.slice(0, idx) + to + src.slice(idx + from.length);
}

/**
 * Look up a registered pair for a given src.
 * Returns { alternate, currentVariant } or null.
 */
function findPair(src) {
  for (const pair of pairs) {
    if (pairMatch(src, pair.light)) {
      return { alternate: buildAlternate(src, pair.light, pair.dark), currentVariant: 'light' };
    }
    if (pairMatch(src, pair.dark)) {
      return { alternate: buildAlternate(src, pair.dark, pair.light), currentVariant: 'dark' };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Convention-based helpers
// ---------------------------------------------------------------------------

/**
 * Probe whether a URL exists by loading it as an Image.
 * Resolves to true/false without throwing. The browser's native HTTP cache
 * (Cache-Control, ETag, etc.) prevents redundant network requests.
 */
function imageExists(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

/** Build the alternate URL by swapping -light↔-dark. */
function conventionAltUrl(src) {
  return src.replace(SUFFIX_RE, (_, suffix, ext) => {
    return (suffix === '-light' ? '-dark' : '-light') + ext;
  });
}

// ---------------------------------------------------------------------------
// Swap logic
// ---------------------------------------------------------------------------

/** Swap a single image if it doesn't match the given theme. */
async function swapImage(img, theme) {
  const src = img.getAttribute('src');
  if (!src) return;

  // 1. Check registered pairs first
  const pair = findPair(src);
  if (pair) {
    if (pair.currentVariant !== theme) {
      const exists = await imageExists(pair.alternate);
      if (exists) {
        img.setAttribute('src', pair.alternate);
      }
    }
    return;
  }

  // 2. Fall back to convention-based (-light/-dark suffix)
  const match = src.match(SUFFIX_RE);
  if (!match) return;

  const currentVariant = match[1] === '-light' ? 'light' : 'dark';
  if (currentVariant === theme) return;

  const alternate = conventionAltUrl(src);
  const exists = await imageExists(alternate);
  if (exists) {
    img.setAttribute('src', alternate);
  }
}

/** Swap all candidate images in the document. */
function swapAllImages(theme) {
  // Convention-based images
  const conventionImages = document.querySelectorAll('img[src*="-light."], img[src*="-dark."]');
  for (const img of conventionImages) {
    swapImage(img, theme);
  }

  // Pair-based images — scan all <img> elements against registered pairs
  if (pairs.length > 0) {
    const allImages = document.querySelectorAll('img[src]');
    for (const img of allImages) {
      const src = img.getAttribute('src');
      if (findPair(src)) {
        swapImage(img, theme);
      }
    }
  }
}

/** Check if an image's src might be a candidate for swapping. */
function isCandidate(src) {
  if (!src) return false;
  if (SUFFIX_RE.test(src)) return true;
  if (findPair(src)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

let activeCleanup = null;

function currentTheme() {
  const dataTheme = document.documentElement.getAttribute('data-theme');
  if (dataTheme === 'dark' || dataTheme === 'light') return dataTheme;
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

/**
 * Initialize automatic dark/light image swapping.
 *
 * Idempotent — safe to call multiple times. Subsequent calls are no-ops that
 * return the same cleanup function. Calling cleanup allows re-initialization.
 *
 * Watches for:
 * - Theme changes via class or data-theme on <html> (Tailwind and Docusaurus)
 * - New <img> elements added to the DOM (SPA navigation, lazy loading, etc.)
 * - src attribute changes on existing <img> elements
 *
 * Runs an initial swap on call.
 *
 * @returns {() => void} Cleanup function that stops all observers.
 */
export function initDarkImages() {
  if (activeCleanup) return activeCleanup;

  // Initial swap
  swapAllImages(currentTheme());

  // Watch for theme changes (class, data-theme, or system preference)
  const unsubTheme = onThemeChange((theme) => {
    swapAllImages(theme);
  });

  // Watch for new/changed images in the DOM
  const domObserver = new MutationObserver((mutations) => {
    const theme = currentTheme();
    for (const mutation of mutations) {
      // New nodes added to the DOM
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        if (node.tagName === 'IMG') {
          swapImage(node, theme);
        }
        for (const img of node.querySelectorAll?.('img') ?? []) {
          if (isCandidate(img.getAttribute('src'))) {
            swapImage(img, theme);
          }
        }
      }
      // src attribute changed on an existing <img>
      if (mutation.type === 'attributes' && mutation.target.tagName === 'IMG') {
        swapImage(mutation.target, theme);
      }
    }
  });

  domObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src'],
  });

  activeCleanup = () => {
    unsubTheme();
    domObserver.disconnect();
    activeCleanup = null;
  };

  return activeCleanup;
}
