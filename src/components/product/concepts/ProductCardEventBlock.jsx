'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import CountdownClock from '../CountdownClock';
//import ProductActions from '../ProductActions';
import ProductMedia from './ProductMedia';
//import { getBlurhashAverageColor } from '@/lib/blurhashColor';
import { useVibrantImageColor } from '@/lib/hooks/useVibrantImageColor';
import { formatUGX, computeDiscountPct } from '@/lib/currency';
import { resizedImage } from '@/helpers/universal';
import AddToCart from '../AddToCart';

/**
 * ProductCardEventBlock — an event-invite card: the photo sits on top and
 * bleeds into a solid info block tinted with the image's own dominant color,
 * one hue per product, with a calendar-style date badge repurposed to carry
 * the discount instead of a day of the month.
 */
export default function ProductCardEventBlock({ product, index = 0 }) {
  if (!product) return null;
  const {
    id, name, slug, price, sale_price, sale_end_date,
    featured_image, stock, discount_pct, category,
    vendor, tt_location,
  } = product;

  const pct = discount_pct || computeDiscountPct(price, sale_price);
  const isOutOfStock = stock !== null && stock <= 0;
  const imageUrl = featured_image?.url ? resizedImage(featured_image.url, 'big_thumb') : null;
  const miniImageUrl = featured_image?.url ? resizedImage(featured_image.url, 'mini') : null;
  const vendorName = tt_location?.name || vendor?.display_name || vendor?.name;

  // Real-pixel extraction via the actual Vibrant.js algorithm (client-only,
  // upgrades in after the image decodes) wins when available; the blurhash
  // DC average covers first paint and any CORS/load failure.
  const { best: glow } = useVibrantImageColor(miniImageUrl);
  //const glow = dominant || getBlurhashAverageColor(featured_image?.blurhash) || '20, 90, 90';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="relative group flex h-full flex-col overflow-hidden rounded-2xl shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <Link href={`/products/${slug}`} className="relative block h-[400px] w-full overflow-hidden">
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
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-sm">SOLD OUT</span>
          </div>
        )}
      </Link>

      {/* Info block, tinted with the image's own dominant color */}
      <div className='absolute bottom-0 w-full'>
        <div
        className="absolute w-full h-full mask-fade-up"
        style={{ background: glow ? `rgba(${glow})` : `rgba(12, 12, 16, 0.94)` }}
      />
      <div
        className="mt-10 pt-0 relative flex flex-1 flex-col gap-2.5 p-3 backdrop-blur-[2px]"
      >
        <Link href={`/products/${slug}`}>
          <h3 className="line-clamp-2 max-w-[70%] text-[1.2em] font-semibold !text-white">{name}</h3>
        </Link>

        <div className="flex items-center gap-2.5 empty:hidden">
          {/* Calendar-style date badge, repurposed for the discount */}
          

          {sale_end_date && !isOutOfStock && (
            <div className="shrink-0">
              <CountdownClock saleEndDate={sale_end_date} size="sm" />
            </div>
          )}
        </div>

        <div className="mt-auto flex flex-row gap-2 justify-between items-center [&_button]:!text-white [&_button:hover]:!text-white/70">

        <div className="flex items-center gap-2.5 empty:hidden">
          {/* Calendar-style date badge, repurposed for the discount */}
          <div className="flex h-11 w-11 flex-shrink-0 flex-col items-center justify-center rounded-lg border border-white/25 bg-white/15 backdrop-blur-sm">
            <span className="font-['Syne',sans-serif] text-[0.78rem] font-black leading-none text-white">
              {pct > 0 ? `${Math.round(pct)}%` : 'NOW'}
            </span>
            <span className="text-[0.42rem] font-bold uppercase leading-none text-white/70">
              {pct > 0 ? 'off' : 'on sale'}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5">
              <span className="font-['Syne',sans-serif] text-[0.95rem] font-bold text-white">{formatUGX(sale_price)}</span>
              {price > sale_price && (
                <span className="text-[0.62rem] text-white/55 line-through">{formatUGX(price)}</span>
              )}
            </div>
            {vendorName && (
              <p className="line-clamp-1 flex items-center gap-1 text-[0.65rem] text-white/65">
                <MapPin size={10} strokeWidth={2.5} /> {vendorName}
              </p>
            )}
          </div>

        </div>
          <AddToCart
            leftExtraClass=""
            product={product}
            actionButtonClass="bg-white/15 text-white rounded-full"
          />
        </div>
      </div>
      </div>
    </motion.div>
  );
}
