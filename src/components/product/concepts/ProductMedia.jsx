'use client';

import { useState } from 'react';
import { useBlurhashDataURL } from '@/lib/hooks/useBlurhashDataURL';
import { getBlurhashAverageColor } from '@/lib/blurhashColor';

/**
 * ProductMedia — shared blur-up image loader for the card concepts.
 *
 * Three layers, cheapest-first, so there's never a blank frame:
 *  1. Average color from the blurhash (pure math, SSR-safe) — instant, even
 *     on first paint before any client JS has run.
 *  2. Fully decoded blurhash → canvas data URL — client-only (no `canvas`
 *     package for a server-side decode here), swapped in once ready.
 *  3. The real image, cross-faded in on load.
 */
export default function ProductMedia({ src, blurhash, alt, fit = 'cover', imgClassName = '', className = '' }) {
  const [loaded, setLoaded] = useState(false);
  const blurUrl = useBlurhashDataURL(blurhash);
  const avgColor = getBlurhashAverageColor(blurhash);
  const fitClass = fit === 'cover' ? 'object-cover' : 'object-contain';

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={avgColor ? { backgroundColor: `rgb(${avgColor})` } : undefined}
    >
      {blurUrl && (
        <img
          src={blurUrl}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 h-full w-full ${fitClass} scale-110 blur-xl transition-opacity duration-500 ${loaded ? 'opacity-0' : 'opacity-100'}`}
        />
      )}
      {src && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={`relative h-full w-full ${fitClass} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
        />
      )}
    </div>
  );
}
