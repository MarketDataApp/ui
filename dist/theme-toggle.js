// Auto-generated from src/ by scripts/build-js.js — do not edit manually

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
const buttonTpl = "<div class=\"theme-toggle-wrapper\">\n  <button type=\"button\" class=\"{{buttonClass}}\"><svg xmlns=\"http://www.w3.org/2000/svg\" class=\"theme-toggle-icon-light\" viewBox=\"0 0 24 24\" width=\"24\" height=\"24\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M12,9c1.65,0,3,1.35,3,3s-1.35,3-3,3s-3-1.35-3-3S10.35,9,12,9 M12,7c-2.76,0-5,2.24-5,5s2.24,5,5,5s5-2.24,5-5 S14.76,7,12,7L12,7z M2,13l2,0c0.55,0,1-0.45,1-1s-0.45-1-1-1l-2,0c-0.55,0-1,0.45-1,1S1.45,13,2,13z M20,13l2,0c0.55,0,1-0.45,1-1 s-0.45-1-1-1l-2,0c-0.55,0-1,0.45-1,1S19.45,13,20,13z M11,2v2c0,0.55,0.45,1,1,1s1-0.45,1-1V2c0-0.55-0.45-1-1-1S11,1.45,11,2z M11,20v2c0,0.55,0.45,1,1,1s1-0.45,1-1v-2c0-0.55-0.45-1-1-1C11.45,19,11,19.45,11,20z M5.99,4.58c-0.39-0.39-1.03-0.39-1.41,0 c-0.39,0.39-0.39,1.03,0,1.41l1.06,1.06c0.39,0.39,1.03,0.39,1.41,0s0.39-1.03,0-1.41L5.99,4.58z M18.36,16.95 c-0.39-0.39-1.03-0.39-1.41,0c-0.39,0.39-0.39,1.03,0,1.41l1.06,1.06c0.39,0.39,1.03,0.39,1.41,0c0.39-0.39,0.39-1.03,0-1.41 L18.36,16.95z M19.42,5.99c0.39-0.39,0.39-1.03,0-1.41c-0.39-0.39-1.03-0.39-1.41,0l-1.06,1.06c-0.39,0.39-0.39,1.03,0,1.41 s1.03,0.39,1.41,0L19.42,5.99z M7.05,18.36c0.39-0.39,0.39-1.03,0-1.41c-0.39-0.39-1.03-0.39-1.41,0l-1.06,1.06 c-0.39,0.39-0.39,1.03,0,1.41s1.03,0.39,1.41,0L7.05,18.36z\"/></svg><svg xmlns=\"http://www.w3.org/2000/svg\" class=\"theme-toggle-icon-dark\" viewBox=\"0 0 24 24\" width=\"24\" height=\"24\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M9.37,5.51C9.19,6.15,9.1,6.82,9.1,7.5c0,4.08,3.32,7.4,7.4,7.4c0.68,0,1.35-0.09,1.99-0.27C17.45,17.19,14.93,19,12,19 c-3.86,0-7-3.14-7-7C5,9.07,6.81,6.55,9.37,5.51z M12,3c-4.97,0-9,4.03-9,9s4.03,9,9,9s9-4.03,9-9c0-0.46-0.04-0.92-0.1-1.36 c-0.98,1.37-2.58,2.26-4.4,2.26c-2.98,0-5.4-2.42-5.4-5.4c0-1.81,0.89-3.42,2.26-4.4C12.92,3.04,12.46,3,12,3L12,3z\"/></svg></button>\n</div>";

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
    html.classList.remove('light');
    html.setAttribute('data-theme', 'dark');
  } else {
    html.classList.add('light');
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
 * @returns {{ cleanup: () => void, resetToSystem: () => void }} Object with cleanup() to remove the toggle and event listeners, and resetToSystem() to clear the user preference and follow OS theme
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
