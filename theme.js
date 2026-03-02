/**
 * @module theme
 * Cross-domain dark/light theme cookie management for *.marketdata.app.
 *
 * Preference hierarchy: cookie > localStorage > system preference > light (default).
 * The cookie is set on .marketdata.app so the theme persists across subdomains.
 *
 * This module handles preference detection only — no DOM manipulation.
 * Each property (Amember, Docusaurus, etc.) applies the theme its own way.
 */

/** Reads the theme cookie value ('dark' | 'light' | null). */
export function getThemeCookie() {
    const match = document.cookie.match(/(?:^|;\s*)theme=(dark|light)/);
    return match ? match[1] : null;
}

/** Sets the theme cookie on .marketdata.app with a 1-year expiry. */
export function setThemeCookie(theme) {
    document.cookie = `theme=${theme}; domain=.marketdata.app; path=/; max-age=31536000; SameSite=Lax`;
}

/** Returns the user's explicitly saved preference (cookie > localStorage), or 'no-preference'. */
export function getUserThemePreference() {
    const cookieTheme = getThemeCookie();
    if (cookieTheme) return cookieTheme;

    const localTheme = localStorage.getItem('theme');
    if (localTheme === 'dark' || localTheme === 'light') {
        setThemeCookie(localTheme);
        return localTheme;
    }

    return 'no-preference';
}

/** Returns the browser/OS theme preference via matchMedia, or 'no-preference'. */
export function getBrowserThemePreference() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
    } else {
        return 'no-preference';
    }
}

/** Returns the effective theme by checking cookie > localStorage > system > 'light'. */
export function getEffectiveTheme() {
    const userThemePreference = getUserThemePreference();
    if (userThemePreference !== 'no-preference') {
        return userThemePreference;
    }

    const browserThemePreference = getBrowserThemePreference();
    if (browserThemePreference !== 'no-preference') {
        return browserThemePreference;
    }

    return 'light';
}
