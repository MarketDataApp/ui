/**
 * @module navbar-overflow
 * Priority-based navbar overflow utility.
 *
 * Uses ResizeObserver to monitor a container's width and dynamically hides/shows
 * items in priority order (lowest priority hidden first) to prevent wrapping.
 */
/**
 * @typedef {Object} OverflowItem
 * @property {string} selector - CSS selector to find the element
 * @property {number} priority - Lower number = hidden first
 */
/**
 * @typedef {Object} OverflowOptions
 * @property {HTMLElement} container - The navbar container to observe
 * @property {OverflowItem[]} items - Items with selectors and priority ordering
 */
/**
 * Initializes the navbar overflow handler.
 *
 * @param {OverflowOptions} options
 * @returns {() => void} Cleanup function that disconnects the observer and restores all items
 */
export function initNavbarOverflow({ container, items }: OverflowOptions): () => void;
export type OverflowItem = {
    /**
     * - CSS selector to find the element
     */
    selector: string;
    /**
     * - Lower number = hidden first
     */
    priority: number;
};
export type OverflowOptions = {
    /**
     * - The navbar container to observe
     */
    container: HTMLElement;
    /**
     * - Items with selectors and priority ordering
     */
    items: OverflowItem[];
};
