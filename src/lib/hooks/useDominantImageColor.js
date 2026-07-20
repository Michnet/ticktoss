'use client';

import { useEffect, useState } from 'react';

// Client-only: canvas isn't available during SSR. Pair with
// getBlurhashAverageColor for an instant first-paint color, then let this
// hook upgrade it once the real image has decoded.
const cache = new Map();
const SAMPLE_SIZE = 48; // downscale target — plenty for a color estimate, cheap to scan

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  return [0, s, l];
}

function extractDominantColor(img) {
  const canvas = document.createElement('canvas');
  const scale = Math.min(1, SAMPLE_SIZE / Math.max(img.naturalWidth, img.naturalHeight));
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Quantize into coarse RGB buckets (4 bits/channel = 4096 buckets),
  // tracking each bucket's true (unquantized) average color.
  const buckets = new Map();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a < 128) continue;
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    let bucket = buckets.get(key);
    if (!bucket) { bucket = { r: 0, g: 0, b: 0, count: 0 }; buckets.set(key, bucket); }
    bucket.r += r; bucket.g += g; bucket.b += b; bucket.count += 1;
  }
  if (buckets.size === 0) return null;

  // Score every bucket toward "the color that stands out": saturated and
  // mid-lightness scores highest, but a dark, saturated accent (eg. red on
  // a mostly-black frame) still beats the black it sits on, since black's
  // saturation is ~0. Falls back to the single largest bucket (whatever
  // that is, even if muted) if nothing scores above zero.
  let best = null, bestScore = -1;
  let largest = null, largestCount = -1;
  for (const bucket of buckets.values()) {
    const r = bucket.r / bucket.count, g = bucket.g / bucket.count, b = bucket.b / bucket.count;
    const [, s, l] = rgbToHsl(r, g, b);
    const lightnessWeight = 1 - Math.min(1, Math.abs(l - 0.5) * 1.6);
    const score = bucket.count * s * s * (0.35 + 0.65 * lightnessWeight);
    if (score > bestScore) { bestScore = score; best = { r, g, b }; }
    if (bucket.count > largestCount) { largestCount = bucket.count; largest = { r, g, b }; }
  }

  const winner = best && bestScore > 0 ? best : largest;
  return `${Math.round(winner.r)}, ${Math.round(winner.g)}, ${Math.round(winner.b)}`;
}

/**
 * Scan the real, decoded image pixels for the color that "stands out",
 * instead of approximating one from the blurhash. getBlurhashAverageColor
 * is a DC-term average — accurate for the image's overall tone, but a
 * mostly-black photo with a small bright accent (eg. red highlights on a
 * black gym bike) averages out to near-black. This weights saturated,
 * mid-lightness pixels higher, so the accent wins.
 *
 * Client-only and requires the image host to allow cross-origin pixel
 * reads (CORS) — resolves to null on a CORS-tainted canvas or load
 * failure, so callers should fall back to getBlurhashAverageColor.
 *
 * @param {string|null|undefined} src
 * @returns {string|null} "r, g, b", or null until resolved/on failure
 */
export function useDominantImageColor(src) {
  const [color, setColor] = useState(() => (src ? cache.get(src) ?? null : null));

  useEffect(() => {
    if (!src) { setColor(null); return; }
    if (cache.has(src)) { setColor(cache.get(src)); return; }

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (cancelled) return;
      let rgb = null;
      try {
        rgb = extractDominantColor(img);
      } catch {
        // Tainted canvas (image host doesn't send CORS headers) or decode
        // failure — leave rgb null so the caller falls back.
      }
      cache.set(src, rgb);
      if (!cancelled) setColor(rgb);
    };
    img.onerror = () => {
      if (!cancelled) setColor(null);
    };
    img.src = src;

    return () => { cancelled = true; };
  }, [src]);

  return color;
}
