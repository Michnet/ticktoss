'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLiveUrgencyProducts } from '@/hooks/useHomeData';
import { resizedImage } from '@/helpers/universal';
import { formatUGX } from '@/lib/currency';
import { getStringStyle } from '@/lib/colors';
import FeedPostCard from '../FeedPostCard';

function useCountdown(endDateStr) {
  const getTime = () => {
    const diff = new Date(endDateStr) - Date.now();
    if (diff <= 0) return { h: 0, m: 0, expired: true };
    return { h: Math.floor(diff / 3_600_000), m: Math.floor((diff % 3_600_000) / 60_000), expired: false };
  };
  const [time, setTime] = useState(getTime);
  useEffect(() => {
    const id = setInterval(() => setTime(getTime()), 30_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endDateStr]);
  return time;
}

function Row({ product, rank }) {
  const { h, m, expired } = useCountdown(product.sale_end_date);
  const isCritical = !expired && h === 0 && m < 30;
  const categoryName = product.product_categories?.name || 'Uncategorized';
  const { emoji } = getStringStyle(categoryName);

  return (
    <Link
      href={`/products/${product.slug}`}
      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--tt-radius-md)] transition-colors ${isCritical ? 'bg-[rgba(255,45,85,0.06)]' : 'hover:bg-[var(--tt-surface)]'}`}
    >
      <span className={`text-[0.72rem] font-extrabold w-5 text-center shrink-0 ${rank <= 3 ? 'text-[var(--tt-flame)]' : 'text-[var(--tt-muted)]'}`}>
        {rank}
      </span>
      <span className="w-8 h-8 rounded-[var(--tt-radius-sm)] bg-[var(--tt-surface-2)] flex items-center justify-center text-[1rem] shrink-0 overflow-hidden">
        {product.featured_image?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resizedImage(product.featured_image.url, 'thumbnail')} alt="" className="w-full h-full object-cover" />
        ) : emoji}
      </span>
      <span className="flex-1 min-w-0 text-[0.8rem] font-medium truncate">{product.name}</span>
      <span className="text-[0.78rem] font-bold shrink-0" style={{ color: isCritical ? 'var(--tt-danger)' : 'var(--tt-text)' }}>
        {formatUGX(product.sale_price)}
      </span>
      <span className={`text-[0.7rem] font-bold shrink-0 min-w-[46px] text-right ${isCritical ? 'text-[var(--tt-danger)] animate-[tt-pulse_1.2s_ease-in-out_infinite]' : 'text-[var(--tt-muted-2)]'}`}>
        {expired ? 'ENDED' : `${h}h ${m}m`}
      </span>
    </Link>
  );
}

export default function FeedEndingSoonPost() {
  const { data: products, isLoading } = useLiveUrgencyProducts();
  const top = products?.slice(0, 5);

  if (!isLoading && !top?.length) return null;

  return (
    <FeedPostCard avatar="⏰" title="Ending Soonest" meta="Live urgency ranking — re-sorts every 30s" tag="🔴 Live" tagVariant="danger">
      <div className="flex flex-col gap-1">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="tt-shimmer h-[42px] rounded-[var(--tt-radius-md)] bg-[var(--tt-surface)]" />
            ))
          : top.map((p, i) => <Row key={p.id} product={p} rank={i + 1} />)}
      </div>
      <Link href="/products" className="block text-center text-[0.78rem] font-semibold text-[var(--tt-flame-2)] mt-2 pt-2 border-t border-[var(--tt-border)]">
        View all urgent deals →
      </Link>
    </FeedPostCard>
  );
}
