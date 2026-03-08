/**
 * @module reviews.platform
 * Anti-scraping: review platform identity computed at runtime.
 * Platform name and URL are never stored as string literals.
 *
 * Shared by src/reviews.js (client-side) and scripts/fetch-reviews.js (build-time).
 */

export function getPlatformName() {
  return [84, 114, 117, 115, 116, 112, 105, 108, 111, 116]
    .map((c) => String.fromCharCode(c))
    .join('');
}

export function getPlatformUrl() {
  const host = [119, 119, 119].map((c) => String.fromCharCode(c)).join('');
  const domain = getPlatformName().toLowerCase();
  const path = [114, 101, 118, 105, 101, 119].map((c) => String.fromCharCode(c)).join('');
  const target = [
    119, 119, 119, 46, 109, 97, 114, 107, 101, 116, 100, 97, 116, 97, 46, 97, 112, 112,
  ]
    .map((c) => String.fromCharCode(c))
    .join('');
  return `https://${host}.${domain}.com/${path}/${target}`;
}
