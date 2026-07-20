'use client';

import Link from 'next/link';
import { useFeaturedProducts } from '@/hooks/useHomeData';
import { resizedImage } from '@/helpers/universal';
import { formatUGX } from '@/lib/currency';
import { getStringStyle } from '@/lib/colors';
import CountdownClock from '@/components/product/CountdownClock';
import UrgencyCircle from '@/components/product/UrgencyCircle';
import ProductActions from '@/components/product/ProductActions';
import FeedPostCard from '../FeedPostCard';

function timeAgo(dateStr) {
  if (!dateStr) return 'Just now';
  const minutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function FeedDealSpotlightPost({ index = 0 }) {
  const { data: products, isLoading } = useFeaturedProducts();
  const product = products?.[index];

  if (isLoading) {
    return <div className="tt-shimmer h-[420px] rounded-[var(--tt-radius-lg)] bg-[var(--tt-surface)]" />;
  }
  if (!product) return null;

  const imageUrl = product.featured_image?.url ?? null;
  const categoryName = product.product_categories?.name || 'Uncategorized';
  const { emoji, color } = getStringStyle(categoryName);
  const discountPct = product.price > 0
    ? Math.round(((product.price - product.sale_price) / product.price) * 100)
    : 0;

  return (
    <FeedPostCard
      avatar={emoji}
      title={categoryName}
      meta={`Featured Deal · ${timeAgo(product.created_at)}`}
      tag="⭐ Featured"
      tagVariant="gold"
      noPadding
      footer={<ProductActions product={product} leftExtraClass="bg-transparent" />}
    >
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative bg-white aspect-[16/10] flex items-center justify-center text-[3rem] overflow-hidden">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resizedImage(imageUrl, 'medium_large')} alt={product.name} className="w-full h-full object-contain" />
          ) : (
            <span style={{ color }}>{emoji}</span>
          )}
          {discountPct > 0 && (
            <div className="absolute top-3 right-3 bg-[var(--tt-flame)] text-white shadow-[0_4px_12px_rgba(255,77,0,0.5)] text-[0.9rem] font-black w-11 h-11 rounded-full flex items-center justify-center">
              -{discountPct}%
            </div>
          )}
        </div>
      </Link>
      <div className="px-4 pt-3">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-['Syne',sans-serif] font-bold text-[1rem] leading-snug line-clamp-2 mb-2">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="font-['Syne',sans-serif] font-extrabold text-[1.2rem] text-[var(--tt-flame)]">
            {formatUGX(product.sale_price)}
          </span>
          <span className="text-[0.78rem] text-[var(--tt-muted)] line-through">{formatUGX(product.price)}</span>
        </div>
        <div className="flex items-center justify-between gap-2 bg-[var(--tt-surface)] rounded-[var(--tt-radius-md)] px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--tt-muted-2)]">Ends in</span>
            <CountdownClock saleEndDate={product.sale_end_date} size="sm" />
          </div>
          <UrgencyCircle saleEndDate={product.sale_end_date} showLabel={false} />
        </div>
      </div>
    </FeedPostCard>
  );
}
