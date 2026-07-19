'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import CountdownClock from '../CountdownClock';
import ProductActions from '../ProductActions';
import ProductMedia from './ProductMedia';
import { formatUGX, computeDiscountPct } from '@/lib/currency';
import { useCountdown } from '@/lib/hooks/useCountdown';
import { resizedImage } from '@/helpers/universal';
import { getStringStyle } from '@/lib/colors';

function timeLeftLabel({ days, hours, minutes, expired }) {
  if (expired) return 'Ended';
  if (days > 0) return `${days}d left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

/**
 * ProductCardStory — an Instagram-Stories-shaped card. Segmented progress
 * dashes at the top cycle through the product gallery on hover; the "time
 * since posted" slot that stories normally show is repurposed to count down
 * instead of up.
 */
export default function ProductCardStory({ product, index = 0 }) {
  if (!product) return null;
  const {
    id, name, slug, price, sale_price, sale_end_date,
    featured_image, gallery, stock, discount_pct,
    watchers, likes, vendor, tt_location, short_description,
  } = product;

  const images = useMemo(() => {
    const list = [featured_image, ...(Array.isArray(gallery) ? gallery : [])].filter(img => img?.url);
    return list.length ? list : [null];
  }, [featured_image, gallery]);

  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);
  const intervalRef = useRef(null);

  const startCycle = () => {
    if (images.length <= 1) return;
    setHovering(true);
    intervalRef.current = setInterval(() => {
      setActive(i => (i + 1) % images.length);
    }, 900);
  };
  const stopCycle = () => {
    setHovering(false);
    clearInterval(intervalRef.current);
    setActive(0);
  };
  useEffect(() => () => clearInterval(intervalRef.current), []);

  const { days, hours, minutes, expired } = useCountdown(sale_end_date);
  const pct = discount_pct || computeDiscountPct(price, sale_price);
  const isOutOfStock = stock !== null && stock <= 0;
  const current = images[active];
  const imageUrl = current?.url ? resizedImage(current.url, 'medium') : null;
  const vendorName = tt_location?.name || vendor?.display_name || vendor?.name || 'Vendor';
  const { emoji } = getStringStyle(vendorName);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--tt-border)] bg-[var(--tt-theme)] shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl"
      onMouseEnter={startCycle}
      onMouseLeave={stopCycle}
    >
      <Link href={`/products/${slug}`} className="relative block aspect-square w-full">
        {/* Story segments */}
        <div className="absolute inset-x-2 top-2 z-10 flex gap-1">
          {images.map((_, i) => (
            <span key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/35">
              <span
                className="block h-full rounded-full bg-white transition-all"
                style={{ width: i < active ? '100%' : i === active ? (hovering ? '100%' : '30%') : '0%', transitionDuration: i === active ? '900ms' : '200ms' }}
              />
            </span>
          ))}
        </div>

        {/* Header row: vendor "avatar" + reversed timestamp */}
        <div className="absolute inset-x-2 top-6 z-10 flex items-center justify-between">
          <span className="flex items-center gap-1.5 rounded-full bg-black/35 py-1 pl-1 pr-2.5 backdrop-blur-sm">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[0.65rem]">{emoji}</span>
            <span className="line-clamp-1 max-w-[90px] text-[0.62rem] font-semibold text-white/90">{vendorName}</span>
          </span>
          {sale_end_date && !isOutOfStock && (
            <span className="rounded-full bg-black/35 px-2 py-1 text-[0.6rem] font-bold text-white/90 backdrop-blur-sm">
              ⏳ {timeLeftLabel({ days, hours, minutes, expired })}
            </span>
          )}
        </div>

        <ProductMedia
          src={imageUrl}
          blurhash={current?.blurhash}
          alt={name}
          className="h-full w-full"
        />

        {pct > 0 && !isOutOfStock && (
          <span className="absolute bottom-2 left-2 z-10 rounded-lg bg-[var(--tt-flame)] px-2 py-1 text-[0.7rem] font-black text-white shadow-[var(--tt-glow-flame)]">
            {Math.round(pct)}% OFF
          </span>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-sm">SOLD OUT</span>
          </div>
        )}
      </Link>

      {/* Caption */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div>
          <Link href={`/products/${slug}`}>
            <h3 className="line-clamp-1 text-sm font-semibold text-[var(--tt-text)]">{name}</h3>
          </Link>
          {short_description && (
            <p className="line-clamp-1 text-[0.72rem] text-[var(--tt-muted)]">{short_description}</p>
          )}
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="font-['Syne',sans-serif] text-[1rem] font-bold text-[var(--tt-text)]">
            {formatUGX(sale_price)}
          </span>
          {price > sale_price && (
            <span className="text-[0.68rem] text-[var(--tt-muted)] line-through">{formatUGX(price)}</span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-[var(--tt-border)] pt-2">
          <div className="flex items-center gap-3 text-[0.68rem] font-medium text-[var(--tt-muted)]">
            {likes > 0 && <span>❤ {likes}</span>}
            {watchers > 0 && <span>👁 {watchers}</span>}
          </div>
          <ProductActions
            exClass=""
            leftExtraClass=""
            iconSize={14}
            product={product}
            storeData={tt_location || vendor}
          />
        </div>
      </div>
    </motion.div>
  );
}
