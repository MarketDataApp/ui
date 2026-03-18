import { evaluateCondition, initUserState } from '../../dist/user-state.js';
import { _clearCache } from '../../dist/user.js';

// ---------------------------------------------------------------------------
// sessionStorage mock
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
// Test data
// ---------------------------------------------------------------------------
const paidUser = {
  login: 'cparksch2',
  email: 'chris@example.com',
  name: 'Christopher Parks',
  products: ['quant', 'starter'],
  paid: true,
  trial: false,
  expires: '2026-03-20',
};

const freeUser = {
  login: 'freebie',
  email: 'free@example.com',
  name: 'Free User',
  products: ['free-forever'],
  paid: false,
  trial: false,
  expires: '2099-01-01',
};

const trialUser = {
  login: 'trialer',
  email: 'trial@example.com',
  name: 'Trial User',
  products: ['starter-trial'],
  paid: false,
  trial: true,
  expires: '2026-04-01',
};

// ---------------------------------------------------------------------------
// evaluateCondition
// ---------------------------------------------------------------------------
describe('evaluateCondition', () => {
  describe('logged-in / logged-out', () => {
    it('logged-in matches when user exists', () => {
      expect(evaluateCondition('logged-in', paidUser)).toBe(true);
    });

    it('logged-in does not match when user is null', () => {
      expect(evaluateCondition('logged-in', null)).toBe(false);
    });

    it('logged-out matches when user is null', () => {
      expect(evaluateCondition('logged-out', null)).toBe(true);
    });

    it('logged-out does not match when user exists', () => {
      expect(evaluateCondition('logged-out', paidUser)).toBe(false);
    });
  });

  describe('paid / free', () => {
    it('paid matches when user.paid is true', () => {
      expect(evaluateCondition('paid', paidUser)).toBe(true);
    });

    it('paid does not match when user.paid is false', () => {
      expect(evaluateCondition('paid', freeUser)).toBe(false);
    });

    it('paid does not match when user is null', () => {
      expect(evaluateCondition('paid', null)).toBe(false);
    });

    it('free matches when logged in and user.paid is false', () => {
      expect(evaluateCondition('free', freeUser)).toBe(true);
    });

    it('free does not match when user.paid is true', () => {
      expect(evaluateCondition('free', paidUser)).toBe(false);
    });

    it('free does not match when user is null', () => {
      expect(evaluateCondition('free', null)).toBe(false);
    });
  });

  describe('trial', () => {
    it('trial matches when user.trial is true', () => {
      expect(evaluateCondition('trial', trialUser)).toBe(true);
    });

    it('trial does not match when user.trial is false', () => {
      expect(evaluateCondition('trial', paidUser)).toBe(false);
    });

    it('trial does not match when user is null', () => {
      expect(evaluateCondition('trial', null)).toBe(false);
    });
  });

  describe('product:<slug>', () => {
    it('matches when user has the product', () => {
      expect(evaluateCondition('product:quant', paidUser)).toBe(true);
    });

    it('does not match when user lacks the product', () => {
      expect(evaluateCondition('product:prime', paidUser)).toBe(false);
    });

    it('does not match when user is null', () => {
      expect(evaluateCondition('product:quant', null)).toBe(false);
    });

    it('is case-insensitive', () => {
      expect(evaluateCondition('product:Quant', paidUser)).toBe(true);
      expect(evaluateCondition('product:QUANT', paidUser)).toBe(true);
    });

    it('matches slugified product names', () => {
      expect(evaluateCondition('product:starter-trial', trialUser)).toBe(true);
    });
  });

  describe('case insensitivity', () => {
    it('condition keywords are case-insensitive', () => {
      expect(evaluateCondition('Logged-In', paidUser)).toBe(true);
      expect(evaluateCondition('PAID', paidUser)).toBe(true);
      expect(evaluateCondition('Trial', trialUser)).toBe(true);
    });
  });

  describe('unknown conditions', () => {
    it('returns false for unrecognized conditions', () => {
      expect(evaluateCondition('admin', paidUser)).toBe(false);
      expect(evaluateCondition('', paidUser)).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// initUserState
// ---------------------------------------------------------------------------
describe('initUserState', () => {
  let root;

  /** Create a test element with data-user-state and hidden attributes */
  function addEl(condition, text) {
    const el = document.createElement('div');
    el.setAttribute('data-user-state', condition);
    el.setAttribute('hidden', '');
    el.textContent = text;
    root.appendChild(el);
    return el;
  }

  beforeEach(() => {
    _clearCache();
    sessionStorage.clear();
    vi.restoreAllMocks();

    root = document.createElement('div');
    addEl('logged-in', 'Welcome');
    addEl('logged-out', 'Please log in');
    addEl('paid', 'Premium');
    addEl('free', 'Upgrade');
    addEl('trial', 'Trial');
    addEl('product:quant', 'Quant');
    document.body.appendChild(root);
  });

  afterEach(() => {
    document.body.removeChild(root);
  });

  function mockApi(user) {
    return user === null
      ? 'data:application/json,null'
      : 'data:application/json,' + encodeURIComponent(JSON.stringify(user));
  }

  function visibleText() {
    return Array.from(root.querySelectorAll('[data-user-state]'))
      .filter((el) => !el.hidden)
      .map((el) => el.textContent.trim());
  }

  function hiddenText() {
    return Array.from(root.querySelectorAll('[data-user-state]'))
      .filter((el) => el.hidden)
      .map((el) => el.textContent.trim());
  }

  it('reveals logged-out elements when user is null', async () => {
    await initUserState({ root, apiUrl: mockApi(null) });

    expect(visibleText()).toEqual(['Please log in']);
    expect(hiddenText()).toContain('Welcome');
    expect(hiddenText()).toContain('Premium');
  });

  it('reveals logged-in and paid elements for a paid user', async () => {
    await initUserState({ root, apiUrl: mockApi(paidUser) });

    expect(visibleText()).toContain('Welcome');
    expect(visibleText()).toContain('Premium');
    expect(visibleText()).toContain('Quant');
    expect(hiddenText()).toContain('Please log in');
    expect(hiddenText()).toContain('Upgrade');
    expect(hiddenText()).toContain('Trial');
  });

  it('reveals free and trial elements for a trial user', async () => {
    await initUserState({ root, apiUrl: mockApi(trialUser) });

    expect(visibleText()).toContain('Welcome');
    expect(visibleText()).toContain('Upgrade');
    expect(visibleText()).toContain('Trial');
    expect(hiddenText()).toContain('Please log in');
    expect(hiddenText()).toContain('Premium');
    expect(hiddenText()).toContain('Quant');
  });

  it('reveals free elements for a free non-trial user', async () => {
    await initUserState({ root, apiUrl: mockApi(freeUser) });

    expect(visibleText()).toContain('Welcome');
    expect(visibleText()).toContain('Upgrade');
    expect(hiddenText()).toContain('Premium');
    expect(hiddenText()).toContain('Trial');
  });

  it('supports OR logic with space-separated conditions', async () => {
    const orEl = addEl('paid trial', 'Non-free');

    await initUserState({ root, apiUrl: mockApi(trialUser) });
    expect(orEl.hidden).toBe(false);

    // Also works for paid users
    orEl.setAttribute('hidden', '');
    _clearCache();
    await initUserState({ root, apiUrl: mockApi(paidUser) });
    expect(orEl.hidden).toBe(false);
  });

  it('cleanup re-hides all elements', async () => {
    const cleanup = await initUserState({ root, apiUrl: mockApi(paidUser) });

    expect(visibleText().length).toBeGreaterThan(0);

    cleanup();

    // All elements should be hidden again
    const allHidden = Array.from(root.querySelectorAll('[data-user-state]')).every(
      (el) => el.hidden,
    );
    expect(allHidden).toBe(true);
  });
});
