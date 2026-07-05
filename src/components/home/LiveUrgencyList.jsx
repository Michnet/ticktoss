'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

import { useLiveUrgencyProducts } from '@/hooks/useHomeData';
import { resizedImage } from '@/helpers/universal';

const CATEGORY_STYLES = {
  'Electronics': { emoji: '📱', color: '#4C8BFF' },
  'Fashion': { emoji: '👗', color: '#FF6B9D' },
  'Home & Living': { emoji: '🛋️', color: '#00E87A' },
  'Vehicles': { emoji: '🚗', color: '#FFB800' },
  'Sports': { emoji: '⚽', color: '#9B6BFF' },
  'Food & Drinks': { emoji: '🍱', color: '#FF4D00' },
  'Health & Beauty': { emoji: '💊', color: '#00D4C8' },
  'Agriculture': { emoji: '🌿', color: '#7BC400' },
  default: { emoji: '🛍️', color: 'var(--tt-gold)' }
};

function getStyle(categoryName) {
  return CATEGORY_STYLES[categoryName] || CATEGORY_STYLES.default;
}

function useCountdown(endDateStr) {
  const getTime = (str) => {
    const diff = new Date(str) - Date.now();
    if (diff <= 0) return { h: 0, m: 0, s: 0, expired: true };
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1000);
    return { h, m, s, expired: false };
  };
  const [time, setTime] = useState(() => getTime(endDateStr));
  useEffect(() => {
    const id = setInterval(() => setTime(getTime(endDateStr)), 1000);
    return () => clearInterval(id);
  }, [endDateStr]); // eslint-disable-line react-hooks/exhaustive-deps
  return time;
}

function formatUGX(n) {
  if (!n && n !== 0) return '';
  return 'UGX ' + Math.round(n).toLocaleString('en-UG');
}

function pad(n) {
  return String(n).padStart(2, '0');
}

/* ─── Compact list row for urgency list ──────────────────────────────────────── */
function UrgencyRow({ product, rank, isNew }) {
  const { h, m, s, expired } = useCountdown(product.sale_end_date);
  const isCritical = !expired && h === 0 && m < 30;
  const isVeryLow = product.stock <= 3;
  const {featured_image, name, slug} = product ?? {};
  
  const discountPct = product.price > 0 ? Math.round(((product.price - product.sale_price) / product.price) * 100) : 0;
  const categoryName = product.product_categories?.name || 'Uncategorized';
  const { emoji, color: catColor } = getStyle(categoryName);

  return (
    <motion.div
      layout
      layoutId={`urg-${product.id}`}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <Link
        href={`/products/${product.slug}`}
        className={`flex items-center gap-3 px-[0.875rem] py-[0.7rem] rounded-[var(--tt-radius-md)] no-underline transition-all duration-200 relative overflow-hidden hover:translate-x-[3px] ${isCritical ? 'bg-[rgba(255,45,85,0.06)] border border-[rgba(255,45,85,0.2)]' : 'bg-[var(--tt-surface)] border border-[var(--tt-border)]'}`}
      >
        {/* Rank */}
        <span
          className={`font-['Syne',sans-serif] font-extrabold text-[0.78rem] w-[18px] text-center shrink-0 ${rank <= 3 ? 'text-[var(--tt-flame)]' : 'text-[var(--tt-muted)]'}`}
        >
          {rank <= 3 ? ['🥇','🥈','🥉'][rank - 1] : rank}
        </span>

        {/* Emoji placeholder */}
        <span
          className="text-[1.4rem] w-8 h-8 flex items-center justify-center rounded-[var(--tt-radius-sm)] shrink-0"
          style={{ background: `${catColor}18` }}
        >
          {featured_image ? <img  src={resizedImage(featured_image?.url, 'thumbnail')} alt="" /> : emoji}
        </span>

        {/* Name + location */}
        <div className="flex-1 min-w-0">
          <div className="text-[0.82rem] font-semibold text-[var(--tt-text)] whitespace-nowrap overflow-hidden text-ellipsis leading-[1.3]">
            {product.name}
          </div>
          <div className="text-[0.68rem] text-[var(--tt-muted)] mt-[1px]">
            📍 {product.location || 'Uganda'}
          </div>
        </div>

        {/* Prices */}
        <div className="text-right shrink-0">
          <div
            className={`font-['Syne',sans-serif] font-bold text-[0.85rem] ${isCritical ? 'text-[var(--tt-danger)]' : 'text-[var(--tt-text)]'}`}
          >
            {formatUGX(product.sale_price)}
          </div>
          <div className="text-[0.68rem] text-[var(--tt-muted)] line-through">
            {formatUGX(product.price)}
          </div>
        </div>

        {/* Countdown */}
        <div
          className={`text-right shrink-0 min-w-[52px] font-['Syne',sans-serif] font-bold text-[0.8rem] ${isCritical ? 'text-[var(--tt-danger)] animate-[tt-pulse_1.2s_ease-in-out_infinite]' : h < 2 ? 'text-gray-500' : 'text-[var(--tt-muted-2)]'}`}
        >
          {expired
            ? 'EXPIRED'
            : h > 0
            ? `${h}h ${pad(m)}m`
            : `${pad(m)}:${pad(s)}`}
        </div>

        {/* Discount badge */}
        <span className="bg-[rgba(255,77,0,0.12)] border border-[rgba(255,77,0,0.3)] text-[var(--tt-flame-2)] font-extrabold text-[0.65rem] px-[6px] py-[2px] rounded-full shrink-0">
          -{discountPct}%
        </span>

        {/* LOW STOCK stripe */}
        {isVeryLow && (
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--tt-danger)] rounded-l-full" />
        )}
      </Link>
    </motion.div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────────── */
export default function LiveUrgencyList() {
  const { data: dbProducts, isLoading } = useLiveUrgencyProducts();
  const [sorted, setSorted] = useState([]);
  const prevRanks = useRef({});

  // Initialize and periodically re-sort on the client
  useEffect(() => {
    if (!dbProducts) return;

    const doSort = () => {
      setSorted((prev) => {
        prevRanks.current = Object.fromEntries(
          prev.map((p, i) => [p.id, i + 1])
        );
        // Recalculate urgency client-side combining DB urgency + real-time stock/hours
        const rescored = dbProducts.map((p) => {
          const hoursLeft = Math.max((new Date(p.sale_end_date) - Date.now()) / 3_600_000, 0.01);
          const stockAlert = p.stock_alert_level || 5;
          const score = (p.urgency_score || 0) + (30 / hoursLeft) + (20 / Math.max(p.stock, 1)) + (stockAlert * 2);
          return { ...p, current_score: score };
        });
        return rescored.sort((a, b) => b.current_score - a.current_score);
      });
    };

    doSort(); // Initial sort
    const id = setInterval(doSort, 30_000);
    return () => clearInterval(id);
  }, [dbProducts]);

  return (
    <section className="pb-12">
      <div>
        <div className="flex items-end justify-between mb-5 gap-4 flex-wrap">
          <div>
            <h2 className="font-['Syne',sans-serif] font-extrabold text-[clamp(1.3rem,2.5vw,1.85rem)]">
              Ending{' '}
              <span className="bg-[image:var(--tt-gradient-flame)] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
                Soonest
              </span>
            </h2>
            <p className="text-[var(--tt-muted)] text-[0.875rem] mt-1">
              Live urgency ranking — re-sorts every 30s{' '}
              <span className="inline-block w-[6px] h-[6px] bg-[var(--tt-success)] rounded-full ml-1 animate-[tt-pulse_1.5s_ease-in-out_infinite] align-middle" />
            </p>
          </div>
          <Link
            href="/products"
            className="tt-btn tt-btn-ghost text-[0.82rem] px-4 py-[0.45rem]"
          >
            View All →
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          {isLoading ? (
             Array.from({ length: 5 }).map((_, i) => (
               <div key={i} className="tt-shimmer h-[64px] rounded-[var(--tt-radius-md)] bg-[var(--tt-surface)]" />
             ))
          ) : (
            <AnimatePresence>
              {sorted.map((p, i) => (
                <UrgencyRow
                  key={p.id}
                  product={p}
                  rank={i + 1}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </section>
  );
}
