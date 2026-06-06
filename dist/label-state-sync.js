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
 * ### `data-state-for` override
 *
 * When the markup is broken — a `<label for="X">` whose `#X` doesn't
 * exist, or whose `#X` is a wrapper around the real controls — add
 * `data-state-for="<id> [<id> …]"` to the label. The override replaces
 * `for` as the source-of-truth for state mirroring (the native `for`
 * attribute keeps its click-to-focus / accessibility role, even if the id
 * is wrong). Multiple ids combine with ANY semantics: if *any* listed
 * target is disabled / invalid / focused, the label gets the matching
 * attribute. Same logic across all three bindings.
 *
 * Example (amember swap-input pattern, where one of two controls is
 * shown and the other is `display: none`):
 *
 *     <label for="grp-state" data-state-for="f_state t_state">State</label>
 *     <select id="f_state" disabled>…</select>
 *     <input id="t_state" disabled style="display: none">
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
const OBSERVED_ATTRS = [...new Set([...SOURCE_ATTRS, 'for', 'id', 'data-state-for'])];
const USES_FOCUS_EVENTS = STATE_BINDINGS.some((b) => b.usesFocusEvents);

/** Selector for every label this module manages — either via the native
 *  `for` attribute or the `data-state-for` override. */
const LABEL_SELECTOR = 'label[for], label[data-state-for]';

/**
 * @typedef {Object} LabelStateSyncOptions
 * @property {HTMLElement} [root=document.body] - Scope for label/input pairs.
 *   Useful when a page hosts multiple unrelated forms and you only want to
 *   sync within one.
 */

/**
 * Resolve a label's state-mirroring target(s). When `data-state-for` is
 * set, it wins — `for` is treated as broken markup (still useful for the
 * browser's click-to-focus, but not for state). Otherwise fall back to
 * `for`. Either source may list multiple ids (space-separated); missing
 * ids are silently dropped so partial markup degrades gracefully.
 *
 * @param {HTMLLabelElement} label
 * @returns {HTMLElement[]}
 */
function resolveTargets(label) {
  const idSource = label.getAttribute('data-state-for') ?? label.getAttribute('for');
  if (!idSource) return [];
  const doc = label.ownerDocument;
  const targets = [];
  for (const id of idSource.split(/\s+/)) {
    if (!id) continue;
    const el = doc.getElementById(id);
    if (el) targets.push(el);
  }
  return targets;
}

/**
 * Does this label mirror state from the input with the given id? Used by
 * the per-input re-sync path so we don't have to build escaped CSS
 * selectors against arbitrary id values (HTML5 ids can legally contain
 * `.`, `:`, `#`, etc.).
 *
 * @param {HTMLLabelElement} label
 * @param {string} id
 */
function labelTargetsId(label, id) {
  const override = label.getAttribute('data-state-for');
  if (override !== null) {
    return override.split(/\s+/).includes(id);
  }
  return label.htmlFor === id;
}

/**
 * Sync every managed label inside `root` once.
 *
 * @param {ParentNode} root
 */
function syncAll(root) {
  const labels = root.querySelectorAll(LABEL_SELECTOR);
  for (const label of labels) {
    syncOne(label);
  }
}

/**
 * Sync a single label against its resolved target(s) across every
 * binding. Multi-target labels (via `data-state-for="a b c"`) use ANY
 * semantics — the label gets the state attribute if any listed target is
 * in that state. For the single-target case this collapses to the same
 * behavior as a direct read.
 *
 * @param {HTMLLabelElement} label
 */
function syncOne(label) {
  const targets = resolveTargets(label);
  if (targets.length === 0) return;
  for (const binding of STATE_BINDINGS) {
    label.toggleAttribute(
      binding.labelAttr,
      targets.some((t) => binding.read(t)),
    );
  }
}

/**
 * For every label that targets the given input (via `for` or
 * `data-state-for`), re-sync it. Walks all managed labels and asks
 * `labelTargetsId` per label instead of building a selector — avoids
 * needing to CSS-escape arbitrary id values.
 *
 * @param {HTMLElement} input
 */
function syncLabelsFor(input) {
  if (!input.id) return;
  const labels = input.ownerDocument.querySelectorAll(LABEL_SELECTOR);
  for (const label of labels) {
    if (labelTargetsId(/** @type {HTMLLabelElement} */ (label), input.id)) {
      syncOne(/** @type {HTMLLabelElement} */ (label));
    }
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
        if (
          (mutation.attributeName === 'for' || mutation.attributeName === 'data-state-for') &&
          target.tagName === 'LABEL'
        ) {
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
        if (
          el.tagName === 'LABEL' &&
          (el.hasAttribute('for') || el.hasAttribute('data-state-for'))
        ) {
          syncOne(/** @type {HTMLLabelElement} */ (el));
        }
        if (el.id) {
          syncLabelsFor(el);
        }
        // Added subtree may contain labels and inputs.
        for (const label of el.querySelectorAll?.(LABEL_SELECTOR) ?? []) {
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
    const labels = target.ownerDocument.querySelectorAll(LABEL_SELECTOR);
    for (const label of labels) {
      if (!labelTargetsId(/** @type {HTMLLabelElement} */ (label), target.id)) continue;
      // Multi-target labels (via `data-state-for="a b c"`): when focus
      // moves between sibling targets, the sequence is focusout(A) →
      // focusin(B). The intermediate `focused=false` set on focusout
      // happens inside a single synchronous task and is never painted
      // before focusin re-asserts true, so event-type read stays
      // correct without bringing back the jsdom/spec timing bug that
      // `readFromEvent` was written to defeat.
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
