/**
 * @module long-progress
 * Reusable long-running progress card that takes over a section while a
 * long (10–30s) POST is in flight.
 *
 * Animates a fake-but-realistic timeline of step text + progress-bar fill,
 * with an optional real-progress signal for upload bytes. On success the
 * bar fast-forwards to 100% so the host's content swap feels intentional.
 * On error the original section markup is restored and a danger admonition
 * banner is inserted, so the user can retry without losing their input.
 *
 * Minimal usage — every option has a sensible default:
 *
 *   const lp = new LongProgress(sectionEl);
 *   lp.start();             // mounts the card
 *   await lp.fastForward(); // fills to 100% on success
 *   lp.restore('Sorry, the request failed. Please try again.');
 */

const DEFAULT_PHASES = [
  { step: 'Working…', fillPct: 30, durationMs: 4000 },
  { step: 'Almost there…', fillPct: 65, durationMs: 8000 },
  { step: 'Finishing up…', fillPct: 85, durationMs: 10000 },
  { step: 'Still working — this is taking longer than usual…', fillPct: 92, durationMs: 15000 },
];

const DEFAULT_HINT = "<strong>Don't refresh.</strong> This usually takes 10–20 seconds.";

// Heroicons mini "exclamation-triangle" (20×20). Inline so we don't have to
// ship a separate icon file or template; sized via .long-progress-hint-icon.
const HINT_ICON_SVG =
  '<svg class="long-progress-hint-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">' +
  '<path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />' +
  '</svg>';
const DEFAULT_DONE_STEP = 'Done';
const DEFAULT_BYTES_STEP = 'Uploading…';
const BYTES_FILL_DURATION_MS = 200;
const FAST_FORWARD_DEFAULT_MS = 200;

// Map barVariant option → modifier class applied alongside .progress-bar-fill.
// 'orange' is the bare .progress-bar-fill default (brand orange gradient) and
// gets no modifier; the others select a -blue gradient or solid Flowbite
// semantic color. Default is 'info' to preserve the prior solid-blue look.
const BAR_VARIANT_CLASSES = {
  orange: '',
  blue: 'progress-bar-fill-blue',
  info: 'progress-bar-fill-info',
  success: 'progress-bar-fill-success',
  danger: 'progress-bar-fill-danger',
};
const DEFAULT_BAR_VARIANT = 'info';

/**
 * @typedef {Object} Phase
 * @property {string} step - Step text shown when this phase fires.
 * @property {number} fillPct - Bar fill percentage to animate to (0–100).
 * @property {number} durationMs - How long this phase runs. The bar
 *   fills from the previous phase's fillPct to this phase's fillPct
 *   over this duration. The next phase fires when this one ends.
 *   Phases run back-to-back starting at t=0 (or at upload-complete in
 *   bytes mode).
 */

/**
 * @typedef {Object} BytesOptions
 * @property {number} capPct - Fraction of the bar (1–100) that real upload
 *   bytes occupy before time-driven phases take over.
 * @property {string} [step='Uploading…'] - Step text shown during upload.
 */

/**
 * @typedef {'orange' | 'blue' | 'info' | 'success' | 'danger'} BarVariant
 */

/**
 * @typedef {Object} LongProgressOptions
 * @property {string | null} [hint] - Warning text directly under the bar.
 *   Rendered via innerHTML so the default can include <strong> for
 *   emphasis on "Do not refresh." Caller must ensure this contains no
 *   untrusted input — never pass user-supplied text here.
 * @property {Phase[]} [phases] - Time-driven simulation. Defaults to a
 *   generic 4-phase ~22s timeline. Pass [] to disable (pure upload mode).
 * @property {BytesOptions | null} [bytes] - Enables bytes mode for upload
 *   surfaces. Off by default.
 * @property {boolean} [inline=false] - true uses .long-progress-inline
 *   layout (in-list row instead of centered card).
 * @property {string | null} [errorInsertBefore=null] - CSS selector inside
 *   the restored DOM to insert the error banner before. Falls back to
 *   appending to the section.
 * @property {string} [doneStep='Done'] - Step text shown briefly during
 *   fastForward().
 * @property {BarVariant} [barVariant='info'] - Fill color. `'orange'` and
 *   `'blue'` are the kit's brand gradients (same as `btn-orange-to-blue` /
 *   `btn-blue-to-orange` resting states). `'info'`, `'success'`, `'danger'`
 *   are solid Flowbite semantic colors with auto dark-mode handling.
 *   Default `'info'` matches the prior solid-blue look.
 */

/**
 * @typedef {Object} HtmxBindOptions
 * @property {{
 *   responseError?: string | ((evt: Event) => string),
 *   sendError?:     string | ((evt: Event) => string),
 *   timeout?:       string | ((evt: Event) => string),
 * }} [errorMessages]
 */

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export class LongProgress {
  #section;
  #opts;
  #savedHtml = null;
  #timers = [];
  #cardEl = null;
  #barEl = null;
  #fillEl = null;
  #stepEl = null;
  #bytesPct = 0;
  #phasesStarted = false;
  // 'idle' → 'running' → ('done' | 'restored')
  #state = 'idle';

  /**
   * @param {Element} section - The DOM element to take over.
   * @param {LongProgressOptions} [opts]
   */
  constructor(section, opts = {}) {
    if (!(section instanceof Element)) {
      throw new TypeError('LongProgress: section must be an Element');
    }
    /** @type {Required<LongProgressOptions>} */
    this.#opts = {
      hint: opts.hint === null ? null : (opts.hint ?? DEFAULT_HINT),
      phases: opts.phases ?? DEFAULT_PHASES,
      bytes: opts.bytes ? normalizeBytes(opts.bytes) : null,
      inline: !!opts.inline,
      errorInsertBefore: opts.errorInsertBefore ?? null,
      doneStep: opts.doneStep ?? DEFAULT_DONE_STEP,
      barVariant: normalizeBarVariant(opts.barVariant),
    };
    this.#section = section;
  }

  /**
   * Mount the progress card and start the timeline (or, in bytes mode,
   * arm bytes input and wait for setBytesProgress(1) to start phases).
   * Subsequent calls are a no-op until restore() resets state.
   */
  start() {
    if (this.#state !== 'idle') return;
    this.#state = 'running';
    this.#savedHtml = this.#section.innerHTML;
    this.#section.innerHTML = this.#renderCard();
    this.#cardEl = this.#section.querySelector('.long-progress');
    this.#barEl = this.#section.querySelector('.long-progress-bar');
    this.#fillEl = this.#section.querySelector('.long-progress-bar-fill');
    this.#stepEl = this.#section.querySelector('.long-progress-step');
    if (!this.#opts.bytes) {
      this.#startPhases();
    }
  }

  /**
   * Update the bar from a real upload byte-progress signal.
   * `fraction` is in [0, 1]; the bar fills to `fraction * bytes.capPct`.
   * Monotonic — passing a smaller value than current does not regress.
   * When fraction reaches 1, the time-driven phase timeline starts
   * automatically.
   *
   * @param {number} fraction
   */
  setBytesProgress(fraction) {
    if (this.#state !== 'running' || !this.#opts.bytes) return;
    if (typeof fraction !== 'number' || Number.isNaN(fraction)) return;
    fraction = Math.max(0, Math.min(1, fraction));
    const newFill = fraction * this.#opts.bytes.capPct;
    if (newFill > this.#bytesPct) {
      this.#bytesPct = newFill;
      this.#setFill(newFill, BYTES_FILL_DURATION_MS);
    }
    if (fraction >= 1 && !this.#phasesStarted) {
      this.#startPhases();
    }
  }

  /**
   * Manual trigger for the phase timeline. Use when you want to kick off
   * phases on `xhr.upload.onloadstart` instead of waiting for the last
   * progress event. No-op if already started or not running.
   */
  startPhases() {
    if (this.#state !== 'running') return;
    this.#startPhases();
  }

  /**
   * Cancel pending phases, fill the bar to 100% over `holdMs`, and set
   * the step text to the configured doneStep. Returns a promise that
   * resolves after the transition so callers can `await` before swapping
   * content.
   *
   * @param {{ holdMs?: number }} [opts]
   * @returns {Promise<void>}
   */
  fastForward({ holdMs = FAST_FORWARD_DEFAULT_MS } = {}) {
    if (this.#state !== 'running') return Promise.resolve();
    this.#state = 'done';
    this.#clearTimers();
    if (this.#stepEl) this.#stepEl.textContent = this.#opts.doneStep;
    this.#setFill(100, holdMs);
    return new Promise((resolve) => setTimeout(resolve, holdMs));
  }

  /**
   * Restore the section's original markup and (optionally) insert a
   * danger admonition banner with `message`. Calls window.htmx.process()
   * on the restored section if HTMX is loaded. Idempotent.
   *
   * @param {string} [message]
   */
  restore(message) {
    if (this.#state === 'idle' || this.#state === 'restored') return;
    this.#state = 'restored';
    this.#clearTimers();
    if (this.#savedHtml !== null) {
      this.#section.innerHTML = this.#savedHtml;
      this.#savedHtml = null;
      if (typeof window !== 'undefined' && window.htmx && window.htmx.process) {
        window.htmx.process(this.#section);
      }
    }
    this.#cardEl = this.#barEl = this.#fillEl = this.#stepEl = null;
    if (message) {
      const banner = this.#renderErrorBanner(message);
      const target = this.#opts.errorInsertBefore
        ? this.#section.querySelector(this.#opts.errorInsertBefore)
        : null;
      if (target && target.parentNode) {
        target.parentNode.insertBefore(banner, target);
      } else {
        this.#section.appendChild(banner);
      }
    }
  }

  /**
   * Wire HTMX lifecycle events on a form element to start/fastForward/
   * restore. Returns an unbind function.
   *
   * @param {Element} formEl
   * @param {HtmxBindOptions} [opts]
   * @returns {() => void}
   */
  bindHtmx(formEl, { errorMessages = {} } = {}) {
    const pick = (key, evt) => {
      const v = errorMessages[key];
      return typeof v === 'function' ? v(evt) : v;
    };
    const handlers = {
      'htmx:beforeRequest': () => this.start(),
      'htmx:beforeSwap': () => this.fastForward(),
      'htmx:responseError': (e) => this.restore(pick('responseError', e)),
      'htmx:sendError': (e) => this.restore(pick('sendError', e)),
      'htmx:timeout': (e) => this.restore(pick('timeout', e)),
    };
    for (const [evt, fn] of Object.entries(handlers)) {
      formEl.addEventListener(evt, fn);
    }
    return () => {
      for (const [evt, fn] of Object.entries(handlers)) {
        formEl.removeEventListener(evt, fn);
      }
    };
  }

  // ---- private ------------------------------------------------------------

  #startPhases() {
    if (this.#phasesStarted) return;
    this.#phasesStarted = true;
    // Phases run back-to-back: each one fires when the previous ends,
    // so its start offset is the cumulative sum of prior durationMs.
    let startAt = 0;
    for (const phase of this.#opts.phases) {
      const at = startAt;
      const id = setTimeout(() => {
        if (this.#state !== 'running') return;
        if (this.#stepEl && phase.step) this.#stepEl.textContent = phase.step;
        this.#setFill(phase.fillPct, phase.durationMs);
      }, at);
      this.#timers.push(id);
      startAt += phase.durationMs;
    }
  }

  #setFill(pct, durationMs) {
    if (!this.#cardEl || !this.#barEl || !this.#fillEl) return;
    const clamped = Math.max(0, Math.min(100, pct));
    const rounded = Math.round(clamped);
    this.#cardEl.style.setProperty('--long-progress-fill-duration', `${durationMs}ms`);
    // Bar width: smooth sub-pixel transition via standard width animation.
    this.#fillEl.style.width = `${clamped}%`;
    // Counter: integer custom property (registered as @property <integer>),
    // transitions in lockstep with the bar over the same duration. The
    // counter() in .long-progress-percent::after reads this and steps
    // through 1, 2, 3, … to target.
    this.#cardEl.style.setProperty('--long-progress-pct', String(rounded));
    this.#barEl.setAttribute('aria-valuenow', String(rounded));
  }

  #clearTimers() {
    for (const id of this.#timers) clearTimeout(id);
    this.#timers = [];
  }

  #renderCard() {
    const initialStep = this.#opts.bytes
      ? this.#opts.bytes.step
      : (this.#opts.phases[0]?.step ?? '');
    const inlineCls = this.#opts.inline ? ' long-progress-inline' : '';
    // Layout: header row (step left + percent right) → bar → warning hint.
    // The step text lives in the header and updates in place as phases
    // fire — it's the most informative thing on the card, so it owns the
    // prominent top-left position. Percent text is CSS-generated via
    // counter() in .long-progress-percent::after; leave the span empty.
    const headerHtml = `<div class="long-progress-header"><p class="long-progress-step">${escapeHtml(initialStep)}</p><span class="long-progress-percent"></span></div>`;
    const hintHtml =
      this.#opts.hint !== null
        ? `<p class="long-progress-hint">${HINT_ICON_SVG}<span>${this.#opts.hint}</span></p>`
        : '';
    const variantCls = BAR_VARIANT_CLASSES[this.#opts.barVariant];
    const fillCls = `progress-bar-fill${variantCls ? ' ' + variantCls : ''} long-progress-bar-fill`;
    return `<div class="long-progress${inlineCls}" role="status" aria-live="polite">${headerHtml}<div class="progress-bar long-progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="${fillCls}"></div></div>${hintHtml}</div>`;
  }

  #renderErrorBanner(message) {
    const div = document.createElement('div');
    div.className = 'admonition admonition-danger';
    div.setAttribute('role', 'alert');
    div.innerHTML = `<div class="admonition-content"><p>${escapeHtml(message)}</p></div>`;
    return div;
  }
}

function normalizeBytes(bytes) {
  const cap = bytes.capPct;
  if (typeof cap !== 'number' || cap <= 0 || cap > 100) {
    throw new RangeError('LongProgress: bytes.capPct must be > 0 and <= 100');
  }
  return { capPct: cap, step: bytes.step ?? DEFAULT_BYTES_STEP };
}

function normalizeBarVariant(variant) {
  if (variant === undefined) return DEFAULT_BAR_VARIANT;
  if (!(variant in BAR_VARIANT_CLASSES)) {
    const allowed = Object.keys(BAR_VARIANT_CLASSES).join(', ');
    throw new RangeError(`LongProgress: barVariant must be one of ${allowed}`);
  }
  return variant;
}
