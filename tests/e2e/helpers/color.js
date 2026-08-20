/**
 * Reading real, resolved colours out of a browser, and comparing them.
 *
 * Chrome serialises a computed colour in the space it was authored in, so this
 * kit hands back `oklab()` for anything built on its `oklch()` tokens and
 * `rgb()` for a plain hex. Neither is directly comparable, so every value goes
 * through a probe element using relative colour syntax and comes back as sRGB.
 *
 * Shared by focus-ring.spec.js and badge-link.spec.js — both assert about
 * delivered contrast, and the probe is subtle enough to be worth having once.
 */

/**
 * A ring painted by Tailwind's `ring-{n}` at a given width: spread only, no
 * blur, no offset.
 *
 * The colour is matched as any CSS colour function rather than as `rgb()`,
 * for the serialisation reason above.
 */
export function ringShadow(width) {
  return new RegExp(`[a-z]+\\([^)]*\\)\\s+0px 0px 0px ${width}px`);
}

/**
 * Read one element's painted colours, all as sRGB channels in 0-1.
 *
 * Returns the raw `box-shadow` string too, so a caller can assert that no ring
 * is painted at all — a parsed `null` cannot distinguish "no ring" from "ring
 * the parser missed".
 *
 * `surface` is the element's own background, falling back to the document
 * body's when the element is transparent: a transparent control rings against
 * whatever it sits on.
 */
export async function readStyles(page, selector, ringWidth = 4) {
  return page.evaluate(
    ([sel, width, colorPattern]) => {
      const toSrgb = (value) => {
        const probe = document.createElement('span');
        probe.style.color = `rgb(from ${value} r g b)`;
        // An unsupported syntax is dropped silently, and the probe would then
        // report its inherited colour — making every comparison 1:1 and every
        // assertion pass or fail for the wrong reason.
        if (!probe.style.color) throw new Error(`relative colour syntax rejected: ${value}`);
        document.body.appendChild(probe);
        const out = getComputedStyle(probe).color;
        probe.remove();

        // Chrome answers `color(srgb r g b)` with 0-1 channels when the source
        // was authored wide-gamut, and `rgb(r, g, b)` with 0-255 channels when
        // it was already sRGB. The kit produces both.
        const scale = out.startsWith('color(') ? 1 : 255;
        return out
          .match(/[-\d.]+/g)
          .slice(0, 3)
          .map((v) => Math.min(1, Math.max(0, Number(v) / scale)));
      };

      const el = document.querySelector(sel);
      if (!el) throw new Error(`no element matches ${sel}`);
      const style = getComputedStyle(el);

      const shadow = style.boxShadow;
      const ring = shadow.match(new RegExp(`(${colorPattern})\\s+0px 0px 0px ${width}px`));

      let behind = style.backgroundColor;
      const transparent = behind === 'rgba(0, 0, 0, 0)';
      if (transparent) behind = getComputedStyle(document.body).backgroundColor;

      return {
        shadow,
        ring: ring && toSrgb(ring[1]),
        surface: toSrgb(behind),
        background: transparent ? null : toSrgb(style.backgroundColor),
        color: toSrgb(style.color),
      };
    },
    [selector, ringWidth, '[a-z]+\\([^)]*\\)'],
  );
}

/** WCAG relative luminance from sRGB channels in 0-1. */
export function luminance([r, g, b]) {
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio between two sRGB channel triples. */
export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** True when two sRGB triples differ by more than float noise. */
export function differs(a, b) {
  return a.some((channel, i) => Math.abs(channel - b[i]) > 0.001);
}
