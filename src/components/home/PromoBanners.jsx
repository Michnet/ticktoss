'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const DEFAULT_BANNERS = [
  {
    id: 'weekend',
    label: '🗓️ Weekend Flash',
    title: 'Weekend Deals Are Live!',
    sub: 'Extra-deep discounts on electronics & fashion — ends Sunday 23:59',
    cta: { label: 'Shop Weekend Deals', href: '/products?tag=weekend-flash' },
    gradient: '#FF4D00',
    glow: 'rgba(255,77,0,0.35)',
  },
  {
    id: 'clearance',
    label: '🔥 Clearance',
    title: 'End-of-Season Clearance',
    sub: 'Up to 80% off — stock clearing fast. Once it\'s gone, it\'s gone.',
    cta: { label: 'Grab Clearance Deals', href: '/products?tag=clearance' },
    gradient: '#FF8C00',
    glow: 'rgba(255,184,0,0.30)',
  },
  {
    id: 'newyear',
    label: '🎉 Mid-Year',
    title: 'Mid-Year Mega Sale 2025',
    sub: 'Thousands of deals across all categories. Countdown clocks ticking faster.',
    cta: { label: 'See All Deals', href: '/products' },
    gradient: '#7B2FF7',
    glow: 'rgba(123,47,247,0.30)',
  },
  {
    id: 'vendor',
    label: '🏪 Sell with Us',
    title: 'Start Selling in Minutes',
    sub: 'List with a discount, set a deadline, watch your stock move. Free to start.',
    cta: { label: 'Become a Vendor', href: '/apply-vendor' },
    gradient: '#00E87A',
    glow: 'rgba(0,232,122,0.25)',
  },
];

export default function PromoBanners({ items = DEFAULT_BANNERS }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setActive((a) => (a + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [paused, items.length]);

  const banner = items[active];

  return (
    <section className="pb-8">
      <div className="tt-container tt-container-padding">
        {/* Main rotating banner */}
        <div
          key={banner.id}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="rounded-[var(--tt-radius-xl)] p-[clamp(1.5rem,4vw,2.5rem)] relative overflow-hidden animate-[bannerFadeIn_0.45s_ease]"
          style={{
            background: banner.gradient,
            boxShadow: `0 0 6px ${banner.glow}`,
          }}
        >
          {/* Main rotating banner inner wrapper */}
          <div className="flex items-center justify-between gap-4 flex-wrap relative z-10">
            <div>
              <span className="text-[0.7rem] font-bold tracking-[0.1em] uppercase bg-white/25 rounded-full px-[10px] py-[2px] text-white mb-2 inline-block">
                {banner.label}
              </span>
              <h2 className="font-['Syne',sans-serif] font-extrabold text-[clamp(1.2rem,3vw,2rem)] text-white mb-[0.35rem] leading-[1.15]">
                {banner.title}
              </h2>
              <p className="text-white/80 text-[0.9rem] max-w-[480px]">
                {banner.sub}
              </p>
            </div>
            <Link
              href={banner.cta.href}
              className="bg-white/20 backdrop-blur-md border border-white/35 text-white font-bold text-[0.88rem] px-6 py-[0.65rem] rounded-[var(--tt-radius-md)] whitespace-nowrap inline-flex items-center gap-[0.4rem] transition-colors duration-200 shrink-0 hover:bg-white/30"
            >
              {banner.cta.label} →
            </Link>
          </div>

          {/* Dot nav */}
          <div className="absolute bottom-3 right-4 flex gap-[5px] z-10">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`h-[6px] rounded-full border-none cursor-pointer p-0 transition-all duration-300 ${i === active ? 'w-[20px] bg-white' : 'w-[6px] bg-white/40'}`}
              />
            ))}
          </div>
        </div>

        {/* Mini inline banners */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3 mt-3">
          {[
            {
              icon: '⚡',
              label: 'Flash Deals',
              sub: 'Ending in < 2hrs',
              href: '/products?filter=flash',
              bg: 'rgba(255,77,0,0.12)',
              border: 'rgba(255,77,0,0.25)',
              color: 'var(--tt-flame)',
            },
            {
              icon: '📍',
              label: 'Near Me',
              sub: 'Deals within 5 km',
              href: '/near-me',
              bg: 'rgba(0,232,122,0.08)',
              border: 'rgba(0,232,122,0.2)',
              color: 'var(--tt-success)',
            },
            {
              icon: '🏷️',
              label: 'Biggest Discounts',
              sub: '50% off or more',
              href: '/products?sort=discount',
              bg: 'rgba(255,184,0,0.08)',
              border: 'rgba(255,184,0,0.2)',
              color: 'var(--tt-gold)',
            },
            {
              icon: '🆕',
              label: 'Just Listed',
              sub: 'Fresh deals today',
              href: '/products?sort=new',
              bg: 'rgba(123,47,247,0.1)',
              border: 'rgba(123,47,247,0.25)',
              color: '#9B6BFF',
            },
          ].map(({ icon, label, sub, href, bg, border, color }) => (
            <Link
              key={label}
              href={href}
              className="flex items-center gap-3 px-4 py-[0.85rem] rounded-[var(--tt-radius-md)] no-underline transition-all duration-200 hover:-translate-y-[2px] bg-gray-100 dark:bg-gray-900"
              /* style={{
                background: bg,
                borderColor: border,
                borderWidth: '1px',
                borderStyle: 'solid',
              }} */
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 6px 24px ${border}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span className="text-[1.5rem] w-8 flex items-center justify-center">{icon}</span>
              <div>
                <div className="font-bold text-[0.85rem] leading-[1.2] mb-1" style={{ color }}>{label}</div>
                <div className="text-[0.8rem]">{sub}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes bannerFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
