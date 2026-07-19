'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, Heart } from 'lucide-react';
import CountdownClock from '../CountdownClock';
import ProductActions from '../ProductActions';
import ProductMedia from './ProductMedia';
import { getBlurhashAverageColor } from '@/lib/blurhashColor';
import { formatUGX, computeDiscountPct } from '@/lib/currency';
import { resizedImage } from '@/helpers/universal';

/**
 * ProductCardGlassTag — a restrained, catalog-friendly card. The photo stays
 * sharp and uncluttered; a single frosted-glass price tag floats over its
 * corner, tinted with the product's own blurhash color instead of generic
 * gray glass — glam accent, not a takeover.
 */
export default function ProductCardGlassTag({ product, index = 0 }) {
  if (!product) return null;
  const {
    id, name, slug, price, sale_price, sale_end_date,
    featured_image, stock, discount_pct, category,
    watchers, likes, vendor, tt_location,
  } = product;

  const glow = getBlurhashAverageColor(featured_image?.blurhash) || '255, 77, 0';
  const pct = discount_pct || computeDiscountPct(price, sale_price);
  const isOutOfStock = stock !== null && stock <= 0;
  const imageUrl = featured_image?.url ? resizedImage(featured_image.url, 'medium') : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--tt-border)] bg-[var(--tt-theme)] shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <Link href={`/products/${slug}`} className="relative block aspect-[4/5] w-full">
        <ProductMedia
          src={imageUrl}
          blurhash={featured_image?.blurhash}
          alt={name}
          className="h-full w-full"
          imgClassName="transition-transform duration-500 group-hover:scale-105"
        />

        {category?.name && (
          <span className="absolute left-3 top-3 rounded-full bg-black/35 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-sm">
            {category.name}
          </span>
        )}

        {(watchers > 0 || likes > 0) && (
          <span
            className="absolute right-3 top-3 flex items-center gap-2 rounded-full border border-white/30 px-2.5 py-1 text-[0.62rem] font-semibold text-white backdrop-blur-md"
            style={{ background: `rgba(${glow}, 0.35)` }}
          >
            {watchers > 0 && <span className="flex items-center gap-1"><Eye size={11} strokeWidth={2.5} />{watchers}</span>}
            {likes > 0 && <span className="flex items-center gap-1"><Heart size={11} strokeWidth={2.5} />{likes}</span>}
          </span>
        )}

        {/* Floating color-tinted glass price tag */}
        {!isOutOfStock && (
          <div
            className="absolute bottom-3 left-3 right-3 overflow-hidden rounded-xl border border-white/25 p-2.5 shadow-lg backdrop-blur-xl"
            style={{ background: `rgba(${glow}, 0.3)` }}
          >
            <span className="pointer-events-none absolute inset-x-2.5 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-baseline gap-1.5">
                <span className="font-['Syne',sans-serif] text-[0.95rem] font-bold text-white">{formatUGX(sale_price)}</span>
                {price > sale_price && (
                  <span className="text-[0.62rem] text-white/60 line-through">{formatUGX(price)}</span>
                )}
              </div>
              {pct > 0 && (
                <span className="shrink-0 rounded-full bg-white/25 px-2 py-0.5 text-[0.62rem] font-black text-white">
                  {Math.round(pct)}%
                </span>
              )}
            </div>
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-sm">SOLD OUT</span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link href={`/products/${slug}`}>
          <h3 className="line-clamp-1 text-sm font-medium text-[var(--tt-text)]">{name}</h3>
        </Link>

        {sale_end_date && !isOutOfStock && (
          <CountdownClock saleEndDate={sale_end_date} size="sm" />
        )}

        <ProductActions
          exClass="opacity-0 group-hover:opacity-100 transition-opacity mt-auto"
          product={product}
          storeData={tt_location || vendor}
        />
      </div>
    </motion.div>
  );
}
