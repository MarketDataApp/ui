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
export function initThemeToggle(options: {
    container: HTMLElement;
    buttonClass?: string;
}): {
    cleanup: () => void;
    resetToSystem: () => void;
};
