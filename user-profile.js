/**
 * @module user-profile
 * Framework-agnostic user profile avatar and dropdown for *.marketdata.app navbars.
 *
 * Zero production dependencies. Renders a log-in button (logged out) or
 * Gravatar avatar with optional dropdown menu (logged in).
 */

// ---------------------------------------------------------------------------
// Internal MD5 — Joseph Myers' implementation for Gravatar hashing.
// Not exported; Web Crypto doesn't support MD5 and we have zero deps.
// ---------------------------------------------------------------------------

function add32(a, b) {
  return (a + b) & 0xffffffff;
}

function cmn(q, a, b, x, s, t) {
  a = add32(add32(a, q), add32(x, t));
  return add32((a << s) | (a >>> (32 - s)), b);
}
function ff(a, b, c, d, x, s, t) {
  return cmn((b & c) | (~b & d), a, b, x, s, t);
}
function gg(a, b, c, d, x, s, t) {
  return cmn((b & d) | (c & ~d), a, b, x, s, t);
}
function hh(a, b, c, d, x, s, t) {
  return cmn(b ^ c ^ d, a, b, x, s, t);
}
function ii(a, b, c, d, x, s, t) {
  return cmn(c ^ (b | ~d), a, b, x, s, t);
}

function md5cycle(x, k) {
  var a = x[0],
    b = x[1],
    c = x[2],
    d = x[3];
  a = ff(a, b, c, d, k[0], 7, -680876936);
  d = ff(d, a, b, c, k[1], 12, -389564586);
  c = ff(c, d, a, b, k[2], 17, 606105819);
  b = ff(b, c, d, a, k[3], 22, -1044525330);
  a = ff(a, b, c, d, k[4], 7, -176418897);
  d = ff(d, a, b, c, k[5], 12, 1200080426);
  c = ff(c, d, a, b, k[6], 17, -1473231341);
  b = ff(b, c, d, a, k[7], 22, -45705983);
  a = ff(a, b, c, d, k[8], 7, 1770035416);
  d = ff(d, a, b, c, k[9], 12, -1958414417);
  c = ff(c, d, a, b, k[10], 17, -42063);
  b = ff(b, c, d, a, k[11], 22, -1990404162);
  a = ff(a, b, c, d, k[12], 7, 1804603682);
  d = ff(d, a, b, c, k[13], 12, -40341101);
  c = ff(c, d, a, b, k[14], 17, -1502002290);
  b = ff(b, c, d, a, k[15], 22, 1236535329);
  a = gg(a, b, c, d, k[1], 5, -165796510);
  d = gg(d, a, b, c, k[6], 9, -1069501632);
  c = gg(c, d, a, b, k[11], 14, 643717713);
  b = gg(b, c, d, a, k[0], 20, -373897302);
  a = gg(a, b, c, d, k[5], 5, -701558691);
  d = gg(d, a, b, c, k[10], 9, 38016083);
  c = gg(c, d, a, b, k[15], 14, -660478335);
  b = gg(b, c, d, a, k[4], 20, -405537848);
  a = gg(a, b, c, d, k[9], 5, 568446438);
  d = gg(d, a, b, c, k[14], 9, -1019803690);
  c = gg(c, d, a, b, k[3], 14, -187363961);
  b = gg(b, c, d, a, k[8], 20, 1163531501);
  a = gg(a, b, c, d, k[13], 5, -1444681467);
  d = gg(d, a, b, c, k[2], 9, -51403784);
  c = gg(c, d, a, b, k[7], 14, 1735328473);
  b = gg(b, c, d, a, k[12], 20, -1926607734);
  a = hh(a, b, c, d, k[5], 4, -378558);
  d = hh(d, a, b, c, k[8], 11, -2022574463);
  c = hh(c, d, a, b, k[11], 16, 1839030562);
  b = hh(b, c, d, a, k[14], 23, -35309556);
  a = hh(a, b, c, d, k[1], 4, -1530992060);
  d = hh(d, a, b, c, k[4], 11, 1272893353);
  c = hh(c, d, a, b, k[7], 16, -155497632);
  b = hh(b, c, d, a, k[10], 23, -1094730640);
  a = hh(a, b, c, d, k[13], 4, 681279174);
  d = hh(d, a, b, c, k[0], 11, -358537222);
  c = hh(c, d, a, b, k[3], 16, -722521979);
  b = hh(b, c, d, a, k[6], 23, 76029189);
  a = hh(a, b, c, d, k[9], 4, -640364487);
  d = hh(d, a, b, c, k[12], 11, -421815835);
  c = hh(c, d, a, b, k[15], 16, 530742520);
  b = hh(b, c, d, a, k[2], 23, -995338651);
  a = ii(a, b, c, d, k[0], 6, -198630844);
  d = ii(d, a, b, c, k[7], 10, 1126891415);
  c = ii(c, d, a, b, k[14], 15, -1416354905);
  b = ii(b, c, d, a, k[5], 21, -57434055);
  a = ii(a, b, c, d, k[12], 6, 1700485571);
  d = ii(d, a, b, c, k[3], 10, -1894986606);
  c = ii(c, d, a, b, k[10], 15, -1051523);
  b = ii(b, c, d, a, k[1], 21, -2054922799);
  a = ii(a, b, c, d, k[8], 6, 1873313359);
  d = ii(d, a, b, c, k[15], 10, -30611744);
  c = ii(c, d, a, b, k[6], 15, -1560198380);
  b = ii(b, c, d, a, k[13], 21, 1309151649);
  a = ii(a, b, c, d, k[4], 6, -145523070);
  d = ii(d, a, b, c, k[11], 10, -1120210379);
  c = ii(c, d, a, b, k[2], 15, 718787259);
  b = ii(b, c, d, a, k[9], 21, -343485551);
  x[0] = add32(a, x[0]);
  x[1] = add32(b, x[1]);
  x[2] = add32(c, x[2]);
  x[3] = add32(d, x[3]);
}

function md5blk(s) {
  var md5blks = [],
    i;
  for (i = 0; i < 64; i += 4) {
    md5blks[i >> 2] =
      s.charCodeAt(i) +
      (s.charCodeAt(i + 1) << 8) +
      (s.charCodeAt(i + 2) << 16) +
      (s.charCodeAt(i + 3) << 24);
  }
  return md5blks;
}

function rhex(n) {
  var hex_chr = '0123456789abcdef';
  var s = '',
    j = 0;
  for (; j < 4; j++) s += hex_chr[(n >> (j * 8 + 4)) & 0x0f] + hex_chr[(n >> (j * 8)) & 0x0f];
  return s;
}

function md5(s) {
  var n = s.length,
    state = [1732584193, -271733879, -1732584194, 271733878],
    i;
  for (i = 64; i <= n; i += 64) {
    md5cycle(state, md5blk(s.substring(i - 64, i)));
  }
  s = s.substring(i - 64);
  var tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (i = 0; i < s.length; i++) tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
  tail[i >> 2] |= 0x80 << ((i % 4) << 3);
  if (i > 55) {
    md5cycle(state, tail);
    for (i = 0; i < 16; i++) tail[i] = 0;
  }
  tail[14] = n * 8;
  md5cycle(state, tail);
  return state.map(rhex).join('');
}

// ---------------------------------------------------------------------------
// Gravatar URL
// ---------------------------------------------------------------------------

/**
 * Computes a Gravatar URL for the given email address.
 *
 * @param {string} email
 * @param {Object} [options]
 * @param {number} [options.size=80] - Image size in pixels (2x for 40px Retina display)
 * @param {string} [options.fallback='404'] - Gravatar default image param (404 triggers onerror)
 * @returns {string} Gravatar URL
 */
export function getGravatarUrl(email, options = {}) {
  const { size = 80, fallback = '404' } = options;
  const hash = md5(email.trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${fallback}`;
}

// ---------------------------------------------------------------------------
// Fetch User with stale-while-revalidate caching
// ---------------------------------------------------------------------------

const DEFAULT_API_URL = 'https://dashboard.marketdata.app/api/user/';
const CACHE_KEY = 'marketdata_user';

/** Module-level cache for the current session. */
let _memoryCache = null;

/**
 * Fetches the current user from the MarketData API.
 * Uses stale-while-revalidate: returns cached data immediately and
 * refreshes in the background.
 *
 * @param {Object} [options]
 * @param {string} [options.apiUrl] - Override the API endpoint
 * @returns {Promise<Object|null>} User object or null on any error
 */
export async function fetchUser(options = {}) {
  const apiUrl = options.apiUrl || DEFAULT_API_URL;

  // Try memory cache first, then sessionStorage
  let cached = _memoryCache;
  if (!cached) {
    try {
      const stored = sessionStorage.getItem(CACHE_KEY);
      if (stored) {
        cached = JSON.parse(stored);
        _memoryCache = cached;
      }
    } catch {
      // sessionStorage unavailable or corrupt — continue without cache
    }
  }

  // If we have cached data, return it immediately and revalidate in background
  if (cached) {
    fetchAndCache(apiUrl)
      .then((fresh) => {
        if (!fresh && options.onInvalidate) options.onInvalidate();
      })
      .catch(() => {});
    return cached;
  }

  // No cache — must wait for network
  return fetchAndCache(apiUrl);
}

async function fetchAndCache(apiUrl) {
  try {
    const res = await fetch(apiUrl, { credentials: 'include' });
    if (!res.ok) {
      _memoryCache = null;
      try {
        sessionStorage.removeItem(CACHE_KEY);
      } catch {}
      return null;
    }
    const user = await res.json();
    _memoryCache = user;
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(user));
    } catch {
      // Storage full or unavailable
    }
    return user;
  } catch {
    return null;
  }
}

/** Clear all caches. Useful for testing. */
export function _clearCache() {
  _memoryCache = null;
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// SVG Placeholder (Flowbite avatar/placeholder-icon pattern)
// ---------------------------------------------------------------------------

function createPlaceholderSvg() {
  const wrapper = document.createElement('div');
  wrapper.className = 'user-profile-placeholder';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'user-profile-placeholder-svg');
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('viewBox', '0 0 20 20');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('fill-rule', 'evenodd');
  path.setAttribute('d', 'M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z');
  path.setAttribute('clip-rule', 'evenodd');

  svg.appendChild(path);
  wrapper.appendChild(svg);
  return wrapper;
}

// ---------------------------------------------------------------------------
// Dropdown toggle
// ---------------------------------------------------------------------------

function setupDropdown(trigger, menu) {
  const listeners = [];

  function on(target, event, handler) {
    target.addEventListener(event, handler);
    listeners.push({ target, event, handler });
  }

  function open() {
    menu.classList.remove('hidden');
    trigger.setAttribute('aria-expanded', 'true');
  }

  function close() {
    menu.classList.add('hidden');
    trigger.setAttribute('aria-expanded', 'false');
  }

  function toggle() {
    menu.classList.contains('hidden') ? open() : close();
  }

  on(trigger, 'click', (e) => {
    e.stopPropagation();
    toggle();
  });

  on(document, 'click', (e) => {
    if (!menu.contains(e.target)) close();
  });

  on(document, 'keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  return function cleanup() {
    for (const { target, event, handler } of listeners) {
      target.removeEventListener(event, handler);
    }
  };
}

// ---------------------------------------------------------------------------
// initUserProfile
// ---------------------------------------------------------------------------

/**
 * Renders a user profile avatar (or log-in button) into the given container.
 *
 * @param {Object} options
 * @param {HTMLElement} options.container - DOM element to render into
 * @param {boolean} [options.dropdown=false] - Enable dropdown menu
 * @param {string} [options.loginUrl='https://dashboard.marketdata.app/marketdata/login'] - Log-in href
 * @param {string} [options.logoutUrl='https://dashboard.marketdata.app/marketdata/logout'] - Log-out href
 * @param {string} [options.dashboardUrl='https://dashboard.marketdata.app/marketdata/member'] - Dashboard link
 * @param {string} [options.profileUrl='https://dashboard.marketdata.app/marketdata/profile'] - Profile link
 * @param {string} [options.planUrl='https://dashboard.marketdata.app/marketdata/signup'] - Plan link
 * @param {Array<{label: string, url: string}>} [options.menuItems=[]] - Extra menu items
 * @param {string} [options.apiUrl] - Override API endpoint
 * @param {string} [options.loginText='Sign in'] - Log-in button text
 * @param {string} [options.buttonClass='btn-hover-orange'] - CSS class on log-in button
 * @returns {Promise<() => void>} Cleanup function
 */
export async function initUserProfile(options) {
  const {
    container,
    dropdown = false,
    loginUrl = 'https://dashboard.marketdata.app/marketdata/login',
    logoutUrl = 'https://dashboard.marketdata.app/marketdata/logout',
    dashboardUrl = 'https://dashboard.marketdata.app/marketdata/member',
    profileUrl = 'https://dashboard.marketdata.app/marketdata/profile',
    planUrl = 'https://dashboard.marketdata.app/marketdata/signup',
    menuItems = [],
    apiUrl,
    loginText = 'Log in',
    buttonClass = 'btn-hover-orange',
  } = options;

  let dropdownCleanup = null;

  function clearContainer() {
    if (dropdownCleanup) {
      dropdownCleanup();
      dropdownCleanup = null;
    }
    while (container.firstChild) container.removeChild(container.firstChild);
  }

  function renderSignIn() {
    clearContainer();
    const link = document.createElement('a');
    link.href = loginUrl;
    link.className = buttonClass;
    link.textContent = loginText;
    container.appendChild(link);
  }

  const user = await fetchUser({
    ...(apiUrl ? { apiUrl } : {}),
    onInvalidate: renderSignIn,
  });

  // Logged out or error → log-in button
  if (!user) {
    renderSignIn();
    return clearContainer;
  }

  const gravatarSrc = getGravatarUrl(user.email);

  function handleImgError(img) {
    const placeholder = createPlaceholderSvg();
    // Copy over attributes for dropdown compatibility
    if (img.id) placeholder.id = img.id;
    if (img.getAttribute('data-dropdown-toggle')) {
      placeholder.setAttribute('data-dropdown-toggle', img.getAttribute('data-dropdown-toggle'));
    }
    if (img.getAttribute('data-dropdown-placement')) {
      placeholder.setAttribute(
        'data-dropdown-placement',
        img.getAttribute('data-dropdown-placement'),
      );
    }
    placeholder.setAttribute('role', 'img');
    placeholder.setAttribute('aria-label', img.alt || 'User avatar');
    img.replaceWith(placeholder);
    return placeholder;
  }

  // Logged in, no dropdown — avatar link to dashboard
  if (!dropdown) {
    const link = document.createElement('a');
    link.href = dashboardUrl;

    const img = document.createElement('img');
    img.src = gravatarSrc;
    img.alt = user.login || '';
    img.className = 'user-profile-avatar';
    img.addEventListener('error', () => handleImgError(img));

    link.appendChild(img);
    container.appendChild(link);

    return () => {
      while (container.firstChild) container.removeChild(container.firstChild);
    };
  }

  // Logged in, with dropdown — wrapper for absolute positioning
  const wrapper = document.createElement('div');
  wrapper.className = 'user-profile-wrapper';

  const img = document.createElement('img');
  img.id = 'avatarButton';
  img.setAttribute('data-dropdown-toggle', 'userDropdown');
  img.setAttribute('data-dropdown-placement', 'bottom-start');
  img.className = 'user-profile-avatar';
  img.src = gravatarSrc;
  img.alt = 'User dropdown';

  const menuEl = document.createElement('div');
  menuEl.id = 'userDropdown';
  menuEl.className = 'user-profile-dropdown hidden';

  // Header section
  const header = document.createElement('div');
  header.className = 'user-profile-dropdown-header';
  const nameDiv = document.createElement('div');
  nameDiv.className = 'user-profile-dropdown-name';
  nameDiv.textContent = user.name || user.login || '';
  const emailDiv = document.createElement('div');
  emailDiv.className = 'user-profile-dropdown-email';
  emailDiv.textContent = user.email || '';
  header.appendChild(nameDiv);
  header.appendChild(emailDiv);

  // Menu list
  const ul = document.createElement('ul');
  ul.className = 'user-profile-dropdown-menu';
  ul.setAttribute('aria-labelledby', 'avatarButton');

  const defaultItems = [
    { label: 'Dashboard', url: dashboardUrl },
    { label: 'Profile', url: profileUrl },
    { label: 'Modify My Plan', url: planUrl },
  ];

  for (const item of [...defaultItems, ...menuItems]) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = item.url;
    a.className = 'user-profile-dropdown-link';
    a.textContent = item.label;
    li.appendChild(a);
    ul.appendChild(li);
  }

  // Sign out item
  const signOutLi = document.createElement('li');
  const signOutA = document.createElement('a');
  signOutA.href = logoutUrl;
  signOutA.className = 'user-profile-dropdown-signout';
  signOutA.textContent = 'Log out';
  signOutLi.appendChild(signOutA);
  ul.appendChild(signOutLi);

  menuEl.appendChild(header);
  menuEl.appendChild(ul);

  wrapper.appendChild(img);
  wrapper.appendChild(menuEl);
  container.appendChild(wrapper);

  // Set up dropdown toggle (our own JS since we can't rely on Flowbite JS)
  let triggerEl = img;
  dropdownCleanup = setupDropdown(triggerEl, menuEl);

  // Handle Gravatar error — swap img for placeholder, re-attach dropdown
  img.addEventListener('error', () => {
    const placeholder = handleImgError(img);
    triggerEl = placeholder;
    // Re-attach dropdown to the new element
    if (dropdownCleanup) dropdownCleanup();
    dropdownCleanup = setupDropdown(triggerEl, menuEl);
  });

  return clearContainer;
}
