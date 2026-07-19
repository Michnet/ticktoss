'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, Heart } from 'lucide-react';
import CountdownClock from '../CountdownClock';
import ProductActions from '../ProductActions';
import ProductStats from '../ProductStats';
import ProductMedia from './ProductMedia';
import { formatUGX, computeDiscountPct } from '@/lib/currency';
import { resizedImage } from '@/helpers/universal';
import { ProductLabelRow } from '@/components/ui/ProductLabel';

/**
 * ProductCardCollage — a mosaic that puts the whole gallery on display at
 * once: a large spotlight shot with up to three thumbnails beside it.
 * Clicking a thumbnail swaps the spotlight in place, no navigation needed —
 * every image is visible at a glance, nothing hidden behind hover or swipe.
 */
export default function ProductCardCollage({cardWidth=null, product, index = 0 }) {
  if (!product) return null;
  const {
    id, name, slug, price, sale_price, sale_end_date,
    featured_image, gallery, stock, discount_pct, category,
    watchers, likes, views, vendor, tt_location,short_description
  } = product;

  const images = useMemo(() => {
    const list = [featured_image, ...(Array.isArray(gallery) ? gallery : [])].filter(img => img?.url);
    return list.length ? list : [null];
  }, [featured_image, gallery]);

  const [spotlight, setSpotlight] = useState(0);
  const thumbs = images.filter((_, i) => i !== spotlight).slice(0, 3);
  const extraCount = images.length - 1 - thumbs.length;

  const showThumb = (e, originalIndex) => {
    e.preventDefault();
    e.stopPropagation();
    setSpotlight(originalIndex);
  };

  const main = images[spotlight];
  const imageUrl = main?.url ? resizedImage(main.url, 'medium') : null;
  const pct = discount_pct || computeDiscountPct(price, sale_price);
  const isOutOfStock = stock !== null && stock <= 0;

  return (
    <motion.div
      style={{width: cardWidth || 'auto'}}
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={`item_card group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--tt-surface-2)] bg-[var(--tt-theme)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-gl max-w-[100vw]`}
    >
      <div className="relative flex gap-1 p-1 mb-2">
        {/* Spotlight image */}
        <Link href={`/products/${slug}`} className="relative block aspect-square w-full flex-1 overflow-hidden rounded-lg">
          <ProductMedia
            src={imageUrl}
            blurhash={main?.blurhash}
            alt={name}
            className="h-full w-full"
          />

          {/* {category?.name && (
            <span className="absolute left-2 top-2 rounded-full bg-black/35 px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-sm">
              {category.name}
            </span>
          )} */}

          {pct > 0 && !isOutOfStock && (
            <span className="absolute right-2 top-2 rounded-lg bg-[var(--tt-glass-bg)] px-1.5 py-0.5 text-[0.62rem] font-black shadow-[var(--tt-glow-flame)]">
              {Math.round(pct)}%
            </span>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <span className="rounded-full bg-white/15 px-3 py-1 text-[0.65rem] font-bold text-white backdrop-blur-sm">SOLD OUT</span>
            </div>
          )}
        </Link>

        {/* Thumbnail stack — every other shot in the gallery, all visible at once */}
        {thumbs.length > 0 && (
          <div className="flex w-1/4 flex-shrink-0 flex-col gap-1 overflow-hidden">
            {thumbs.map((img) => {
              const originalIndex = images.indexOf(img);
              const isLast = extraCount > 0 && img === thumbs[thumbs.length - 1];
              return (
                <button
                  key={originalIndex}
                  onClick={(e) => showThumb(e, originalIndex)}
                  className="relative block aspect-square w-full flex-1 overflow-hidden rounded-md first:rounded-tr-2xl border border-[var(--tt-surface)] transition-opacity hover:opacity-80"
                  aria-label={`Show gallery image ${originalIndex + 1}`}
                >
                  <ProductMedia
                    src={img?.url ? resizedImage(img.url, 'thumbnail') : null}
                    blurhash={img?.blurhash}
                    alt=""
                    className="h-full w-full"
                  />
                  {isLast && extraCount > 0 && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-[0.68rem] font-bold text-white">
                      +{extraCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3 pt-1">
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/products/${slug}`}>
          <div className="flex justify-between shrink-0 items-center mb-2 gap-2 text-[0.68rem] font-medium text-[var(--tt-muted)]">
            <ProductLabelRow random={true} className='flex-nowrap' max={4} itemStyle={{borderRadius:'5px'}} noIcon noBg product={product} size="md" />
            <ProductStats likes={likes} watchers={watchers} views={views} />
          </div>
            <h3 className="line-clamp-1 font-semibold text-[var(--tt-text)]">{name}</h3>
            {short_description && <p dangerouslySetInnerHTML={{ __html: short_description }} className='line-clamp-2 leading-[1.65] opacity-60 text-sm sm:text-xs'/>}
          </Link>
          
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
        </div>



        <div className="border-t border-[var(--tt-border)] border-dashed pt-2">
                  
                  <ProductActions
                    iconSize={18}
          leftExtraClass=''
          exClass="mt-auton gap-2 opacity-70 group-hover:opacity-100 transition-opacity"
          actionButtonClass='bg-[var(--tt-flame)] text-[var(--tt-flame-light)] rounded-full'
          product={product}
          storeData={tt_location || vendor}
                  />
                </div>
      </div>
    </motion.div>
  );
}
