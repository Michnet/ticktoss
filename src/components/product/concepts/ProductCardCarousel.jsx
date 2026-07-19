'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Eye, Heart } from 'lucide-react';
import CountdownClock from '../CountdownClock';
import ProductActions from '../ProductActions';
import ProductMedia from './ProductMedia';
import { formatUGX, computeDiscountPct } from '@/lib/currency';
import { resizedImage } from '@/helpers/universal';

/**
 * ProductCardCarousel — the gallery as a tappable slide deck. Chevrons and
 * dot indicators let a shopper flip through every shot without leaving the
 * grid, unlike the Story card's passive hover-cycle.
 */
export default function ProductCardCarousel({ product, index = 0 }) {
  if (!product) return null;
  const {
    id, name, slug, price, sale_price, sale_end_date,
    featured_image, gallery, stock, discount_pct, category,
    watchers, likes, vendor, tt_location,
  } = product;

  const images = useMemo(() => {
    const list = [featured_image, ...(Array.isArray(gallery) ? gallery : [])].filter(img => img?.url);
    return list.length ? list : [null];
  }, [featured_image, gallery]);

  const [active, setActive] = useState(0);
  const hasMultiple = images.length > 1;

  const go = (e, dir) => {
    e.preventDefault();
    e.stopPropagation();
    setActive(i => (i + dir + images.length) % images.length);
  };

  const jump = (e, i) => {
    e.preventDefault();
    e.stopPropagation();
    setActive(i);
  };

  const current = images[active];
  const imageUrl = current?.url ? resizedImage(current.url, 'medium') : null;
  const pct = discount_pct || computeDiscountPct(price, sale_price);
  const isOutOfStock = stock !== null && stock <= 0;

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
          blurhash={current?.blurhash}
          alt={name}
          className="h-full w-full"
        />

        {category?.name && (
          <span className="absolute left-3 top-3 rounded-full bg-black/35 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-sm">
            {category.name}
          </span>
        )}

        {pct > 0 && !isOutOfStock && (
          <span className="absolute right-3 top-3 rounded-lg bg-[var(--tt-flame)] px-2 py-1 text-[0.68rem] font-black text-white shadow-[var(--tt-glow-flame)]">
            {Math.round(pct)}% OFF
          </span>
        )}

        {hasMultiple && (
          <>
            <button
              onClick={(e) => go(e, -1)}
              className="absolute left-1.5 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={(e) => go(e, 1)}
              className="absolute right-1.5 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight size={16} />
            </button>

            {/* Dot indicators — tappable, always visible */}
            <div className="absolute inset-x-0 bottom-2 z-10 flex items-center justify-center gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => jump(e, i)}
                  aria-label={`Show image ${i + 1}`}
                  className="flex h-4 w-4 items-center justify-center"
                >
                  <span
                    className="rounded-full transition-all"
                    style={{
                      width: i === active ? '14px' : '5px',
                      height: '5px',
                      background: i === active ? '#fff' : 'rgba(255,255,255,0.5)',
                    }}
                  />
                </button>
              ))}
            </div>
          </>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-sm">SOLD OUT</span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/products/${slug}`}>
            <h3 className="line-clamp-1 text-sm font-semibold text-[var(--tt-text)]">{name}</h3>
          </Link>
          <div className="flex shrink-0 items-center gap-2 text-[0.68rem] font-medium text-[var(--tt-muted)]">
            {watchers > 0 && <span className="flex items-center gap-1"><Eye size={12} strokeWidth={2.5} />{watchers}</span>}
            {likes > 0 && <span className="flex items-center gap-1"><Heart size={12} strokeWidth={2.5} />{likes}</span>}
          </div>
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="font-['Syne',sans-serif] text-[1rem] font-bold text-[var(--tt-text)]">
            {formatUGX(sale_price)}
          </span>
          {price > sale_price && (
            <span className="text-[0.68rem] text-[var(--tt-muted)] line-through">{formatUGX(price)}</span>
          )}
        </div>

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
