'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import CountdownClock from './CountdownClock';
import UrgencyBar from './UrgencyBar';
import { formatUGX } from '@/lib/currency';
import { getUrgencyLevel } from '@/lib/urgency';
import { resizedImage } from '@/helpers/universal';
import ProductActions from './ProductActions';
import { getStringStyle } from '@/lib/colors';

/**
 * TicktockCard — A dynamic product card designed specifically to highlight the
 * "ticktock" concept with glowing, pulsating animations, and 'theme-set' classes.
 * Supports horizontal and vertical layouts via a prop.
 * 
 * @param {{ product: object, layout?: 'vertical' | 'horizontal', index?: number }} props
 */
export default function TicktockCard({ product, layout = 'vertical', index = 0 }) {
  if (!product) return null;
  const {
    id, name, slug,
    price, sale_price,
    sale_end_date,
    featured_image,
    stock, stock_alert_level,
    discount_pct,
    product_categories,
    vendor, tt_location 
  } = product;

  const level = getUrgencyLevel(sale_end_date);
  const isLowStock = stock !== null && stock <= (stock_alert_level ?? 5) && stock > 0;
  const isOutOfStock = stock !== null && stock <= 0;
  const isHorizontal = layout === 'horizontal';

  const imageUrl = featured_image?.url ?? featured_image?.src ?? null;
  const categoryName = product_categories?.name || 'Uncategorized';
  const { emoji, color: categoryColor } = getStringStyle(categoryName);
  
  let calculatedDiscountPct = discount_pct;
  if (!calculatedDiscountPct && sale_price > 0 && price > 0) {
      calculatedDiscountPct = Math.round(((price - sale_price) / price) * 100);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05, duration: 0.35, type: 'spring', stiffness: 260, damping: 26 }}
      className={`group relative ${isHorizontal ? 'w-full' : 'h-full'}`}
    >
      <div className="no-underline block h-full">
        <div
          className={`
            cursor-pointer border border-gray-200 dark:border-gray-700/60 
            bg-[var(--tt-surface)] overflow-hidden transition-all duration-300
            hover:-translate-y-1 hover:shadow-2xl hover:border-[rgba(255,77,0,0.4)]
            flex ${isHorizontal ? 'flex-row h-[155px]' : 'flex-col h-full'}
            rounded-xl
          `}
          style={{
            boxShadow: level === 'critical'
              ? `0 0 20px rgba(255, 45, 85, 0.18), inset 0 0 0 1px rgba(255, 45, 85, 0.15)`
              : undefined,
          }}
        >
          {/* Image area */}
          <div 
            className={`
              relative bg-white flex items-center justify-center text-[2.8rem] overflow-hidden shrink-0
              ${isHorizontal ? 'w-[140px] h-full border-r border-gray-100 dark:border-gray-800' : 'w-full aspect-[4/3]'}
            `}
          >
            <Link href={`/products/${slug}`} className="w-full h-full flex items-center justify-center">
              {imageUrl ? (
                <img
                  className={`object-contain transition-transform duration-500 group-hover:scale-110 ${isHorizontal ? 'h-[120px] p-2' : 'h-[180px]'}`}
                  src={resizedImage(imageUrl, 'medium')}
                  alt={name}
                />
              ) : (
                <div className="flex items-center justify-center bg-[var(--tt-surface-2)] w-full h-full">
                  {emoji}
                </div>
              )}
            </Link>
            
            {/* Discount Badge */}
            {calculatedDiscountPct > 0 && (
              <div className="absolute top-2 right-2 shadow-[0_4px_12px_rgba(255,77,0,0.3)] text-[0.7rem] font-black p-1 rounded-full z-10 aspect-square flex items-center justify-center border-none bg-[var(--tt-flame)] text-white">
                -{calculatedDiscountPct}%
              </div>
            )}
            
            {/* Out of stock overlay */}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-[#0d0d14]/70 flex items-center justify-center z-20 backdrop-blur-[2px]">
                <span className="bg-gray-600 text-white font-bold text-[0.8rem] px-4 py-1.5 rounded-full shadow-lg tracking-wide">
                  SOLD OUT
                </span>
              </div>
            )}

            {/* Time Warning Overlay (Vertical Mode) */}
            {sale_end_date && !isOutOfStock && !isHorizontal && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0d0d14]/95 via-[#0d0d14]/60 to-transparent pt-10 pb-2 px-2 flex flex-col items-center justify-end z-10 pointer-events-none">
                <div className="theme-set px-3 py-[3px] rounded-full flex items-center gap-2 shadow-[0_0_15px_rgba(255,77,0,0.4)]">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--tt-flame)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--tt-flame-2)]"></span>
                  </span>
                  <span className="text-[0.6rem] font-black uppercase tracking-[0.15em] leading-none mt-[1px]">
                    TickTock
                  </span>
                  <div className="-ml-1 text-white">
                     <CountdownClock saleEndDate={sale_end_date} size="sm" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Body area */}
          <div className={`p-3 pb-2 flex-1 flex flex-col justify-between z-20 ${isHorizontal ? 'gap-1' : 'gap-2'}`}>
            <div className="flex flex-col h-full">
              {/* Category pill */}
              {categoryName && categoryName !== 'Uncategorized' && (
                <div className="leading-tight line-clamp-1 mb-1"
                  style={{ fontSize: '0.65rem', fontWeight: 700, color: categoryColor }}
                >
                  {categoryName}
                </div>
              )}
              
              {/* Title */}
              <Link href={`/products/${slug}`}>
                <h3 className={`font-semibold leading-[1.3] mb-1 line-clamp-2 text-[var(--tt-text)] transition-colors group-hover:text-[var(--tt-flame)] ${isHorizontal ? 'text-[0.85rem]' : 'text-[0.8rem]'}`}>
                  {name}
                </h3>
              </Link>
              
              {/* Horizontal Time Warning (Compact) */}
              {sale_end_date && !isOutOfStock && isHorizontal && (
                <div className="theme-set flex items-center gap-1.5 mt-0.5 mb-1 self-start px-2 py-0.5 rounded-full shadow-[0_0_8px_rgba(255,77,0,0.2)]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--tt-flame)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--tt-flame-2)]"></span>
                  </span>
                  <div className="text-[0.7rem] text-white">
                    <CountdownClock saleEndDate={sale_end_date} size="sm" />
                  </div>
                </div>
              )}

              {/* Pricing */}
              <div className="flex items-baseline gap-2 mt-auto">
                <span className="font-['Syne',sans-serif] font-black text-[0.95rem]" style={{ color: level === 'critical' ? 'var(--tt-danger)' : 'var(--tt-text)' }}>
                  {formatUGX(sale_price)}
                </span>
                {price && price > sale_price && (
                  <span className="text-[0.65rem] text-[var(--tt-muted)] line-through font-semibold">
                    {formatUGX(price)}
                  </span>
                )}
              </div>

              {/* Low stock warning */}
              {isLowStock && !isOutOfStock && (
                <p className="text-[0.7rem] text-[var(--tt-danger)] font-bold mt-1">
                  🔥 Only {stock} left!
                </p>
              )}
              
              {/* Urgency bar */}
              <div className="mt-2 mb-1">
                <UrgencyBar saleEndDate={sale_end_date} showLabel={!isHorizontal} />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-auto pt-2 border-t border-[var(--tt-border)]/50">
              <ProductActions product={product} storeData={tt_location || vendor} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
