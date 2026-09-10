/**
 * The sections of a dropdown with every disabled row removed, and every
 * section that emptied out removed with it.
 *
 * The drawer lists only what a visitor can tap. A "coming soon" row is an
 * announcement, and an announcement you cannot follow is pure height on a
 * phone. The mega menu keeps them: there is room across its columns.
 *
 * @param {NavDropdown} item
 * @returns {NavSection[]}
 */
export function tappableSections(item: NavDropdown): NavSection[];
/**
 * Render the site header to an HTML string.
 *
 * Emit it as-is in the initial HTML — Astro: `<Fragment set:html={html} />` —
 * then call `initHeader()` from `@marketdataapp/ui/header-client` once on the
 * client. The output is one `<header class="site-header">` (skip link, fixed
 * bar, backdrop, drawer) followed by a spacer the height of the bar.
 *
 * @param {RenderHeaderOptions} [options]
 * @returns {string}
 */
export function renderHeader(options?: RenderHeaderOptions): string;
/**
 * One row in a menu.
 *
 * @typedef {Object} NavLink
 * @property {string} label
 * @property {string} href
 * @property {string} [icon] - A built-in icon name (see `headerIconNames`) or a raw `<svg …>` string. Raw SVG is trusted markup.
 * @property {boolean} [external] - Opens in a new tab with `rel="noopener noreferrer"`.
 * @property {boolean} [disabled] - An announcement, not a link. Shown in the mega menu, dropped from the drawer.
 * @property {string} [disabledLabel] - Suffix after a disabled label, e.g. "(coming soon)".
 * @property {string} [description] - Second line under the label. Only the `cards` layout draws it.
 */
/**
 * A titled group of rows inside a dropdown.
 *
 * @typedef {Object} NavSection
 * @property {string} [title]
 * @property {string} [titleHref] - Makes the title a link.
 * @property {string} [titleIcon] - Drawer only: a linked title is a row like the ones under it and needs their icon to line up.
 * @property {NavLink[]} links
 */
/**
 * A top-level item that opens a mega menu on desktop and an accordion in the drawer.
 *
 * @typedef {Object} NavDropdown
 * @property {'dropdown'} type
 * @property {string} id - Stable slug; element ids derive from it (`mega-menu-${id}`).
 * @property {string} label
 * @property {NavSection[]} columns
 * @property {NavSection} [aside] - The darker right-hand column.
 * @property {'list'|'cards'} [layout] - `cards` is the two-column Products grid with descriptions. Default `list`.
 */
/**
 * A top-level item that is a plain link.
 *
 * @typedef {Object} NavDirectLink
 * @property {'link'} type
 * @property {string} label
 * @property {string} href
 */
/** @typedef {NavDropdown | NavDirectLink} NavItem */
/**
 * One entry of the shared data catalogue.
 *
 * @typedef {Object} DataCatalogEntry
 * @property {string} key - Stable identifier, e.g. `mutual-funds`.
 * @property {string} title - Display name, e.g. "Mutual Funds".
 * @property {string} icon - Built-in icon name.
 * @property {string} [href] - Canonical page. Absent while `comingSoon`.
 * @property {boolean} comingSoon
 */
/**
 * An image source for the logo.
 *
 * @typedef {string | { src: string, srcset?: string, sizes?: string }} LogoSource
 */
/**
 * @typedef {Object} HeaderLogo
 * @property {LogoSource} light
 * @property {LogoSource} dark
 * @property {string} [alt] - Default "MarketData".
 * @property {number} [width] - Intrinsic width attribute. Default 160.
 * @property {number} [height] - Intrinsic height attribute. Default 32.
 */
/**
 * @typedef {Object} HeaderSlots
 * @property {string} [logo] - Replaces both logo markups. Trusted HTML.
 * @property {string} [auth] - Replaces the account-control container. Keep `id="user-profile"` on its outer element so the overflow pass and `initHeader` can find it. Trusted HTML.
 * @property {string} [drawerStart] - HTML placed at the top of the drawer body, above the navigation. Trusted HTML.
 * @property {string} [drawerEnd] - HTML placed at the bottom of the drawer body. Trusted HTML.
 */
/**
 * @typedef {Object} RenderHeaderOptions
 * @property {HeaderLogo} [logo] - Required unless `slots.logo` is given.
 * @property {string} [currentPath] - The page's pathname. Marks the matching drawer row with `aria-current="page"`.
 * @property {NavItem[]} [navigation] - Default `defaultNavigation`.
 * @property {string} [homeHref] - Default "/".
 * @property {string} [skipLinkHref] - Default "#main-content".
 * @property {string} [loginUrl] - Drawer fallback link. Default dashboard login.
 * @property {string} [loginText] - Default "Log In".
 * @property {string} [signupUrl] - Drawer fallback link. Default "/signup/".
 * @property {string} [signupText] - Default "Try For Free".
 * @property {boolean} [fixed] - `true` (default): a fixed 60px bar plus a 60px spacer. `false`: an in-flow bar and no spacer.
 * @property {HeaderSlots} [slots]
 */
/**
 * The data types marketdata.app offers, in display order.
 *
 * This is the one list behind the Data menu. The website derives the cards on
 * its home, /api and /data pages from the same shape, so it should build them
 * from this catalogue and keep only its own copy (descriptions) beside it —
 * see README "Site Header › Data catalogue".
 *
 * @type {ReadonlyArray<DataCatalogEntry>}
 */
export const dataCatalog: ReadonlyArray<DataCatalogEntry>;
/**
 * The navigation every property shows: the website's live nav as of the
 * extraction. It links marketdata.app pages only. Nothing here points at an
 * application that is not meant to be discovered.
 *
 * @type {ReadonlyArray<NavItem>}
 */
export const defaultNavigation: ReadonlyArray<NavItem>;
/** Names accepted by `NavLink.icon`, `NavSection.titleIcon` and `DataCatalogEntry.icon`. */
export const headerIconNames: readonly string[];
/**
 * One row in a menu.
 */
export type NavLink = {
    label: string;
    href: string;
    /**
     * - A built-in icon name (see `headerIconNames`) or a raw `<svg …>` string. Raw SVG is trusted markup.
     */
    icon?: string;
    /**
     * - Opens in a new tab with `rel="noopener noreferrer"`.
     */
    external?: boolean;
    /**
     * - An announcement, not a link. Shown in the mega menu, dropped from the drawer.
     */
    disabled?: boolean;
    /**
     * - Suffix after a disabled label, e.g. "(coming soon)".
     */
    disabledLabel?: string;
    /**
     * - Second line under the label. Only the `cards` layout draws it.
     */
    description?: string;
};
/**
 * A titled group of rows inside a dropdown.
 */
export type NavSection = {
    title?: string;
    /**
     * - Makes the title a link.
     */
    titleHref?: string;
    /**
     * - Drawer only: a linked title is a row like the ones under it and needs their icon to line up.
     */
    titleIcon?: string;
    links: NavLink[];
};
/**
 * A top-level item that opens a mega menu on desktop and an accordion in the drawer.
 */
export type NavDropdown = {
    type: "dropdown";
    /**
     * - Stable slug; element ids derive from it (`mega-menu-${id}`).
     */
    id: string;
    label: string;
    columns: NavSection[];
    /**
     * - The darker right-hand column.
     */
    aside?: NavSection;
    /**
     * - `cards` is the two-column Products grid with descriptions. Default `list`.
     */
    layout?: "list" | "cards";
};
/**
 * A top-level item that is a plain link.
 */
export type NavDirectLink = {
    type: "link";
    label: string;
    href: string;
};
export type NavItem = NavDropdown | NavDirectLink;
/**
 * One entry of the shared data catalogue.
 */
export type DataCatalogEntry = {
    /**
     * - Stable identifier, e.g. `mutual-funds`.
     */
    key: string;
    /**
     * - Display name, e.g. "Mutual Funds".
     */
    title: string;
    /**
     * - Built-in icon name.
     */
    icon: string;
    /**
     * - Canonical page. Absent while `comingSoon`.
     */
    href?: string;
    comingSoon: boolean;
};
/**
 * An image source for the logo.
 */
export type LogoSource = string | {
    src: string;
    srcset?: string;
    sizes?: string;
};
export type HeaderLogo = {
    light: LogoSource;
    dark: LogoSource;
    /**
     * - Default "MarketData".
     */
    alt?: string;
    /**
     * - Intrinsic width attribute. Default 160.
     */
    width?: number;
    /**
     * - Intrinsic height attribute. Default 32.
     */
    height?: number;
};
export type HeaderSlots = {
    /**
     * - Replaces both logo markups. Trusted HTML.
     */
    logo?: string;
    /**
     * - Replaces the account-control container. Keep `id="user-profile"` on its outer element so the overflow pass and `initHeader` can find it. Trusted HTML.
     */
    auth?: string;
    /**
     * - HTML placed at the top of the drawer body, above the navigation. Trusted HTML.
     */
    drawerStart?: string;
    /**
     * - HTML placed at the bottom of the drawer body. Trusted HTML.
     */
    drawerEnd?: string;
};
export type RenderHeaderOptions = {
    /**
     * - Required unless `slots.logo` is given.
     */
    logo?: HeaderLogo;
    /**
     * - The page's pathname. Marks the matching drawer row with `aria-current="page"`.
     */
    currentPath?: string;
    /**
     * - Default `defaultNavigation`.
     */
    navigation?: NavItem[];
    /**
     * - Default "/".
     */
    homeHref?: string;
    /**
     * - Default "#main-content".
     */
    skipLinkHref?: string;
    /**
     * - Drawer fallback link. Default dashboard login.
     */
    loginUrl?: string;
    /**
     * - Default "Log In".
     */
    loginText?: string;
    /**
     * - Drawer fallback link. Default "/signup/".
     */
    signupUrl?: string;
    /**
     * - Default "Try For Free".
     */
    signupText?: string;
    /**
     * - `true` (default): a fixed 60px bar plus a 60px spacer. `false`: an in-flow bar and no spacer.
     */
    fixed?: boolean;
    slots?: HeaderSlots;
};
