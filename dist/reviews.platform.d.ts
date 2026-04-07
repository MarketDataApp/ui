/**
 * @module reviews.platform
 * Anti-scraping: review platform identity computed at runtime.
 * Platform name and URL are never stored as string literals.
 *
 * Shared by src/reviews.js (client-side) and scripts/fetch-reviews.js (build-time).
 */
export function getPlatformName(): string;
export function getPlatformUrl(): string;
