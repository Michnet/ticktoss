'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const DEFAULT_BANNERS_WITH_IMAGES = [
  {
    id: 'local-sellers',
    label: '🏪 Multivendor Marketplace',
    title: 'Top Sellers Nationwide',
    sub: 'Discover amazing deals from trusted local and national vendors.',
    cta: { label: 'Explore Vendors', href: '/vendors' },
    image: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=80&w=1200&auto=format&fit=crop',
    gradient: 'linear-gradient(to right, rgba(0,0,0,0.8), rgba(0,0,0,0.2))',
  },
  {
    id: 'hot-deals',
    label: '🔥 Never Miss A Deal',
    title: 'Grab The Moment',
    sub: 'Flash discounts dropping hourly. Once the clock hits zero, they are gone.',
    cta: { label: 'Shop Live Deals', href: '/products?sort=discount' },
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1200&auto=format&fit=crop',
    gradient: 'linear-gradient(to right, rgba(255,77,0,0.8), rgba(255,77,0,0.1))',
  },
  {
    id: 'near-you',
    label: '📍 Local Steals',
    title: 'Hot Sales Near You',
    sub: 'Find heavily discounted items available for immediate pickup in your area.',
    cta: { label: 'See Nearby', href: '/near-me' },
    image: 'https://images.unsplash.com/photo-1555529771-835f59fc5efe?q=80&w=1200&auto=format&fit=crop',
    gradient: 'linear-gradient(to right, rgba(123,47,247,0.8), rgba(123,47,247,0.1))',
  },
];

export default function PromoBanners2({ items = DEFAULT_BANNERS_WITH_IMAGES }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setActive((a) => (a + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [paused, items.length]);

  return (
    <section className="pb-8 pt-4">
      <div className="tt-container tt-container-padding grid grid-cols-1 md:grid-cols-[auto_300px] lg:grid-cols-[auto_400px] gap-3 md:gap-6">
        {/* Main rotating banner with image */}
        <div className="relative w-full overflow-hidden rounded-[var(--tt-radius-xl)] shadow-lg min-h-[250px]">
          {items.map((banner, i) => (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out py-4 ${
                i === active ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${banner.image})` }}
              />
              <div 
                className="absolute inset-0"
                style={{ background: banner.gradient }}
              />
              <div className="absolute inset-0 p-[clamp(1.5rem,4vw,3rem)] flex flex-col justify-center items-start z-20 w-full md:w-3/4">
                <span className="text-[10px] font-bold tracking-widest uppercase bg-black/30 backdrop-blur-md rounded-full px-3 py-1 text-white mb-3 border border-white/20">
                  {banner.label}
                </span>
                <h2 className="font-extrabold  text-md sm:text-[clamp(1.5rem,4vw,1.5rem)] text-white mb-2 leading-tight drop-shadow-md">
                  {banner.title}
                </h2>
                <p className="text-white/90 text-sm md:text-[0.8rem] mb-6 max-w-md drop-shadow">
                  {banner.sub}
                </p>
                <Link
                  href={banner.cta.href}
                  className="theme-set font-bold text-[0.9rem] px-4 py-2 rounded-full hover:scale-105 transition-transform duration-200 shadow-[0_4px_14px_rgba(0,0,0,0.25)]"
                >
                  {banner.cta.label}
                </Link>
              </div>
            </div>
          ))}

          {/* Dot nav */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30 bg-black/20 backdrop-blur-sm px-3 py-2 rounded-full">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`h-2 rounded-full border-none cursor-pointer p-0 transition-all duration-300 ${
                  i === active ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Mini highlight cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-4">
          {[
            { icon: '🏷️', title: 'Discount Deals', sub: 'Time-limited offers' },
            { icon: '🛡️', title: 'Compare Prices', sub: 'Find the best deals' },
            { icon: '↩️', title: 'Location search', sub: 'Find deals near you' },
            { icon: '💬', title: 'Quality Products', sub: 'Buy from top vendors' },
          ].map((feature, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-[var(--tt-radius-md)] p-3 md:p-4 flex flex-col items-center text-center border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow justify-center">
              <span className="text-2xl mb-2">{feature.icon}</span>
              <h3 className="font-bold text-[0.85rem] md:text-[0.9rem] text-gray-900 dark:text-white leading-tight">{feature.title}</h3>
              <p className="text-[0.75rem] text-gray-500 dark:text-gray-400 mt-1">{feature.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
