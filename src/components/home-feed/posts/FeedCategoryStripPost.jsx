'use client';

import { useTopCategories } from '@/hooks/useHomeData';
import FeedPostCard from '../FeedPostCard';
import CategoryCard from '@/components/home/CategoryCard';

export default function FeedCategoryStripPost() {
  const { data: categories, isLoading } = useTopCategories();

  if (!isLoading && !categories?.length) return null;

  return (
    <FeedPostCard className='' noPadding avatar="🗂️" title="Browse by Category" meta="Updated live" tag="Explore" tagVariant="flame">
      <div className="flex gap-3 overflow-x-auto no-scrollbar pt-1 pb-1">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="tt-shimmer w-[86px] h-[92px] rounded-[var(--tt-radius-md)] bg-[var(--tt-surface-2)] shrink-0" />
            ))
          : categories.map((cat) => (
              <div className='shrink-0 w-[100px]'>
                <CategoryCard exClass='h-full'  key={cat.id} cat={cat} CardStyle={'default'} />
              </div>
            ))}
      </div>
    </FeedPostCard>
  );
}
