'use client';

import Link from 'next/link';
import { useNewArrivals, useUpcomingDeals } from '@/hooks/useHomeData';
import { useProducts } from '@/lib/hooks/useProducts';
import ProductCard from '@/components/product/ProductCard';
import FeedPostCard from '../FeedPostCard';

/**
 * Reusable "post" that shows a small grid of product cards — powers the New
 * Arrivals / Budget Finds / Upcoming style feed items with one component.
 */
export default function FeedProductGridPost({
  source = 'new',        // 'new' | 'upcoming' | 'custom'
  filters = [],           // cluster ids, used when source === 'custom'
  avatar = '🆕',
  title = 'New Arrivals',
  meta = 'Fresh listings',
  tag = 'New',
  tagVariant = 'flame',
  limit = 4,
  ctaHref = '/products',
  counterLabel,
  startDate = false,
  noPadding = false
}) {
  let hook;
  if (source === 'upcoming') hook = useUpcomingDeals;
  else if (source === 'custom') hook = () => useProducts({ clusters: filters, limit: 12 });
  else hook = useNewArrivals;

  const { data: products, isLoading } = hook();
  const items = products?.slice(0, limit);

  if (!isLoading && !items?.length) return null;

  return (
    <FeedPostCard noPadding={noPadding} contentExClass='flex-1 flex' className='flex flex-col' avatar={avatar} title={title} meta={meta} tag={tag} tagVariant={tagVariant}>
      <div className='flex flex-col gap-2 justify-between'>
      <div className="grid grid-cols-2 gap-2.5">
        {isLoading
          ? Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="tt-shimmer h-[220px] rounded-[var(--tt-radius-md)] bg-[var(--tt-surface)]" />
            ))
          : items.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} counterLabel={counterLabel} startDate={startDate} />
            ))}
      </div>
      <Link href={ctaHref} className="block text-center text-[0.78rem] font-semibold text-[var(--tt-flame-2)] mt-3">
        See more →
      </Link>
      </div>
    </FeedPostCard>
  );
}
