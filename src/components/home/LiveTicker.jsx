// Server Component — no 'use client' directive.
// Fetches live data at request time and passes it to the client animation strip.

import { getTickerItems } from '@/lib/db/tickerQueries';
import LiveTickerTrack from './LiveTickerTrack';

export default async function LiveTicker() {
  // Fetch live ticker messages; fall back to static set on error
  let items;
  try {
    items = await getTickerItems();
  } catch (err) {
    console.error('[LiveTicker] failed to fetch ticker data:', err);
    items = [
      '🇺🇬 TickToss — Uganda\'s #1 Discount Marketplace',
      '⚡ Flash deals updated daily — check back often',
      '🛒 Cash on delivery — no online payment needed',
      '📍 Deals across Kampala, Jinja, Wakiso & more',
      '⏰ Every deal has a countdown — book before time runs out',
    ];
  }

  return (
    <div className="shadow-lg py-[1.55rem] overflow-hidden mb-10 relative">
      {/* Left fade */}
      <div className="absolute left-0 top-0 bottom-0 w-[60px] bg-[linear-gradient(90deg,var(--tt-surface),transparent)] z-[2] pointer-events-none" />
      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 w-[60px] bg-[linear-gradient(-90deg,var(--tt-surface),transparent)] z-[2] pointer-events-none" />

      <LiveTickerTrack items={items} />
    </div>
  );
}
