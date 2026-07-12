'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { resizedImage } from '@/helpers/universal';
import CountdownClock from '@/components/product/CountdownClock';
import UrgencyBar from '@/components/product/UrgencyBar';
import ProductActions from '../ProductActions';
import { ProductLabelRow } from '@/components/ui/ProductLabel';

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

function formatUGX(n) {
  return 'UGX ' + Math.round(n).toLocaleString('en-UG');
}

export default function ProductCard1({ product, index, cardWidth = '300px' }) {
  const isLowStock = product.stock <= 3;
  const { featured_image, sale_price, price, discount_pct } = product ?? {}

  const discountPct = product.price > 0 ? Math.round(((product.price - product.sale_price) / product.price) * 100) : 0;
  const categoryName = product.product_categories?.name || 'Uncategorized';
  const { emoji, color: catColor } = getStyle(categoryName);
  let onSale = sale_price && price ? sale_price > 0 && sale_price < price : false;

  const hrefLink = `/products/${product.slug}`;
  let calculatedDiscountPct = discount_pct ? discount_pct.toFixed(0) : 0;
  if (!calculatedDiscountPct && sale_price > 0 && price > 0) {
      calculatedDiscountPct = Math.round(((price - sale_price) / price) * 100).toFixed(0);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
      style={{ width: cardWidth }}
      className="h-full flex"
    >
      <div
        className="cursor-pointer w-full h-full transition-all duration-200 hover:-translate-y-1 grid grid-cols-[120px_1fr] border bg-[var(--tt-theme)] border-[var(--tt-surface)]"
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = `0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px ${catColor}40`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* Image placeholder with emoji */}
        <div className="flex items-center justify-center text-[4rem] relative overflow-hidden p-2 pr-0">
          {featured_image ? (
            <img src={resizedImage(featured_image.url, 'medium')} alt={product.name} className="w-full rounded-full aspect-square object-cover" />
          ) : (
            emoji
          )}

          {/* Discount badge */}
            {calculatedDiscountPct > 0 && (
              <div className="absolute top-[6px] left-[6px] bg-[var(--tt-flame)] border border-white/20 text-white shadow-[0_4px_12px_rgba(255,77,0,0.5)] text-[0.75rem] font-black p-1 rounded-full z-10 aspect-square flex items-center">
                -{calculatedDiscountPct}%
              </div>
            )}

          {/* Low stock ribbon */}
          {isLowStock && (
            <div className="absolute bottom-2 right-2 bg-[var(--tt-danger)] text-white font-bold text-[0.62rem] px-2 py-[2px] rounded-full">
              Only {product.stock} left!
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-[0.875rem] flex-grow flex flex-col justify-between gap-1">
          <div className='flex flex-row'>
            <div>
              <div className="inline-block mb-1 text-[var(--tt-muted-2)] text-[0.5rem] font-semibold uppercase tracking-[0.06em]">
                {categoryName}
              </div>
              <Link href={hrefLink} className="text-[0.88rem] font-semibold leading-[1.3] mb-1 line-clamp-2">
                {product.name}
              </Link>

              <div className="flex items-baseline gap-[0.4rem]">
                <span className={`font-bold text-base ${onSale ? 'text-[var(--tt-flame)]' : ''}`}>
                  {formatUGX(onSale ? sale_price : price)}
                </span>
                {/* {onSale && <span className="text-[0.72rem] text-[var(--tt-muted)] line-through">
                {formatUGX(price)}
              </span>} */}
              </div>
            </div>
            <ProductLabelRow style={{gap:'10px'}} className='flex-nowrap flex-col' max={4} itemStyle={{ borderRadius: '5px', padding:'2px 4px'}} noText noBg product={product} size="md" />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[0.65rem] font-bold text-[var(--tt-muted-2)] uppercase tracking-wider flex items-center gap-1">
                ⏱️
              </span>
              <CountdownClock saleEndDate={product.sale_end_date} size="sm" />
            </div>
            <ProductActions product={product} />
            {/* <UrgencyBar saleEndDate={product.sale_end_date} /> */}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
