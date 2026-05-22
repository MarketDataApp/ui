import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initCopyButton } from '../../dist/copy-button.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createGroup({ value = 'hello', copyValue, omitButton = false } = {}) {
  const group = document.createElement('div');
  group.setAttribute('data-copy-input-group', '');

  const input = document.createElement('input');
  input.setAttribute('data-copy-input', '');
  input.type = 'text';
  input.value = value;
  input.readOnly = true;
  group.appendChild(input);

  let button = null;
  let defaultEl = null;
  let successEl = null;

  if (!omitButton) {
    button = document.createElement('button');
    button.setAttribute('data-copy-button', '');
    if (copyValue !== undefined) button.dataset.copyValue = copyValue;

    defaultEl = document.createElement('span');
    defaultEl.setAttribute('data-copy-default', '');
    defaultEl.textContent = 'Copy';

    successEl = document.createElement('span');
    successEl.setAttribute('data-copy-success', '');
    successEl.hidden = true;
    successEl.textContent = 'Copied';

    button.appendChild(defaultEl);
    button.appendChild(successEl);
    group.appendChild(button);
  }

  document.body.appendChild(group);
  return { group, input, button, defaultEl, successEl };
}

// jsdom doesn't ship navigator.clipboard — install a mock.
let writeTextMock;

beforeEach(() => {
  document.body.innerHTML = '';
  writeTextMock = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: writeTextMock },
    configurable: true,
    writable: true,
  });
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('initCopyButton', () => {
  it('copies the input value to the clipboard on click', async () => {
    const { button } = createGroup({ value: 'npm install foo' });
    initCopyButton();

    button.click();
    await vi.runAllTimersAsync();

    expect(writeTextMock).toHaveBeenCalledTimes(1);
    expect(writeTextMock).toHaveBeenCalledWith('npm install foo');
  });

  it('prefers data-copy-value over input.value when present', async () => {
    const { button } = createGroup({ value: 'visible-truncated', copyValue: 'full-secret-value' });
    initCopyButton();

    button.click();
    await vi.runAllTimersAsync();

    expect(writeTextMock).toHaveBeenCalledWith('full-secret-value');
  });

  it('shows success state after click and resets after 2s', async () => {
    const { button, defaultEl, successEl } = createGroup();
    initCopyButton();

    expect(defaultEl.hidden).toBe(false);
    expect(successEl.hidden).toBe(true);

    button.click();
    await vi.advanceTimersByTimeAsync(0); // let the awaited writeText resolve

    expect(defaultEl.hidden).toBe(true);
    expect(successEl.hidden).toBe(false);

    await vi.advanceTimersByTimeAsync(2000);

    expect(defaultEl.hidden).toBe(false);
    expect(successEl.hidden).toBe(true);
  });

  it('handles two independent instances without cross-talk', async () => {
    const a = createGroup({ value: 'A' });
    const b = createGroup({ value: 'B' });
    initCopyButton();

    a.button.click();
    await vi.advanceTimersByTimeAsync(0);

    expect(a.successEl.hidden).toBe(false);
    expect(b.successEl.hidden).toBe(true);

    b.button.click();
    await vi.advanceTimersByTimeAsync(0);

    expect(a.successEl.hidden).toBe(false);
    expect(b.successEl.hidden).toBe(false);
    expect(writeTextMock).toHaveBeenCalledWith('A');
    expect(writeTextMock).toHaveBeenCalledWith('B');
  });

  it('is idempotent — calling twice does not double-fire', async () => {
    const { button } = createGroup();
    initCopyButton();
    initCopyButton();

    button.click();
    await vi.advanceTimersByTimeAsync(0);

    expect(writeTextMock).toHaveBeenCalledTimes(1);
  });

  it('cleanup detaches listeners and clears pending reset', async () => {
    const { button, defaultEl, successEl } = createGroup();
    const cleanup = initCopyButton();

    button.click();
    await vi.advanceTimersByTimeAsync(0);
    expect(successEl.hidden).toBe(false);

    cleanup();

    // Pending reset should have been cleared — state stays as it was at cleanup
    await vi.advanceTimersByTimeAsync(2000);
    expect(successEl.hidden).toBe(false);
    expect(defaultEl.hidden).toBe(true);

    // Listener should be detached — further clicks do nothing
    writeTextMock.mockClear();
    button.click();
    await vi.advanceTimersByTimeAsync(0);
    expect(writeTextMock).not.toHaveBeenCalled();
  });

  it('skips groups missing required parts', () => {
    createGroup({ omitButton: true });
    expect(() => initCopyButton()).not.toThrow();
  });

  it('toggles all default/success element pairs in a group (icon + tooltip)', async () => {
    // Build a group that has TWO default spans and TWO success spans —
    // mimics the icon-only variant where the button has icons and a sibling
    // tooltip has the matching text.
    const group = document.createElement('div');
    group.setAttribute('data-copy-input-group', '');

    const input = document.createElement('input');
    input.setAttribute('data-copy-input', '');
    input.value = 'x';
    group.appendChild(input);

    const button = document.createElement('button');
    button.setAttribute('data-copy-button', '');
    const iconDefault = document.createElement('span');
    iconDefault.setAttribute('data-copy-default', '');
    iconDefault.textContent = 'copy-icon';
    const iconSuccess = document.createElement('span');
    iconSuccess.setAttribute('data-copy-success', '');
    iconSuccess.hidden = true;
    iconSuccess.textContent = 'check-icon';
    button.append(iconDefault, iconSuccess);
    group.appendChild(button);

    const tooltip = document.createElement('div');
    tooltip.setAttribute('data-copy-tooltip', '');
    const tipDefault = document.createElement('span');
    tipDefault.setAttribute('data-copy-default', '');
    tipDefault.textContent = 'Copy to clipboard';
    const tipSuccess = document.createElement('span');
    tipSuccess.setAttribute('data-copy-success', '');
    tipSuccess.hidden = true;
    tipSuccess.textContent = 'Copied!';
    tooltip.append(tipDefault, tipSuccess);
    group.appendChild(tooltip);

    document.body.appendChild(group);
    initCopyButton();

    button.click();
    await vi.advanceTimersByTimeAsync(0);

    // Both default spans hidden, both success spans visible
    expect(iconDefault.hidden).toBe(true);
    expect(tipDefault.hidden).toBe(true);
    expect(iconSuccess.hidden).toBe(false);
    expect(tipSuccess.hidden).toBe(false);

    await vi.advanceTimersByTimeAsync(2000);

    // Both pairs reset
    expect(iconDefault.hidden).toBe(false);
    expect(tipDefault.hidden).toBe(false);
    expect(iconSuccess.hidden).toBe(true);
    expect(tipSuccess.hidden).toBe(true);
  });

  it('manages tooltip visibility state on .copy-input-action wrapper', async () => {
    // Icon-only variant structure: group > action > (button + tooltip)
    const group = document.createElement('div');
    group.setAttribute('data-copy-input-group', '');

    const input = document.createElement('input');
    input.setAttribute('data-copy-input', '');
    input.value = 'hello';
    group.appendChild(input);

    const action = document.createElement('div');
    action.classList.add('copy-input-action');
    group.appendChild(action);

    const button = document.createElement('button');
    button.setAttribute('data-copy-button', '');
    const defaultEl = document.createElement('span');
    defaultEl.setAttribute('data-copy-default', '');
    const successEl = document.createElement('span');
    successEl.setAttribute('data-copy-success', '');
    successEl.hidden = true;
    button.append(defaultEl, successEl);
    action.appendChild(button);

    const tooltip = document.createElement('div');
    tooltip.setAttribute('data-copy-tooltip', '');
    action.appendChild(tooltip);

    document.body.appendChild(group);
    initCopyButton();

    // Pre-click — no state
    expect(action.dataset.copyState).toBeUndefined();

    button.click();
    await vi.advanceTimersByTimeAsync(0);

    // Success window — tooltip is force-shown
    expect(action.dataset.copyState).toBe('success');

    await vi.advanceTimersByTimeAsync(2000);

    // After 2s — cooldown forces tooltip hidden
    expect(action.dataset.copyState).toBe('cooldown');

    // Mouseleave clears cooldown so default hover behavior resumes
    action.dispatchEvent(new MouseEvent('mouseleave'));
    expect(action.dataset.copyState).toBeUndefined();
  });

  it('blur on the button also clears the cooldown state', async () => {
    const group = document.createElement('div');
    group.setAttribute('data-copy-input-group', '');

    const input = document.createElement('input');
    input.setAttribute('data-copy-input', '');
    input.value = 'x';
    group.appendChild(input);

    const action = document.createElement('div');
    action.classList.add('copy-input-action');
    group.appendChild(action);

    const button = document.createElement('button');
    button.setAttribute('data-copy-button', '');
    const defaultEl = document.createElement('span');
    defaultEl.setAttribute('data-copy-default', '');
    const successEl = document.createElement('span');
    successEl.setAttribute('data-copy-success', '');
    successEl.hidden = true;
    button.append(defaultEl, successEl);
    action.appendChild(button);

    const tooltip = document.createElement('div');
    tooltip.setAttribute('data-copy-tooltip', '');
    action.appendChild(tooltip);

    document.body.appendChild(group);
    initCopyButton();

    button.click();
    await vi.advanceTimersByTimeAsync(2000);
    expect(action.dataset.copyState).toBe('cooldown');

    button.dispatchEvent(new FocusEvent('blur'));
    expect(action.dataset.copyState).toBeUndefined();
  });

  it('respects the root option', async () => {
    const inside = createGroup({ value: 'inside' });
    const outside = createGroup({ value: 'outside' });

    const scope = document.createElement('div');
    document.body.appendChild(scope);
    scope.appendChild(inside.group);

    initCopyButton({ root: scope });

    outside.button.click();
    await vi.advanceTimersByTimeAsync(0);
    expect(writeTextMock).not.toHaveBeenCalled();

    inside.button.click();
    await vi.advanceTimersByTimeAsync(0);
    expect(writeTextMock).toHaveBeenCalledWith('inside');
  });
});
