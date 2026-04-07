/**
 * Computes a Gravatar URL for the given email address.
 *
 * @param {string} email
 * @param {Object} [options]
 * @param {number} [options.size=80] - Image size in pixels (2x for 40px Retina display)
 * @param {string} [options.fallback='404'] - Gravatar default image param (404 triggers onerror)
 * @returns {string} Gravatar URL
 */
export function getGravatarUrl(email: string, options?: {
    size?: number;
    fallback?: string;
}): string;
/**
 * Renders a user profile avatar (or log-in button) into the given container.
 *
 * @param {Object} options
 * @param {HTMLElement} options.container - DOM element to render into
 * @param {boolean} [options.dropdown=false] - Enable dropdown menu
 * @param {string} [options.loginUrl='https://dashboard.marketdata.app/marketdata/login'] - Log-in href
 * @param {string} [options.logoutUrl='https://dashboard.marketdata.app/marketdata/logout'] - Log-out href
 * @param {string} [options.dashboardUrl='https://dashboard.marketdata.app/marketdata/member'] - Dashboard link
 * @param {string} [options.profileUrl='https://dashboard.marketdata.app/marketdata/profile'] - Profile link
 * @param {string} [options.planUrl='https://dashboard.marketdata.app/marketdata/signup'] - Plan link
 * @param {Array<{label: string, url: string}>} [options.menuItems=[]] - Extra menu items
 * @param {string} [options.apiUrl] - Override API endpoint
 * @param {string} [options.loginText='Log in'] - Log-in button text
 * @param {string} [options.signupUrl='https://dashboard.marketdata.app/marketdata/signup'] - Signup/trial href
 * @param {string} [options.signupText='Start Free Trial'] - Signup menu item text
 * @returns {Promise<() => void>} Cleanup function
 */
export function initUserProfile(options: {
    container: HTMLElement;
    dropdown?: boolean;
    loginUrl?: string;
    logoutUrl?: string;
    dashboardUrl?: string;
    profileUrl?: string;
    planUrl?: string;
    menuItems?: Array<{
        label: string;
        url: string;
    }>;
    apiUrl?: string;
    loginText?: string;
    signupUrl?: string;
    signupText?: string;
}): Promise<() => void>;
