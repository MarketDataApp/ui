import { initDarkImages, addImagePair } from '../../dist/dark-images.js';

// ---------------------------------------------------------------------------
// Image mock — controls whether imageExists() resolves true or false
// ---------------------------------------------------------------------------

/** URLs that should "exist" (onload fires). All others get onerror. */
const existingUrls = new Set();

class MockImage {
  set src(url) {
    this._src = url;
    // Defer so the caller can attach onload/onerror first
    setTimeout(() => {
      if (existingUrls.has(url)) {
        this.onload?.();
      } else {
        this.onerror?.();
      }
    }, 0);
  }
  get src() {
    return this._src;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setLightMode() {
  document.documentElement.classList.remove('dark');
}

function setDarkMode() {
  document.documentElement.classList.add('dark');
}

/** Flush microtasks + setTimeout(0) so Image mock callbacks and MutationObserver fire. */
async function flush() {
  // MutationObserver is microtask-based in jsdom; Image mock uses setTimeout(0)
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => setTimeout(r, 0));
}

/** Create an img element with the given src and append to body. */
function addImg(src) {
  const img = document.createElement('img');
  img.setAttribute('src', src);
  document.body.appendChild(img);
  return img;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('dark-images', () => {
  let originalImage;
  let cleanups;

  /** Call initDarkImages and track the cleanup for afterEach. */
  function init() {
    const cleanup = initDarkImages();
    cleanups.push(cleanup);
    return cleanup;
  }

  beforeAll(() => {
    originalImage = globalThis.Image;
    globalThis.Image = MockImage;
  });

  afterAll(() => {
    globalThis.Image = originalImage;
  });

  beforeEach(() => {
    cleanups = [];
    existingUrls.clear();
    setLightMode();
  });

  afterEach(() => {
    cleanups.forEach((fn) => fn());
    document.body.innerHTML = ''; // eslint-disable-line -- safe: static test content
  });

  // -------------------------------------------------------------------------
  // Convention-based swapping
  // -------------------------------------------------------------------------
  describe('convention-based', () => {
    it('swaps -light image to -dark when theme is dark and alternate exists', async () => {
      setDarkMode();
      existingUrls.add('logo-dark.png');
      addImg('logo-light.png');

      init();
      await flush();

      expect(document.querySelector('img').getAttribute('src')).toBe('logo-dark.png');
    });

    it('swaps -dark image to -light when theme is light and alternate exists', async () => {
      setLightMode();
      existingUrls.add('logo-light.png');
      addImg('logo-dark.png');

      init();
      await flush();

      expect(document.querySelector('img').getAttribute('src')).toBe('logo-light.png');
    });

    it('does not swap when image suffix already matches theme', async () => {
      setLightMode();
      addImg('logo-light.png');

      init();
      await flush();

      expect(document.querySelector('img').getAttribute('src')).toBe('logo-light.png');
    });

    it('does not swap when alternate 404s', async () => {
      setDarkMode();
      // Don't add 'logo-dark.png' to existingUrls → simulates 404
      addImg('logo-light.png');

      init();
      await flush();

      expect(document.querySelector('img').getAttribute('src')).toBe('logo-light.png');
    });

    it('ignores images without -light/-dark suffix', async () => {
      setDarkMode();
      addImg('logo.png');

      init();
      await flush();

      expect(document.querySelector('img').getAttribute('src')).toBe('logo.png');
    });

    it('handles .avif extension', async () => {
      setDarkMode();
      existingUrls.add('logo-dark.avif');
      addImg('logo-light.avif');

      init();
      await flush();

      expect(document.querySelector('img').getAttribute('src')).toBe('logo-dark.avif');
    });

    it('handles full URL paths', async () => {
      setDarkMode();
      existingUrls.add('https://cdn.example.com/images/hero-dark.jpg');
      addImg('https://cdn.example.com/images/hero-light.jpg');

      init();
      await flush();

      expect(document.querySelector('img').getAttribute('src')).toBe(
        'https://cdn.example.com/images/hero-dark.jpg',
      );
    });
  });

  // -------------------------------------------------------------------------
  // Theme change via MutationObserver
  // -------------------------------------------------------------------------
  describe('theme change observer', () => {
    it('swaps images when theme toggles from light to dark', async () => {
      setLightMode();
      existingUrls.add('logo-dark.png');
      addImg('logo-light.png');

      const cleanup = init();
      await flush();

      // Image should stay as-is in light mode
      expect(document.querySelector('img').getAttribute('src')).toBe('logo-light.png');

      // Toggle to dark
      setDarkMode();
      await flush();

      expect(document.querySelector('img').getAttribute('src')).toBe('logo-dark.png');
      cleanup();
    });

    it('swaps images back when theme toggles from dark to light', async () => {
      setDarkMode();
      existingUrls.add('logo-dark.png');
      existingUrls.add('logo-light.png');
      addImg('logo-light.png');

      const cleanup = init();
      await flush();

      // Should have swapped to dark
      expect(document.querySelector('img').getAttribute('src')).toBe('logo-dark.png');

      // Toggle to light
      setLightMode();
      await flush();

      expect(document.querySelector('img').getAttribute('src')).toBe('logo-light.png');
      cleanup();
    });
  });

  // -------------------------------------------------------------------------
  // DOM observer — dynamically added images
  // -------------------------------------------------------------------------
  describe('DOM observer', () => {
    it('swaps a dynamically added image', async () => {
      setDarkMode();
      existingUrls.add('banner-dark.png');

      const cleanup = init();
      await flush();

      // Add image after init
      const img = addImg('banner-light.png');
      await flush();

      expect(img.getAttribute('src')).toBe('banner-dark.png');
      cleanup();
    });

    it('swaps images inside a dynamically added container', async () => {
      setDarkMode();
      existingUrls.add('icon-dark.svg');

      const cleanup = init();
      await flush();

      // Add a div with a nested image
      const div = document.createElement('div');
      const img = document.createElement('img');
      img.setAttribute('src', 'icon-light.svg');
      div.appendChild(img);
      document.body.appendChild(div);
      await flush();

      expect(img.getAttribute('src')).toBe('icon-dark.svg');
      cleanup();
    });
  });

  // -------------------------------------------------------------------------
  // Explicit pairs
  // -------------------------------------------------------------------------
  describe('addImagePair', () => {
    it('swaps a partial-match pair when theme is dark', async () => {
      addImagePair('chart.png', 'chart-inverted.png');
      existingUrls.add('/assets/chart-inverted.png');
      setDarkMode();
      addImg('/assets/chart.png');

      init();
      await flush();

      expect(document.querySelector('img').getAttribute('src')).toBe('/assets/chart-inverted.png');
    });

    it('swaps back from dark to light variant', async () => {
      addImagePair('graph.png', 'graph-night.png');
      existingUrls.add('/img/graph.png');
      setLightMode();
      addImg('/img/graph-night.png');

      init();
      await flush();

      expect(document.querySelector('img').getAttribute('src')).toBe('/img/graph.png');
    });

    it('swaps exact URL pairs', async () => {
      addImagePair('https://cdn.example.com/logo.png', 'https://cdn.example.com/logo-night.png');
      existingUrls.add('https://cdn.example.com/logo-night.png');
      setDarkMode();
      addImg('https://cdn.example.com/logo.png');

      init();
      await flush();

      expect(document.querySelector('img').getAttribute('src')).toBe(
        'https://cdn.example.com/logo-night.png',
      );
    });

    it('swaps exact absolute path pairs', async () => {
      addImagePair('/images/photo.jpg', '/images/photo-dark.jpg');
      existingUrls.add('/images/photo-dark.jpg');
      setDarkMode();
      addImg('/images/photo.jpg');

      init();
      await flush();

      expect(document.querySelector('img').getAttribute('src')).toBe('/images/photo-dark.jpg');
    });

    it('does not swap pair when alternate 404s', async () => {
      addImagePair('exists.png', 'missing.png');
      // Don't add 'missing.png' to existingUrls
      setDarkMode();
      addImg('/path/exists.png');

      init();
      await flush();

      expect(document.querySelector('img').getAttribute('src')).toBe('/path/exists.png');
    });

    it('does not swap pair when theme already matches', async () => {
      addImagePair('day.png', 'night.png');
      setLightMode();
      addImg('/img/day.png');

      init();
      await flush();

      // day.png is the light variant, theme is light — no swap
      expect(document.querySelector('img').getAttribute('src')).toBe('/img/day.png');
    });
  });

  // -------------------------------------------------------------------------
  // Cleanup and idempotency
  // -------------------------------------------------------------------------
  describe('cleanup and idempotency', () => {
    it('returns a cleanup function that stops observing', async () => {
      setLightMode();
      existingUrls.add('test-dark.png');
      addImg('test-light.png');

      const cleanup = init();
      await flush();

      // Disconnect observers
      cleanup();

      // Toggle theme — should NOT trigger a swap since we disconnected
      setDarkMode();
      await flush();

      expect(document.querySelector('img').getAttribute('src')).toBe('test-light.png');
    });

    it('multiple calls return the same cleanup function (idempotent)', () => {
      const cleanup1 = initDarkImages();
      const cleanup2 = initDarkImages();
      const cleanup3 = initDarkImages();

      expect(cleanup1).toBe(cleanup2);
      expect(cleanup2).toBe(cleanup3);

      cleanup1();
    });

    it('can re-initialize after cleanup', async () => {
      setDarkMode();
      existingUrls.add('re-dark.png');
      addImg('re-light.png');

      const cleanup1 = init();
      await flush();
      expect(document.querySelector('img').getAttribute('src')).toBe('re-dark.png');

      // Cleanup and reset image
      cleanup1();
      document.querySelector('img').setAttribute('src', 're-light.png');

      // Re-init should work
      existingUrls.add('re-dark.png');
      init();
      await flush();
      expect(document.querySelector('img').getAttribute('src')).toBe('re-dark.png');
    });
  });
});
