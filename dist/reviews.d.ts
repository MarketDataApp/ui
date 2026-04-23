/**
 * Renders a review platform rating widget into the given container.
 *
 * @param {Object} options
 * @param {HTMLElement} options.container - DOM element to render into
 * @param {'large'|'small'} [options.version='large'] - Widget variant
 * @returns {() => void} Cleanup function
 */
export function initResenaWidget(options: {
    container: HTMLElement;
    version?: "large" | "small";
}): () => void;
/**
 * @module reviews
 * Framework-agnostic review platform widget for *.marketdata.app.
 *
 * Zero production dependencies. Renders a review rating widget with
 * build-time data from the review platform's public page.
 */
export const reviewRating: "4.2";
export const reviewCount: "96";
export const reviewLabel: "Great";
