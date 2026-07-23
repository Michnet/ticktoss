'use client';

//import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import CountdownClock from './CountdownClock';
//import DiscountBadge from './DiscountBadge';
//import UrgencyBar from './UrgencyBar';
import { formatUGX } from '@/lib/currency';
import { getUrgencyLevel } from '@/lib/urgency';
import { resizedImage } from '@/helpers/universal';
import ProductActions from './ProductActions';
import { getStringStyle } from '@/lib/colors';
import UrgencyCircle from './UrgencyCircle';
import { ProductLabelRow } from '../ui/ProductLabel';

function getTimeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/**
 * ProductCard — glassmorphism card with live countdown, discount badge, urgency bar.
 *
 * @param {{ product: object, rank?: number, prevRank?: number, priority?: boolean, index?: number }} props
 */
export default function ProductCard({ product, counterLabel=null, startDate=false, rank, prevRank, priority = false, index = 0 }) {
  if (!product) return null;
  const {
    id, name, slug,
    price, sale_price,
    sale_end_date,sale_start_date,
    featured_image,
    stock, stock_alert_level,
    discount_pct,
    category,
    created_at, vendor, tt_location 
  } = product;

  const level = getUrgencyLevel(sale_end_date);
  const isLowStock = stock !== null && stock <= (stock_alert_level ?? 5) && stock > 0;
  const isOutOfStock = stock !== null && stock <= 0;
  const rankChange = prevRank !== undefined && rank !== undefined ? prevRank - rank : 0;

  const imageUrl = featured_image?.url ?? featured_image?.src ?? null;
  const categoryName = category?.name || 'Uncategorized';
  const { emoji, color: categoryColor } = getStringStyle(categoryName);
  
  // Calculate discount percentage based on price and sale_price if discount_pct is not provided
  let calculatedDiscountPct = discount_pct;
  if (!calculatedDiscountPct && sale_price > 0 && price > 0) {
      calculatedDiscountPct = Math.round(((price - sale_price) / price) * 100);
  }
  const age = getTimeAgo(created_at);

  return (
    <motion.div
      layout
      layoutId={`product-${id}`}
      className='bg-[var(--tt-theme)] border border-[var(--tt-surface)]'
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.06, duration: 0.3, type: 'spring', stiffness: 260, damping: 26 }}
      style={{ position: 'relative' }}
    >
      <div className="no-underline block h-full group">
        <div
          className="cursor-pointer flex flex-col transition-all duration-200 hover:-translate-y-[3px] hover:shadow-xl overflow-hidden"
          style={{
            height: '100%',
            boxShadow: level === 'critical'
              ? `0 0 20px rgba(255, 45, 85, 0.18), inset 0 0 0 1px rgba(255, 45, 85, 0.15)`
              : undefined,
          }}
        >
          {/* Image area */}
          <div className="flex items-center justify-center text-[2.8rem] relative bg-white  overflow-hidden" style={{ aspectRatio: '4/3' }}>
            {imageUrl ? (
              <img
                className='max-h-[180px] h-full min-w-full object-contain transition-transform duration-400 hover:scale-105'
                src={resizedImage(imageUrl, 'medium')}
                alt={name}
              />
            ) : (
              <div className="max-h-[180px] h-full flex items-center justify-center bg-[var(--tt-surface-2)] w-full">
                {emoji}
              </div>
            )}
            
            {/* NEW badge */}
            {/* <div className="absolute top-[6px] left-[6px] bg-[rgba(255,77,0,0.12)] border border-[rgba(255,77,0,0.3)] text-[var(--tt-flame-2)] backdrop-blur-[4px] text-[0.58rem] font-extrabold px-[6px] py-[1px] rounded-full tracking-[0.06em]">
              NEW
            </div> */}
            
            {/* Discount */}
            {calculatedDiscountPct > 0 && (
              <div className="absolute top-[6px] right-[6px] bg-[var(--tt-flame)] border border-white/20 text-white shadow-[0_4px_12px_rgba(255,77,0,0.5)] text-[0.75rem] font-black p-1 rounded-full z-10 aspect-square flex items-center">
                {calculatedDiscountPct}%
              </div>
            )}
            
            {/* Time ago */}
            {/* {age && (
              <div className="absolute bottom-[6px] right-[6px] bg-[#0d0d14]/75 backdrop-blur-[6px] text-[var(--tt-muted-2)] text-[0.58rem] font-semibold px-[6px] py-[1px] rounded-full">
                🕐 {age}
              </div>
            )} */}


            {/* Rank change indicator */}
            {rankChange !== 0 && (
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ delay: 1.5, duration: 0.5 }}
                style={{
                  position: 'absolute',
                  bottom: '30px',
                  right: '6px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: rankChange > 0 ? 'var(--tt-success)' : 'var(--tt-danger)',
                  background: 'rgba(13,13,20,0.8)',
                  borderRadius: '99px',
                  padding: '2px 6px',
                }}
              >
                {rankChange > 0 ? `↑${rankChange}` : `↓${Math.abs(rankChange)}`}
              </motion.div>
            )}

            {/* Out of stock overlay */}
            {isOutOfStock && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(13, 13, 20, 0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span className='bg-gray-500'
                  style={{
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    padding: '0.4rem 1rem',
                    borderRadius: '99px',
                  }}
                >
                  SOLD OUT
                </span>
              </div>
            )}

            
          </div>

          {/* Body */}
          <div className="flex-1 flex flex-col justify-between gap-1">
            <div className='p-3 pb-0'>
              {/* Category pill */}
            {/* {categoryName && categoryName !== 'Uncategorized' && (
              <div className='leading-tight line-clamp-1 mb-1 text-gray-500'
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600
                }}
              >
                {categoryName}
              </div>
            )} */}
            <ProductLabelRow random={true} className='flex-nowrap mb-1' max={4} itemStyle={{borderRadius:'5px'}} noIcon noBg product={product} size="md" />
            {/* Name */}
            <Link className='mb-1 block' href={`/products/${slug}`}>
            <h3 className="font-light leading-[1.35] line-clamp-1 text-sm text-[var(--tt-text)]">
              {name}
            </h3>
            </Link>
            
            
            {/* Prices */}
            <div className="flex items-baseline flex-col">
              <span className="font-['Syne',sans-serif] font-bold text-[1rem] leading-[1.15]" style={{ color: level === 'critical' ? 'var(--tt-danger)' : 'var(--tt-text)' }}>
                {formatUGX(sale_price)}
              </span>
              {/* {price && price > sale_price && (
                <span className="text-[0.65rem] text-[var(--tt-muted)] line-through">
                  {formatUGX(price)}
                </span>
              )} */}
            </div>

            {/* Low stock warning */}
            {/* {isLowStock && !isOutOfStock && (
              <p style={{ fontSize: '0.72rem', color: 'var(--tt-danger)', fontWeight: 600, marginBottom: '0.5rem' }}>
                🔥 Only {stock} left!
              </p>
            )} */}
            
            
            {/* Urgency bar */}
            {/* <UrgencyBar saleEndDate={sale_end_date} showLabel={true} /> */}

            {/* Time Warning Overlay */}
            {sale_end_date && !isOutOfStock && (
                <div className="flex items-center justify-between gap-2">
                  {/* <span className="text-[0.65rem] text-white/90 font-bold uppercase tracking-widest">
                    ⏱️
                  </span> */}
                  <CountdownClock counterLabel={counterLabel} startDate={startDate} saleStartDate={sale_start_date} saleEndDate={sale_end_date} size="sm" />
                  <UrgencyCircle saleEndDate={sale_end_date} showLabel={false} />
                </div>
            )}
            
            </div>

            {/* Actions: change the hover opacity change to work at group level on-hover */}
            
            <ProductActions exClass='opacity-40 group-hover:opacity-100' product={product} storeData={tt_location || vendor} />

          </div>
        </div>
      </div>
    </motion.div>
  );
}
