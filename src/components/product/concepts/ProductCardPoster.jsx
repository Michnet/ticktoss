'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, Share2, Eye } from 'lucide-react';
import CountdownClock from '../CountdownClock';
import ProductActions from '../ProductActions';
import ProductMedia from './ProductMedia';
import { getBlurhashAverageColor } from '@/lib/blurhashColor';
import { formatUGX, computeDiscountPct } from '@/lib/currency';
import { resizedImage } from '@/helpers/universal';

/**
 * ProductCardPoster — full-bleed editorial poster, StyleShare-app-style: a
 * mini nav bar floats over the photo and a bottom scrim — tinted with the
 * image's own dominant color instead of flat black — carries a bold display
 * headline, price and countdown like a movie poster's tagline card.
 */
export default function ProductCardPoster({ product, index = 0 }) {
  if (!product) return null;
  const {
    id, name, slug, price, sale_price, sale_end_date,
    featured_image, stock, discount_pct, category, watchers,
  } = product;

  const glow = getBlurhashAverageColor(featured_image?.blurhash) || '20, 20, 24';
  const pct = discount_pct || computeDiscountPct(price, sale_price);
  const isOutOfStock = stock !== null && stock <= 0;
  const imageUrl = featured_image?.url ? resizedImage(featured_image.url, 'medium') : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <Link href={`/products/${slug}`} className="relative block aspect-[3/4] w-full">
        <ProductMedia
          src={imageUrl}
          blurhash={featured_image?.blurhash}
          alt={name}
          className="h-full w-full"
          imgClassName="transition-transform duration-700 group-hover:scale-105"
        />

        {/* Mini app bar, StyleShare-style */}
        <div className="absolute inset-x-3 top-3 z-10 flex items-center justify-between gap-2">
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm">
            <ChevronLeft size={16} strokeWidth={2.5} />
          </span>
          {category?.name && (
            <span className="line-clamp-1 rounded-full bg-black/30 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-sm">
              {category.name}
            </span>
          )}
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm">
            <Share2 size={14} strokeWidth={2.5} />
          </span>
        </div>

        {isOutOfStock && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
            <span className="rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-sm">SOLD OUT</span>
          </div>
        )}

        {/* Poster scrim, tinted with the image's own dominant color */}
        <div
          className="absolute inset-x-0 bottom-0 z-10 pt-16"
          style={{ background: `linear-gradient(180deg, transparent 0%, rgba(${glow}, 0.25) 30%, rgba(${glow}, 0.7) 60%, rgba(10, 10, 12, 0.92) 100%)` }}
        >
          <div className="flex flex-col gap-2 p-3.5 pt-2">
            <h3 className="line-clamp-2 font-['Syne',sans-serif] text-xl font-black leading-[1.08] text-white">
              {name}
            </h3>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-baseline gap-1.5">
                <span className="font-['Syne',sans-serif] text-[0.95rem] font-bold text-white">{formatUGX(sale_price)}</span>
                {price > sale_price && (
                  <span className="text-[0.65rem] text-white/55 line-through">{formatUGX(price)}</span>
                )}
              </div>
              {pct > 0 && !isOutOfStock && (
                <span
                  className="shrink-0 rounded-full border border-white/30 px-2 py-0.5 text-[0.62rem] font-black text-white"
                  style={{ background: `rgba(${glow}, 0.85)` }}
                >
                  {Math.round(pct)}% OFF
                </span>
              )}
            </div>

            {sale_end_date && !isOutOfStock ? (
              <CountdownClock saleEndDate={sale_end_date} size="sm" />
            ) : watchers > 0 ? (
              <span className="flex items-center gap-1 text-[0.68rem] font-medium text-white/70">
                <Eye size={12} strokeWidth={2.5} /> {watchers} watching
              </span>
            ) : null}

            <div className="-mx-1 [&_button]:!text-white [&_button:hover]:!text-white/70">
              <ProductActions
                leftExtraClass=""
                exClass="opacity-0 group-hover:opacity-100 transition-opacity"
                product={product}
                actionButtonClass="bg-white/15 text-white rounded-full"
              />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
