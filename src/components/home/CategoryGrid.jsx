'use client';

import Link from 'next/link';
import { useTopCategories } from '@/hooks/useHomeData';
import CategoryCard from './CategoryCard';

export default function CategoryGrid({ CardStyle = 'default' }) {
  const { data: categories, isLoading, error } = useTopCategories();

  // Show a simple skeleton loader if loading
  if (isLoading) {
    return (
      <section className="pb-5">
        <div className="tt-container tt-container-padding">
          <div className="tt-shimmer h-[30px] w-[200px] bg-[var(--tt-surface)] rounded-[4px] mb-5" />
          <div className={
            CardStyle === 'pills' 
              ? "flex flex-wrap gap-3" 
              : CardStyle === 'detailed'
                ? "grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4"
                : "grid grid-cols-[repeat(auto-fill,minmax(145px,1fr))] gap-3"
          }>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={`tt-shimmer bg-[var(--tt-surface)] ${CardStyle === 'pills' ? 'h-[40px] w-[120px] rounded-full' : CardStyle === 'detailed' ? 'h-[140px] rounded-[var(--tt-radius-lg)]' : 'h-[140px] rounded-[var(--tt-radius-lg)]'}`} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !categories) return null;

  return (
    <section className="pb-5">
      <div className="tt-container tt-container-padding">
        {/* Header */}
        <div className="flex items-end justify-between mb-5 gap-4 flex-wrap">
          <div>
            <h2 className="font-['Syne',sans-serif] font-extrabold text-[clamp(1.3rem,2.5vw,1.85rem)]">
              Browse by{' '}
              <span className="bg-[image:var(--tt-gradient-flame)] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
                Category
              </span>
            </h2>
            <p className="text-[var(--tt-muted)] text-[0.875rem] mt-1">
              Every category has live countdown deals
            </p>
          </div>
          <Link
            href="/categories"
            className="tt-btn tt-btn-ghost text-[0.82rem] px-4 py-[0.45rem]"
          >
            All Categories →
          </Link>
        </div>

        {/* Grid */}
        <div className={
          CardStyle === 'pills' 
            ? "flex flex-wrap gap-3" 
            : CardStyle === 'detailed'
              ? "grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4"
              : "grid grid-cols-[repeat(auto-fill,minmax(95px,1fr))] gap-3"
        }>
          {categories.map((cat) => (
            <CategoryCard key={cat.id} cat={cat} CardStyle={CardStyle} />
          ))}
        </div>
      </div>
    </section>
  );
}
