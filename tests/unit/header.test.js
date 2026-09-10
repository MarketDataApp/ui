import {
  renderHeader,
  defaultNavigation,
  dataCatalog,
  headerIconNames,
  tappableSections,
} from '../../dist/header.js';

// The renderer is tested through the BUILT module, like every other module
// here: dist/header.js is what consumers import, with the icon partials
// inlined by build-js.js. A test against src/ would pass with a broken build.

const LOGO = { light: '/logo-light.png', dark: '/logo-dark.png' };

/** Parse the rendered string into a detached document fragment. */
function render(options = {}) {
  const html = renderHeader({ logo: LOGO, ...options });
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  return { html, root: tpl.content };
}

const drawerOf = (root) => root.querySelector('#navbar-main');
const linksOf = (root) => root.querySelector('#navbar-links');

// ---------------------------------------------------------------------------
// Shape
// ---------------------------------------------------------------------------
describe('renderHeader: document shape', () => {
  it('renders one banner with the skip link, the bar, the backdrop, the drawer and a spacer', () => {
    const { root } = render();
    const header = root.querySelector('header.site-header');
    expect(header).not.toBeNull();
    expect(header.querySelector('a.site-header-skip').getAttribute('href')).toBe('#main-content');
    expect(header.querySelector('nav[aria-label="Primary"].site-header-bar')).not.toBeNull();
    expect(header.querySelector('#navbar-backdrop')).not.toBeNull();
    expect(header.querySelector('nav#navbar-main[aria-label="Main menu"]')).not.toBeNull();
    expect(root.querySelector('header + .site-header-spacer')).not.toBeNull();
  });

  it('is a fixed bar with a spacer by default, and an in-flow bar without one when fixed is false', () => {
    const fixed = render();
    expect(fixed.root.querySelector('.site-header-bar--static')).toBeNull();
    expect(fixed.root.querySelector('.site-header-spacer')).not.toBeNull();

    const inFlow = render({ fixed: false });
    expect(inFlow.root.querySelector('.site-header-bar--static')).not.toBeNull();
    expect(inFlow.root.querySelector('.site-header-spacer')).toBeNull();
  });

  it('keeps the ids the website and its checks address', () => {
    const { root } = render();
    for (const id of [
      'navbar-row',
      'navbar-links',
      'navbar-toggle',
      'navbar-main',
      'navbar-backdrop',
      'navbar-close',
      'user-profile',
      'theme-toggle',
      'theme-toggle-drawer',
    ]) {
      expect(root.querySelector(`#${id}`), id).not.toBeNull();
    }
  });

  it('ships the first-paint seed and the closed drawer state in the markup itself', () => {
    const { root } = render();
    expect(root.querySelector('#navbar-row').hasAttribute('data-navbar-unmeasured')).toBe(true);
    expect(drawerOf(root).hasAttribute('inert')).toBe(true);
    expect(root.querySelector('#navbar-toggle').getAttribute('aria-expanded')).toBe('false');
    expect(root.querySelector('#navbar-toggle').getAttribute('aria-controls')).toBe('navbar-main');
  });

  it('uses only the kit’s own classes, never a Tailwind utility', () => {
    // The markup must render from dist/css alone and from a consumer's own
    // Tailwind build that never scans this package. A utility here would
    // ship unstyled to one of them. The three exceptions are the containers
    // other kit modules already style.
    const { root } = render({ currentPath: '/pricing/' });
    const allowed = /^(site-header(-[a-z-]+)?|user-profile-container|theme-toggle-container)$/;
    const offenders = new Set();
    for (const el of root.querySelectorAll('[class]')) {
      for (const cls of el.getAttribute('class').split(/\s+/)) {
        if (cls && !allowed.test(cls)) offenders.add(cls);
      }
    }
    expect([...offenders]).toEqual([]);
  });

  it('carries no Flowbite data-API attribute, so a global Flowbite cannot bind a second controller', () => {
    const { html } = render();
    expect(html).not.toMatch(
      /data-(dropdown|accordion|collapse|drawer|modal|tooltip|popover|tabs|dial)-/,
    );
  });

  it('gives every menu trigger aria-controls pointing at its panel', () => {
    const { root } = render();
    const desktop = root.querySelectorAll('.site-header-menu-button');
    const mobile = root.querySelectorAll('.site-header-accordion-button');
    expect(desktop.length).toBe(4);
    expect(mobile.length).toBe(4);
    for (const button of [...desktop, ...mobile]) {
      const panel = root.getElementById(button.getAttribute('aria-controls'));
      expect(panel, button.id).not.toBeNull();
      expect(panel.hasAttribute('hidden')).toBe(true);
      expect(button.getAttribute('aria-expanded')).toBe('false');
    }
    expect(root.querySelector('#mega-menu-products-button').getAttribute('aria-controls')).toBe(
      'mega-menu-products',
    );
    expect(
      root.querySelector('#mega-menu-products-mobile-button').getAttribute('aria-controls'),
    ).toBe('mega-menu-products-mobile');
  });
});

// ---------------------------------------------------------------------------
// Default navigation and the data catalogue
// ---------------------------------------------------------------------------
describe('defaultNavigation', () => {
  it('is the website’s five top-level items in order', () => {
    expect(defaultNavigation.map((i) => i.label)).toEqual([
      'Data',
      'Products',
      'Learn',
      'Pricing',
      'Company',
    ]);
  });

  it('links nothing under /tools/', () => {
    const { root } = render();
    const hrefs = [...root.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
    expect(hrefs.some((h) => /\/tools(\/|$)/.test(h))).toBe(false);
  });

  it('builds the Data menu from the catalogue: live types link, planned types are announcements', () => {
    const data = defaultNavigation[0];
    const live = dataCatalog.filter((d) => !d.comingSoon);
    const planned = dataCatalog.filter((d) => d.comingSoon);
    expect(data.columns[0].links.map((l) => l.label)).toEqual(live.map((d) => d.title));
    expect(data.columns[0].links.every((l) => !l.disabled && l.href !== '#')).toBe(true);
    expect(data.aside.links.map((l) => l.label)).toEqual(planned.map((d) => d.title));
    expect(data.aside.links.every((l) => l.disabled)).toBe(true);
  });

  it('exposes a catalogue with stable keys, a title, an icon that exists, and an href on every live type', () => {
    expect(dataCatalog.length).toBe(11);
    const keys = dataCatalog.map((d) => d.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const d of dataCatalog) {
      expect(d.key).toMatch(/^[a-z-]+$/);
      expect(typeof d.title).toBe('string');
      expect(headerIconNames).toContain(d.icon);
      expect(typeof d.comingSoon).toBe('boolean');
      if (!d.comingSoon) expect(d.href).toMatch(/^\/data\//);
    }
  });

  it('is frozen', () => {
    expect(Object.isFrozen(defaultNavigation)).toBe(true);
    expect(Object.isFrozen(dataCatalog)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Mega menu vs drawer
// ---------------------------------------------------------------------------
describe('renderHeader: mega menu and drawer differ on purpose', () => {
  it('keeps disabled rows in the mega menu and drops them, and their emptied group, from the drawer', () => {
    const { root } = render();
    const panel = root.querySelector('#mega-menu-data');
    expect(panel.querySelectorAll('.site-header-panel-aside-link--disabled').length).toBe(6);
    expect(panel.textContent).toContain('Coming Soon');

    const accordion = root.querySelector('#mega-menu-data-mobile');
    expect(accordion.textContent).not.toContain('Coming Soon');
    expect(accordion.textContent).not.toContain('Indices');
    expect(accordion.querySelectorAll('a').length).toBe(6); // "Explore Our Data" + 5 live types
  });

  it('tappableSections removes disabled rows and any section left empty', () => {
    const sections = tappableSections({
      type: 'dropdown',
      id: 'x',
      label: 'X',
      columns: [
        {
          title: 'Keep',
          links: [
            { label: 'a', href: '/a' },
            { label: 'b', href: '#', disabled: true },
          ],
        },
      ],
      aside: { title: 'Gone', links: [{ label: 'c', href: '#', disabled: true }] },
    });
    expect(sections.map((s) => s.title)).toEqual(['Keep']);
    expect(sections[0].links.map((l) => l.label)).toEqual(['a']);
  });

  it('renders the Products panel as cards with descriptions and the coming-soon suffix', () => {
    const { root } = render();
    const panel = root.querySelector('#mega-menu-products');
    expect(panel.classList.contains('site-header-panel--cards')).toBe(true);
    expect(panel.querySelector('.site-header-panel-grid')).not.toBeNull();
    expect(panel.querySelectorAll('.site-header-panel-description').length).toBe(4);
    const excel = [...panel.querySelectorAll('.site-header-panel-item--disabled')][0];
    expect(excel.textContent).toContain('Excel Add-in');
    expect(excel.querySelector('.site-header-panel-soon').textContent).toBe('(coming soon)');
    expect(excel.querySelector('a')).toBeNull();
  });

  it('marks external links to open in a new tab in both the mega menu and the drawer', () => {
    const { root } = render();
    const swagger = [...root.querySelectorAll('a[href="https://api.marketdata.app/"]')];
    expect(swagger.length).toBe(2);
    for (const a of swagger) {
      expect(a.getAttribute('target')).toBe('_blank');
      expect(a.getAttribute('rel')).toBe('noopener noreferrer');
    }
    const internal = root.querySelector('a[href="/pricing/"]');
    expect(internal.hasAttribute('target')).toBe(false);
  });

  it('carries the account fallback links in the drawer with the defaults, and takes overrides', () => {
    const { root } = render();
    const links = [...drawerOf(root).querySelectorAll('.site-header-drawer-auth-link')];
    expect(links.map((a) => [a.getAttribute('href'), a.textContent])).toEqual([
      ['https://dashboard.marketdata.app/marketdata/login', 'Log In'],
      ['/signup/', 'Try For Free'],
    ]);

    const custom = render({
      loginUrl:
        'https://dashboard.marketdata.app/marketdata/login?amember_redirect_url=%2Ftools%2F',
      loginText: 'Sign in',
      signupUrl: '/trial/',
      signupText: 'Start',
    });
    const overridden = [...drawerOf(custom.root).querySelectorAll('.site-header-drawer-auth-link')];
    expect(overridden[0].getAttribute('href')).toContain('amember_redirect_url');
    expect(overridden.map((a) => a.textContent)).toEqual(['Sign in', 'Start']);
  });
});

// ---------------------------------------------------------------------------
// Current page
// ---------------------------------------------------------------------------
describe('renderHeader: aria-current', () => {
  it('marks the drawer row for the current path, with or without a trailing slash', () => {
    for (const path of ['/pricing/', '/pricing']) {
      const { root } = render({ currentPath: path });
      const current = [...root.querySelectorAll('[aria-current="page"]')];
      expect(current.length, path).toBe(1);
      expect(current[0].getAttribute('href')).toBe('/pricing/');
      expect(drawerOf(root).contains(current[0])).toBe(true);
    }
  });

  it('marks a nested row and a linked section title', () => {
    const { root } = render({ currentPath: '/data/' });
    const current = root.querySelector('[aria-current="page"]');
    expect(current.classList.contains('site-header-drawer-section-link')).toBe(true);

    const nested = render({ currentPath: '/data/options' });
    expect(nested.root.querySelector('[aria-current="page"]').textContent).toBe('Options');
  });

  it('never marks a placeholder or an off-site href, and nothing without currentPath', () => {
    expect(render({ currentPath: '/' }).root.querySelector('[aria-current]')).toBeNull();
    expect(
      render({ currentPath: 'https://roadmap.marketdata.app/' }).root.querySelector(
        '[aria-current]',
      ),
    ).toBeNull();
    expect(render().root.querySelector('[aria-current]')).toBeNull();
  });

  it('leaves the mega menu unmarked, as the website does', () => {
    const { root } = render({ currentPath: '/pricing/' });
    expect(linksOf(root).querySelector('[aria-current]')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Logo
// ---------------------------------------------------------------------------
describe('renderHeader: logo', () => {
  it('requires a logo or a logo slot', () => {
    expect(() => renderHeader({})).toThrow(/logo/);
    expect(() => renderHeader({ logo: { light: '/l.png' } })).toThrow(/logo/);
  });

  it('renders the light/dark pair twice — bar and drawer — with eager loading', () => {
    const { root } = render();
    const light = [...root.querySelectorAll('img.site-header-logo-light')];
    const dark = [...root.querySelectorAll('img.site-header-logo-dark')];
    expect(light.length).toBe(2);
    expect(dark.length).toBe(2);
    expect(light[0].getAttribute('src')).toBe('/logo-light.png');
    expect(dark[0].getAttribute('src')).toBe('/logo-dark.png');
    expect(light[0].getAttribute('alt')).toBe('MarketData');
    expect(light[0].getAttribute('loading')).toBe('eager');
    expect(light[0].getAttribute('width')).toBe('160');
    expect(light[0].getAttribute('height')).toBe('32');
  });

  it('accepts srcset and sizes, and a custom alt', () => {
    const { root } = render({
      logo: {
        light: { src: '/l.webp', srcset: '/l.webp 160w, /l@2x.webp 320w', sizes: '160px' },
        dark: { src: '/d.webp', srcset: '/d.webp 160w, /d@2x.webp 320w', sizes: '160px' },
        alt: 'Market Data',
      },
    });
    const img = root.querySelector('img.site-header-logo-light');
    expect(img.getAttribute('srcset')).toBe('/l.webp 160w, /l@2x.webp 320w');
    expect(img.getAttribute('sizes')).toBe('160px');
    expect(img.getAttribute('alt')).toBe('Market Data');
  });

  it('lets the logo slot replace both logo markups verbatim', () => {
    const { root } = render({ logo: undefined, slots: { logo: '<svg data-own-logo></svg>' } });
    expect(root.querySelectorAll('[data-own-logo]').length).toBe(2);
    expect(root.querySelector('.site-header-logo')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Slots, escaping, icons
// ---------------------------------------------------------------------------
describe('renderHeader: slots and trust boundaries', () => {
  it('replaces the account container with the auth slot, verbatim', () => {
    const slot =
      '<div id="user-profile" class="user-profile-container"><a href="/login">Log in</a></div>';
    const { root } = render({ slots: { auth: slot } });
    const end = root.querySelector('.site-header-end');
    expect(end.querySelector('#user-profile a[href="/login"]')).not.toBeNull();
    expect(end.querySelectorAll('#user-profile').length).toBe(1);
  });

  it('places drawerStart above the navigation and drawerEnd below it', () => {
    const { root } = render({
      slots: { drawerStart: '<p id="start">s</p>', drawerEnd: '<p id="end">e</p>' },
    });
    const body = root.querySelector('.site-header-drawer-body');
    const children = [...body.children].map((el) => el.id || el.className);
    expect(children).toEqual(['start', 'site-header-drawer-list', 'end']);
  });

  it('escapes labels, hrefs and descriptions', () => {
    const navigation = [
      { type: 'link', label: '<b>Bold</b> & "quoted"', href: '/x?a=1&b="2"' },
      {
        type: 'dropdown',
        id: 'd',
        label: 'D',
        columns: [
          {
            title: '<title>',
            links: [{ label: '<i>', href: '#', icon: 'star', description: '<d>' }],
          },
        ],
      },
    ];
    const { html, root } = render({ navigation });
    expect(html).not.toContain('<b>Bold</b>');
    expect(html).not.toContain('<title>');
    expect(html).not.toContain('<d>');
    const link = root.querySelector('.site-header-link');
    expect(link.textContent).toBe('<b>Bold</b> & "quoted"');
    expect(link.getAttribute('href')).toBe('/x?a=1&b="2"');
  });

  it('inlines a built-in icon by name with the sizing class, and accepts a raw <svg> string', () => {
    const navigation = [
      {
        type: 'dropdown',
        id: 'd',
        label: 'D',
        columns: [
          {
            links: [
              { label: 'Named', href: '/n', icon: 'stocks' },
              { label: 'Own', href: '/o', icon: '<svg viewBox="0 0 1 1" data-own></svg>' },
            ],
          },
        ],
      },
    ];
    const { root } = render({ navigation });
    const icons = [...root.querySelectorAll('#mega-menu-d svg.site-header-panel-icon')];
    expect(icons.length).toBe(2);
    expect(icons[0].getAttribute('aria-hidden')).toBe('true');
    expect(icons[0].getAttribute('fill')).toBe('currentColor');
    expect(icons[1].hasAttribute('data-own')).toBe(true);
    expect(icons[1].classList.contains('site-header-panel-icon')).toBe(true);
  });

  it('throws on an unknown icon name rather than rendering nothing', () => {
    const navigation = [
      {
        type: 'dropdown',
        id: 'd',
        label: 'D',
        columns: [{ links: [{ label: 'x', href: '/x', icon: 'nope' }] }],
      },
    ];
    expect(() => renderHeader({ logo: LOGO, navigation })).toThrow(/unknown icon "nope"/);
  });

  it('ships every icon the default navigation and the catalogue name', () => {
    expect(headerIconNames).toEqual(
      expect.arrayContaining(['menu', 'x', 'triangle', 'chevron-right', 'braces']),
    );
    expect(headerIconNames.length).toBe(32);
  });
});
