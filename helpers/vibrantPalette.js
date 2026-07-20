import { Vibrant } from 'node-vibrant/browser';

// Preference order when picking a single swatch out of Vibrant's six-swatch
// palette (Vibrant/Muted x plain/Light/Dark) — favors a genuinely vibrant
// accent, only falling back to muted swatches if the image has none.
export const SWATCH_PRIORITY = ['Vibrant', 'LightVibrant', 'DarkVibrant', 'Muted', 'LightMuted', 'DarkMuted'];

export const EMPTY_PALETTE = Object.fromEntries([...SWATCH_PRIORITY, 'best'].map((name) => [name, null]));

// Extract a full swatch palette using the real Vibrant.js algorithm. Resolves
// to EMPTY_PALETTE (rather than throwing) on a CORS-tainted canvas or load
// failure, so callers can save/render without a palette instead of blocking.
export async function extractVibrantPalette(src) {
  if (!src) return EMPTY_PALETTE;

  try {
    const rawPalette = await Vibrant.from(src).getPalette();
    const palette = { ...EMPTY_PALETTE };
    for (const name of SWATCH_PRIORITY) {
      const swatch = rawPalette[name];
      if (swatch) palette[name] = swatch.rgb.map(Math.round).join(', ');
    }
    palette.best = SWATCH_PRIORITY.map((name) => palette[name]).find(Boolean) ?? null;
    return palette;
  } catch (error) {
    console.error('Error extracting vibrant palette:', error);
    return EMPTY_PALETTE;
  }
}
