'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Eye } from 'lucide-react';
import CountdownClock from '../CountdownClock';
import ProductActions from '../ProductActions';
import ProductMedia from './ProductMedia';
import { formatUGX, computeDiscountPct } from '@/lib/currency';
import { resizedImage } from '@/helpers/universal';

/**
 * ProductCardPolaroid — the deal as a snapped-and-shared polaroid: thick
 * photo frame, a sale sticker slapped on the corner, a handwritten-feel
 * caption strip. Leans glam/social rather than catalog-clinical.
 */
export default function ProductCardPolaroid({ product, index = 0 }) {
  if (!product) return null;
  const {
    id, name, slug, price, sale_price, sale_end_date,
    featured_image, stock, discount_pct,
    watchers, likes, vendor, tt_location,
  } = product;

  const pct = discount_pct || computeDiscountPct(price, sale_price);
  const isOutOfStock = stock !== null && stock <= 0;
  const imageUrl = featured_image?.url ? resizedImage(featured_image.url, 'medium') : null;
  const rotate = ((id ?? 0) % 5) - 2; // deterministic -2..2deg per product, feels hand-placed

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group flex h-full flex-col"
    >
      <div
        className="relative rounded-sm border border-[var(--tt-border)] bg-[var(--tt-theme)] p-2.5 pb-4 shadow-md transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-0 group-hover:shadow-xl"
        style={{ transform: `rotate(${rotate}deg)` }}
      >
        {/* Sale sticker */}
        {pct > 0 && !isOutOfStock && (
          <div className="absolute -right-2.5 -top-2.5 z-10 flex h-11 w-11 rotate-12 flex-col items-center justify-center rounded-full text-white shadow-[var(--tt-glow-flame)]" style={{ background: 'var(--tt-gradient-flame)' }}>
            <span className="text-[0.72rem] font-black leading-none">{Math.round(pct)}%</span>
            <span className="text-[0.4rem] font-bold uppercase leading-none">off</span>
          </div>
        )}

        <Link href={`/products/${slug}`} className="relative block aspect-square w-full overflow-hidden">
          <ProductMedia
            src={imageUrl}
            blurhash={featured_image?.blurhash}
            alt={name}
            className="h-full w-full"
            imgClassName="transition-transform duration-500 group-hover:scale-105"
          />
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <span className="rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-sm">SOLD OUT</span>
            </div>
          )}
        </Link>

        {/* Handwritten-feel caption strip */}
        <div className="pt-3 text-center">
          <Link href={`/products/${slug}`}>
            <h3 className="line-clamp-1 font-['Syne',sans-serif] text-sm italic text-[var(--tt-text)]">{name}</h3>
          </Link>
          <div className="mt-1 flex items-center justify-center gap-1.5">
            <span className="text-[0.95rem] font-bold text-[var(--tt-flame)]">{formatUGX(sale_price)}</span>
            {price > sale_price && (
              <span className="text-[0.65rem] text-[var(--tt-muted)] line-through">{formatUGX(price)}</span>
            )}
          </div>
          {sale_end_date && !isOutOfStock && (
            <div className="mt-1 flex justify-center">
              <CountdownClock saleEndDate={sale_end_date} size="sm" />
            </div>
          )}
        </div>
      </div>

      {/* Social proof + actions, outside the frame */}
      <div className="mt-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5 text-[0.68rem] font-medium text-[var(--tt-muted)]">
          {likes > 0 && <span className="flex items-center gap-1"><Heart size={12} strokeWidth={2.5} />{likes}</span>}
          {watchers > 0 && <span className="flex items-center gap-1"><Eye size={12} strokeWidth={2.5} />{watchers}</span>}
        </div>
        <ProductActions
          exClass="opacity-0 group-hover:opacity-100 transition-opacity"
          leftExtraClass=""
          iconSize={14}
          product={product}
          storeData={tt_location || vendor}
        />
      </div>
    </motion.div>
  );
}
