/**
 * @module header-client
 * Behaviour for the site header rendered by `header.js`.
 *
 * One call wires everything the markup needs on the client: the overflow
 * measurement that decides between the nav links and the hamburger, the
 * drawer, its accordions, the desktop mega menus, both theme toggles and the
 * account control. It returns one cleanup that undoes all of it.
 *
 * The mega menus are driven here, not by Flowbite. The website's header used
 * Flowbite's Dropdown and carried four workarounds for what it got wrong
 * (Popper padding, `hide()` never returning focus, `aria-expanded` never
 * updated, a click that toggled a hover menu). Owning the ~80 lines is
 * cheaper than patching a library that a sibling property does not load, and
 * it keeps the markup free of Flowbite's data API — so a page that does load
 * Flowbite globally cannot bind a second controller to these panels.
 *
 * Extracted from MarketDataApp/website `src/components/Header.astro`.
 */

import { initNavbarOverflow } from './navbar-overflow.js';
import { initThemeToggle } from './theme-toggle.js';
import { initUserProfile } from './user-profile.js';

/**
 * @typedef {Object} InitHeaderOptions
 * @property {HTMLElement} [root] - The `<header class="site-header">`. Default: the first one in the document.
 * @property {false | Object} [userProfile] - Options forwarded to `initUserProfile` for `#user-profile` (defaults: `dropdown: true`, `signupUrl: '/signup/'`, `signupText: 'Try For Free'`). Pass `false` when the application owns the account control; the header then never touches that element.
 * @property {boolean} [themeToggle] - Initialise every `.theme-toggle-container` in the header. Default `true`.
 * @property {string} [inert] - Selector for the page regions made inert while the drawer is open. Default `'main, footer'`. Elements inside the header, and elements already inert, are left alone.
 * @property {number} [hoverDelay] - Milliseconds before a hovered mega menu opens, and before it closes after the pointer leaves. Default 100.
 */

/** Hover-capable device with a precise pointer: the one where hover, not click, owns the mega menus. */
const HOVER_POINTER = '(hover: hover) and (pointer: fine)';

function hoverPointerDevice() {
  return typeof window.matchMedia === 'function' && window.matchMedia(HOVER_POINTER).matches;
}

/** One live header per root; a second `initHeader` on the same root returns the first cleanup. */
const instances = new WeakMap();

/**
 * Wire up a rendered site header.
 *
 * Idempotent per root: calling it twice does not bind twice. Sets
 * `data-header-ready` on the root once every binding is in place.
 *
 * @param {InitHeaderOptions} [options]
 * @returns {() => void} Cleanup. Closes the drawer and every menu, restores
 *   the page's `inert` and scroll state, removes every listener and observer
 *   this call added, and tears down the controls it initialised. It never
 *   removes markup a consumer placed in a slot.
 */
export function initHeader(options = {}) {
  const root = options.root ?? document.querySelector('.site-header');
  if (!root) return () => {};
  if (instances.has(root)) return instances.get(root);

  const {
    userProfile = {},
    themeToggle = true,
    inert: inertSelector = 'main, footer',
    hoverDelay = 100,
  } = options;

  const q = (selector) => root.querySelector(selector);
  const qa = (selector) => Array.from(root.querySelectorAll(selector));

  // Every listener and timer goes through these so cleanup cannot miss one.
  const listeners = [];
  const on = (target, event, handler, opts) => {
    target.addEventListener(event, handler, opts);
    listeners.push(() => target.removeEventListener(event, handler, opts));
  };
  const timers = new Set();
  const after = (ms, fn) => {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
    return id;
  };
  const cancel = (id) => {
    clearTimeout(id);
    timers.delete(id);
  };
  const cleanups = [];

  const row = q('#navbar-row');
  const navLinks = q('#navbar-links');
  const hamburger = q('#navbar-toggle');
  const drawer = q('#navbar-main');
  const backdrop = q('#navbar-backdrop');
  const closeBtn = q('#navbar-close');

  const linksVisible = () => !!navLinks && !navLinks.hasAttribute('data-navbar-hidden');

  // ── Overflow ──────────────────────────────────────────────────────────────
  // No breakpoint decides what the bar shows; the utility measures the row and
  // drops the lowest priority first. Drop order and what covers each loss:
  //   1. nav links     → the drawer lists all of them
  //   2. account ctrl  → the drawer carries Log In and the trial link
  //   3. theme toggle  → the drawer's bar carries its own
  // The logo and the hamburger are never dropped: one is the home link, the
  // other is what the losses fall back to. The utility watches the subtree,
  // so it re-measures when the async user fetch swaps the pill for the avatar.
  if (row) {
    // Until now CSS held the seeded layout; from here the measurement rules.
    row.removeAttribute('data-navbar-unmeasured');
    cleanups.push(
      initNavbarOverflow({
        container: row,
        items: [
          { selector: '#navbar-links', priority: 1 },
          { selector: '#user-profile', priority: 2 },
          { selector: '#theme-toggle', priority: 3 },
        ],
      }),
    );
  }

  // ── Theme toggles ─────────────────────────────────────────────────────────
  // Two containers, one in the bar and one in the drawer's bar; CSS shows one
  // at a time. A container that already holds a toggle was initialised by the
  // consumer and is left alone.
  if (themeToggle) {
    for (const container of qa('.theme-toggle-container')) {
      if (container.querySelector('.theme-toggle-wrapper')) continue;
      cleanups.push(initThemeToggle({ container }).cleanup);
    }
  }

  // ── Account control ───────────────────────────────────────────────────────
  // `userProfile: false` means the application owns #user-profile (its own
  // login return handling, its own refresh triggers) and nothing here may
  // render into it or clear it.
  if (userProfile !== false) {
    const container = q('#user-profile');
    if (container) {
      let profileCleanup = null;
      let disposed = false;
      initUserProfile({
        container,
        dropdown: true,
        signupUrl: '/signup/',
        signupText: 'Try For Free',
        ...userProfile,
      }).then((cleanup) => {
        if (disposed) cleanup();
        else profileCleanup = cleanup;
      });
      cleanups.push(() => {
        disposed = true;
        if (profileCleanup) profileCleanup();
      });
    }
  }

  // ── Drawer ────────────────────────────────────────────────────────────────
  const accordionButtons = qa('[data-site-header-accordion]');
  const accordionPanel = (button) =>
    q(`[id="${button.getAttribute('data-site-header-accordion')}"]`);

  const setAccordion = (button, open) => {
    const panel = accordionPanel(button);
    if (!panel) return;
    panel.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
  };

  // What the drawer changed outside itself, so close() restores exactly that
  // and nothing else: regions we made inert (never ones that already were),
  // and the body's own overflow value (never assumed to be empty).
  let inertedByUs = [];
  let priorBodyOverflow = null;

  const isOpen = () => !!drawer && !drawer.hasAttribute('inert');

  const setOpen = (open) => {
    if (!drawer || open === isOpen()) return;

    drawer.toggleAttribute('data-open', open);
    // inert governs both the tab order and the accessibility tree: the closed
    // drawer can be neither tabbed into nor announced while it stays in the
    // DOM to animate.
    if (open) drawer.removeAttribute('inert');
    else drawer.setAttribute('inert', '');
    backdrop?.toggleAttribute('data-open', open);

    if (open) {
      priorBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      // The page behind must not be reachable either. Marking its landmarks
      // inert is what stops Tab walking out of the open drawer into content
      // sitting behind the backdrop. The header is excluded: the drawer lives
      // inside it.
      inertedByUs = Array.from(document.querySelectorAll(inertSelector)).filter(
        (el) => !root.contains(el) && !el.hasAttribute('inert'),
      );
      for (const el of inertedByUs) el.setAttribute('inert', '');
    } else {
      document.body.style.overflow = priorBodyOverflow ?? '';
      priorBodyOverflow = null;
      for (const el of inertedByUs) el.removeAttribute('inert');
      inertedByUs = [];
    }

    hamburger?.setAttribute('aria-expanded', String(open));
    hamburger?.setAttribute('aria-label', open ? 'Close main menu' : 'Open main menu');

    if (open) {
      closeBtn?.focus();
    } else {
      // Collapse every accordion so the menu reopens at the top level.
      for (const button of accordionButtons) setAccordion(button, false);
    }
  };

  const closeDrawer = ({ returnFocus = true } = {}) => {
    if (!isOpen()) return;
    setOpen(false);
    if (returnFocus) hamburger?.focus();
  };

  if (hamburger) on(hamburger, 'click', () => (isOpen() ? closeDrawer() : setOpen(true)));
  if (closeBtn) on(closeBtn, 'click', () => closeDrawer());
  if (backdrop) on(backdrop, 'click', () => closeDrawer());

  if (drawer) {
    // Following a link inside the drawer navigates; on a same-page anchor
    // nothing else would dismiss it.
    on(drawer, 'click', (e) => {
      if (e.target.closest('a')) closeDrawer({ returnFocus: false });
    });
  }

  for (const button of accordionButtons) {
    on(button, 'click', () => {
      const panel = accordionPanel(button);
      if (panel) setAccordion(button, panel.hidden);
    });
  }

  // ── Desktop mega menus ────────────────────────────────────────────────────
  //
  // The owner's rule, and what the WordPress nav this replaced did: on a
  // device with a mouse the top-level items that own a panel are not links.
  // Hover opens the panel, hovering away closes it, and a pointer click does
  // nothing at all. Three things that rule must not break:
  //
  //   TOUCH. A touch device has no hover, so a tap is the only way in. Two
  //   conditions cover it: the media query excludes a pure touch device, and
  //   the click's own pointerType excludes a finger on a hybrid laptop that
  //   matches the query.
  //   KEYBOARD. Enter and Space on a <button> arrive as a click with
  //   `detail === 0`, and that click is the whole of how a keyboard user opens
  //   the menu. Everything with detail 0 passes, which also covers assistive
  //   technology and a programmatic .click() — the safe direction.
  //   FOCUS. A panel that hides while focus is inside it strands a keyboard
  //   user at the top of the document. Focus goes back to the trigger first.
  const menus = qa('[data-site-header-menu]')
    .map((button) => {
      const panel = q(`[id="${button.getAttribute('data-site-header-menu')}"]`);
      return panel ? { button, panel, item: button.parentElement, timer: null } : null;
    })
    .filter(Boolean);

  const gutterOf = (el) => {
    const declared = el ? parseFloat(getComputedStyle(el).paddingInlineStart) : NaN;
    return Number.isFinite(declared) && declared > 0 ? declared : 16;
  };

  // Centre the panel under its trigger, then keep it off both viewport
  // edges by the gutter the row already declares (its padding-inline-start:
  // the logo starts there, and the trailing side mirrors it). Read at open
  // time, so a change to the row's padding follows without a number here.
  // Narrow panels sit centred and untouched; the wide Products panel is the
  // one this clamps today, and any panel that grows gets the same gutter.
  const position = ({ item, button, panel }) => {
    panel.style.left = '';
    const gutter = gutterOf(row);
    const itemRect = item.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    const width = panel.offsetWidth;
    const viewport = document.documentElement.clientWidth;
    let left = buttonRect.left + buttonRect.width / 2 - width / 2;
    left = Math.min(left, viewport - gutter - width);
    left = Math.max(left, gutter);
    panel.style.left = `${left - itemRect.left}px`;
  };

  const menuOpen = (menu) => !menu.panel.hidden;

  const closeMenu = (menu) => {
    if (menu.timer) {
      cancel(menu.timer);
      menu.timer = null;
    }
    if (!menuOpen(menu)) return;
    // Before the panel hides, never after: display:none on a focused element
    // moves focus to <body> and loses a keyboard user's place in the nav.
    if (menu.panel.contains(document.activeElement)) menu.button.focus();
    menu.panel.hidden = true;
    menu.button.setAttribute('aria-expanded', 'false');
  };

  const closeMenus = (except) => {
    for (const menu of menus) if (menu !== except) closeMenu(menu);
  };

  const openMenu = (menu) => {
    if (menu.timer) {
      cancel(menu.timer);
      menu.timer = null;
    }
    if (menuOpen(menu) || !linksVisible()) return;
    closeMenus(menu);
    menu.panel.hidden = false;
    menu.button.setAttribute('aria-expanded', 'true');
    position(menu);
  };

  const schedule = (menu, open) => {
    if (menu.timer) cancel(menu.timer);
    menu.timer = after(hoverDelay, () => {
      menu.timer = null;
      open ? openMenu(menu) : closeMenu(menu);
    });
  };

  for (const menu of menus) {
    // Hover. mouseenter/mouseleave on the <li> cover the trigger and the
    // absolutely positioned panel together, so crossing from one to the other
    // never counts as leaving; the CSS bridge over the offset covers the gap.
    on(menu.item, 'mouseenter', () => {
      if (hoverPointerDevice()) schedule(menu, true);
    });
    on(menu.item, 'mouseleave', () => {
      if (hoverPointerDevice()) schedule(menu, false);
    });

    on(menu.button, 'click', (e) => {
      const pointerClick = e.detail !== 0 && e.pointerType !== 'touch' && hoverPointerDevice();
      if (pointerClick) return; // hover owns the menu on this device
      menuOpen(menu) ? closeMenu(menu) : openMenu(menu);
    });

    // Focus leaving the item entirely — Tab past the last row, or a click
    // elsewhere — dismisses it, so a keyboard user never leaves a panel open
    // over the content they moved on to.
    on(menu.item, 'focusout', (e) => {
      if (e.relatedTarget && menu.item.contains(e.relatedTarget)) return;
      closeMenu(menu);
    });
  }

  // ── Document-level ────────────────────────────────────────────────────────
  on(document, 'click', (e) => {
    for (const menu of menus) {
      if (menuOpen(menu) && !menu.item.contains(e.target)) closeMenu(menu);
    }
  });

  // Escape: WCAG 1.4.13 asks that content shown on hover or focus can be
  // dismissed without moving the pointer or the focus. closeMenu moves focus
  // only when it was already inside the panel.
  on(document, 'keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (isOpen()) closeDrawer();
    closeMenus();
  });

  // ── Links come or go ──────────────────────────────────────────────────────
  // "Desktop" is not a width: it means the overflow pass kept the nav links.
  // When they go, the open mega menus go with them; when they come back, the
  // drawer closes — the CSS would hide it, but leave the body locked and the
  // page inert. The utility debounces its reflow, so watch its marker rather
  // than the resize event.
  let observer = null;
  if (navLinks) {
    observer = new MutationObserver(() => {
      if (linksVisible()) closeDrawer({ returnFocus: false });
      else closeMenus();
    });
    observer.observe(navLinks, { attributes: true, attributeFilter: ['data-navbar-hidden'] });
  }

  root.setAttribute('data-header-ready', '');

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    closeDrawer({ returnFocus: false });
    closeMenus();
    observer?.disconnect();
    for (const id of timers) clearTimeout(id);
    timers.clear();
    for (const off of listeners) off();
    for (const fn of cleanups) fn();
    root.removeAttribute('data-header-ready');
    instances.delete(root);
  };

  instances.set(root, cleanup);
  return cleanup;
}
