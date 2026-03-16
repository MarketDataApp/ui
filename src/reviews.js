/**
 * @module reviews
 * Framework-agnostic review platform widget for *.marketdata.app.
 *
 * Zero production dependencies. Renders a review rating widget with
 * build-time data from the review platform's public page.
 */

import { reviewRating, reviewCount, reviewLabel } from './reviews.data.js';
import { large as largeTpl, small as smallTpl } from './reviews.templates.js';
import { getPlatformName, getPlatformUrl } from './reviews.platform.js';

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

// ---------------------------------------------------------------------------
// initResenaWidget
// ---------------------------------------------------------------------------

/**
 * Renders a review platform rating widget into the given container.
 *
 * @param {Object} options
 * @param {HTMLElement} options.container - DOM element to render into
 * @param {'large'|'small'} [options.version='large'] - Widget variant
 * @returns {() => void} Cleanup function
 */
export function initResenaWidget(options) {
  const { container, version = 'large' } = options;

  const platformName = getPlatformName();
  const reviewUrl = getPlatformUrl();

  const tpl = version === 'small' ? smallTpl : largeTpl;

  const vars = {
    rating: reviewRating,
    count: reviewCount,
    labelText: reviewLabel,
  };

  const el = htmlToElement(renderTemplate(tpl, vars));

  // Set SVG title text at runtime (anti-scraping)
  const titleEls = el.querySelectorAll('title');
  titleEls.forEach((titleEl) => {
    if (titleEl.classList.contains('titulo-calificacion')) {
      titleEl.textContent = `${reviewRating} out of five star rating on ${platformName}`;
    } else if (titleEl.classList.contains('titulo-logo')) {
      titleEl.textContent = platformName;
    }
  });

  // Add click handlers
  const enlaces = el.querySelectorAll('.resena-enlace');
  enlaces.forEach((enlace) => {
    enlace.addEventListener('click', () => {
      window.open(reviewUrl, '_blank', 'noopener,noreferrer');
    });
    enlace.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        enlace.click();
      }
    });
    enlace.style.cursor = 'pointer';
  });

  container.appendChild(el);

  return function cleanup() {
    if (el.parentNode) el.parentNode.removeChild(el);
  };
}

// Re-export data for consumers who want just the numbers
export { reviewRating, reviewCount, reviewLabel };
