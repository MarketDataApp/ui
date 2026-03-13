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

import { getEffectiveTheme, setThemeCookie, clearThemeCookie, isSystemMode } from './theme.js';
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
 * Shows a moon icon in dark mode and a sun icon in light mode (reflecting
 * the current mode). Persists the choice via
 * setThemeCookie() for cross-subdomain sync.
 *
 * @param {Object} options
 * @param {HTMLElement} options.container - DOM element to render into
 * @param {string} [options.buttonClass='theme-toggle-button'] - CSS class on the button
 * @returns {() => void} Cleanup function that removes the toggle and event listeners
 */
export function initThemeToggle(options) {
  const { container, buttonClass = 'theme-toggle-button' } = options;

  const wrapper = htmlToElement(renderTemplate(buttonTpl, { buttonClass }));
  const button = wrapper.querySelector('button');
  const sunIcon = button.querySelector('.theme-toggle-icon-light');
  const moonIcon = button.querySelector('.theme-toggle-icon-dark');

  function updateState() {
    const dark = isDark();
    // Show the icon for the current mode: moon in dark, sun in light.
    sunIcon.style.display = dark ? 'none' : 'block';
    moonIcon.style.display = dark ? 'block' : 'none';
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
  container.appendChild(wrapper);

  // Listen for system preference changes — apply theme when in system mode
  let mql = null;
  function onSystemChange(e) {
    if (isSystemMode()) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
    updateState();
  }
  if (window.matchMedia) {
    mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener('change', onSystemChange);
  }

  function cleanup() {
    button.removeEventListener('click', toggle);
    if (mql) mql.removeEventListener('change', onSystemChange);
    if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
  }

  function resetToSystem() {
    clearThemeCookie();
    applyTheme(getEffectiveTheme());
    updateState();
  }

  return { cleanup, resetToSystem };
}
