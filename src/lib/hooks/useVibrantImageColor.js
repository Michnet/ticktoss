'use client';

import { useEffect, useState } from 'react';
import { extractVibrantPalette, EMPTY_PALETTE } from '@/helpers/vibrantPalette';

// Client-only, like useDominantImageColor — canvas isn't available during
// SSR. Pair with getBlurhashAverageColor for an instant first-paint color.
const cache = new Map();

/**
 * Extract an accent color using the real Vibrant.js algorithm — median-cut
 * quantization feeding the same Vibrant/Muted swatch scoring node-vibrant
 * and Android's Palette API use — rather than the hand-rolled saturation
 * scoring in useDominantImageColor. Heavier (ships a real quantizer) but a
 * closer match to that library's actual output, for comparison.
 *
 * Client-only and requires the image host to allow cross-origin pixel
 * reads (CORS) — resolves to a palette of nulls on a CORS-tainted canvas
 * or load failure, so callers should fall back to getBlurhashAverageColor.
 *
 * @param {string|null|undefined} src
 * @returns {{Vibrant: string|null, LightVibrant: string|null, DarkVibrant: string|null,
 *   Muted: string|null, LightMuted: string|null, DarkMuted: string|null,
 *   best: string|null}} each swatch as "r, g, b" (or null); `best` is the
 *   first populated swatch in SWATCH_PRIORITY order.
 */
export function useVibrantImageColor(src) {
  const [palette, setPalette] = useState(() => (src ? cache.get(src) ?? EMPTY_PALETTE : EMPTY_PALETTE));

  useEffect(() => {
    if (!src) { setPalette(EMPTY_PALETTE); return; }
    if (cache.has(src)) { setPalette(cache.get(src)); return; }

    let cancelled = false;

    extractVibrantPalette(src).then((palette) => {
      cache.set(src, palette);
      if (!cancelled) setPalette(palette);
    });

    return () => { cancelled = true; };
  }, [src]);

  return palette;
}
