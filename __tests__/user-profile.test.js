import { getGravatarUrl, fetchUser, initUserProfile, _clearCache } from '../user-profile.js';

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

  it('returns null on network error', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const user = await fetchUser();
    expect(user).toBeNull();
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

  it('returns cached data on second call (stale-while-revalidate)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUser),
    });

    const first = await fetchUser();
    expect(first).toEqual(mockUser);

    // Second call returns cached immediately
    const second = await fetchUser();
    expect(second).toEqual(mockUser);
    // fetch was called for the first request + the background revalidation
    expect(fetch).toHaveBeenCalledTimes(2);
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

  it('renders a sign-in button when user is not authenticated', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await initUserProfile({ container });

    const link = container.querySelector('a');
    expect(link).not.toBeNull();
    expect(link.textContent).toBe('Sign in');
    expect(link.className).toBe('btn-hover-orange');
    expect(link.href).toContain('/dashboard/');
  });

  it('uses custom loginText and buttonClass', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await initUserProfile({
      container,
      loginText: 'Log in',
      buttonClass: 'btn-orange-to-blue',
    });

    const link = container.querySelector('a');
    expect(link.textContent).toBe('Log in');
    expect(link.className).toBe('btn-orange-to-blue');
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

  it('renders an avatar link to the dashboard', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await initUserProfile({ container });

    const link = container.querySelector('a');
    expect(link.href).toContain('/dashboard/');

    const img = link.querySelector('img');
    expect(img).not.toBeNull();
    expect(img.alt).toBe('jdoe');
    expect(img.className).toContain('rounded-full');
    expect(img.src).toContain('gravatar.com/avatar/');
  });

  it('replaces img with SVG placeholder on error', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await initUserProfile({ container });

    const img = container.querySelector('img');
    img.dispatchEvent(new Event('error'));

    const placeholder = container.querySelector('div[role="img"]');
    expect(placeholder).not.toBeNull();
    expect(placeholder.querySelector('svg')).not.toBeNull();
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
    expect(labels).toContain('Sign out');
  });

  it('includes custom menuItems before Sign out', async () => {
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
    const signOutIdx = labels.indexOf('Sign out');
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

    // Placeholder should exist
    const placeholder = container.querySelector('div[role="img"]');
    expect(placeholder).not.toBeNull();
    expect(placeholder.id).toBe('avatarButton');

    // Dropdown should still toggle via the placeholder
    const menu = container.querySelector('#userDropdown');
    placeholder.click();
    expect(menu.classList.contains('hidden')).toBe(false);

    placeholder.click();
    expect(menu.classList.contains('hidden')).toBe(true);
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
    const nameDiv = menu.querySelector('.font-medium');
    expect(nameDiv.textContent).toBe('jdoe');
  });
});
