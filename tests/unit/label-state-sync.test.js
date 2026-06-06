import { initLabelStateSync } from '../../dist/label-state-sync.js';

/** Flush MutationObserver callbacks (microtask-based in jsdom). */
async function flush() {
  await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
}

function makeLabel(forId, text = 'Label') {
  const label = document.createElement('label');
  label.setAttribute('for', forId);
  label.textContent = text;
  return label;
}

function makeInput(id, { disabled = false, invalid = false, type = 'text' } = {}) {
  const input = document.createElement('input');
  input.type = type;
  input.id = id;
  if (disabled) input.disabled = true;
  if (invalid) input.setAttribute('aria-invalid', 'true');
  return input;
}

describe('label-state-sync', () => {
  let cleanups;

  function init(options) {
    const cleanup = initLabelStateSync(options);
    cleanups.push(cleanup);
    return cleanup;
  }

  beforeEach(() => {
    cleanups = [];
  });

  afterEach(() => {
    cleanups.forEach((fn) => fn());
    document.body.innerHTML = ''; // eslint-disable-line -- safe: static test content
  });

  // -------------------------------------------------------------------------
  // Initial pass — disabled
  // -------------------------------------------------------------------------
  describe('initial pass: disabled', () => {
    it('sets disabled on labels whose for-target is disabled at init time', () => {
      const label = makeLabel('field-a');
      const input = makeInput('field-a', { disabled: true });
      document.body.append(label, input);

      init();

      expect(label.hasAttribute('disabled')).toBe(true);
    });

    it('leaves enabled labels alone', () => {
      const label = makeLabel('field-a');
      const input = makeInput('field-a');
      document.body.append(label, input);

      init();

      expect(label.hasAttribute('disabled')).toBe(false);
    });

    it('handles label and input in different containers', () => {
      const leftCol = document.createElement('div');
      const rightCol = document.createElement('div');
      leftCol.append(makeLabel('cross-1'));
      rightCol.append(makeInput('cross-1', { disabled: true }));
      document.body.append(leftCol, rightCol);

      init();

      expect(leftCol.querySelector('label').hasAttribute('disabled')).toBe(true);
    });

    it('ignores labels without a for attribute', () => {
      const label = document.createElement('label');
      label.textContent = 'no-for';
      const input = makeInput('orphan', { disabled: true });
      document.body.append(label, input);

      init();

      expect(label.hasAttribute('disabled')).toBe(false);
    });

    it('ignores labels whose for-target does not exist', () => {
      const label = makeLabel('missing');
      document.body.append(label);

      init();

      expect(label.hasAttribute('disabled')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Initial pass — error (aria-invalid)
  // -------------------------------------------------------------------------
  describe('initial pass: error', () => {
    it('sets error on labels whose for-target has aria-invalid="true" at init time', () => {
      const label = makeLabel('field-a');
      const input = makeInput('field-a', { invalid: true });
      document.body.append(label, input);

      init();

      expect(label.hasAttribute('error')).toBe(true);
    });

    it('leaves valid labels alone', () => {
      const label = makeLabel('field-a');
      const input = makeInput('field-a');
      document.body.append(label, input);

      init();

      expect(label.hasAttribute('error')).toBe(false);
    });

    it('treats aria-invalid="false" as not-errored', () => {
      const label = makeLabel('field-a');
      const input = makeInput('field-a');
      input.setAttribute('aria-invalid', 'false');
      document.body.append(label, input);

      init();

      expect(label.hasAttribute('error')).toBe(false);
    });

    it('handles label and input in different containers', () => {
      const leftCol = document.createElement('div');
      const rightCol = document.createElement('div');
      leftCol.append(makeLabel('cross-1'));
      rightCol.append(makeInput('cross-1', { invalid: true }));
      document.body.append(leftCol, rightCol);

      init();

      expect(leftCol.querySelector('label').hasAttribute('error')).toBe(true);
    });

    it('mirrors both disabled and error on the same label when both states hold', () => {
      const label = makeLabel('field-a');
      const input = makeInput('field-a', { disabled: true, invalid: true });
      document.body.append(label, input);

      init();

      expect(label.hasAttribute('disabled')).toBe(true);
      expect(label.hasAttribute('error')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Disabled attribute changes
  // -------------------------------------------------------------------------
  describe('disabled attribute changes', () => {
    it('reflects disabled when an input is disabled after init', async () => {
      const label = makeLabel('field-b');
      const input = makeInput('field-b');
      document.body.append(label, input);
      init();

      input.disabled = true;
      await flush();

      expect(label.hasAttribute('disabled')).toBe(true);
    });

    it('clears disabled when an input is re-enabled', async () => {
      const label = makeLabel('field-c');
      const input = makeInput('field-c', { disabled: true });
      document.body.append(label, input);
      init();
      expect(label.hasAttribute('disabled')).toBe(true);

      input.disabled = false;
      await flush();

      expect(label.hasAttribute('disabled')).toBe(false);
    });

    it('does not affect siblings of the toggled input', async () => {
      const labelA = makeLabel('rg-a', 'A');
      const labelB = makeLabel('rg-b', 'B');
      const inputA = makeInput('rg-a', { type: 'radio' });
      const inputB = makeInput('rg-b', { type: 'radio' });
      document.body.append(labelA, labelB, inputA, inputB);
      init();

      inputA.disabled = true;
      await flush();

      expect(labelA.hasAttribute('disabled')).toBe(true);
      expect(labelB.hasAttribute('disabled')).toBe(false);
    });

    it('handles multiple labels pointing at the same input', async () => {
      const label1 = makeLabel('shared');
      const label2 = makeLabel('shared');
      const input = makeInput('shared');
      document.body.append(label1, label2, input);
      init();

      input.disabled = true;
      await flush();

      expect(label1.hasAttribute('disabled')).toBe(true);
      expect(label2.hasAttribute('disabled')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // aria-invalid attribute changes
  // -------------------------------------------------------------------------
  describe('aria-invalid attribute changes', () => {
    it('reflects error when aria-invalid is set after init', async () => {
      const label = makeLabel('field-b');
      const input = makeInput('field-b');
      document.body.append(label, input);
      init();

      input.setAttribute('aria-invalid', 'true');
      await flush();

      expect(label.hasAttribute('error')).toBe(true);
    });

    it('clears error when aria-invalid is removed', async () => {
      const label = makeLabel('field-c');
      const input = makeInput('field-c', { invalid: true });
      document.body.append(label, input);
      init();
      expect(label.hasAttribute('error')).toBe(true);

      input.removeAttribute('aria-invalid');
      await flush();

      expect(label.hasAttribute('error')).toBe(false);
    });

    it('clears error when aria-invalid flips to "false"', async () => {
      const label = makeLabel('field-c');
      const input = makeInput('field-c', { invalid: true });
      document.body.append(label, input);
      init();
      expect(label.hasAttribute('error')).toBe(true);

      input.setAttribute('aria-invalid', 'false');
      await flush();

      expect(label.hasAttribute('error')).toBe(false);
    });

    it('does not cross-pollute the disabled attribute when only aria-invalid flips', async () => {
      const label = makeLabel('field-b');
      const input = makeInput('field-b');
      document.body.append(label, input);
      init();

      input.setAttribute('aria-invalid', 'true');
      await flush();

      expect(label.hasAttribute('error')).toBe(true);
      expect(label.hasAttribute('disabled')).toBe(false);
    });

    it('handles disabled and error transitioning independently on the same input', async () => {
      const label = makeLabel('field-b');
      const input = makeInput('field-b');
      document.body.append(label, input);
      init();

      input.setAttribute('aria-invalid', 'true');
      await flush();
      expect(label.hasAttribute('disabled')).toBe(false);
      expect(label.hasAttribute('error')).toBe(true);

      input.disabled = true;
      await flush();
      expect(label.hasAttribute('disabled')).toBe(true);
      expect(label.hasAttribute('error')).toBe(true);

      input.removeAttribute('aria-invalid');
      await flush();
      expect(label.hasAttribute('disabled')).toBe(true);
      expect(label.hasAttribute('error')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // DOM mutations
  // -------------------------------------------------------------------------
  describe('DOM mutations', () => {
    it('syncs a label added after init (disabled)', async () => {
      const input = makeInput('field-d', { disabled: true });
      document.body.append(input);
      init();

      const label = makeLabel('field-d');
      document.body.append(label);
      await flush();

      expect(label.hasAttribute('disabled')).toBe(true);
    });

    it('syncs a label added after init (error)', async () => {
      const input = makeInput('field-d', { invalid: true });
      document.body.append(input);
      init();

      const label = makeLabel('field-d');
      document.body.append(label);
      await flush();

      expect(label.hasAttribute('error')).toBe(true);
    });

    it('syncs labels added inside a wrapper after init', async () => {
      const input = makeInput('field-e', { disabled: true, invalid: true });
      document.body.append(input);
      init();

      const wrapper = document.createElement('div');
      wrapper.append(makeLabel('field-e'));
      document.body.append(wrapper);
      await flush();

      const label = wrapper.querySelector('label');
      expect(label.hasAttribute('disabled')).toBe(true);
      expect(label.hasAttribute('error')).toBe(true);
    });

    it('syncs labels when their target input is added after init', async () => {
      const label = makeLabel('field-f');
      document.body.append(label);
      init();

      document.body.append(makeInput('field-f', { disabled: true, invalid: true }));
      await flush();

      expect(label.hasAttribute('disabled')).toBe(true);
      expect(label.hasAttribute('error')).toBe(true);
    });

    it('re-syncs when a label’s for attribute changes to a disabled input', async () => {
      const label = makeLabel('off');
      document.body.append(label, makeInput('off'));
      document.body.append(makeInput('on', { disabled: true }));
      init();
      expect(label.hasAttribute('disabled')).toBe(false);

      label.setAttribute('for', 'on');
      await flush();

      expect(label.hasAttribute('disabled')).toBe(true);
    });

    it('re-syncs when a label’s for attribute changes to an invalid input', async () => {
      const label = makeLabel('off');
      document.body.append(label, makeInput('off'));
      document.body.append(makeInput('on', { invalid: true }));
      init();
      expect(label.hasAttribute('error')).toBe(false);

      label.setAttribute('for', 'on');
      await flush();

      expect(label.hasAttribute('error')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Focus state
  // -------------------------------------------------------------------------
  describe('focus state', () => {
    it('sets focused on the label when its target gains focus', async () => {
      const label = makeLabel('field-f');
      const input = makeInput('field-f');
      document.body.append(label, input);
      init();
      expect(label.hasAttribute('focused')).toBe(false);

      input.focus();
      await flush();

      expect(label.hasAttribute('focused')).toBe(true);
    });

    it('clears focused on the label when its target loses focus', async () => {
      const label = makeLabel('field-f');
      const input = makeInput('field-f');
      document.body.append(label, input);
      init();

      input.focus();
      await flush();
      expect(label.hasAttribute('focused')).toBe(true);

      input.blur();
      await flush();

      expect(label.hasAttribute('focused')).toBe(false);
    });

    it('reflects focused at init time when an input is already focused', () => {
      const label = makeLabel('field-f');
      const input = makeInput('field-f');
      document.body.append(label, input);
      input.focus();

      init();

      expect(label.hasAttribute('focused')).toBe(true);
    });

    it('moves focused between labels as focus moves between inputs', async () => {
      const labelA = makeLabel('focus-a');
      const labelB = makeLabel('focus-b');
      const inputA = makeInput('focus-a');
      const inputB = makeInput('focus-b');
      document.body.append(labelA, labelB, inputA, inputB);
      init();

      inputA.focus();
      await flush();
      expect(labelA.hasAttribute('focused')).toBe(true);
      expect(labelB.hasAttribute('focused')).toBe(false);

      inputB.focus();
      await flush();
      expect(labelA.hasAttribute('focused')).toBe(false);
      expect(labelB.hasAttribute('focused')).toBe(true);
    });

    it('clears [focused] on focusout even when activeElement still points at the blurring target', async () => {
      // Regression test for #33: some browsers fire `focusout` while
      // `document.activeElement` still references the element losing
      // focus, which would leave `[focused]` stuck-on if the handler
      // relied on the synchronous activeElement read. The handler now
      // derives the focus state from `event.type` instead.
      const label = makeLabel('field-f');
      const input = makeInput('field-f');
      document.body.append(label, input);
      init();

      input.focus();
      await flush();
      expect(label.hasAttribute('focused')).toBe(true);

      // Manually dispatch focusout without calling .blur(), so jsdom
      // does NOT move activeElement off the input. This is the
      // worst-case timing the issue describes.
      input.dispatchEvent(new Event('focusout', { bubbles: true }));
      expect(document.activeElement).toBe(input);

      expect(label.hasAttribute('focused')).toBe(false);
    });

    it('co-exists with error: error stays set while focused toggles', async () => {
      const label = makeLabel('field-f');
      const input = makeInput('field-f', { invalid: true });
      document.body.append(label, input);
      init();
      expect(label.hasAttribute('error')).toBe(true);
      expect(label.hasAttribute('focused')).toBe(false);

      input.focus();
      await flush();
      expect(label.hasAttribute('error')).toBe(true);
      expect(label.hasAttribute('focused')).toBe(true);

      input.blur();
      await flush();
      expect(label.hasAttribute('error')).toBe(true);
      expect(label.hasAttribute('focused')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Scoped root
  // -------------------------------------------------------------------------
  describe('scoped root', () => {
    it('only observes labels and inputs inside the given root', async () => {
      const formA = document.createElement('form');
      const formB = document.createElement('form');
      formA.append(makeLabel('a-field'), makeInput('a-field'));
      formB.append(makeLabel('b-field'), makeInput('b-field'));
      document.body.append(formA, formB);

      init({ root: formA });

      formA.querySelector('input').disabled = true;
      formB.querySelector('input').disabled = true;
      await flush();

      expect(formA.querySelector('label').hasAttribute('disabled')).toBe(true);
      expect(formB.querySelector('label').hasAttribute('disabled')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------
  describe('cleanup', () => {
    it('stops observing after cleanup', async () => {
      const label = makeLabel('field-g');
      const input = makeInput('field-g');
      document.body.append(label, input);
      const cleanup = init();

      cleanup();
      input.disabled = true;
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      await flush();

      expect(label.hasAttribute('disabled')).toBe(false);
      expect(label.hasAttribute('error')).toBe(false);
      expect(label.hasAttribute('focused')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // data-state-for override
  // -------------------------------------------------------------------------
  describe('data-state-for override', () => {
    it('uses data-state-for as the source when for points at a non-existent id', () => {
      // Real amember markup pattern: <label for="grp-state"> with no #grp-state,
      // and the actual <select> / fallback <input> living under different ids.
      const label = makeLabel('grp-state');
      label.setAttribute('data-state-for', 'f_state');
      const select = makeInput('f_state', { disabled: true });
      document.body.append(label, select);

      init();

      expect(label.hasAttribute('disabled')).toBe(true);
    });

    it('prefers data-state-for over for when both resolve to elements', () => {
      // for points at an enabled input, data-state-for points at a disabled
      // one. The override wins — `for` keeps its native click-to-focus role
      // but stops driving the state mirror.
      const label = makeLabel('real-id');
      label.setAttribute('data-state-for', 'override-id');
      const realInput = makeInput('real-id');
      const overrideInput = makeInput('override-id', { disabled: true });
      document.body.append(label, realInput, overrideInput);

      init();

      expect(label.hasAttribute('disabled')).toBe(true);
    });

    it('combines multiple ids with ANY semantics (disabled)', () => {
      // Two listed targets, only one is disabled. Label should dim.
      const label = makeLabel('grp-state');
      label.setAttribute('data-state-for', 'f_state t_state');
      const select = makeInput('f_state', { disabled: true });
      const fallback = makeInput('t_state'); // enabled
      document.body.append(label, select, fallback);

      init();

      expect(label.hasAttribute('disabled')).toBe(true);
    });

    it('clears disabled only when every listed target is enabled', async () => {
      const label = makeLabel('grp-state');
      label.setAttribute('data-state-for', 'f_state t_state');
      const select = makeInput('f_state', { disabled: true });
      const fallback = makeInput('t_state', { disabled: true });
      document.body.append(label, select, fallback);
      init();
      expect(label.hasAttribute('disabled')).toBe(true);

      select.disabled = false;
      await flush();
      expect(label.hasAttribute('disabled')).toBe(true); // still ANY-disabled

      fallback.disabled = false;
      await flush();
      expect(label.hasAttribute('disabled')).toBe(false);
    });

    it('combines multiple ids with ANY semantics (error)', () => {
      const label = makeLabel('grp');
      label.setAttribute('data-state-for', 'a b');
      const a = makeInput('a');
      const b = makeInput('b', { invalid: true });
      document.body.append(label, a, b);

      init();

      expect(label.hasAttribute('error')).toBe(true);
    });

    it('combines multiple ids with ANY semantics (focused)', async () => {
      const label = makeLabel('grp');
      label.setAttribute('data-state-for', 'a b');
      const a = makeInput('a');
      const b = makeInput('b');
      document.body.append(label, a, b);
      init();
      expect(label.hasAttribute('focused')).toBe(false);

      b.focus();
      await flush();

      expect(label.hasAttribute('focused')).toBe(true);
    });

    it('ignores missing ids in the list and uses the ones that resolve', () => {
      const label = makeLabel('grp');
      label.setAttribute('data-state-for', 'nope_1 real_id nope_2');
      const real = makeInput('real_id', { disabled: true });
      document.body.append(label, real);

      init();

      expect(label.hasAttribute('disabled')).toBe(true);
    });

    it('tolerates extra whitespace between ids', () => {
      const label = makeLabel('grp');
      label.setAttribute('data-state-for', '  a   b  ');
      const a = makeInput('a', { disabled: true });
      const b = makeInput('b');
      document.body.append(label, a, b);

      init();

      expect(label.hasAttribute('disabled')).toBe(true);
    });

    it('re-syncs when data-state-for changes after init', async () => {
      const label = makeLabel('grp');
      label.setAttribute('data-state-for', 'a');
      const a = makeInput('a');
      const b = makeInput('b', { disabled: true });
      document.body.append(label, a, b);
      init();
      expect(label.hasAttribute('disabled')).toBe(false);

      label.setAttribute('data-state-for', 'b');
      await flush();

      expect(label.hasAttribute('disabled')).toBe(true);
    });

    it('re-syncs when a listed target flips state after init', async () => {
      const label = makeLabel('grp');
      label.setAttribute('data-state-for', 'a b');
      const a = makeInput('a');
      const b = makeInput('b');
      document.body.append(label, a, b);
      init();
      expect(label.hasAttribute('disabled')).toBe(false);

      b.disabled = true;
      await flush();

      expect(label.hasAttribute('disabled')).toBe(true);
    });

    it('picks up a label added after init that uses data-state-for', async () => {
      const input = makeInput('f_state', { disabled: true });
      document.body.append(input);
      init();

      const label = makeLabel('grp-state');
      label.setAttribute('data-state-for', 'f_state');
      document.body.append(label);
      await flush();

      expect(label.hasAttribute('disabled')).toBe(true);
    });

    it('works on a label that has data-state-for but no for attribute', () => {
      const label = document.createElement('label');
      label.setAttribute('data-state-for', 'standalone');
      const input = makeInput('standalone', { disabled: true });
      document.body.append(label, input);

      init();

      expect(label.hasAttribute('disabled')).toBe(true);
    });

    // -----------------------------------------------------------------
    // Hidden listed targets (amember swap-input pattern)
    // -----------------------------------------------------------------

    it('skips a listed target with hidden attribute when combining state (disabled)', () => {
      // Swap pattern: visible-enabled select + hidden-disabled fallback
      // input share one label. ANY-semantics over both would mirror the
      // hidden half's :disabled and paint the label disabled-on-enabled.
      const label = makeLabel('grp-state');
      label.setAttribute('data-state-for', 'f_state t_state');
      const visible = makeInput('f_state'); // enabled, visible
      const hidden = makeInput('t_state', { disabled: true });
      hidden.hidden = true;
      document.body.append(label, visible, hidden);

      init();

      expect(label.hasAttribute('disabled')).toBe(false);
    });

    it('skips a listed target with inline display: none', () => {
      const label = makeLabel('grp-state');
      label.setAttribute('data-state-for', 'f_state t_state');
      const visible = makeInput('f_state');
      const hidden = makeInput('t_state', { disabled: true });
      hidden.style.display = 'none';
      document.body.append(label, visible, hidden);

      init();

      expect(label.hasAttribute('disabled')).toBe(false);
    });

    it('still paints disabled when the only visible listed target is disabled', () => {
      // Opposite half of the swap: the visible control is the disabled
      // one. Label must still pick it up — the visibility filter is
      // about skipping stale state on hidden halves, not suppressing
      // legitimate disabled state on visible ones.
      const label = makeLabel('grp-state');
      label.setAttribute('data-state-for', 'f_state t_state');
      const visibleDisabled = makeInput('f_state', { disabled: true });
      const hiddenEnabled = makeInput('t_state');
      hiddenEnabled.style.display = 'none';
      document.body.append(label, visibleDisabled, hiddenEnabled);

      init();

      expect(label.hasAttribute('disabled')).toBe(true);
    });

    it('re-syncs after a swap when the disabled flip rides alongside the visibility flip', async () => {
      // amember toggles `display` and `disabled` together on both
      // halves. The disabled mutation wakes the observer; the
      // re-sync re-reads visibility fresh and picks the now-visible
      // (and now-enabled) half — label flips off.
      const label = makeLabel('grp-state');
      label.setAttribute('data-state-for', 'f_state t_state');
      const a = makeInput('f_state', { disabled: true });
      const b = makeInput('t_state');
      a.style.display = 'none';
      document.body.append(label, a, b);
      init();
      expect(label.hasAttribute('disabled')).toBe(false); // a hidden, b visible+enabled

      // Swap: a becomes visible+disabled, b becomes hidden+enabled remains.
      // Mutate disabled on a to wake the observer (mirrors amember).
      a.style.display = '';
      b.style.display = 'none';
      a.disabled = true; // already true, but re-set to force a mutation record
      // Force a real attribute mutation so the observer fires:
      a.removeAttribute('disabled');
      a.setAttribute('disabled', '');
      await flush();

      expect(label.hasAttribute('disabled')).toBe(true);
    });

    it('skips hidden targets across ANY-semantics for error state too', () => {
      const label = makeLabel('grp');
      label.setAttribute('data-state-for', 'a b');
      const visible = makeInput('a');
      const hidden = makeInput('b', { invalid: true });
      hidden.style.display = 'none';
      document.body.append(label, visible, hidden);

      init();

      expect(label.hasAttribute('error')).toBe(false);
    });

    it('does not leak focused state across labels when focus moves within a multi-target group', async () => {
      // Regression for the multi-target focus-handling reasoning in
      // onFocusChange: focusout(A) → focusin(B) for two targets of the
      // same label must end with focused=true (B is now focused).
      const label = makeLabel('grp');
      label.setAttribute('data-state-for', 'a b');
      const a = makeInput('a');
      const b = makeInput('b');
      document.body.append(label, a, b);
      init();

      a.focus();
      await flush();
      expect(label.hasAttribute('focused')).toBe(true);

      b.focus(); // jsdom moves activeElement to b and fires focusout(a) + focusin(b)
      await flush();

      expect(label.hasAttribute('focused')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------
  describe('edge cases', () => {
    it('escapes for attribute values with CSS-special characters', () => {
      const label = makeLabel('weird.id:with#chars');
      const input = makeInput('weird.id:with#chars', { disabled: true });
      document.body.append(label, input);

      init();

      expect(label.hasAttribute('disabled')).toBe(true);
    });

    it('returns a no-op cleanup when root is null', () => {
      const cleanup = initLabelStateSync({ root: null });
      expect(() => cleanup()).not.toThrow();
    });
  });
});
