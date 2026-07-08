'use client';

import { useEffect, useRef } from 'react';

const TICKER_ITEMS = [
  '⚡ Flash deal: Samsung A55 down 46%',
  '🔥 3 items left — HP ProBook ending in 27min',
  '🇺🇬 TickToss — Uganda\'s #1 Discount Marketplace',
  '🆕 120 new deals listed in the last 2 hours',
  '💰 Save up to UGX 1.4M on this Sony TV',
  '📍 Deals in Kampala, Jinja, Wakiso & more',
  '⏰ Weekend Flash ends Sunday 23:59',
  '🛒 800+ bookings made today',
  '🏷️ Clearance: up to 80% off electronics',
  '📦 Cash on delivery — no online payment needed',
];

export default function LiveTicker() {
  const trackRef = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let pos = 0;
    const speed = 0.6; // px per frame
    const step = () => {
      pos -= speed;
      if (Math.abs(pos) >= track.scrollWidth / 2) {
        pos = 0;
      }
      track.style.transform = `translateX(${pos}px)`;
      raf = requestAnimationFrame(step);
    };
    let raf = requestAnimationFrame(step);

    track.addEventListener('mouseenter', () => cancelAnimationFrame(raf));
    track.addEventListener('mouseleave', () => {
      raf = requestAnimationFrame(step);
    });

    return () => cancelAnimationFrame(raf);
  }, []);

  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="bg-[var(--tt-surface)] shadow-lg py-[1.55rem] overflow-hidden mb-10 relative">
      {/* Left fade */}
      <div className="absolute left-0 top-0 bottom-0 w-[60px] bg-[linear-gradient(90deg,var(--tt-surface),transparent)] z-[2] pointer-events-none" />
      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 w-[60px] bg-[linear-gradient(-90deg,var(--tt-surface),transparent)] z-[2] pointer-events-none" />

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
    </div>
  );
}
