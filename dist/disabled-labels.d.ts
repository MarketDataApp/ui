/**
 * Initialize the disabled-label sync.
 *
 * Idempotent per `root`: calling again returns a fresh observer (callers
 * should reuse the returned cleanup rather than re-init). Runs an initial
 * pass on call so existing disabled inputs are reflected immediately.
 *
 * Watches for:
 * - `disabled` attribute changes on any element under `root`
 * - `for` attribute changes on label elements
 * - `id` attribute changes on input/control elements
 * - New nodes added (labels or inputs) anywhere in the subtree
 *
 * @param {DisabledLabelsOptions} [options]
 * @returns {() => void} Cleanup function that disconnects the observer.
 */
export function initDisabledLabels({ root }?: DisabledLabelsOptions): () => void;
export type DisabledLabelsOptions = {
    /**
     * - Scope for label/input pairs.
     * Useful when a page hosts multiple unrelated forms and you only want to
     * sync within one.
     */
    root?: HTMLElement;
};
