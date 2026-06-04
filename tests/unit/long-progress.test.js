import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LongProgress } from '../../dist/long-progress.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSection(originalHtml = '<form><button type="submit">Go</button></form>') {
  const section = document.createElement('section');
  section.innerHTML = originalHtml;
  document.body.appendChild(section);
  return section;
}

const minimalPhases = [
  { step: 'starting', fillPct: 10, durationMs: 1000 }, // fires at t=0, runs until t=1000
  { step: 'middle', fillPct: 50, durationMs: 4000 }, // fires at t=1000, runs until t=5000
  { step: 'late', fillPct: 90, durationMs: 1000 }, // fires at t=5000, runs until t=6000
];

beforeEach(() => {
  document.body.innerHTML = '';
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  delete window.htmx;
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LongProgress — defaults', () => {
  it('renders with sensible defaults given no options', () => {
    const section = makeSection();
    new LongProgress(section).start();

    const card = section.querySelector('.long-progress');
    expect(card).not.toBeNull();
    expect(card.getAttribute('role')).toBe('status');
    expect(card.getAttribute('aria-live')).toBe('polite');

    // Step text lives in the header row (no title element anymore).
    // Default phases[0].step provides the initial header text.
    const stepEl = section.querySelector('.long-progress-step');
    expect(stepEl).not.toBeNull();
    expect(stepEl.textContent).toBe('Working…');
    expect(section.querySelector('.long-progress-title')).toBeNull();

    const bar = section.querySelector('.long-progress-bar');
    expect(bar.getAttribute('role')).toBe('progressbar');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
    expect(bar.getAttribute('aria-valuenow')).toBe('0');

    // Default hint contains the load-bearing "don't refresh" emphasis.
    const hint = section.querySelector('.long-progress-hint');
    expect(hint.querySelector('strong').textContent).toMatch(/don.?t refresh/i);
    // Hint is icon-prefixed so the warning reads as a structured affordance.
    expect(hint.querySelector('svg')).not.toBeNull();
  });

  it('renders the step in the header row, before the bar', () => {
    const section = makeSection();
    new LongProgress(section).start();
    const card = section.querySelector('.long-progress');
    const header = card.querySelector('.long-progress-header');
    const stepEl = section.querySelector('.long-progress-step');
    // Step is inside the header (not below the bar).
    expect(header.contains(stepEl)).toBe(true);
    // Bar comes after the header in document order.
    expect(header.compareDocumentPosition(section.querySelector('.long-progress-bar'))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('renders the hint directly under the bar (and after it in document order)', () => {
    const section = makeSection();
    new LongProgress(section).start();
    const bar = section.querySelector('.long-progress-bar');
    const hint = section.querySelector('.long-progress-hint');
    expect(bar.compareDocumentPosition(hint)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('drives bar fill + percent counter via --long-progress-pct on the container', async () => {
    // The percent text is CSS-generated (counter() in .long-progress-percent::after),
    // driven by the integer custom property — so it counts smoothly through 1,2,3…
    // to the target rather than jumping. JS only writes the target value; the
    // @property <integer> registration makes the CSS transition do the counting.
    const section = makeSection();
    new LongProgress(section, { phases: minimalPhases }).start();

    const card = section.querySelector('.long-progress');
    const percentEl = section.querySelector('.long-progress-percent');
    expect(percentEl).not.toBeNull();
    expect(card.style.getPropertyValue('--long-progress-pct')).toBe('');

    await vi.advanceTimersByTimeAsync(0); // phase[0] → 10% over 1000ms
    expect(card.style.getPropertyValue('--long-progress-pct')).toBe('10');
    expect(card.style.getPropertyValue('--long-progress-fill-duration')).toBe('1000ms');

    await vi.advanceTimersByTimeAsync(1000); // phase[1] → 50% over 4000ms
    expect(card.style.getPropertyValue('--long-progress-pct')).toBe('50');
    expect(card.style.getPropertyValue('--long-progress-fill-duration')).toBe('4000ms');
  });

  it('omits hint when hint: null is passed', () => {
    const section = makeSection();
    new LongProgress(section, { hint: null }).start();
    expect(section.querySelector('.long-progress-hint')).toBeNull();
  });

  it('applies long-progress-inline class when inline: true', () => {
    const section = makeSection();
    new LongProgress(section, { inline: true }).start();
    expect(section.querySelector('.long-progress').classList.contains('long-progress-inline')).toBe(
      true,
    );
  });

  it('renders track and fill with .progress-bar / .progress-bar-fill utilities', () => {
    const section = makeSection();
    new LongProgress(section).start();
    const bar = section.querySelector('.long-progress-bar');
    const fill = section.querySelector('.long-progress-bar-fill');
    expect(bar.classList.contains('progress-bar')).toBe(true);
    expect(fill.classList.contains('progress-bar-fill')).toBe(true);
  });

  it('defaults to barVariant: "info" → adds .progress-bar-fill-info modifier', () => {
    const section = makeSection();
    new LongProgress(section).start();
    const fill = section.querySelector('.long-progress-bar-fill');
    expect(fill.classList.contains('progress-bar-fill-info')).toBe(true);
  });

  it('barVariant: "orange" uses bare .progress-bar-fill (no modifier — brand orange gradient)', () => {
    const section = makeSection();
    new LongProgress(section, { barVariant: 'orange' }).start();
    const fill = section.querySelector('.long-progress-bar-fill');
    expect(fill.classList.contains('progress-bar-fill')).toBe(true);
    expect(fill.classList.contains('progress-bar-fill-info')).toBe(false);
    expect(fill.classList.contains('progress-bar-fill-blue')).toBe(false);
  });

  it.each([
    ['blue', 'progress-bar-fill-blue'],
    ['success', 'progress-bar-fill-success'],
    ['danger', 'progress-bar-fill-danger'],
  ])('barVariant: "%s" adds .%s modifier', (variant, expectedCls) => {
    const section = makeSection();
    new LongProgress(section, { barVariant: variant }).start();
    expect(section.querySelector('.long-progress-bar-fill').classList.contains(expectedCls)).toBe(
      true,
    );
  });

  it('throws RangeError for an unknown barVariant', () => {
    const section = makeSection();
    expect(() => new LongProgress(section, { barVariant: 'purple' })).toThrow(RangeError);
  });

  it('escapes the initial step text to prevent XSS', () => {
    const section = makeSection();
    new LongProgress(section, {
      phases: [{ step: '<img src=x onerror=alert(1)>', fillPct: 10, durationMs: 100 }],
    }).start();
    const stepEl = section.querySelector('.long-progress-step');
    expect(stepEl.textContent).toBe('<img src=x onerror=alert(1)>');
    expect(stepEl.querySelector('img')).toBeNull();
  });
});

describe('LongProgress — time-driven phases', () => {
  it('advances step text and aria-valuenow as phases fire', async () => {
    const section = makeSection();
    const lp = new LongProgress(section, { phases: minimalPhases });
    lp.start();

    const step = section.querySelector('.long-progress-step');
    const bar = section.querySelector('.long-progress-bar');

    // Initial step matches phases[0].step
    expect(step.textContent).toBe('starting');

    // Phase 0 fires at t=0 (next macrotask) — bar should update to 10%
    await vi.advanceTimersByTimeAsync(0);
    expect(bar.getAttribute('aria-valuenow')).toBe('10');

    await vi.advanceTimersByTimeAsync(1000);
    expect(step.textContent).toBe('middle');
    expect(bar.getAttribute('aria-valuenow')).toBe('50');

    await vi.advanceTimersByTimeAsync(4000);
    expect(step.textContent).toBe('late');
    expect(bar.getAttribute('aria-valuenow')).toBe('90');
  });
});

describe('LongProgress — fastForward', () => {
  it('clears pending phases, sets step to doneStep, fills to 100%', async () => {
    const section = makeSection();
    const lp = new LongProgress(section, { phases: minimalPhases });
    lp.start();

    await vi.advanceTimersByTimeAsync(500); // mid-phase-0
    const ffPromise = lp.fastForward({ holdMs: 200 });

    const step = section.querySelector('.long-progress-step');
    const bar = section.querySelector('.long-progress-bar');
    expect(step.textContent).toBe('Done');
    expect(bar.getAttribute('aria-valuenow')).toBe('100');

    // The middle/late phases (at 1000ms/5000ms) should never fire
    await vi.advanceTimersByTimeAsync(10000);
    expect(step.textContent).toBe('Done'); // never overwritten by phase 1/2

    await ffPromise; // resolves after holdMs (already elapsed)
  });

  it('returns a promise that resolves after holdMs', async () => {
    const section = makeSection();
    const lp = new LongProgress(section);
    lp.start();

    let resolved = false;
    lp.fastForward({ holdMs: 300 }).then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(299);
    expect(resolved).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(resolved).toBe(true);
  });

  it('uses the configured doneStep override', async () => {
    const section = makeSection();
    const lp = new LongProgress(section, { doneStep: 'All set!' });
    lp.start();
    lp.fastForward();
    expect(section.querySelector('.long-progress-step').textContent).toBe('All set!');
  });
});

describe('LongProgress — restore', () => {
  it('restores original innerHTML and clears the card', async () => {
    const section = makeSection('<form id="orig"><input name="x"/></form>');
    const lp = new LongProgress(section);
    lp.start();
    expect(section.querySelector('.long-progress')).not.toBeNull();

    lp.restore();

    expect(section.querySelector('.long-progress')).toBeNull();
    expect(section.querySelector('#orig')).not.toBeNull();
    expect(section.querySelector('input[name="x"]')).not.toBeNull();
  });

  it('inserts an admonition-danger banner with role="alert" when a message is given', () => {
    const section = makeSection();
    const lp = new LongProgress(section);
    lp.start();
    lp.restore('Sorry, that failed.');

    const banner = section.querySelector('.admonition.admonition-danger');
    expect(banner).not.toBeNull();
    expect(banner.getAttribute('role')).toBe('alert');
    expect(banner.textContent).toContain('Sorry, that failed.');
  });

  it('escapes the error message to prevent XSS', () => {
    const section = makeSection();
    const lp = new LongProgress(section);
    lp.start();
    lp.restore('<img src=x onerror=alert(1)>');

    const banner = section.querySelector('.admonition.admonition-danger');
    expect(banner.querySelector('img')).toBeNull();
    expect(banner.textContent).toBe('<img src=x onerror=alert(1)>');
  });

  it('inserts banner before errorInsertBefore target when present', () => {
    const section = makeSection(
      '<form><input name="a"/><div class="form-actions"><button>Go</button></div></form>',
    );
    const lp = new LongProgress(section, { errorInsertBefore: '.form-actions' });
    lp.start();
    lp.restore('Failed.');

    const form = section.querySelector('form');
    const banner = form.querySelector('.admonition-danger');
    const actions = form.querySelector('.form-actions');
    expect(banner.nextElementSibling).toBe(actions);
  });

  it('appends banner to section when errorInsertBefore selector is not found', () => {
    const section = makeSection('<form><input name="a"/></form>');
    const lp = new LongProgress(section, { errorInsertBefore: '.nope' });
    lp.start();
    lp.restore('Failed.');

    const banner = section.querySelector('.admonition-danger');
    expect(banner.parentNode).toBe(section);
  });

  it('calls window.htmx.process on the section when HTMX is loaded', () => {
    window.htmx = { process: vi.fn() };
    const section = makeSection();
    const lp = new LongProgress(section);
    lp.start();
    lp.restore();
    expect(window.htmx.process).toHaveBeenCalledWith(section);
  });

  it('is a no-op if called before start()', () => {
    const section = makeSection('<form id="orig"></form>');
    const lp = new LongProgress(section);
    lp.restore('boom');
    expect(section.querySelector('#orig')).not.toBeNull();
    expect(section.querySelector('.admonition-danger')).toBeNull();
  });

  it('is a no-op when called twice', () => {
    const section = makeSection();
    const lp = new LongProgress(section);
    lp.start();
    lp.restore('first');
    lp.restore('second'); // should not stack a second banner

    expect(section.querySelectorAll('.admonition-danger').length).toBe(1);
    expect(section.querySelector('.admonition-danger').textContent).toContain('first');
  });

  it('cancels pending phase timers', async () => {
    const section = makeSection();
    const lp = new LongProgress(section, { phases: minimalPhases });
    lp.start();
    lp.restore('failed');

    // Even after the phase timeline would have completed, the restored
    // section's original DOM should be unchanged (no card sneaking back)
    await vi.advanceTimersByTimeAsync(10000);
    expect(section.querySelector('.long-progress')).toBeNull();
  });
});

describe('LongProgress — bytes mode', () => {
  it('fills bar to fraction * capPct (e.g. 0.5 with cap 25 → 12.5%)', () => {
    const section = makeSection();
    const lp = new LongProgress(section, { bytes: { capPct: 25 }, phases: [] });
    lp.start();
    lp.setBytesProgress(0.5);

    const bar = section.querySelector('.long-progress-bar');
    expect(bar.getAttribute('aria-valuenow')).toBe('13'); // round(12.5) = 13
  });

  it('handles capPct: 100 as a pure upload bar', () => {
    const section = makeSection();
    const lp = new LongProgress(section, { bytes: { capPct: 100 }, phases: [] });
    lp.start();
    lp.setBytesProgress(0.75);
    expect(section.querySelector('.long-progress-bar').getAttribute('aria-valuenow')).toBe('75');
  });

  it('shows bytes.step as initial step text', () => {
    const section = makeSection();
    new LongProgress(section, {
      bytes: { capPct: 25, step: 'Uploading file…' },
      phases: minimalPhases,
    }).start();
    expect(section.querySelector('.long-progress-step').textContent).toBe('Uploading file…');
  });

  it('does NOT advance phases on time alone — only after setBytesProgress(1)', async () => {
    const section = makeSection();
    const lp = new LongProgress(section, {
      bytes: { capPct: 25 },
      phases: minimalPhases,
    });
    lp.start();

    // Advance well past the phase timeline — phases must not fire yet.
    await vi.advanceTimersByTimeAsync(10000);
    expect(section.querySelector('.long-progress-step').textContent).toBe('Uploading…');

    // Now signal upload complete — phases start from this moment.
    lp.setBytesProgress(1);
    await vi.advanceTimersByTimeAsync(0);
    expect(section.querySelector('.long-progress-step').textContent).toBe('starting');

    await vi.advanceTimersByTimeAsync(1000);
    expect(section.querySelector('.long-progress-step').textContent).toBe('middle');
  });

  it('is monotonic — passing a lower fraction does not move the bar backward', () => {
    const section = makeSection();
    const lp = new LongProgress(section, { bytes: { capPct: 100 }, phases: [] });
    lp.start();
    lp.setBytesProgress(0.6);
    expect(section.querySelector('.long-progress-bar').getAttribute('aria-valuenow')).toBe('60');

    lp.setBytesProgress(0.3);
    expect(section.querySelector('.long-progress-bar').getAttribute('aria-valuenow')).toBe('60');
  });

  it('calling setBytesProgress(1) twice does not start phases twice', async () => {
    const section = makeSection();
    const lp = new LongProgress(section, {
      bytes: { capPct: 25 },
      phases: [
        { step: 'after-upload', fillPct: 50, durationMs: 300 }, // fires at t=0, runs until t=300
        { step: 'much-later', fillPct: 60, durationMs: 100 }, // fires at t=300
      ],
    });
    lp.start();

    lp.setBytesProgress(1);
    await vi.advanceTimersByTimeAsync(150); // mid phase[0]
    expect(section.querySelector('.long-progress-step').textContent).toBe('after-upload');

    // Second 1.0 call — phases should NOT re-arm at a new t=0
    lp.setBytesProgress(1);
    await vi.advanceTimersByTimeAsync(200); // total 350ms — past phase[1] start
    expect(section.querySelector('.long-progress-step').textContent).toBe('much-later');

    // …and 100ms later, no spurious re-fire of phase[0] reverting us
    await vi.advanceTimersByTimeAsync(100);
    expect(section.querySelector('.long-progress-step').textContent).toBe('much-later');
  });

  it('ignores NaN and out-of-range fractions safely', () => {
    const section = makeSection();
    const lp = new LongProgress(section, { bytes: { capPct: 100 }, phases: [] });
    lp.start();
    lp.setBytesProgress(NaN);
    lp.setBytesProgress(-1);
    expect(section.querySelector('.long-progress-bar').getAttribute('aria-valuenow')).toBe('0');
    lp.setBytesProgress(2); // clamped to 1
    expect(section.querySelector('.long-progress-bar').getAttribute('aria-valuenow')).toBe('100');
  });

  it('setBytesProgress is a no-op when bytes mode is not configured', () => {
    const section = makeSection();
    const lp = new LongProgress(section);
    lp.start();
    lp.setBytesProgress(0.5);
    // bar shouldn't reflect bytes input since phase[0] already fired at 0ms
    // initially. The valuenow should still be 0 or phase[0]'s fillPct.
    const valuenow = section.querySelector('.long-progress-bar').getAttribute('aria-valuenow');
    expect(['0', '30']).toContain(valuenow); // 0 before phase fires, 30 after
  });

  it('rejects invalid bytes.capPct at construction', () => {
    const section = makeSection();
    expect(() => new LongProgress(section, { bytes: { capPct: 0 } })).toThrow(RangeError);
    expect(() => new LongProgress(section, { bytes: { capPct: 150 } })).toThrow(RangeError);
  });
});

describe('LongProgress — start guards', () => {
  it('is idempotent — calling start() twice does not double-save innerHTML', () => {
    const section = makeSection('<form id="orig"></form>');
    const lp = new LongProgress(section);
    lp.start();
    lp.start(); // second call should be a no-op
    lp.restore();
    expect(section.querySelector('#orig')).not.toBeNull();
  });

  it('throws if section is not an Element', () => {
    expect(() => new LongProgress(null)).toThrow(TypeError);
    expect(() => new LongProgress('div')).toThrow(TypeError);
  });
});

describe('LongProgress — bindHtmx', () => {
  it('wires beforeRequest → start, beforeSwap → fastForward', async () => {
    const section = makeSection();
    const form = document.createElement('form');
    document.body.appendChild(form);
    const lp = new LongProgress(section);
    lp.bindHtmx(form);

    form.dispatchEvent(new CustomEvent('htmx:beforeRequest'));
    expect(section.querySelector('.long-progress')).not.toBeNull();

    form.dispatchEvent(new CustomEvent('htmx:beforeSwap'));
    await vi.advanceTimersByTimeAsync(200);
    expect(section.querySelector('.long-progress-bar').getAttribute('aria-valuenow')).toBe('100');
  });

  it('wires error events to restore() with the configured message', () => {
    const section = makeSection('<form id="orig"></form>');
    const form = document.createElement('form');
    document.body.appendChild(form);
    const lp = new LongProgress(section);
    lp.bindHtmx(form, {
      errorMessages: {
        responseError: (e) => `HTTP ${e.detail.xhr.status}`,
        sendError: 'No network',
        timeout: 'Too slow',
      },
    });

    form.dispatchEvent(new CustomEvent('htmx:beforeRequest'));
    form.dispatchEvent(new CustomEvent('htmx:responseError', { detail: { xhr: { status: 500 } } }));

    expect(section.querySelector('#orig')).not.toBeNull();
    expect(section.querySelector('.admonition-danger').textContent).toContain('HTTP 500');
  });

  it('unbind detaches all listeners', () => {
    const section = makeSection();
    const form = document.createElement('form');
    document.body.appendChild(form);
    const lp = new LongProgress(section);
    const unbind = lp.bindHtmx(form);

    unbind();
    form.dispatchEvent(new CustomEvent('htmx:beforeRequest'));
    expect(section.querySelector('.long-progress')).toBeNull();
  });
});
