'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

import { useFeaturedProducts } from '@/hooks/useHomeData';
import { resizedImage } from '@/helpers/universal';
import CountdownClock from '@/components/product/CountdownClock';
import UrgencyBar from '@/components/product/UrgencyBar';
import Carousel from '../ui/Carousel';
import ProductCardCollage from '../product/concepts/ProductCardCollage';

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

function FeaturedCard({ product, index, cardWidth='300px' }) {
  const isLowStock = product.stock <= 3;
  const {featured_image} = product ?? {}
  
  const discountPct = product.price > 0 ? Math.round(((product.price - product.sale_price) / product.price) * 100) : 0;
  const categoryName = product.product_categories?.name || 'Uncategorized';
  const { emoji, color: catColor } = getStyle(categoryName);

  const hrefLink = `/products/${product.slug}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: Math.min(index, 4) * 0.08, duration: 0.35 }}
      style={{ width: cardWidth }}
      className="h-full flex"
    >
        <div
          className="bg-[var(--tt-theme)] border border-[var(--tt-surface)] w-full h-full transition-all duration-200 hover:-translate-y-1 flex flex-col"
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = `0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px ${catColor}40`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {/* Image placeholder with emoji */}
          <div className="bg-[var(--tt-surface-2)] flex items-center justify-center text-[4rem] relative overflow-hidden aspect-[4/3]">
            {featured_image ? (
              <img src={resizedImage(featured_image.url, 'medium')} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              emoji
            )}

            {/* Discount badge */}
            <div className="absolute top-2 left-2 bg-[rgba(255,77,0,0.12)] border border-[rgba(255,77,0,0.3)] text-[var(--tt-flame-2)] backdrop-blur-[4px] font-extrabold text-[0.7rem] px-2 py-[3px] rounded-full">
              -{discountPct}%
            </div>

            {/* Featured badge */}
            <div className="absolute top-2 right-2 bg-[rgba(255,77,0,0.12)] border border-[rgba(255,77,0,0.3)] text-[var(--tt-flame-2)] backdrop-blur-sm font-bold text-[0.62rem] px-[7px] py-[2px] rounded-full">
              ⭐ Featured
            </div>

            {/* Low stock ribbon */}
            {isLowStock && (
              <div className="absolute bottom-2 right-2 bg-[var(--tt-danger)] text-white font-bold text-[0.62rem] px-2 py-[2px] rounded-full">
                Only {product.stock} left!
              </div>
            )}
          </div>

          {/* Body */}
          <div className="p-[0.875rem] flex-grow flex flex-col justify-between gap-1">
            <div>
              <div className="inline-block px-[0.6rem] py-[0.25rem] mb-[0.5rem] rounded-full bg-[var(--tt-surface-2)] border border-[var(--tt-border)] text-[var(--tt-muted-2)] text-[10px] font-semibold">
              {categoryName}
            </div>
            <Link href={hrefLink} className="text-[0.88rem] font-semibold leading-[1.3] mb-2 line-clamp-2">
              {product.name}
            </Link>

            <div className="flex items-baseline gap-[0.4rem] mb-[0.4rem]">
              <span className="font-bold text-base text-[var(--tt-flame)]">
                {formatUGX(product.sale_price)}
              </span>
              <span className="text-[0.72rem] text-[var(--tt-muted)] line-through">
                {formatUGX(product.price)}
              </span>
            </div>
            </div>

            <div className="mt-2 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[0.65rem] font-bold text-[var(--tt-muted-2)] uppercase tracking-wider flex items-center gap-1">
                  ⏱️ Time Left
                </span>
                <CountdownClock saleEndDate={product.sale_end_date} size="sm" />
              </div>
              <UrgencyBar saleEndDate={product.sale_end_date} />
            </div>
          </div>
        </div>
    </motion.div>
  );
}

export default function FeaturedProducts({cardWidth='300px'}) {
  const { data: products, isLoading } = useFeaturedProducts();
  return (
    <section className="tt-container">
        <div className="flex items-end justify-between px-5 mb-5 gap-4 flex-wrap">
          <div>
            <h2 className="font-extrabold text-[clamp(1.3rem,2.5vw,1.85rem)]">
              ⭐ Featured{' '}
              <span className="bg-[linear-gradient(135deg,#FFB800,#FF8C00)] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
                Deals
              </span>
            </h2>
            <p className="text-[var(--tt-muted)] text-[0.875rem] mt-1">
              Hand-picked by our team — premium discounts, high trust vendors
            </p>
          </div>
          <Link
            href="/products?filter=featured"
            className="tt-btn tt-btn-ghost text-[0.82rem] px-4 py-[0.45rem]"
          >
            All Featured →
          </Link>
        </div>

        <Carousel autoWidth={true} trackClassName="gap-3" itemClassName="flex" padding={16}>
          {isLoading ? (
             Array.from({ length: 4 }).map((_, i) => (
               <div key={i} className="tt-shimmer h-[340px] w-[220px] rounded-[var(--tt-radius-lg)] bg-[var(--tt-surface)]" />
             ))
          ) : (
            products?.map((p, i) => (
              <ProductCardCollage key={p.id} product={p} index={i} cardWidth={cardWidth} />
            ))
          )}
        </Carousel>
        {/* <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {isLoading ? (
             Array.from({ length: 4 }).map((_, i) => (
               <div key={i} className="tt-shimmer h-[340px] rounded-[var(--tt-radius-lg)] bg-[var(--tt-surface)]" />
             ))
          ) : (
            products?.map((p, i) => (
              <FeaturedCard key={p.id} product={p} index={i} cardWidth={cardWidth} />
            ))
          )}
        </div> */}
    </section>
  );
}
