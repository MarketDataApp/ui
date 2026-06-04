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
