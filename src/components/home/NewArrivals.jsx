'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

import { useNewArrivals } from '@/hooks/useHomeData';
import { resizedImage } from '@/helpers/universal';

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

function getTimeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatUGX(n) {
  return 'UGX ' + Math.round(n).toLocaleString('en-UG');
}

export default function NewArrivals() {
  const { data: products, isLoading } = useNewArrivals();
  return (
    <section className="pb-12">
      <div className="tt-container">
        <div className="flex items-end justify-between mb-5 gap-4 flex-wrap">
          <div>
            <h2 className="font-['Syne',sans-serif] font-extrabold text-[clamp(1.3rem,2.5vw,1.85rem)]">
              🆕 Just{' '}
              <span className="text-[#4c8bff]">
                Listed
              </span>
            </h2>
            <p className="text-[var(--tt-muted)] text-[0.875rem] mt-1">
              Fresh deals added today — be the first to book
            </p>
          </div>
          <Link
            href="/products?sort=new"
            className="tt-btn tt-btn-ghost text-[0.82rem] px-4 py-[0.45rem]"
          >
            See All New →
          </Link>
        </div>

        {/* Horizontal scroll strip */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-[0.875rem]">
          {isLoading ? (
             Array.from({ length: 6 }).map((_, i) => (
               <div key={i} className="tt-shimmer h-[260px] rounded-[var(--tt-radius-lg)] bg-[var(--tt-surface)]" />
             ))
          ) : (
            products?.map((p, i) => {
              const categoryName = p.product_categories?.name || 'Uncategorized';
              const { emoji, color: catColor } = getStyle(categoryName);
              const discountPct = p.price > 0 ? Math.round(((p.price - p.sale_price) / p.price) * 100) : 0;
              const age = getTimeAgo(p.created_at);
              const {featured_image} = p ?? {};

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                >
                  <Link href={`/products/${p.slug}`} className="no-underline block h-full">
                    <div
                      className="tt-card cursor-pointer transition-all duration-200 hover:-translate-y-[3px]"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = `0 12px 36px rgba(0,0,0,0.5)`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {/* Image area */}
                      <div className="flex items-center justify-center text-[2.8rem] relative bg-white">
                        {featured_image ? <img className='h-[180px] min-w-full object-contain' src={resizedImage(featured_image?.url, 'medium')} alt={p.name} /> : emoji}
                        {/* NEW badge */}
                        <div className="absolute top-[6px] left-[6px] bg-[rgba(255,77,0,0.12)] border border-[rgba(255,77,0,0.3)] text-[var(--tt-flame-2)] backdrop-blur-[4px] text-[0.58rem] font-extrabold px-[6px] py-[1px] rounded-full tracking-[0.06em]">
                          NEW
                        </div>
                        {/* Discount */}
                        <div className="absolute top-[6px] right-[6px] bg-[rgba(255,77,0,0.12)] border border-[rgba(255,77,0,0.3)] text-[var(--tt-flame-2)] backdrop-blur-[4px] text-[0.6rem] font-extrabold px-[6px] py-[1px] rounded-full">
                          -{discountPct}%
                        </div>
                        {/* Time ago */}
                        <div className="absolute bottom-[6px] right-[6px] bg-[#0d0d14]/75 backdrop-blur-[6px] text-[var(--tt-muted-2)] text-[0.58rem] font-semibold px-[6px] py-[1px] rounded-full">
                          🕐 {age}
                        </div>
                      </div>

                      {/* Body */}
                      <div className="p-3">
                        <p className="text-[0.78rem] font-semibold leading-[1.35] mb-[0.4rem] line-clamp-2">
                          {p.name}
                        </p>
                        <div className="flex items-baseline gap-[0.35rem]">
                          <span className="font-['Syne',sans-serif] font-bold text-[0.88rem]">
                            {formatUGX(p.sale_price)}
                          </span>
                          <span className="text-[0.65rem] text-[var(--tt-muted)] line-through">
                            {formatUGX(p.price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
