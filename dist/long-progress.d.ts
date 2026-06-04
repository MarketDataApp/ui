export class LongProgress {
    /**
     * @param {Element} section - The DOM element to take over.
     * @param {LongProgressOptions} [opts]
     */
    constructor(section: Element, opts?: LongProgressOptions);
    /**
     * Mount the progress card and start the timeline (or, in bytes mode,
     * arm bytes input and wait for setBytesProgress(1) to start phases).
     * Subsequent calls are a no-op until restore() resets state.
     */
    start(): void;
    /**
     * Update the bar from a real upload byte-progress signal.
     * `fraction` is in [0, 1]; the bar fills to `fraction * bytes.capPct`.
     * Monotonic — passing a smaller value than current does not regress.
     * When fraction reaches 1, the time-driven phase timeline starts
     * automatically.
     *
     * @param {number} fraction
     */
    setBytesProgress(fraction: number): void;
    /**
     * Manual trigger for the phase timeline. Use when you want to kick off
     * phases on `xhr.upload.onloadstart` instead of waiting for the last
     * progress event. No-op if already started or not running.
     */
    startPhases(): void;
    /**
     * Cancel pending phases, fill the bar to 100% over `holdMs`, and set
     * the step text to the configured doneStep. Returns a promise that
     * resolves after the transition so callers can `await` before swapping
     * content.
     *
     * @param {{ holdMs?: number }} [opts]
     * @returns {Promise<void>}
     */
    fastForward({ holdMs }?: {
        holdMs?: number;
    }): Promise<void>;
    /**
     * Restore the section's original markup and (optionally) insert a
     * danger admonition banner with `message`. Calls window.htmx.process()
     * on the restored section if HTMX is loaded. Idempotent.
     *
     * @param {string} [message]
     */
    restore(message?: string): void;
    /**
     * Wire HTMX lifecycle events on a form element to start/fastForward/
     * restore. Returns an unbind function.
     *
     * @param {Element} formEl
     * @param {HtmxBindOptions} [opts]
     * @returns {() => void}
     */
    bindHtmx(formEl: Element, { errorMessages }?: HtmxBindOptions): () => void;
    #private;
}
export type Phase = {
    /**
     * - Step text shown when this phase fires.
     */
    step: string;
    /**
     * - Bar fill percentage to animate to (0–100).
     */
    fillPct: number;
    /**
     * - How long this phase runs. The bar
     * fills from the previous phase's fillPct to this phase's fillPct
     * over this duration. The next phase fires when this one ends.
     * Phases run back-to-back starting at t=0 (or at upload-complete in
     * bytes mode).
     */
    durationMs: number;
};
export type BytesOptions = {
    /**
     * - Fraction of the bar (1–100) that real upload
     * bytes occupy before time-driven phases take over.
     */
    capPct: number;
    /**
     * - Step text shown during upload.
     */
    step?: string;
};
export type BarVariant = "orange" | "blue" | "info" | "success" | "danger";
export type LongProgressOptions = {
    /**
     * - Warning text directly under the bar.
     * Rendered via innerHTML so the default can include <strong> for
     * emphasis on "Do not refresh." Caller must ensure this contains no
     * untrusted input — never pass user-supplied text here.
     */
    hint?: string | null;
    /**
     * - Time-driven simulation. Defaults to a
     * generic 4-phase ~22s timeline. Pass [] to disable (pure upload mode).
     */
    phases?: Phase[];
    /**
     * - Enables bytes mode for upload
     * surfaces. Off by default.
     */
    bytes?: BytesOptions | null;
    /**
     * - true uses .long-progress-inline
     * layout (in-list row instead of centered card).
     */
    inline?: boolean;
    /**
     * - CSS selector inside
     * the restored DOM to insert the error banner before. Falls back to
     * appending to the section.
     */
    errorInsertBefore?: string | null;
    /**
     * - Step text shown briefly during
     * fastForward().
     */
    doneStep?: string;
    /**
     * - Fill color. `'orange'` and
     * `'blue'` are the kit's brand gradients (same as `btn-orange-to-blue` /
     * `btn-blue-to-orange` resting states). `'info'`, `'success'`, `'danger'`
     * are solid Flowbite semantic colors with auto dark-mode handling.
     * Default `'info'` matches the prior solid-blue look.
     */
    barVariant?: BarVariant;
};
export type HtmxBindOptions = {
    errorMessages?: {
        responseError?: string | ((evt: Event) => string);
        sendError?: string | ((evt: Event) => string);
        timeout?: string | ((evt: Event) => string);
    };
};
