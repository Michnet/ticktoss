'use client';

import { useEffect, useRef } from 'react';

/**
 * Pure client component — owns only the RAF-based scroll animation.
 * Receives pre-fetched `items` as a prop from the Server Component parent.
 */
export default function LiveTickerTrack({ items = [] }) {
  const trackRef = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || items.length === 0) return;

    let pos = 0;
    const speed = 0.6; // px per frame
    let raf;

    const step = () => {
      pos -= speed;
      if (Math.abs(pos) >= track.scrollWidth / 2) {
        pos = 0;
      }
      track.style.transform = `translateX(${pos}px)`;
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);

    const pause = () => cancelAnimationFrame(raf);
    const resume = () => { raf = requestAnimationFrame(step); };

    track.addEventListener('mouseenter', pause);
    track.addEventListener('mouseleave', resume);

    return () => {
      cancelAnimationFrame(raf);
      track.removeEventListener('mouseenter', pause);
      track.removeEventListener('mouseleave', resume);
    };
  }, [items]);

  // Double the array so the infinite-loop seam is invisible
  const doubled = [...items, ...items];

  if (doubled.length === 0) return null;

  return (
    <div
      ref={trackRef}
      className="flex gap-8 whitespace-nowrap will-change-transform"
    >
      {doubled.map((item, i) => (
        <span
          key={i}
          className="text-[1.1rem] text-[var(--tt-muted-2)] font-medium inline-flex items-center gap-8"
        >
          {item}
          <span className="inline-block w-1 h-1 bg-[var(--tt-flame)] rounded-full opacity-50" />
        </span>
      ))}
    </div>
  );
}
