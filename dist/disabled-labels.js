// Auto-generated from src/ by scripts/build-js.js — do not edit manually

/**
 * @module disabled-labels
 * Mirrors the `disabled` state of form controls onto their associated
 * `<label for="">` elements by toggling a `disabled` attribute on the label.
 *
 * The kit's existing CSS handles the *adjacent-sibling* case
 * (`input:disabled ~ label`) and the *wrapping-label* case
 * (`label:has(input:disabled)`). Both require label and input to share a
 * parent — they don't help when a `<label for="X">` lives in a different
 * container from `#X`, or when a single legend-style label sits next to
 * a radio group where only some inputs are disabled.
 *
 * CSS can't express "label with for=X, where #X is :disabled" — there's no
 * way to compare an attribute value against another element's id in a
 * selector. So this helper resolves the link in JS: walk every
 * `label[for]` under `root`, look up its target via `getElementById`, and
 * `toggleAttribute('disabled', target.disabled)` on the label. A
 * MutationObserver keeps the state in sync as inputs flip and as nodes are
 * added/removed.
 *
 * The CSS for the disabled-label appearance lives in `components.src.css`
 * (`.form-label[disabled]` / `label[disabled]`).
 */

/**
 * @typedef {Object} DisabledLabelsOptions
 * @property {HTMLElement} [root=document.body] - Scope for label/input pairs.
 *   Useful when a page hosts multiple unrelated forms and you only want to
 *   sync within one.
 */

/**
 * Sync every `label[for]` inside `root` once — read the target's disabled
 * state and reflect it onto the label.
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
 * Sync a single label against its `for=""` target. Resolution uses
 * `getElementById` on the document so the input can live anywhere — the
 * cross-container case is the whole reason this helper exists.
 *
 * @param {HTMLLabelElement} label
 */
function syncOne(label) {
  const id = label.getAttribute('for');
  if (!id) return;
  const target = label.ownerDocument.getElementById(id);
  if (!target) return;
  // `disabled` only has IDL meaning on form controls; reading it on other
  // elements is fine (undefined → falsy → no attribute).
  label.toggleAttribute('disabled', !!target.disabled);
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
export function initDisabledLabels({ root = document.body } = {}) {
  if (!root) return () => {};

  syncAll(root);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes') {
        const target = /** @type {HTMLElement} */ (mutation.target);
        if (mutation.attributeName === 'disabled') {
          // An input flipped — re-sync every label that points at it.
          syncLabelsFor(target);
        } else if (mutation.attributeName === 'for' && target.tagName === 'LABEL') {
          // Label's for="" changed — re-sync this one label against its
          // (possibly new) target.
          syncOne(/** @type {HTMLLabelElement} */ (target));
        } else if (mutation.attributeName === 'id') {
          // An input's id changed — labels that pointed at the *old* id are
          // now stale, but we can't recover the old id from a MutationRecord
          // to clear them. The labels that point at the *new* id need to be
          // synced fresh.
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
    attributeFilter: ['disabled', 'for', 'id'],
  });

  return () => observer.disconnect();
}
