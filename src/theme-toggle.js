/**
 * @module theme-toggle
 * Framework-agnostic light/dark mode toggle for *.marketdata.app navbars.
 *
 * Zero production dependencies. Renders a circular button with sun/moon SVG
 * icons (matching the Docusaurus toggle). Uses theme.js for cross-subdomain
 * cookie persistence.
 *
 * SVG icons from Docusaurus (MIT license, Facebook Inc.)
 */

import { getEffectiveTheme, setThemeCookie } from './theme.js';
import { button as buttonTpl } from './theme-toggle.templates.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderTemplate(html, vars = {}) {
  let result = html;
  for (const [key, val] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, val);
  }
  return result;
}

function htmlToElement(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstChild;
}

function isDark() {
  return document.documentElement.classList.contains('dark');
}

function applyTheme(theme) {
  const html = document.documentElement;
  if (theme === 'dark') {
    html.classList.add('dark');
    html.setAttribute('data-theme', 'dark');
  } else {
    html.classList.remove('dark');
    html.setAttribute('data-theme', 'light');
  }
}

// ---------------------------------------------------------------------------
// initThemeToggle
// ---------------------------------------------------------------------------

/**
 * Renders a light/dark mode toggle button into the given container.
 *
 * Shows a sun icon in dark mode (click to switch to light) and a moon icon
 * in light mode (click to switch to dark). Persists the choice via
 * setThemeCookie() for cross-subdomain sync.
 *
 * @param {Object} options
 * @param {HTMLElement} options.container - DOM element to render into
 * @param {string} [options.buttonClass='theme-toggle-button'] - CSS class on the button
 * @returns {() => void} Cleanup function that removes the toggle and event listeners
 */
export function initThemeToggle(options) {
  const { container, buttonClass = 'theme-toggle-button' } = options;

  const button = htmlToElement(renderTemplate(buttonTpl, { buttonClass }));
  const sunIcon = button.querySelector('.theme-toggle-icon-light');
  const moonIcon = button.querySelector('.theme-toggle-icon-dark');

  function updateState() {
    const dark = isDark();
    // In dark mode: show sun (click to go light). In light mode: show moon (click to go dark).
    sunIcon.style.display = dark ? 'block' : 'none';
    moonIcon.style.display = dark ? 'none' : 'block';
    button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  }

  function toggle() {
    const next = isDark() ? 'light' : 'dark';
    applyTheme(next);
    setThemeCookie(next);
    updateState();
  }

  button.addEventListener('click', toggle);
  updateState();
  container.appendChild(button);

  // Listen for system preference changes (if user has no saved preference)
  let mql = null;
  function onSystemChange() {
    updateState();
  }
  if (window.matchMedia) {
    mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener('change', onSystemChange);
  }

  return function cleanup() {
    button.removeEventListener('click', toggle);
    if (mql) mql.removeEventListener('change', onSystemChange);
    if (button.parentNode) button.parentNode.removeChild(button);
  };
}
