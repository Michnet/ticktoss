'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

import { useHeroProducts } from '@/hooks/useHomeData';
import { resizedImage } from '@/helpers/universal';

const EMOJI_MAP = {
  'Electronics': '📱',
  'Fashion': '👗',
  'Home & Living': '🛋️',
  'Vehicles': '🚗',
  'Sports': '⚽',
  'Food & Drinks': '🍱',
  'Health & Beauty': '💊',
  'Agriculture': '🌿',
};

function getEmoji(categoryName) {
  return EMOJI_MAP[categoryName] || '🛍️';
}

function formatUGX(n) {
  return 'UGX ' + Math.round(n).toLocaleString('en-UG');
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function useCountdown(endDate) {
  const getTime = (d) => {
    const diff = d - Date.now();
    if (diff <= 0) return { h: 0, m: 0, s: 0 };
    return {
      h: Math.floor(diff / 3_600_000),
      m: Math.floor((diff % 3_600_000) / 60_000),
      s: Math.floor((diff % 60_000) / 1000),
    };
  };
  const [t, setT] = useState(() => getTime(endDate));
  useEffect(() => {
    const id = setInterval(() => setT(getTime(endDate)), 1000);
    return () => clearInterval(id);
  }, [endDate]); // eslint-disable-line react-hooks/exhaustive-deps
  return t;
}

function HeroProductPill({ product }) {
  const endDate = new Date(product.sale_end_date);
  const { h, m, s } = useCountdown(endDate);
  const isCritical = h === 0 && m < 30;

  const {featured_image} = product ?? {};
  
  // Calculate discount percentage
  const discountPct = product.price > 0 ? Math.round(((product.price - product.sale_price) / product.price) * 100) : 0;
  const emoji = getEmoji(product.product_categories?.name);

  return (
    <Link
      href={`/products/${product.slug}`}
      className={`flex items-center gap-3 px-4 py-3 backdrop-blur-md rounded-[var(--tt-radius-md)] no-underline transition-all duration-200 hover:translate-x-1 ${isCritical ? 'border border-[#ff2d55]/30 shadow-[0_0_20px_rgba(255,45,85,0.12)]' : 'border border-white/10'}`}
    >
      <span className="text-[1.6rem] shrink-0">{featured_image ? <img className='w-10 h-10 rounded-full' src={resizedImage(featured_image?.url, 'thumbnail')} alt={product.name} /> : emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[0.78rem] font-semibold text-[var(--tt-text)] whitespace-nowrap overflow-hidden text-ellipsis">
          {product.name}
        </div>
        <div className="flex gap-[0.4rem] items-baseline mt-[1px]">
          <span className="font-['Syne',sans-serif] font-bold text-[0.82rem]">
            {formatUGX(product.sale_price)}
          </span>
          <span className="text-[0.65rem] text-[var(--tt-muted)] line-through">
            {formatUGX(product.price)}
          </span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div
          className={`font-['Syne',sans-serif] font-extrabold text-[0.72rem] tracking-[0.02em] ${isCritical ? 'text-[var(--tt-danger)] animate-[tt-pulse_1s_ease-in-out_infinite]' : 'text-[var(--tt-gold)]'}`}
        >
          {h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`}
        </div>
        <div className="text-[0.6rem] bg-[var(--tt-gold)] text-[#0d0d14] font-extrabold px-[5px] py-[1px] rounded-full mt-[2px] text-center">
          -{discountPct}%
        </div>
      </div>
    </Link>
  );
}

export default function HeroSection() {
  const [statsVisible, setStatsVisible] = useState(false);
  const { data: heroProducts, isLoading } = useHeroProducts();

  useEffect(() => {
    const t = setTimeout(() => setStatsVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="py-[5rem] px-0 pb-[3rem] bg-[var(--tt-surface)] relative overflow-hidden">

      <div className="tt-container relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_320px] gap-8 md:gap-12 items-center">
          {/* LEFT: headline + CTAs */}
          <div>
            {/* Badges */}
            {/* <div className="flex flex-wrap gap-2 mb-6">
              <span className="tt-badge tt-badge-flame animate-[tt-pulse_2s_ease-in-out_infinite]">
                ⚡ Live Deals
              </span>
              <span className="tt-badge border border-[var(--tt-border)] text-[var(--tt-muted-2)]">🇺🇬 Uganda&#39;s #1 Urgency Market</span>
              <span className="tt-badge border border-[var(--tt-border)] text-[var(--tt-muted-2)]">
                800+ bookings today
              </span>
            </div> */}

            {/* Headline */}
            <h1 className="font-['Syne',sans-serif] font-extrabold text-[clamp(2rem,5.5vw,4rem)] leading-[1.05] mb-5">
              Every Deal Has a{' '}
              <span className="font-['Syne',sans-serif] font-extrabold bg-[image:var(--tt-gradient-flame)] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
                Clock.
              </span>
              <br />
              Don&#39;t Miss It.
            </h1>

            <p className="text-[var(--tt-muted-2)] text-[clamp(0.95rem,1.8vw,1.15rem)] max-w-[480px] leading-[1.65] mb-8">
              Shop deeply discounted products from vendors across Uganda.
              Every listing races up the list the closer it gets to expiry —
              the best deals rise to the top.
            </p>

            {/* CTAs */}
            <div className="flex gap-3 flex-wrap mb-10">
              <Link
                href="/products"
                className="tt-btn tt-btn-primary tt-shimmer px-8 py-3 text-[0.95rem]"
              >
                Browse Deals
              </Link>
              <Link
                href="/near-me"
                className="tt-btn tt-btn-ghost px-8 py-3 text-[0.95rem]"
              >
                📍 Near Me
              </Link>
              <Link
                href="/apply-vendor"
                className="tt-btn tt-btn-gold px-8 py-3 text-[0.95rem]"
              >
                Sell on TickToss
              </Link>
            </div>

            {/* Stats row */}
            <div
              className={`flex gap-8 flex-wrap pt-7 border-t border-[var(--tt-border)] transition-all duration-500 ${statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
            >
              {[
                { value: '12,400+', label: 'Active Deals' },
                { value: '3,800+', label: 'Vendors' },
                { value: 'UGX Only', label: 'Ugandan Shillings' },
                { value: 'Cash', label: 'Pay on Delivery' },
              ].map(({ value, label }) => (
                <div key={label}>
                  <div className="font-['Syne',sans-serif] font-extrabold text-[1.2rem] bg-[image:var(--tt-gradient-flame)] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
                    {value}
                  </div>
                  <div className="text-[var(--tt-muted)] text-[0.75rem]">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: live product spotlight cards */}
          <div className="flex flex-col gap-[0.6rem]">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block w-[6px] h-[6px] bg-[var(--tt-danger)] rounded-full animate-[tt-pulse_1.2s_ease-in-out_infinite]" />
              <span className="text-[0.72rem] text-[var(--tt-muted)] font-semibold tracking-[0.06em] uppercase">
                Ending Soonest
              </span>
            </div>

            {isLoading ? (
              <div className="flex flex-col gap-[0.6rem]">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="tt-shimmer h-[70px] rounded-[var(--tt-radius-md)] bg-[#16161f]/85" />
                ))}
              </div>
            ) : (
              heroProducts?.map((p) => (
                <HeroProductPill key={p.id} product={p} />
              ))
            )}

            <Link
              href="/products"
              className="block text-center p-2 bg-[#ff4d00]/[0.08] border border-dashed border-[#ff4d00]/25 rounded-[var(--tt-radius-md)] text-[var(--tt-flame-2)] text-[0.78rem] font-semibold no-underline transition-colors duration-200 hover:bg-[#ff4d00]/[0.14]"
            >
              View all {(12400).toLocaleString()} deals →
            </Link>
          </div>
        </div>
      </div>

      {/* Responsive layout for mobile */}
    </section>
  );
}
