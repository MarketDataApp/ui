/**
 * Initialize the label-state sync.
 *
 * Idempotent per `root`: calling again returns a fresh observer (callers
 * should reuse the returned cleanup rather than re-init). Runs an initial
 * pass on call so existing states are reflected immediately.
 *
 * Watches for:
 * - Source attribute changes on any element under `root`
 *   (`disabled`, `aria-invalid`)
 * - `for` attribute changes on label elements
 * - `id` attribute changes on input/control elements
 * - New nodes added (labels or inputs) anywhere in the subtree
 *
 * @param {LabelStateSyncOptions} [options]
 * @returns {() => void} Cleanup function that disconnects the observer.
 */
export function initLabelStateSync({ root }?: LabelStateSyncOptions): () => void;
export type LabelStateSyncOptions = {
    /**
     * - Scope for label/input pairs.
     * Useful when a page hosts multiple unrelated forms and you only want to
     * sync within one.
     */
    root?: HTMLElement;
};
export type StateBinding = {
    /**
     * - Attribute toggled on the label.
     */
    labelAttr: string;
    /**
     * - Attribute observed on the target control.
     * Listed in the MutationObserver's `attributeFilter`.
     */
    sourceAttr: string;
    /**
     * - Reads the state from the
     * target control. The label attribute is set when this returns true and
     * cleared otherwise.
     */
    read: (el: HTMLElement) => boolean;
};
