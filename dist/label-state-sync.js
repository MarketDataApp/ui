// Auto-generated from src/ by scripts/build-js.js — do not edit manually

/**
 * @module label-state-sync
 * Mirrors form-control states onto associated `<label for="">` elements by
 * toggling matching attributes on the label. Currently three states are
 * mirrored:
 *
 * - `:disabled` on the control → `disabled` attribute on the label
 * - `aria-invalid="true"` on the control → `error` attribute on the label
 * - `:focus` on the control → `focused` attribute on the label
 *
 * The kit's existing CSS handles the *adjacent-sibling* case
 * (`input:disabled ~ label`) and the *wrapping-label* case
 * (`label:has(input:disabled)`). Both require label and input to share a
 * parent — they don't help when a `<label for="X">` lives in a different
 * container from `#X`, or when a single legend-style label sits next to
 * a radio group where only some inputs are in the state. The same gap
 * exists for the error and focus states: no CSS selector can target a
 * label in a different parent based on its target's `aria-invalid` or
 * `:focus`.
 *
 * CSS can't express "label with for=X, where #X is :disabled" — there's no
 * way to compare an attribute value against another element's id in a
 * selector. So this helper resolves the link in JS: walk every
 * `label[for]` under `root`, look up its target via `getElementById`, and
 * toggle each state attribute on the label. A MutationObserver keeps
 * attribute-driven state in sync; `focusin`/`focusout` listeners on `root`
 * cover the focus state since `:focus` isn't an attribute the observer
 * can see.
 *
 * The CSS for the disabled-label, error-label, and focused-label
 * appearance lives in `components.src.css` (`label[disabled]`,
 * `label[error]`, `label[focused]`).
 */

/**
 * @typedef {Object} StateBinding
 * @property {string} labelAttr - Attribute toggled on the label.
 * @property {string} [sourceAttr] - Attribute observed on the target
 *   control. Listed in the MutationObserver's `attributeFilter`. Omit for
 *   states that aren't reflected as attributes (e.g. `:focus`) — see
 *   `usesFocusEvents`.
 * @property {boolean} [usesFocusEvents] - When true, the binding is
 *   re-evaluated on `focusin` / `focusout` rather than via the
 *   MutationObserver. Required for states like `:focus` that aren't
 *   exposed as attributes.
 * @property {(el: HTMLElement) => boolean} read - Reads the state from the
 *   target control. The label attribute is set when this returns true and
 *   cleared otherwise. Used by `syncOne()` for the initial pass and any
 *   attribute-driven re-sync.
 * @property {(event: Event) => boolean} [readFromEvent] - Reads the state
 *   from a focus event. Required when `usesFocusEvents` is true. Used in
 *   place of `read` inside the focus-event handler because the
 *   synchronous DOM state (e.g. `document.activeElement`) is unreliable
 *   during `focusout` — the spec lets browsers fire `focusout` while
 *   activeElement still points at the element losing focus.
 */

/**
 * Single formula: each label[for] is resolved once, then each binding is
 * evaluated against the target. Adding a new state to mirror is a matter
 * of pushing one entry here — the scan and add-node handling flow from
 * this table; the observer / focus-listener wiring picks the right signal
 * source based on `sourceAttr` / `usesFocusEvents`.
 *
 * @type {StateBinding[]}
 */
const STATE_BINDINGS = [
  {
    labelAttr: 'disabled',
    sourceAttr: 'disabled',
    read: (el) => !!el.disabled,
  },
  {
    labelAttr: 'error',
    sourceAttr: 'aria-invalid',
    read: (el) => el.getAttribute('aria-invalid') === 'true',
  },
  {
    labelAttr: 'focused',
    usesFocusEvents: true,
    // Initial-pass read: at boot time there's no focus event in hand, so
    // we have to ask the DOM what's currently focused.
    read: (el) => el === el.ownerDocument.activeElement,
    // Focus-event read: derive directly from the event type. Don't
    // re-check activeElement here — at the moment `focusout` dispatches,
    // some browsers still report the blurring element as
    // activeElement, so the state appears stuck-on. The event type
    // itself is unambiguous.
    readFromEvent: (event) => event.type === 'focusin',
  },
];

const SOURCE_ATTRS = new Set(STATE_BINDINGS.filter((b) => b.sourceAttr).map((b) => b.sourceAttr));
const OBSERVED_ATTRS = [...new Set([...SOURCE_ATTRS, 'for', 'id'])];
const USES_FOCUS_EVENTS = STATE_BINDINGS.some((b) => b.usesFocusEvents);

/**
 * @typedef {Object} LabelStateSyncOptions
 * @property {HTMLElement} [root=document.body] - Scope for label/input pairs.
 *   Useful when a page hosts multiple unrelated forms and you only want to
 *   sync within one.
 */

/**
 * Sync every `label[for]` inside `root` once.
 *
 * @param {ParentNode} root
 */
function syncAll(root) {
  const labels = root.querySelectorAll('label[for]');
  for (const label of labels) {
    syncOne(label);
  }
}

/**
 * Sync a single label against its `for=""` target across every binding.
 * Resolution uses `getElementById` on the document so the input can live
 * anywhere — the cross-container case is the whole reason this helper exists.
 *
 * @param {HTMLLabelElement} label
 */
function syncOne(label) {
  const id = label.getAttribute('for');
  if (!id) return;
  const target = label.ownerDocument.getElementById(id);
  if (!target) return;
  for (const binding of STATE_BINDINGS) {
    label.toggleAttribute(binding.labelAttr, binding.read(target));
  }
}

/**
 * For every label[for] that points at the given input, re-sync it. Walks
 * `label[for]` and compares `htmlFor` directly instead of building a
 * selector — avoids needing to CSS-escape arbitrary id values (which can
 * legally contain `.`, `:`, `#`, etc. in HTML5).
 *
 * @param {HTMLElement} input
 */
function syncLabelsFor(input) {
  if (!input.id) return;
  const labels = input.ownerDocument.querySelectorAll('label[for]');
  for (const label of labels) {
    if (label.htmlFor === input.id) syncOne(label);
  }
}

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
export function initLabelStateSync({ root = document.body } = {}) {
  if (!root) return () => {};

  syncAll(root);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes') {
        const target = /** @type {HTMLElement} */ (mutation.target);
        if (mutation.attributeName === 'for' && target.tagName === 'LABEL') {
          syncOne(/** @type {HTMLLabelElement} */ (target));
        } else if (mutation.attributeName === 'id') {
          // An input's id changed — labels that pointed at the *old* id are
          // now stale, but we can't recover the old id from a MutationRecord
          // to clear them. The labels that point at the *new* id need to be
          // synced fresh.
          syncLabelsFor(target);
        } else if (SOURCE_ATTRS.has(mutation.attributeName)) {
          // An input's state flipped — re-sync every label that points at it.
          syncLabelsFor(target);
        }
        continue;
      }

      // childList — new nodes added.
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        const el = /** @type {HTMLElement} */ (node);
        if (el.tagName === 'LABEL' && el.hasAttribute('for')) {
          syncOne(/** @type {HTMLLabelElement} */ (el));
        }
        if (el.id) {
          syncLabelsFor(el);
        }
        // Added subtree may contain labels and inputs.
        for (const label of el.querySelectorAll?.('label[for]') ?? []) {
          syncOne(/** @type {HTMLLabelElement} */ (label));
        }
        for (const input of el.querySelectorAll?.('[id]') ?? []) {
          syncLabelsFor(/** @type {HTMLElement} */ (input));
        }
      }
    }
  });

  observer.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: OBSERVED_ATTRS,
  });

  // Focus state isn't an attribute, so the MutationObserver can't see it.
  // `focusin` / `focusout` bubble (unlike `focus` / `blur`), so a single
  // pair of listeners on `root` covers every input in the subtree. We
  // can't just call `syncLabelsFor(target)` and re-run every binding's
  // `read()` — at `focusout` time, `document.activeElement` may still
  // report the blurring element as focused, which leaves `[focused]`
  // stuck on. Instead, route focus events through each binding's
  // dedicated `readFromEvent` and only touch the bindings that opted in
  // via `usesFocusEvents`.
  const onFocusChange = (event) => {
    const target = /** @type {HTMLElement} */ (event.target);
    if (!target.id) return;
    const labels = target.ownerDocument.querySelectorAll('label[for]');
    for (const label of labels) {
      if (label.htmlFor !== target.id) continue;
      for (const binding of STATE_BINDINGS) {
        if (!binding.usesFocusEvents) continue;
        label.toggleAttribute(binding.labelAttr, binding.readFromEvent(event));
      }
    }
  };
  if (USES_FOCUS_EVENTS) {
    root.addEventListener('focusin', onFocusChange);
    root.addEventListener('focusout', onFocusChange);
  }

  return () => {
    observer.disconnect();
    if (USES_FOCUS_EVENTS) {
      root.removeEventListener('focusin', onFocusChange);
      root.removeEventListener('focusout', onFocusChange);
    }
  };
}
