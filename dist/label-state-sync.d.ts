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
 * - Focus changes inside `root` (`focusin` / `focusout`) for any
 *   focus-driven bindings
 * - `for` attribute changes on label elements
 * - `id` attribute changes on input/control elements
 * - New nodes added (labels or inputs) anywhere in the subtree
 *
 * @param {LabelStateSyncOptions} [options]
 * @returns {() => void} Cleanup function that disconnects the observer
 *   and any focus listeners.
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
     * - Attribute observed on the target
     * control. Listed in the MutationObserver's `attributeFilter`. Omit for
     * states that aren't reflected as attributes (e.g. `:focus`) — see
     * `usesFocusEvents`.
     */
    sourceAttr?: string;
    /**
     * - When true, the binding is
     * re-evaluated on `focusin` / `focusout` rather than via the
     * MutationObserver. Required for states like `:focus` that aren't
     * exposed as attributes.
     */
    usesFocusEvents?: boolean;
    /**
     * - Reads the state from the
     * target control. The label attribute is set when this returns true and
     * cleared otherwise. Used by `syncOne()` for the initial pass and any
     * attribute-driven re-sync.
     */
    read: (el: HTMLElement) => boolean;
    /**
     * - Reads the state
     * from a focus event. Required when `usesFocusEvents` is true. Used in
     * place of `read` inside the focus-event handler because the
     * synchronous DOM state (e.g. `document.activeElement`) is unreliable
     * during `focusout` — the spec lets browsers fire `focusout` while
     * activeElement still points at the element losing focus.
     */
    readFromEvent?: (event: Event) => boolean;
};
