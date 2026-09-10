import { renderHeader } from '../../dist/header.js';
import { initHeader } from '../../dist/header-client.js';
import { _clearCache } from '../../dist/user.js';

// ---------------------------------------------------------------------------
// jsdom stubs
// ---------------------------------------------------------------------------

// initNavbarOverflow needs ResizeObserver; jsdom has none.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverStub;

// The mega menus branch on `(hover: hover) and (pointer: fine)`. `hoverDevice`
// flips what matchMedia answers for that query; every other query is false.
let hoverDevice = true;
window.matchMedia = (query) => ({
  matches: query.includes('hover: hover') ? hoverDevice : false,
  media: query,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
});

// sessionStorage for user.js's cache, as in user-profile.test.js.
const store = new Map();
Object.defineProperty(globalThis, 'sessionStorage', {
  value: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  },
  configurable: true,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LOGO = { light: '/l.png', dark: '/d.png' };

/** Render a page: header + a main and a footer for the drawer to make inert. */
function mount(renderOptions = {}) {
  document.body.innerHTML =
    renderHeader({ logo: LOGO, ...renderOptions }) +
    '<main id="main-content"><a id="page-link" href="#x">page</a></main><footer id="footer"></footer>';
  return document.querySelector('.site-header');
}

const $ = (sel) => document.querySelector(sel);
const drawer = () => $('#navbar-main');
const hamburger = () => $('#navbar-toggle');
const drawerOpen = () => !drawer().hasAttribute('inert');
const links = () => $('#navbar-links');

/** A click as a pointer produces it: detail 1 and a pointerType. */
function pointerClick(el, pointerType = 'mouse') {
  const e = new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 });
  Object.defineProperty(e, 'pointerType', { value: pointerType });
  el.dispatchEvent(e);
}

/** A click as Enter/Space on a button produces it: detail 0, no pointerType. */
function keyboardClick(el) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 0 }));
}

function key(name, target = document) {
  target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));
}

/** Simulate the overflow utility dropping or restoring the nav links. */
function setLinksDropped(dropped) {
  if (dropped) links().setAttribute('data-navbar-hidden', '');
  else links().removeAttribute('data-navbar-hidden');
}

/** MutationObserver callbacks are microtasks. */
const tick = () => new Promise((r) => setTimeout(r, 0));

let cleanup;
beforeEach(() => {
  hoverDevice = true;
  _clearCache();
  sessionStorage.clear();
  document.body.style.overflow = '';
  globalThis.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 401 }));
});
afterEach(() => {
  cleanup?.();
  cleanup = undefined;
  document.body.innerHTML = '';
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Binding
// ---------------------------------------------------------------------------
describe('initHeader: binding', () => {
  it('marks the header ready, hands the row to the overflow pass, and returns a cleanup', () => {
    const root = mount();
    expect($('#navbar-row').hasAttribute('data-navbar-unmeasured')).toBe(true);
    cleanup = initHeader({ userProfile: false });
    expect(typeof cleanup).toBe('function');
    expect(root.hasAttribute('data-header-ready')).toBe(true);
    expect($('#navbar-row').hasAttribute('data-navbar-unmeasured')).toBe(false);
  });

  it('is idempotent per root: a second call returns the first cleanup and binds nothing twice', () => {
    mount();
    cleanup = initHeader({ userProfile: false });
    const again = initHeader({ userProfile: false });
    expect(again).toBe(cleanup);

    // One click toggles once. With a double binding it would open and close.
    hamburger().click();
    expect(drawerOpen()).toBe(true);
    expect(document.querySelectorAll('.theme-toggle-wrapper').length).toBe(2);
  });

  it('returns a no-op when there is no header', () => {
    document.body.innerHTML = '<main></main>';
    expect(() => initHeader()()).not.toThrow();
  });

  it('initialises both theme toggles, and skips one a consumer already initialised', () => {
    mount();
    const own = document.createElement('div');
    own.className = 'theme-toggle-wrapper';
    $('#theme-toggle-drawer').appendChild(own);
    cleanup = initHeader({ userProfile: false });
    expect($('#theme-toggle .theme-toggle-button')).not.toBeNull();
    expect($('#theme-toggle-drawer .theme-toggle-button')).toBeNull();
    expect($('#theme-toggle-drawer').firstChild).toBe(own);
  });

  it('initialises no toggle when themeToggle is false', () => {
    mount();
    cleanup = initHeader({ userProfile: false, themeToggle: false });
    expect(document.querySelector('.theme-toggle-wrapper')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Account control
// ---------------------------------------------------------------------------
describe('initHeader: account control', () => {
  it('renders the shared control into #user-profile by default', async () => {
    mount();
    cleanup = initHeader();
    await tick();
    expect($('#user-profile .user-profile-wrapper')).not.toBeNull();
  });

  it('forwards options to initUserProfile', async () => {
    mount();
    cleanup = initHeader({ userProfile: { signupText: 'Start now', signupUrl: '/go/' } });
    await tick();
    await tick();
    expect($('#user-profile').textContent).toContain('Start now');
    expect($('#user-profile a[href="/go/"]')).not.toBeNull();
  });

  it('never touches a consumer-owned control when userProfile is false — not at init, not at cleanup', async () => {
    const slot =
      '<div id="user-profile" class="user-profile-container"><a id="own-login" href="/login">Log in</a></div>';
    mount({ slots: { auth: slot } });
    cleanup = initHeader({ userProfile: false });
    await tick();
    expect($('#own-login')).not.toBeNull();
    expect($('#user-profile').children.length).toBe(1);
    expect(globalThis.fetch).not.toHaveBeenCalled();

    cleanup();
    cleanup = undefined;
    expect($('#own-login')).not.toBeNull();
  });

  it('tears down the control it created, even when cleanup runs before the user fetch settles', async () => {
    mount();
    const c = initHeader();
    c();
    await tick();
    await tick();
    expect($('#user-profile').children.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Drawer
// ---------------------------------------------------------------------------
describe('initHeader: drawer', () => {
  beforeEach(() => {
    mount();
    setLinksDropped(true);
    cleanup = initHeader({ userProfile: false });
  });

  it('opens: lifts inert, sets data-open, locks scroll, makes the page inert, moves focus to close', () => {
    hamburger().click();
    expect(drawerOpen()).toBe(true);
    expect(drawer().hasAttribute('data-open')).toBe(true);
    expect($('#navbar-backdrop').hasAttribute('data-open')).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');
    expect($('main').hasAttribute('inert')).toBe(true);
    expect($('footer').hasAttribute('inert')).toBe(true);
    expect(hamburger().getAttribute('aria-expanded')).toBe('true');
    expect(hamburger().getAttribute('aria-label')).toBe('Close main menu');
    expect(document.activeElement).toBe($('#navbar-close'));
  });

  it('closes via the close button, the backdrop, Escape and a link, restoring everything and focus', () => {
    const closers = [
      () => $('#navbar-close').click(),
      () => $('#navbar-backdrop').click(),
      () => key('Escape'),
    ];
    for (const close of closers) {
      hamburger().click();
      expect(drawerOpen()).toBe(true);
      close();
      expect(drawerOpen()).toBe(false);
      expect(drawer().hasAttribute('data-open')).toBe(false);
      expect(document.body.style.overflow).toBe('');
      expect($('main').hasAttribute('inert')).toBe(false);
      expect($('footer').hasAttribute('inert')).toBe(false);
      expect(hamburger().getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(hamburger());
    }

    hamburger().click();
    drawer().querySelector('a[href="/pricing/"]').click();
    expect(drawerOpen()).toBe(false);
  });

  it('restores the body’s prior overflow value and leaves an already-inert region alone', () => {
    document.body.style.overflow = 'auto';
    $('footer').setAttribute('inert', '');
    hamburger().click();
    expect(document.body.style.overflow).toBe('hidden');
    $('#navbar-close').click();
    expect(document.body.style.overflow).toBe('auto');
    expect($('footer').hasAttribute('inert')).toBe(true);
  });

  it('toggles accordions and collapses them all when the drawer closes', () => {
    hamburger().click();
    const button = $('#mega-menu-data-mobile-button');
    const panel = $('#mega-menu-data-mobile');
    expect(panel.hidden).toBe(true);
    button.click();
    expect(panel.hidden).toBe(false);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    button.click();
    expect(panel.hidden).toBe(true);

    button.click();
    $('#navbar-close').click();
    expect(panel.hidden).toBe(true);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes when the nav links come back into the row, and releases the page', async () => {
    hamburger().click();
    expect(drawerOpen()).toBe(true);
    setLinksDropped(false);
    await tick();
    expect(drawerOpen()).toBe(false);
    expect(document.body.style.overflow).toBe('');
    expect($('main').hasAttribute('inert')).toBe(false);
  });

  it('cleanup while open closes the drawer, releases the page and unbinds the controls', () => {
    hamburger().click();
    expect(drawerOpen()).toBe(true);
    cleanup();
    cleanup = undefined;
    expect(drawerOpen()).toBe(false);
    expect(document.body.style.overflow).toBe('');
    expect($('main').hasAttribute('inert')).toBe(false);
    expect($('.site-header').hasAttribute('data-header-ready')).toBe(false);

    hamburger().click();
    expect(drawerOpen()).toBe(false);
    key('Escape');
  });

  it('can be initialised again after cleanup', () => {
    cleanup();
    cleanup = initHeader({ userProfile: false });
    hamburger().click();
    expect(drawerOpen()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Mega menus
// ---------------------------------------------------------------------------
describe('initHeader: mega menus', () => {
  const button = () => $('#mega-menu-products-button');
  const panel = () => $('#mega-menu-products');
  const item = () => button().parentElement;

  beforeEach(() => {
    mount();
    cleanup = initHeader({ userProfile: false });
  });

  it('opens and closes from the keyboard, keeping aria-expanded truthful', () => {
    keyboardClick(button());
    expect(panel().hidden).toBe(false);
    expect(button().getAttribute('aria-expanded')).toBe('true');
    keyboardClick(button());
    expect(panel().hidden).toBe(true);
    expect(button().getAttribute('aria-expanded')).toBe('false');
  });

  it('ignores a pointer click on a hover-capable device, so a click cannot close the menu it is reading', () => {
    pointerClick(button());
    expect(panel().hidden).toBe(true);
    keyboardClick(button());
    pointerClick(button());
    expect(panel().hidden).toBe(false);
  });

  it('toggles on a touch tap: on a hybrid by pointerType, on a touch device by the media query', () => {
    pointerClick(button(), 'touch');
    expect(panel().hidden).toBe(false);
    pointerClick(button(), 'touch');
    expect(panel().hidden).toBe(true);

    hoverDevice = false;
    pointerClick(button());
    expect(panel().hidden).toBe(false);
  });

  it('opens on hover after the delay and closes after the pointer leaves, on a hover device only', () => {
    vi.useFakeTimers();
    item().dispatchEvent(new Event('mouseenter'));
    expect(panel().hidden).toBe(true);
    vi.advanceTimersByTime(100);
    expect(panel().hidden).toBe(false);

    item().dispatchEvent(new Event('mouseleave'));
    vi.advanceTimersByTime(99);
    expect(panel().hidden).toBe(false);
    vi.advanceTimersByTime(1);
    expect(panel().hidden).toBe(true);

    hoverDevice = false;
    item().dispatchEvent(new Event('mouseenter'));
    vi.advanceTimersByTime(200);
    expect(panel().hidden).toBe(true);
  });

  it('re-entering before the delay cancels the close', () => {
    vi.useFakeTimers();
    item().dispatchEvent(new Event('mouseenter'));
    vi.advanceTimersByTime(100);
    item().dispatchEvent(new Event('mouseleave'));
    vi.advanceTimersByTime(50);
    item().dispatchEvent(new Event('mouseenter'));
    vi.advanceTimersByTime(200);
    expect(panel().hidden).toBe(false);
  });

  it('opening one menu closes another', () => {
    keyboardClick(button());
    keyboardClick($('#mega-menu-data-button'));
    expect(panel().hidden).toBe(true);
    expect($('#mega-menu-data').hidden).toBe(false);
  });

  it('Escape closes it, and returns focus to the trigger only when focus was inside', () => {
    keyboardClick(button());
    $('#page-link').focus();
    key('Escape');
    expect(panel().hidden).toBe(true);
    expect(document.activeElement).toBe($('#page-link'));

    keyboardClick(button());
    panel().querySelector('a').focus();
    key('Escape');
    expect(panel().hidden).toBe(true);
    expect(document.activeElement).toBe(button());
  });

  it('a click outside and focus leaving the item both close it', () => {
    keyboardClick(button());
    $('main').click();
    expect(panel().hidden).toBe(true);

    keyboardClick(button());
    const last = [...panel().querySelectorAll('a')].pop();
    last.focus();
    last.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: $('#page-link') }),
    );
    expect(panel().hidden).toBe(true);
    expect(document.activeElement).toBe(button());
  });

  it('focus moving within the item does not close it', () => {
    keyboardClick(button());
    const [first, second] = panel().querySelectorAll('a');
    first.focus();
    first.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: second }));
    expect(panel().hidden).toBe(false);
  });

  it('does not open while the links are dropped, and closes when they drop', async () => {
    keyboardClick(button());
    expect(panel().hidden).toBe(false);
    setLinksDropped(true);
    await tick();
    expect(panel().hidden).toBe(true);
    keyboardClick(button());
    expect(panel().hidden).toBe(true);
  });

  it('cleanup closes an open menu and cancels a pending hover', () => {
    vi.useFakeTimers();
    keyboardClick(button());
    item().dispatchEvent(new Event('mouseenter'));
    cleanup();
    cleanup = undefined;
    expect(panel().hidden).toBe(true);
    vi.advanceTimersByTime(500);
    expect(panel().hidden).toBe(true);
    keyboardClick(button());
    expect(panel().hidden).toBe(true);
  });
});
