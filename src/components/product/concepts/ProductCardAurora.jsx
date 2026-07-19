'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, Heart } from 'lucide-react';
import CountdownClock from '../CountdownClock';
import ProductActions from '../ProductActions';
import ProductMedia from './ProductMedia';
import { formatUGX, computeDiscountPct } from '@/lib/currency';
import { getUrgencyLevel } from '@/lib/urgency';
import { resizedImage } from '@/helpers/universal';
import { getBlurhashAverageColor } from '@/lib/blurhashColor';

const RING_COLOR = {
  low: 'var(--tt-success)',
  medium: 'var(--tt-gold)',
  high: 'var(--tt-flame-2)',
  critical: 'var(--tt-danger)',
  expired: 'var(--tt-muted)',
};

const RING_PERCENT = { low: 88, medium: 65, high: 38, critical: 15, expired: 0 };

/**
 * ProductCardAurora — glam magazine-cover card. Ambient glow sampled from the
 * blurhash sits behind the image; a countdown/discount medallion replaces the
 * usual scattered badges with a single focal urgency element.
 */
export default function ProductCardAurora({ product, index = 0 }) {
  if (!product) return null;
  const {
    id, name, slug, price, sale_price, sale_end_date,
    featured_image, stock, discount_pct, category,
    watchers, likes, vendor, tt_location,
  } = product;

  const level = getUrgencyLevel(sale_end_date);
  const pct = discount_pct || computeDiscountPct(price, sale_price);
  const isOutOfStock = stock !== null && stock <= 0;
  const imageUrl = featured_image?.url ? resizedImage(featured_image.url, 'medium') : null;
  const glow = getBlurhashAverageColor(featured_image?.blurhash) || '255, 77, 0';
  const ringColor = RING_COLOR[level] ?? RING_COLOR.low;
  const ringPercent = RING_PERCENT[level] ?? 0;
  const circumference = 2 * Math.PI * 26;
  const dashoffset = circumference - (ringPercent / 100) * circumference;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group relative"
    >
      {/* Ambient glow sampled from the blurhash */}
      <div
        className="pointer-events-none absolute -inset-3 -z-10 rounded-[28px] opacity-40 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
        style={{ background: `radial-gradient(circle at 30% 20%, rgba(${glow}, 0.55), transparent 70%)` }}
      />

      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--tt-border)] bg-[var(--tt-theme)] shadow-sm transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
        <Link href={`/products/${slug}`} className="relative block aspect-[4/5] w-full">
          <ProductMedia
            src={imageUrl}
            blurhash={featured_image?.blurhash}
            alt={name}
            className="h-full w-full"
            imgClassName="transition-transform duration-500 group-hover:scale-105"
          />

          {/* Category kicker */}
          {category?.name && (
            <span className="absolute left-3 top-3 rounded-full bg-black/35 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-sm">
              {category.name}
            </span>
          )}

          {/* Countdown / discount medallion */}
          {!isOutOfStock && (
            <div className="absolute right-3 top-3 h-[52px] w-[52px]">
              <svg viewBox="0 0 60 60" className="h-full w-full -rotate-90">
                <circle cx="30" cy="30" r="26" fill="rgba(13,13,20,0.45)" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                <circle
                  cx="30" cy="30" r="26" fill="none"
                  stroke={ringColor} strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={circumference} strokeDashoffset={dashoffset}
                  style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center leading-none text-white">
                <span className="text-[0.85rem] font-black">{Math.round(pct)}%</span>
                <span className="text-[0.5rem] font-semibold uppercase tracking-wide text-white/70">off</span>
              </div>
            </div>
          )}

          {/* Bottom gradient + social stats overlay */}
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/75 via-black/20 to-transparent p-3 pt-8">
            <h3 className="line-clamp-1 pr-2 font-['Syne',sans-serif] text-sm font-semibold text-white">{name}</h3>
            <div className="flex shrink-0 items-center gap-2 text-[0.68rem] font-medium text-white/85">
              {watchers > 0 && (
                <span className="flex items-center gap-1"><Eye size={12} strokeWidth={2.5} />{watchers}</span>
              )}
              {likes > 0 && (
                <span className="flex items-center gap-1"><Heart size={12} strokeWidth={2.5} />{likes}</span>
              )}
            </div>
          </div>

          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <span className="rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-sm">SOLD OUT</span>
            </div>
          )}
        </Link>

        {/* Footer: price + live countdown */}
        <div className="flex flex-col gap-2 p-3">
          <div className="flex items-baseline justify-between">
            <span className="font-['Syne',sans-serif] text-[1.05rem] font-bold text-[var(--tt-text)]">
              {formatUGX(sale_price)}
            </span>
            {price > sale_price && (
              <span className="text-[0.72rem] text-[var(--tt-muted)] line-through">{formatUGX(price)}</span>
            )}
          </div>

          {sale_end_date && !isOutOfStock && (
            <CountdownClock saleEndDate={sale_end_date} size="sm" />
          )}

          <ProductActions
            exClass="opacity-0 group-hover:opacity-100 transition-opacity -mx-1"
            product={product}
            storeData={tt_location || vendor}
          />
        </div>
      </div>
    </motion.div>
  );
}
