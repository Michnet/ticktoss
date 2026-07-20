const BASE83_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~';

function decode83(str) {
  let value = 0;
  for (let i = 0; i < str.length; i++) {
    value = value * 83 + BASE83_CHARS.indexOf(str[i]);
  }
  return value;
}

/**
 * Derive the average RGB color from a blurhash string. Pure math (no canvas/DOM),
 * so it's safe to call during SSR — used for instant ambient glows/gradients
 * before the real image (or even the canvas blur-up) has loaded.
 *
 * Reads the DC component (chars 2-5) straight out of the hash instead of
 * decoding a pixel grid and re-averaging it: the DC term *is* the source
 * image's average color, already in sRGB. Decoding a grid mixes in the AC/
 * ringing terms, and on high-contrast images (eg. mostly-black with a small
 * bright highlight) the per-pixel clamping during that decode biases the
 * mean toward an unrelated hue.
 *
 * @param {string|null|undefined} hash
 * @returns {string|null} "r, g, b" — ready to drop into an rgba()/rgb() string
 */
const cache = new Map();

export function getBlurhashAverageColor(hash) {
  if (!hash || typeof hash !== 'string' || hash.length < 6) return null;
  if (cache.has(hash)) return cache.get(hash);

  try {
    const value = decode83(hash.substring(2, 6));
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    const rgb = `${r}, ${g}, ${b}`;
    cache.set(hash, rgb);
    return rgb;
  } catch {
    return null;
  }
}
