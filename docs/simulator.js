/**
 * User State Simulator — docs-only tooling for interactive component demos.
 *
 * Renders a sticky picker that lets visitors switch between simulated user
 * states. All components on the page react live via resolveElements (for
 * data-user-state elements) and initUserProfile teardown/re-init (for
 * JS-rendered avatar components).
 *
 * Source panels are generated automatically from the live demo DOM — the HTML
 * is never duplicated in the page source.
 */

import { resolveElements } from '../dist/user-state.js';
import { initUserProfile } from '../dist/user-profile.js';

// ---------------------------------------------------------------------------
// Mock user presets
// ---------------------------------------------------------------------------

const PRESETS = {
  'logged-out': null,
  free: {
    login: 'demo_free',
    email: 'free@example.com',
    name: 'Free User',
    paid: false,
    trial: false,
    products: [],
  },
  trial: {
    login: 'trial_user',
    email: 'trial@example.com',
    name: 'Trial User',
    paid: false,
    trial: true,
    products: ['starter-trial'],
  },
  paid: {
    login: 'demo_paid',
    email: 'paid@example.com',
    name: 'Paid User',
    paid: true,
    trial: false,
    products: ['quant'],
  },
};

const LABELS = {
  'logged-out': 'Logged Out',
  free: 'Free',
  trial: 'Trial',
  paid: 'Paid',
};

// ---------------------------------------------------------------------------
// Mock API URL helper
// ---------------------------------------------------------------------------

function mockApiUrl(user) {
  if (user === null) return 'data:application/json,null';
  return 'data:application/json,' + encodeURIComponent(JSON.stringify(user));
}

// ---------------------------------------------------------------------------
// Source panel generation
// ---------------------------------------------------------------------------

/**
 * Extract copy-pasteable HTML from a demo root element.
 * Clones the DOM, normalises it (re-adds `hidden` to all data-user-state
 * elements, strips the data-simulator-root wrapper), and returns the inner
 * HTML with a trailing <script> import snippet.
 */
function extractSource(root) {
  const clone = root.cloneNode(true);

  // Remove the wrapper attribute — consumers don't need it
  clone.removeAttribute('data-simulator-root');

  // Ensure all data-user-state elements have `hidden` (consumer default)
  for (const el of clone.querySelectorAll('[data-user-state]')) {
    el.setAttribute('hidden', '');
  }

  // Get the inner HTML (the wrapper div itself is docs scaffolding)
  let html = clone.innerHTML;

  // Trim leading/trailing blank lines and normalise indentation
  html = dedent(html);

  // Append the script import
  html +=
    '\n\n<script type="module">\n  import { initUserState } from \'@marketdataapp/ui/user-state\';\n  initUserState();\n</script>';

  return html;
}

/**
 * Remove the common leading whitespace from a multi-line string.
 */
function dedent(text) {
  const lines = text.replace(/^\n+/, '').replace(/\n+$/, '').split('\n');
  const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^(\s*)/)[1].length);
  const min = Math.min(...indents);
  if (min === 0) return lines.join('\n');
  return lines.map((l) => l.slice(min)).join('\n');
}

/**
 * Build and insert a "View source" panel after a demo root element.
 */
function createSourcePanel(root) {
  const source = extractSource(root);

  const wrapper = document.createElement('div');
  wrapper.className = 'mt-4';

  const toggle = document.createElement('button');
  toggle.className =
    'text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 font-medium';
  toggle.textContent = 'View source';
  toggle.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
  });

  const panel = document.createElement('div');
  panel.hidden = true;
  panel.className = 'source-panel mt-2 relative';

  const copyBtn = document.createElement('button');
  copyBtn.className =
    'absolute top-2 right-2 text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600';
  copyBtn.textContent = 'Copy';
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(source).then(() => {
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = 'Copy';
      }, 1500);
    });
  });

  const pre = document.createElement('pre');
  pre.className = 'bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto';

  const code = document.createElement('code');
  code.className = 'text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre';
  code.textContent = source;

  pre.appendChild(code);
  panel.appendChild(copyBtn);
  panel.appendChild(pre);
  wrapper.appendChild(toggle);
  wrapper.appendChild(panel);

  root.after(wrapper);
}

// ---------------------------------------------------------------------------
// Simulator
// ---------------------------------------------------------------------------

/**
 * Initialise the user-state simulator.
 *
 * @param {Object} options
 * @param {HTMLElement} options.container - Element to render the picker into
 */
export function initSimulator({ container }) {
  let currentState = 'logged-out';
  const profileCleanups = new Map();

  // --- Generate source panels from live DOM before first resolve ----------

  for (const root of document.querySelectorAll('[data-simulator-root]')) {
    createSourcePanel(root);
  }

  // --- Render picker UI ---------------------------------------------------

  const fieldset = document.createElement('fieldset');
  fieldset.className = 'flex items-center gap-2 flex-wrap';

  const legend = document.createElement('legend');
  legend.className = 'text-xs font-medium text-gray-500 dark:text-gray-400 mb-1';
  legend.textContent = 'Simulate user state';
  fieldset.appendChild(legend);

  const btnGroup = document.createElement('div');
  btnGroup.className = 'inline-flex rounded-lg shadow-sm';
  btnGroup.setAttribute('role', 'radiogroup');

  const keys = Object.keys(PRESETS);

  keys.forEach((key, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', key === currentState ? 'true' : 'false');
    btn.dataset.state = key;
    btn.textContent = LABELS[key];

    // Segmented control styling
    const base =
      'px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-600 transition-colors focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500';
    const active = 'bg-blue-600 text-white border-blue-600 dark:border-blue-500';
    const inactive =
      'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700';
    const rounded = i === 0 ? 'rounded-l-lg' : i === keys.length - 1 ? 'rounded-r-lg' : '';
    // Collapse double borders between buttons
    const margin = i > 0 ? '-ml-px' : '';

    btn.className =
      `${base} ${key === currentState ? active : inactive} ${rounded} ${margin}`.trim();
    btn.addEventListener('click', () => setState(key));
    btnGroup.appendChild(btn);
  });

  fieldset.appendChild(btnGroup);
  container.appendChild(fieldset);

  // --- State change handler -----------------------------------------------

  async function setState(key) {
    currentState = key;
    const user = PRESETS[key];

    // Update button styles
    for (const btn of btnGroup.querySelectorAll('button')) {
      const isActive = btn.dataset.state === key;
      btn.setAttribute('aria-checked', isActive ? 'true' : 'false');

      const base =
        'px-3 py-1.5 text-sm font-medium border transition-colors focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500';
      const active = 'bg-blue-600 text-white border-blue-600 dark:border-blue-500';
      const inactive =
        'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600';
      const idx = Array.from(btnGroup.children).indexOf(btn);
      const rounded = idx === 0 ? 'rounded-l-lg' : idx === keys.length - 1 ? 'rounded-r-lg' : '';
      const margin = idx > 0 ? '-ml-px' : '';

      btn.className = `${base} ${isActive ? active : inactive} ${rounded} ${margin}`.trim();
    }

    // Resolve data-user-state elements
    for (const root of document.querySelectorAll('[data-simulator-root]')) {
      resolveElements(user, root);
    }

    // Tear down and re-init User Profile instances
    const url = mockApiUrl(user);
    for (const el of document.querySelectorAll('[data-simulator-profile]')) {
      const prev = profileCleanups.get(el);
      if (prev) {
        prev();
        profileCleanups.delete(el);
      }
      const dropdown = el.dataset.simulatorProfile === 'dropdown';
      const cleanup = await initUserProfile({ container: el, dropdown, apiUrl: url });
      profileCleanups.set(el, cleanup);
    }
  }

  // --- Initial resolution -------------------------------------------------

  setState(currentState);
}
