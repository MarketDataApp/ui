// @vitest-environment node

// The renderer runs where there is no DOM: an Astro build, an SSR request on a
// Cloudflare Worker, a Node script. This file runs in vitest's node environment
// — no `document`, no `window` — so a stray DOM reference at import time or in
// the render path fails here rather than in a consumer's build log.

describe('@marketdataapp/ui/header without a DOM', () => {
  it('imports and renders', async () => {
    expect(typeof globalThis.document).toBe('undefined');
    expect(typeof globalThis.window).toBe('undefined');

    const { renderHeader, defaultNavigation, dataCatalog } = await import('../../dist/header.js');
    const html = renderHeader({
      logo: { light: '/l.png', dark: '/d.png' },
      currentPath: '/pricing/',
    });

    expect(html.startsWith('<header class="site-header">')).toBe(true);
    expect(html.endsWith('<div class="site-header-spacer"></div>')).toBe(true);
    expect(defaultNavigation.length).toBe(5);
    expect(dataCatalog.length).toBe(11);
  });

  it('the client module also imports without a DOM, so a bundler can evaluate it during SSR', async () => {
    // Nothing runs at import time; initHeader() is what touches the document.
    const mod = await import('../../dist/header-client.js');
    expect(typeof mod.initHeader).toBe('function');
  });
});
