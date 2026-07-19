'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';
import CountdownClock from '../CountdownClock';
import ProductActions from '../ProductActions';
import ProductMedia from './ProductMedia';
import { formatUGX, computeDiscountPct } from '@/lib/currency';
import { getUrgencyLevel } from '@/lib/urgency';
import { resizedImage } from '@/helpers/universal';

const LEVEL_COLOR = {
  low: 'var(--tt-success)',
  medium: 'var(--tt-gold)',
  high: 'var(--tt-flame-2)',
  critical: 'var(--tt-danger)',
  expired: 'var(--tt-muted)',
};

/**
 * ProductCardTicket — the deal as a physical ticket stub, on-brand for
 * "TickToss". A perforated, die-cut seam separates the image (boarding pass)
 * from the stub (countdown + price), punched circles matching the page
 * background complete the illusion.
 */
export default function ProductCardTicket({ product, index = 0 }) {
  if (!product) return null;
  const {
    id, name, slug, price, sale_price, sale_end_date,
    featured_image, stock, discount_pct, category,
    watchers, vendor, tt_location,
  } = product;

  const level = getUrgencyLevel(sale_end_date);
  const pct = discount_pct || computeDiscountPct(price, sale_price);
  const isOutOfStock = stock !== null && stock <= 0;
  const imageUrl = featured_image?.url ? resizedImage(featured_image.url, 'medium') : null;
  const levelColor = LEVEL_COLOR[level] ?? LEVEL_COLOR.low;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group relative flex h-full flex-col rounded-2xl border border-[var(--tt-border)] bg-[var(--tt-theme)] shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      {/* Discount sticker — overlaps the image corner */}
      {pct > 0 && !isOutOfStock && (
        <div className="absolute -right-2 -top-2 z-10 flex h-12 w-12 -rotate-12 flex-col items-center justify-center rounded-full bg-[var(--tt-gradient-flame,var(--tt-flame))] text-white shadow-[var(--tt-glow-flame)]" style={{ background: 'var(--tt-gradient-flame)' }}>
          <span className="text-[0.8rem] font-black leading-none">{Math.round(pct)}%</span>
          <span className="text-[0.45rem] font-bold uppercase tracking-wide leading-none">off</span>
        </div>
      )}

      <Link href={`/products/${slug}`} className="relative block aspect-[16/11] w-full overflow-hidden rounded-t-2xl">
        <ProductMedia
          src={imageUrl}
          blurhash={featured_image?.blurhash}
          alt={name}
          className="h-full w-full"
          imgClassName="transition-transform duration-500 group-hover:scale-105"
        />
        {category?.name && (
          <span className="absolute left-3 top-3 rounded-full bg-black/35 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-sm">
            {category.name}
          </span>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-sm">SOLD OUT</span>
          </div>
        )}
      </Link>

      {/* Perforated seam with punch-hole notches */}
      <div className="relative border-t border-dashed border-[var(--tt-border-2)]">
        <span className="absolute -top-[7px] -left-[7px] h-[14px] w-[14px] rounded-full border border-[var(--tt-border)] bg-[var(--tt-surface)]" />
        <span className="absolute -top-[7px] -right-[7px] h-[14px] w-[14px] rounded-full border border-[var(--tt-border)] bg-[var(--tt-surface)]" />
      </div>

      {/* Stub */}
      <div className="flex flex-1 flex-col gap-2.5 p-3 pt-3.5">
        <Link href={`/products/${slug}`}>
          <h3 className="line-clamp-1 text-sm font-medium text-[var(--tt-text)]">{name}</h3>
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="font-['Syne',sans-serif] text-[1rem] font-bold text-[var(--tt-text)]">
              {formatUGX(sale_price)}
            </span>
            {price > sale_price && (
              <span className="text-[0.68rem] text-[var(--tt-muted)] line-through">{formatUGX(price)}</span>
            )}
          </div>
          {sale_end_date && !isOutOfStock && (
            <span style={{ color: levelColor }}>
              <CountdownClock saleEndDate={sale_end_date} size="sm" />
            </span>
          )}
        </div>

        {/* Barcode flourish */}
        <div
          className="h-4 w-full rounded-sm opacity-60"
          style={{ backgroundImage: 'repeating-linear-gradient(90deg, var(--tt-border-2) 0 2px, transparent 2px 5px)' }}
          aria-hidden="true"
        />

        <div className="flex items-center justify-between">
          {watchers > 0 ? (
            <span className="flex items-center gap-1 text-[0.68rem] font-medium text-[var(--tt-muted)]">
              <Eye size={12} strokeWidth={2.5} /> {watchers} watching
            </span>
          ) : <span />}
          <ProductActions
            exClass="opacity-0 group-hover:opacity-100 transition-opacity"
            leftExtraClass=""
            product={product}
            storeData={tt_location || vendor}
          />
        </div>
      </div>
    </motion.div>
  );
}
