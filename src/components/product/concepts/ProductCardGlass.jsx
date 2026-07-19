'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';
import ProductActions from '../ProductActions';
import ProductMedia from './ProductMedia';
import { useBlurhashDataURL } from '@/lib/hooks/useBlurhashDataURL';
import { useCountdown } from '@/lib/hooks/useCountdown';
import { getBlurhashAverageColor } from '@/lib/blurhashColor';
import { formatUGX, computeDiscountPct } from '@/lib/currency';
import { resizedImage } from '@/helpers/universal';

function GlassUnit({ value, label, show = true }) {
  if (!show) return null;
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/25 bg-white/10 font-['Syne',sans-serif] text-[0.8rem] font-bold shadow-inner backdrop-blur-md">
        {String(value).padStart(2, '0')}
      </div>
      <span className="text-[0.45rem] font-semibold uppercase tracking-wide">{label}</span>
    </div>
  );
}

/**
 * ProductCardFrostBloom — the blurhash decoded large and blurred *is* the
 * card's ambient backdrop (not just a loading placeholder), with a sharp
 * "spotlight" thumbnail and a frosted-glass panel of glass-tile countdown
 * digits floating on top. Maximalist glassmorphism, one glow per product.
 */
export default function ProductCardGlass({ product, index = 0 }) {
  if (!product) return null;
  const {
    id, name, slug, price, sale_price, sale_end_date,
    featured_image, stock, discount_pct, category, watchers,
  } = product;

  const backdrop = useBlurhashDataURL(featured_image?.blurhash, 48);
  const glow = getBlurhashAverageColor(featured_image?.blurhash) || '30, 30, 40';
  const { days, hours, minutes, seconds, expired } = useCountdown(sale_end_date);
  const pct = discount_pct || computeDiscountPct(price, sale_price);
  const isOutOfStock = stock !== null && stock <= 0;
  const imageUrl = featured_image?.url ? resizedImage(featured_image.url, '500x500') : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="item_card group relative flex h-full flex-col transition-transform duration-300 hover:-translate-y-1"
    >


      <Link href={`/products/${slug}`} className="block space-y-3">


        {/* Spotlight thumbnail */}
        <div className="relative mx-auto shadow-md rounded-xl overflow-hidden">
          <img
            className='h-full max-h-[300px] w-full object-cover'
            src={imageUrl}
            alt={name}
          />
          {pct > 0 && !isOutOfStock && (
            <div className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/40 text-[0.75rem] font-black backdrop-blur-md">
              {Math.round(pct)}%
            </div>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60">
              <span className="rounded-full bg-white/15 px-3 py-1 text-[0.65rem] font-bold backdrop-blur-sm">SOLD OUT</span>
            </div>
          )}
        </div>

        {/* Frosted glass info panel */}
        <div className="relative mt-auto overflow-hidden rounded-2xl border border-white/20  p-3 shadow-lg backdrop-blur-xl">
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(180deg, rgba(${glow}, 0.25) 0%, rgba(8,8,14,0.55) 55%, rgba(8,8,14,0.88) 100%)` }}
            aria-hidden="true"
          />
          <div
            className="absolute  inset-0 scale-125 bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.35]"
            style={{ backgroundImage: backdrop ? `url(${backdrop})` : undefined, backgroundColor: `rgb(${glow})` }}
            aria-hidden="true"
          />
          <div
            className="absolute w-full h-full left-0 top-0 bg-white/10 dark:bg-black/30"
          />
          <div className='relative p-2'>
          <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          <h3 className="line-clamp-1 text-sm font-semibold">{name}</h3>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-['Syne',sans-serif] text-[1rem] font-bold">{formatUGX(sale_price)}</span>
            {price > sale_price && (
              <span className="text-[0.68rem] line-through">{formatUGX(price)}</span>
            )}
          </div>

          {sale_end_date && !isOutOfStock && !expired && (
            <div className="mt-2 flex items-center gap-1.5">
              <GlassUnit value={days} label="d" show={days > 0} />
              <GlassUnit value={hours} label="h" />
              <GlassUnit value={minutes} label="m" />
              <GlassUnit value={seconds} label="s" />
            </div>
          )}

          <div className="mt-2 [&_button]: [&_button:hover]:">
            <ProductActions leftExtraClass='' exClass="-mx-1" product={product} actionButtonClass='bg-[var(--tt-glass-bg)] rounded-full' />
          </div>
          </div>
        </div>
        {/* Top row: category + watchers, dark glass chips for guaranteed contrast */}
        <div className="flex items-center justify-between">
          {category?.name ? (
            <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-wider backdrop-blur-md">
              {category.name}
            </span>
          ) : <span />}
          {watchers > 0 && (
            <span className="flex items-center gap-1 rounded-full border border-white/15 bg-black/30 px-2 py-1 text-[0.6rem] font-semibold backdrop-blur-md">
              <Eye size={11} strokeWidth={2.5} /> {watchers}
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
