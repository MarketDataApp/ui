import { fetchUser, onUserChange, _clearCache, _getLastFetchTime } from '../../dist/user.js';

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
const mockUser = { login: 'jdoe', email: 'jdoe@example.com', name: 'John Doe' };

beforeEach(() => {
  _clearCache();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// fetchUser — basic
// ---------------------------------------------------------------------------
describe('fetchUser', () => {
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

  it('falls back to sessionStorage cache when memory cache is cleared', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUser),
    });

    await fetchUser();
    // Clear all state, then seed sessionStorage manually
    _clearCache();
    sessionStorage.setItem('marketdata_user', JSON.stringify(mockUser));

    const cached = await fetchUser();
    expect(cached).toEqual(mockUser);
  });
});

// ---------------------------------------------------------------------------
// TTL behavior
// ---------------------------------------------------------------------------
describe('fetchUser — TTL', () => {
  it('returns cached data without revalidation when within TTL', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUser),
    });

    const first = await fetchUser();
    expect(first).toEqual(mockUser);

    // Second call within TTL — should NOT trigger another fetch
    const second = await fetchUser();
    expect(second).toEqual(mockUser);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('triggers background revalidation after TTL expires', async () => {
    vi.useFakeTimers();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUser),
    });

    await fetchUser();
    expect(fetch).toHaveBeenCalledTimes(1);

    // Advance past TTL (60s)
    await vi.advanceTimersByTimeAsync(60_001);

    const cached = await fetchUser();
    expect(cached).toEqual(mockUser);
    // Background revalidation should have started
    expect(fetch).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it('records _lastFetchTime after a successful fetch', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUser),
    });

    expect(_getLastFetchTime()).toBe(0);
    await fetchUser();
    expect(_getLastFetchTime()).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Request deduplication
// ---------------------------------------------------------------------------
describe('fetchUser — deduplication', () => {
  it('deduplicates concurrent calls into a single fetch', async () => {
    let resolveResponse;
    globalThis.fetch = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveResponse = resolve;
        }),
    );

    const p1 = fetchUser();
    const p2 = fetchUser();

    expect(fetch).toHaveBeenCalledTimes(1);

    resolveResponse({ ok: true, json: () => Promise.resolve(mockUser) });

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toEqual(mockUser);
    expect(r2).toEqual(mockUser);
  });
});

// ---------------------------------------------------------------------------
// onUserChange — subscriber pattern
// ---------------------------------------------------------------------------
describe('onUserChange', () => {
  it('notifies subscribers when user data changes after fetch', async () => {
    const cb = vi.fn();
    const unsub = onUserChange(cb);

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUser),
    });

    await fetchUser();
    expect(cb).toHaveBeenCalledWith(mockUser);

    unsub();
  });

  it('notifies with null when user becomes logged out', async () => {
    // First, populate cache
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUser),
    });
    await fetchUser();

    const cb = vi.fn();
    const unsub = onUserChange(cb);

    // Now simulate session expiry on revalidation
    vi.useFakeTimers();
    _clearCache();
    // Re-seed memory cache to simulate stale data
    sessionStorage.setItem('marketdata_user', JSON.stringify(mockUser));
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false });

    await fetchUser();
    // The background revalidation returns null, should notify
    await vi.advanceTimersByTimeAsync(0);
    expect(cb).toHaveBeenCalledWith(null);

    unsub();
    vi.useRealTimers();
  });

  it('unsubscribe prevents future callbacks', async () => {
    const cb = vi.fn();
    const unsub = onUserChange(cb);
    unsub();

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUser),
    });

    await fetchUser();
    expect(cb).not.toHaveBeenCalled();
  });

  it('multiple subscribers all get notified', async () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const unsub1 = onUserChange(cb1);
    const unsub2 = onUserChange(cb2);

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUser),
    });

    await fetchUser();
    expect(cb1).toHaveBeenCalledWith(mockUser);
    expect(cb2).toHaveBeenCalledWith(mockUser);

    unsub1();
    unsub2();
  });

  it('throwing subscriber does not prevent other subscribers from being notified', async () => {
    const badCb = vi.fn().mockImplementation(() => {
      throw new Error('subscriber error');
    });
    const goodCb = vi.fn();
    const unsub1 = onUserChange(badCb);
    const unsub2 = onUserChange(goodCb);

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUser),
    });

    await fetchUser();
    expect(badCb).toHaveBeenCalled();
    expect(goodCb).toHaveBeenCalledWith(mockUser);

    unsub1();
    unsub2();
  });

  it('does not notify when fetched data is unchanged', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUser),
    });

    // Initial fetch populates cache
    await fetchUser();

    const cb = vi.fn();
    const unsub = onUserChange(cb);

    // Force revalidation by advancing past TTL
    vi.useFakeTimers();
    await vi.advanceTimersByTimeAsync(60_001);

    await fetchUser();
    // Allow background revalidation to complete
    await vi.advanceTimersByTimeAsync(0);

    // Same data returned — subscriber should NOT be called
    expect(cb).not.toHaveBeenCalled();

    unsub();
    vi.useRealTimers();
  });
});

// ---------------------------------------------------------------------------
// _clearCache
// ---------------------------------------------------------------------------
describe('_clearCache', () => {
  it('resets all state so next fetchUser hits the network', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUser),
    });

    await fetchUser();
    expect(fetch).toHaveBeenCalledTimes(1);

    _clearCache();

    await fetchUser();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('resets _lastFetchTime to 0', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUser),
    });

    await fetchUser();
    expect(_getLastFetchTime()).toBeGreaterThan(0);

    _clearCache();
    expect(_getLastFetchTime()).toBe(0);
  });
});
