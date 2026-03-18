import { getGravatarUrl, initUserProfile } from '../../dist/user-profile.js';
import { fetchUser, _clearCache } from '../../dist/user.js';

// ---------------------------------------------------------------------------
// sessionStorage mock (Node.js 22+ has a built-in one that may interfere)
// ---------------------------------------------------------------------------
function createSessionStorageMock() {
  let store = {};
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    },
    clear() {
      store = {};
    },
  };
}

const _ssMock = createSessionStorageMock();
Object.defineProperty(globalThis, 'sessionStorage', {
  value: _ssMock,
  writable: true,
  configurable: true,
});

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
beforeEach(() => {
  _clearCache();
  sessionStorage.clear();
  while (document.body.firstChild) document.body.removeChild(document.body.firstChild);
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// getGravatarUrl / MD5 correctness
// ---------------------------------------------------------------------------
describe('getGravatarUrl', () => {
  it('produces correct MD5 for a known email', () => {
    // md5("test@example.com") = 55502f40dc8b7c769880b10874abc9d0
    const url = getGravatarUrl('test@example.com');
    expect(url).toBe('https://www.gravatar.com/avatar/55502f40dc8b7c769880b10874abc9d0?s=80&d=404');
  });

  it('normalizes email case and whitespace', () => {
    const url1 = getGravatarUrl('  Test@Example.COM  ');
    const url2 = getGravatarUrl('test@example.com');
    expect(url1).toBe(url2);
  });

  it('uses custom size option', () => {
    const url = getGravatarUrl('test@example.com', { size: 200 });
    expect(url).toContain('s=200');
  });

  it('uses custom fallback option', () => {
    const url = getGravatarUrl('test@example.com', { fallback: 'mp' });
    expect(url).toContain('d=mp');
  });

  it('returns the default 80px size and 404 fallback', () => {
    const url = getGravatarUrl('hello@world.com');
    expect(url).toContain('s=80');
    expect(url).toContain('d=404');
  });

  it('produces correct MD5 for an empty string after trim', () => {
    // md5("") = d41d8cd98f00b204e9800998ecf8427e
    const url = getGravatarUrl('  ');
    expect(url).toContain('d41d8cd98f00b204e9800998ecf8427e');
  });
});

// ---------------------------------------------------------------------------
// fetchUser
// ---------------------------------------------------------------------------
describe('fetchUser', () => {
  const mockUser = { login: 'jdoe', email: 'jdoe@example.com', name: 'John Doe' };

  it('returns user on successful fetch', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUser),
    });

    const user = await fetchUser();
    expect(user).toEqual(mockUser);
    expect(fetch).toHaveBeenCalledWith('https://dashboard.marketdata.app/api/user/', {
      credentials: 'include',
    });
  });

  it('returns null on HTTP error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false });
    const user = await fetchUser();
    expect(user).toBeNull();
  });

  it('returns null on network error after retries', async () => {
    vi.useFakeTimers();
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const promise = fetchUser();
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);

    const user = await promise;
    expect(user).toBeNull();
    vi.useRealTimers();
  });

  it('retries up to 2 times on network error with exponential backoff', async () => {
    vi.useFakeTimers();
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const promise = fetchUser();
    expect(fetch).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000);
    expect(fetch).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(2000);
    expect(fetch).toHaveBeenCalledTimes(3);

    await promise;
    vi.useRealTimers();
  });

  it('returns user when retry succeeds after initial network error', async () => {
    vi.useFakeTimers();
    const mockUser = { login: 'jdoe', email: 'jdoe@example.com', name: 'John Doe' };

    globalThis.fetch = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockUser) });

    const promise = fetchUser();
    await vi.advanceTimersByTimeAsync(1000);

    const result = await promise;
    expect(result).toEqual(mockUser);
    expect(fetch).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('does not retry on HTTP error responses', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401 });

    const result = await fetchUser();
    expect(result).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('uses custom apiUrl', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUser),
    });

    await fetchUser({ apiUrl: 'https://staging.example.com/api/user/' });
    expect(fetch).toHaveBeenCalledWith('https://staging.example.com/api/user/', {
      credentials: 'include',
    });
  });

  it('returns cached data on second call within TTL without revalidation', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUser),
    });

    const first = await fetchUser();
    expect(first).toEqual(mockUser);

    // Second call within TTL returns cached — no background revalidation
    const second = await fetchUser();
    expect(second).toEqual(mockUser);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('falls back to sessionStorage cache when memory cache is cleared', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUser),
    });

    await fetchUser();
    // Clear only memory cache, keep sessionStorage
    _clearCache();
    sessionStorage.setItem('marketdata_user', JSON.stringify(mockUser));

    const cached = await fetchUser();
    expect(cached).toEqual(mockUser);
  });
});

// ---------------------------------------------------------------------------
// initUserProfile — Logged out
// ---------------------------------------------------------------------------
describe('initUserProfile — logged out', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false });
  });

  it('renders a login pill when user is not authenticated', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await initUserProfile({ container });

    const wrapper = container.querySelector('.user-profile-wrapper');
    expect(wrapper).not.toBeNull();

    const link = wrapper.querySelector('a.user-profile-login-pill');
    expect(link).not.toBeNull();
    expect(link.textContent.trim()).toBe('Log in');
    expect(link.href).toContain('dashboard.marketdata.app');

    // Should have person icon SVG but no chevron
    const svgs = link.querySelectorAll('svg');
    expect(svgs.length).toBe(1);
  });

  it('uses custom loginText', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await initUserProfile({
      container,
      loginText: 'Sign in',
    });

    const link = container.querySelector('.user-profile-wrapper a.user-profile-login-pill');
    expect(link.textContent.trim()).toBe('Sign in');
  });

  it('cleanup clears the container', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const cleanup = await initUserProfile({ container });
    expect(container.children.length).toBeGreaterThan(0);

    cleanup();
    expect(container.children.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// initUserProfile — Logged in, no dropdown
// ---------------------------------------------------------------------------
describe('initUserProfile — logged in, no dropdown', () => {
  const mockUser = { login: 'jdoe', email: 'jdoe@example.com', name: 'John Doe' };

  beforeEach(() => {
    _clearCache();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUser),
    });
  });

  it('renders an avatar link to the dashboard wrapped in user-profile-wrapper', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await initUserProfile({ container });

    const wrapper = container.querySelector('.user-profile-wrapper');
    expect(wrapper).not.toBeNull();

    const link = wrapper.querySelector('a');
    expect(link.href).toContain('dashboard.marketdata.app');

    const img = link.querySelector('img');
    expect(img).not.toBeNull();
    expect(img.alt).toBe('jdoe');
    expect(img.className).toContain('user-profile-avatar');
    expect(img.src).toContain('gravatar.com/avatar/');
  });

  it('replaces img with SVG placeholder on error, keeping user-profile-avatar class', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await initUserProfile({ container });

    const img = container.querySelector('img');
    img.dispatchEvent(new Event('error'));

    const placeholder = container.querySelector('div[role="img"]');
    expect(placeholder).not.toBeNull();
    expect(placeholder.querySelector('svg')).not.toBeNull();
    expect(placeholder.classList.contains('user-profile-avatar')).toBe(true);
    expect(placeholder.classList.contains('user-profile-avatar--placeholder')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// initUserProfile — Logged in, with dropdown
// ---------------------------------------------------------------------------
describe('initUserProfile — logged in, with dropdown', () => {
  const mockUser = { login: 'jdoe', email: 'jdoe@example.com', name: 'John Doe' };

  beforeEach(() => {
    _clearCache();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUser),
    });
  });

  it('renders avatar with dropdown menu', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await initUserProfile({ container, dropdown: true });

    const img = container.querySelector('#avatarButton');
    expect(img).not.toBeNull();
    expect(img.getAttribute('data-dropdown-toggle')).toBe('userDropdown');

    const menu = container.querySelector('#userDropdown');
    expect(menu).not.toBeNull();
    expect(menu.classList.contains('hidden')).toBe(true);
  });

  it('shows user name and email in dropdown header', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await initUserProfile({ container, dropdown: true });

    const menu = container.querySelector('#userDropdown');
    expect(menu.textContent).toContain('John Doe');
    expect(menu.textContent).toContain('jdoe@example.com');
  });

  it('contains default menu links', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await initUserProfile({ container, dropdown: true });

    const links = container.querySelectorAll('#userDropdown a');
    const labels = Array.from(links).map((a) => a.textContent);
    expect(labels).toContain('Dashboard');
    expect(labels).toContain('Profile');
    expect(labels).toContain('Modify My Plan');
    expect(labels).toContain('Log out');
  });

  it('includes custom menuItems before Log out', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await initUserProfile({
      container,
      dropdown: true,
      menuItems: [{ label: 'Settings', url: '/settings' }],
    });

    const links = container.querySelectorAll('#userDropdown a');
    const labels = Array.from(links).map((a) => a.textContent);
    const settingsIdx = labels.indexOf('Settings');
    const signOutIdx = labels.indexOf('Log out');
    expect(settingsIdx).toBeGreaterThan(-1);
    expect(settingsIdx).toBeLessThan(signOutIdx);
  });

  it('toggles dropdown on avatar click', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await initUserProfile({ container, dropdown: true });

    const trigger = container.querySelector('#avatarButton');
    const menu = container.querySelector('#userDropdown');

    // Open
    trigger.click();
    expect(menu.classList.contains('hidden')).toBe(false);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    // Close
    trigger.click();
    expect(menu.classList.contains('hidden')).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes dropdown on outside click', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await initUserProfile({ container, dropdown: true });

    const trigger = container.querySelector('#avatarButton');
    const menu = container.querySelector('#userDropdown');

    // Open dropdown
    trigger.click();
    expect(menu.classList.contains('hidden')).toBe(false);

    // Click outside
    document.body.click();
    expect(menu.classList.contains('hidden')).toBe(true);
  });

  it('closes dropdown on Escape key', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await initUserProfile({ container, dropdown: true });

    const trigger = container.querySelector('#avatarButton');
    const menu = container.querySelector('#userDropdown');

    // Open
    trigger.click();
    expect(menu.classList.contains('hidden')).toBe(false);

    // Press Escape
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(menu.classList.contains('hidden')).toBe(true);
  });

  it('cleanup removes listeners and clears container', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const cleanup = await initUserProfile({ container, dropdown: true });

    const trigger = container.querySelector('#avatarButton');
    const menu = container.querySelector('#userDropdown');

    // Open dropdown
    trigger.click();
    expect(menu.classList.contains('hidden')).toBe(false);

    cleanup();
    expect(container.children.length).toBe(0);
  });

  it('replaces img with SVG placeholder on Gravatar error and dropdown still works', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await initUserProfile({ container, dropdown: true });

    const img = container.querySelector('#avatarButton');
    img.dispatchEvent(new Event('error'));

    // Placeholder should exist with base avatar class preserved
    const placeholder = container.querySelector('div[role="img"]');
    expect(placeholder).not.toBeNull();
    expect(placeholder.id).toBe('avatarButton');
    expect(placeholder.classList.contains('user-profile-avatar')).toBe(true);
    expect(placeholder.classList.contains('user-profile-avatar--placeholder')).toBe(true);

    // Dropdown should still toggle via the placeholder
    const menu = container.querySelector('#userDropdown');
    placeholder.click();
    expect(menu.classList.contains('hidden')).toBe(false);

    placeholder.click();
    expect(menu.classList.contains('hidden')).toBe(true);
  });

  it('nudges dropdown left when it overflows the left viewport edge', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await initUserProfile({ container, dropdown: true });

    const menu = container.querySelector('#userDropdown');
    const trigger = container.querySelector('#avatarButton');

    // Mock getBoundingClientRect to simulate left-edge overflow
    vi.spyOn(menu, 'getBoundingClientRect').mockReturnValue({
      left: -20,
      right: 156,
      top: 50,
      bottom: 200,
      width: 176,
      height: 150,
    });

    trigger.click();
    expect(menu.classList.contains('hidden')).toBe(false);
    expect(menu.style.right).toBe('auto');
    expect(menu.style.left).toBe('0px');
  });

  it('renders avatar (not pill) when logged in with dropdown', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await initUserProfile({ container, dropdown: true });

    // Should have avatar, not pill
    expect(container.querySelector('#avatarButton')).not.toBeNull();
    expect(container.querySelector('.user-profile-login-pill')).toBeNull();
  });

  it('falls back to login when user has no name', async () => {
    _clearCache();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ login: 'jdoe', email: 'jdoe@example.com' }),
    });

    const container = document.createElement('div');
    document.body.appendChild(container);

    await initUserProfile({ container, dropdown: true });

    const menu = container.querySelector('#userDropdown');
    const nameDiv = menu.querySelector('.user-profile-dropdown-name');
    expect(nameDiv.textContent).toBe('jdoe');
  });
});

// ---------------------------------------------------------------------------
// initUserProfile — Logged out, with dropdown (guest dropdown)
// ---------------------------------------------------------------------------
describe('initUserProfile — logged out, with dropdown (guest dropdown)', () => {
  beforeEach(() => {
    _clearCache();
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false });
  });

  it('renders pill button (not flat link) when dropdown: true and user is null', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await initUserProfile({ container, dropdown: true });

    const pill = container.querySelector('.user-profile-login-pill');
    expect(pill).not.toBeNull();
    expect(pill.tagName).toBe('BUTTON');

    // Should NOT have the old flat link
    const flatLink = container.querySelector('a.btn-hover-orange');
    expect(flatLink).toBeNull();
  });

  it('pill button contains person icon, "Sign in" text, and chevron icon', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await initUserProfile({ container, dropdown: true });

    const pill = container.querySelector('.user-profile-login-pill');
    const svgs = pill.querySelectorAll('svg');
    expect(svgs.length).toBe(2);

    const textSpan = pill.querySelector('span');
    expect(textSpan.textContent).toBe('Log in');
  });

  it('clicking pill opens dropdown with "Log in" and "Start Free Trial" items', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await initUserProfile({ container, dropdown: true });

    const pill = container.querySelector('.user-profile-login-pill');
    const menu = container.querySelector('.user-profile-dropdown');

    expect(menu.classList.contains('hidden')).toBe(true);

    pill.click();
    expect(menu.classList.contains('hidden')).toBe(false);

    const links = menu.querySelectorAll('.user-profile-dropdown-link');
    const labels = Array.from(links).map((a) => a.textContent.replace(/\n/g, '').trim());
    expect(labels.some((l) => l.includes('Log in'))).toBe(true);
    expect(labels.some((l) => l.includes('Start Free Trial'))).toBe(true);
  });

  it('"Log in" links to loginUrl', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await initUserProfile({ container, dropdown: true, loginUrl: 'https://example.com/login' });

    const links = container.querySelectorAll('.user-profile-dropdown-link');
    const loginLink = Array.from(links).find((a) => a.textContent.includes('Log in'));
    expect(loginLink.href).toBe('https://example.com/login');
  });

  it('"Start Free Trial" links to signupUrl', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await initUserProfile({
      container,
      dropdown: true,
      signupUrl: 'https://example.com/signup',
    });

    const links = container.querySelectorAll('.user-profile-dropdown-link');
    const signupLink = Array.from(links).find((a) => a.textContent.includes('Start Free Trial'));
    expect(signupLink.href).toBe('https://example.com/signup');
  });

  it('signupUrl and planUrl are independent', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await initUserProfile({
      container,
      dropdown: true,
      planUrl: 'https://example.com/plan',
    });

    const links = container.querySelectorAll('.user-profile-dropdown-link');
    const signupLink = Array.from(links).find((a) => a.textContent.includes('Start Free Trial'));
    expect(signupLink.href).toBe('https://dashboard.marketdata.app/marketdata/signup');
  });

  it('"No card required" subtext is visible', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await initUserProfile({ container, dropdown: true });

    const subtext = container.querySelector('.user-profile-dropdown-subtext');
    expect(subtext).not.toBeNull();
    expect(subtext.textContent).toBe('No card required');
  });

  it('Escape key closes the dropdown', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await initUserProfile({ container, dropdown: true });

    const pill = container.querySelector('.user-profile-login-pill');
    const menu = container.querySelector('.user-profile-dropdown');

    pill.click();
    expect(menu.classList.contains('hidden')).toBe(false);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(menu.classList.contains('hidden')).toBe(true);
  });

  it('outside click closes the dropdown', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await initUserProfile({ container, dropdown: true });

    const pill = container.querySelector('.user-profile-login-pill');
    const menu = container.querySelector('.user-profile-dropdown');

    pill.click();
    expect(menu.classList.contains('hidden')).toBe(false);

    document.body.click();
    expect(menu.classList.contains('hidden')).toBe(true);
  });

  it('when dropdown: false and user is null, renders pill as direct link (no chevron)', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await initUserProfile({ container, dropdown: false });

    const pill = container.querySelector('a.user-profile-login-pill');
    expect(pill).not.toBeNull();
    expect(pill.textContent.trim()).toBe('Log in');

    // No chevron (only person icon SVG)
    const svgs = pill.querySelectorAll('svg');
    expect(svgs.length).toBe(1);

    // No dropdown menu
    const menu = container.querySelector('.user-profile-dropdown');
    expect(menu).toBeNull();
  });

  it('uses custom signupText', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await initUserProfile({
      container,
      dropdown: true,
      signupText: 'Try it free',
    });

    const links = container.querySelectorAll('.user-profile-dropdown-link');
    const signupLink = Array.from(links).find((a) => a.textContent.includes('Try it free'));
    expect(signupLink).not.toBeNull();
  });

  it('cleanup clears the container and removes listeners', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const cleanup = await initUserProfile({ container, dropdown: true });
    expect(container.children.length).toBeGreaterThan(0);

    cleanup();
    expect(container.children.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// initUserProfile — skeleton loading state
// ---------------------------------------------------------------------------
describe('initUserProfile — skeleton loading state', () => {
  it('shows skeleton pill while fetching user', async () => {
    let resolveFetch;
    globalThis.fetch = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const container = document.createElement('div');
    document.body.appendChild(container);

    const promise = initUserProfile({ container });

    const skeleton = container.querySelector('.user-profile-skeleton');
    expect(skeleton).not.toBeNull();
    expect(skeleton.classList.contains('user-profile-login-pill')).toBe(true);
    expect(skeleton.getAttribute('aria-hidden')).toBe('true');

    resolveFetch({ ok: false });
    await promise;

    expect(container.querySelector('.user-profile-skeleton')).toBeNull();
  });

  it('skeleton is replaced by login pill when logged out', async () => {
    let resolveFetch;
    globalThis.fetch = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const container = document.createElement('div');
    document.body.appendChild(container);

    const promise = initUserProfile({ container });
    expect(container.querySelector('.user-profile-skeleton')).not.toBeNull();

    resolveFetch({ ok: false });
    await promise;

    const pill = container.querySelector('.user-profile-login-pill');
    expect(pill).not.toBeNull();
    expect(pill.classList.contains('user-profile-skeleton')).toBe(false);
    expect(pill.getAttribute('aria-hidden')).toBeNull();
  });

  it('skeleton is replaced by avatar when logged in', async () => {
    let resolveFetch;
    const mockUser = { login: 'jdoe', email: 'jdoe@example.com', name: 'John Doe' };
    globalThis.fetch = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const container = document.createElement('div');
    document.body.appendChild(container);

    const promise = initUserProfile({ container });
    expect(container.querySelector('.user-profile-skeleton')).not.toBeNull();

    resolveFetch({ ok: true, json: () => Promise.resolve(mockUser) });
    await promise;

    expect(container.querySelector('.user-profile-skeleton')).toBeNull();
    expect(container.querySelector('.user-profile-avatar')).not.toBeNull();
  });

  it('skeleton uses loginText option for correct sizing', async () => {
    let resolveFetch;
    globalThis.fetch = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const container = document.createElement('div');
    document.body.appendChild(container);

    const promise = initUserProfile({ container, loginText: 'Sign in' });

    const skeleton = container.querySelector('.user-profile-skeleton');
    expect(skeleton.textContent).toContain('Sign in');

    resolveFetch({ ok: false });
    await promise;
  });

  it('non-dropdown skeleton renders as link with href="#"', async () => {
    let resolveFetch;
    globalThis.fetch = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const container = document.createElement('div');
    document.body.appendChild(container);

    const promise = initUserProfile({ container, dropdown: false });

    const skeleton = container.querySelector('.user-profile-skeleton');
    expect(skeleton.tagName).toBe('A');
    expect(skeleton.getAttribute('href')).toBe('#');

    // No chevron (person icon only)
    expect(skeleton.querySelectorAll('svg').length).toBe(1);

    resolveFetch({ ok: false });
    await promise;
  });

  it('dropdown skeleton renders as button with chevron', async () => {
    let resolveFetch;
    globalThis.fetch = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const container = document.createElement('div');
    document.body.appendChild(container);

    const promise = initUserProfile({ container, dropdown: true });

    const skeleton = container.querySelector('.user-profile-skeleton');
    expect(skeleton.tagName).toBe('BUTTON');

    // Person icon + chevron
    expect(skeleton.querySelectorAll('svg').length).toBe(2);

    // Dropdown menu exists but is hidden
    const menu = container.querySelector('.user-profile-dropdown');
    expect(menu).not.toBeNull();
    expect(menu.classList.contains('hidden')).toBe(true);

    resolveFetch({ ok: false });
    await promise;
  });
});
