'use client';

import { useEffect, useState } from 'react';
import { decode } from 'blurhash';

// Client-only: canvas isn't available during SSR, so decoding to a data URL
// happens in an effect after mount. getBlurhashAverageColor (SSR-safe) should
// be used for anything needed on first paint.
const cache = new Map();

/**
 * Decode a blurhash into a low-res PNG data URL for a blur-up image placeholder.
 * @param {string|null|undefined} hash
 * @param {number} size
 * @returns {string|null}
 */
export function useBlurhashDataURL(hash, size = 32) {
  const [url, setUrl] = useState(() => (hash ? cache.get(hash) ?? null : null));

  useEffect(() => {
    if (!hash) {
      setUrl(null);
      return;
    }
    if (cache.has(hash)) {
      setUrl(cache.get(hash));
      return;
    }

    try {
      const pixels = decode(hash, size, size);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const imageData = ctx.createImageData(size, size);
      imageData.data.set(pixels);
      ctx.putImageData(imageData, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
      cache.set(hash, dataUrl);
      setUrl(dataUrl);
    } catch {
      setUrl(null);
    }
  }, [hash, size]);

  return url;
}
