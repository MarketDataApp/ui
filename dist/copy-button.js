// Auto-generated from src/ by scripts/build-js.js — do not edit manually

/**
 * @module copy-button
 * Copy-to-clipboard button overlaid on a text input.
 *
 * Markup contract (per instance):
 *   <div data-copy-input-group>
 *     <input data-copy-input ... />
 *     <button data-copy-button [data-copy-value="override"]>
 *       <span data-copy-default>...</span>
 *       <span data-copy-success hidden>...</span>
 *     </button>
 *   </div>
 *
 * On button click the script writes either `button.dataset.copyValue` or
 * `input.value` to the clipboard, then swaps the two state spans for ~2s.
 */

const SUCCESS_DURATION_MS = 2000;
const TOOLTIP_FADE_MS = 300;
const INIT_FLAG = 'copyInitialized';

/**
 * @typedef {Object} CopyButtonOptions
 * @property {ParentNode} [root=document] - Scope to search for groups
 */

/**
 * Initialize all copy buttons under `root`. Safe to call multiple times —
 * groups already wired are skipped.
 *
 * @param {CopyButtonOptions} [options]
 * @returns {() => void} Cleanup function — detaches listeners and clears pending resets
 */
export function initCopyButton({ root = document } = {}) {
  const teardowns = [];

  for (const group of root.querySelectorAll('[data-copy-input-group]')) {
    if (group.dataset[INIT_FLAG] === 'true') continue;

    const input = group.querySelector('[data-copy-input]');
    const button = group.querySelector('[data-copy-button]');
    const tooltip = group.querySelector('[data-copy-tooltip]');
    // Only the icon-only variant has a tooltip. When present, manage its
    // visibility state on the .copy-input-action wrapper so the tooltip
    // auto-hides at the end of the success window — even if the button
    // still has focus or the mouse is still over it.
    const action = tooltip ? button.closest('.copy-input-action') : null;

    // Split state spans by container: button-level (the icon) resets at the
    // 2s mark; tooltip-level (the text) resets only after the fade-out
    // completes, so the user never sees "Copy to clipboard" flicker through
    // the disappearing tooltip.
    const buttonDefaultEls = button ? button.querySelectorAll('[data-copy-default]') : [];
    const buttonSuccessEls = button ? button.querySelectorAll('[data-copy-success]') : [];
    const tooltipDefaultEls = tooltip ? tooltip.querySelectorAll('[data-copy-default]') : [];
    const tooltipSuccessEls = tooltip ? tooltip.querySelectorAll('[data-copy-success]') : [];

    if (!input || !button || buttonDefaultEls.length === 0 || buttonSuccessEls.length === 0)
      continue;

    let resetTimer = null;
    let tooltipResetTimer = null;
    // Track hover/focus manually instead of querying :hover/:focus pseudo-
    // selectors — dispatched events in jsdom don't update the pseudo-class
    // state, and manual tracking is just as accurate in real browsers.
    let hovering = false;
    let focused = false;

    const showSuccess = () => {
      for (const el of buttonDefaultEls) el.hidden = true;
      for (const el of buttonSuccessEls) el.hidden = false;
      for (const el of tooltipDefaultEls) el.hidden = true;
      for (const el of tooltipSuccessEls) el.hidden = false;
    };

    const resetButton = () => {
      for (const el of buttonDefaultEls) el.hidden = false;
      for (const el of buttonSuccessEls) el.hidden = true;
    };

    const resetTooltip = () => {
      for (const el of tooltipDefaultEls) el.hidden = false;
      for (const el of tooltipSuccessEls) el.hidden = true;
    };

    // Cooldown clears only when neither hover nor focus is engaged. If the
    // user is still hovering after blur (or still focused after mouseleave),
    // the tooltip stays hidden via the cooldown rule until they fully
    // disengage; the next hover/focus then shows the default tooltip again.
    const updateCooldown = () => {
      if (!action || action.dataset.copyState !== 'cooldown') return;
      if (!hovering && !focused) delete action.dataset.copyState;
    };

    const onMouseEnter = () => {
      hovering = true;
    };
    const onMouseLeave = () => {
      hovering = false;
      updateCooldown();
    };
    const onFocus = () => {
      focused = true;
    };
    const onBlur = () => {
      focused = false;
      updateCooldown();
    };

    const onClick = async () => {
      const value = button.dataset.copyValue ?? input.value;
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        return;
      }
      showSuccess();
      if (action) action.dataset.copyState = 'success';
      if (resetTimer !== null) clearTimeout(resetTimer);
      if (tooltipResetTimer !== null) {
        clearTimeout(tooltipResetTimer);
        tooltipResetTimer = null;
      }
      resetTimer = setTimeout(() => {
        resetButton();
        if (action) {
          action.dataset.copyState = 'cooldown';
          // Drop focus so the button doesn't trap the tooltip in a visible
          // state via :focus-within. If the user is still hovering, the
          // cooldown rule holds the tooltip hidden until they un-hover.
          button.blur();
          // Delay the tooltip's text reset until after the fade-out
          // finishes, so the tooltip stays showing "Copied!" right up
          // until it's invisible — never flickers back to default.
          tooltipResetTimer = setTimeout(() => {
            resetTooltip();
            tooltipResetTimer = null;
          }, TOOLTIP_FADE_MS);
        } else {
          // No tooltip on this variant — reset the (empty) tooltip state
          // immediately too, for symmetry.
          resetTooltip();
        }
        resetTimer = null;
      }, SUCCESS_DURATION_MS);
    };

    button.addEventListener('click', onClick);
    if (action) {
      action.addEventListener('mouseenter', onMouseEnter);
      action.addEventListener('mouseleave', onMouseLeave);
      button.addEventListener('focus', onFocus);
      button.addEventListener('blur', onBlur);
    }
    group.dataset[INIT_FLAG] = 'true';

    teardowns.push(() => {
      button.removeEventListener('click', onClick);
      if (action) {
        action.removeEventListener('mouseenter', onMouseEnter);
        action.removeEventListener('mouseleave', onMouseLeave);
        button.removeEventListener('focus', onFocus);
        button.removeEventListener('blur', onBlur);
        delete action.dataset.copyState;
      }
      if (resetTimer !== null) clearTimeout(resetTimer);
      if (tooltipResetTimer !== null) clearTimeout(tooltipResetTimer);
      delete group.dataset[INIT_FLAG];
    });
  }

  return () => {
    for (const fn of teardowns) fn();
  };
}
