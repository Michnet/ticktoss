'use client';

import Link from 'next/link';
import { useTopCategories } from '@/hooks/useHomeData';
import FeedPostCard from '../FeedPostCard';

export default function FeedCategoryStripPost() {
  const { data: categories, isLoading } = useTopCategories();

  if (!isLoading && !categories?.length) return null;

  return (
    <FeedPostCard avatar="🗂️" title="Browse by Category" meta="Updated live" tag="Explore" tagVariant="flame">
      <div className="flex gap-3 overflow-x-auto no-scrollbar pt-1 pb-1">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="tt-shimmer w-[86px] h-[92px] rounded-[var(--tt-radius-md)] bg-[var(--tt-surface-2)] shrink-0" />
            ))
          : categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category_id=${cat.id}`}
                className="shrink-0 w-[86px] flex flex-col items-center gap-1.5 p-2.5 rounded-[var(--tt-radius-md)] bg-[var(--tt-surface)] border border-[var(--tt-border)] hover:border-[var(--tt-flame)]/40 hover:-translate-y-[2px] transition-all"
              >
                <span className="text-[1.6rem]">{cat.icon || '🏷️'}</span>
                <span className="text-[0.68rem] font-semibold text-center leading-tight line-clamp-2">{cat.name}</span>
              </Link>
            ))}
      </div>
    </FeedPostCard>
  );
}
