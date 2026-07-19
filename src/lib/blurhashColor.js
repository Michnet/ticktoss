import { decode } from 'blurhash';

/**
 * Derive an average RGB color from a blurhash string. Pure math (no canvas/DOM),
 * so it's safe to call during SSR — used for instant ambient glows/gradients
 * before the real image (or even the canvas blur-up) has loaded.
 *
 * @param {string|null|undefined} hash
 * @returns {string|null} "r, g, b" — ready to drop into an rgba()/rgb() string
 */
const cache = new Map();

export function getBlurhashAverageColor(hash) {
  if (!hash || typeof hash !== 'string') return null;
  if (cache.has(hash)) return cache.get(hash);

  try {
    const pixels = decode(hash, 9, 9);
    let r = 0, g = 0, b = 0;
    const count = pixels.length / 4;
    for (let i = 0; i < pixels.length; i += 4) {
      r += pixels[i];
      g += pixels[i + 1];
      b += pixels[i + 2];
    }
    const rgb = `${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)}`;
    cache.set(hash, rgb);
    return rgb;
  } catch {
    return null;
  }
}
