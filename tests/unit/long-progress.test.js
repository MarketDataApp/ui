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
  { atMs: 0, step: 'starting', fillPct: 10, fillDurationMs: 100 },
  { atMs: 1000, step: 'middle', fillPct: 50, fillDurationMs: 500 },
  { atMs: 5000, step: 'late', fillPct: 90, fillDurationMs: 1000 },
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

    expect(section.querySelector('.long-progress-title').textContent).toBe('Working on it…');

    const bar = section.querySelector('.long-progress-bar');
    expect(bar.getAttribute('role')).toBe('progressbar');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
    expect(bar.getAttribute('aria-valuenow')).toBe('0');

    // Default hint contains the load-bearing "do not refresh" emphasis.
    const hint = section.querySelector('.long-progress-hint');
    expect(hint.querySelector('strong').textContent).toMatch(/do not refresh/i);
  });

  it('omits title when title: null is passed', () => {
    const section = makeSection();
    new LongProgress(section, { title: null }).start();
    expect(section.querySelector('.long-progress-title')).toBeNull();
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

  it('escapes the title to prevent XSS', () => {
    const section = makeSection();
    new LongProgress(section, { title: '<img src=x onerror=alert(1)>' }).start();
    const titleEl = section.querySelector('.long-progress-title');
    // textContent should contain the literal tag; no <img> should be parsed
    expect(titleEl.textContent).toBe('<img src=x onerror=alert(1)>');
    expect(titleEl.querySelector('img')).toBeNull();
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

  it('writes the per-phase fillDurationMs to the CSS custom property', async () => {
    const section = makeSection();
    new LongProgress(section, { phases: minimalPhases }).start();
    const fill = section.querySelector('.long-progress-bar-fill');

    await vi.advanceTimersByTimeAsync(0);
    expect(fill.style.getPropertyValue('--long-progress-fill-duration')).toBe('100ms');

    await vi.advanceTimersByTimeAsync(1000);
    expect(fill.style.getPropertyValue('--long-progress-fill-duration')).toBe('500ms');
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
        { atMs: 100, step: 'after-upload', fillPct: 50, fillDurationMs: 0 },
        { atMs: 200, step: 'much-later', fillPct: 60, fillDurationMs: 0 },
      ],
    });
    lp.start();

    lp.setBytesProgress(1);
    await vi.advanceTimersByTimeAsync(150); // fire phase[0] only
    expect(section.querySelector('.long-progress-step').textContent).toBe('after-upload');

    // Second 1.0 call — phases should NOT re-arm
    lp.setBytesProgress(1);
    await vi.advanceTimersByTimeAsync(50); // would fire phase[1] of a re-armed timeline
    expect(section.querySelector('.long-progress-step').textContent).toBe('much-later');

    // …and 100ms later, no re-fired phase[0] reverting us to 'after-upload'
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
