'use client';

import Link from 'next/link';
import { useTopCategories } from '@/hooks/useHomeData';
import CategoryCard from './CategoryCard';
import DualColorHeading from '../ui/DualColorHeading';

export default function CategoryGrid({ CardStyle = 'default', carousel = false, rows = 1 }) {
  const { data: categories, isLoading, error } = useTopCategories();

  // Show a simple skeleton loader if loading
  if (isLoading) {
    return (
      <section className="pb-5">
        <div className="tt-container tt-container-padding">
          <div className="tt-shimmer h-[30px] w-[200px] bg-[var(--tt-surface)] rounded-[4px] mb-5" />
          <div 
            className={
              carousel
                ? "grid grid-flow-col gap-2 overflow-x-auto pb-4 no-scrollbar [grid-template-rows:repeat(var(--carousel-rows,1),minmax(0,1fr))] md:[grid-template-rows:repeat(1,minmax(0,1fr))]"
                : CardStyle === 'pills' 
                ? "flex flex-wrap gap-3" 
                : CardStyle === 'detailed'
                  ? "grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4"
                  : "grid grid-cols-[repeat(auto-fill,minmax(145px,1fr))] gap-3"
            }
            style={
              carousel ? {
                '--carousel-rows': rows,
                gridAutoColumns: CardStyle === 'pills' ? '120px' : CardStyle === 'detailed' ? '280px' : '145px'
              } : undefined
            }
          >
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
        <div className="flex md:items-end text-center md:text-left items-center md:justify-between justify-center mb-5 gap-4 flex-wrap">
          <DualColorHeading title="Browse by" subTitle="Category" description={'Discover the latest discounts from stores all over Uganda. Shop by category'} />
          <Link
            href="/products"
            className="tt-btn-ghost text-[0.75rem] py-[0.45rem] rounded-3xl leading-[1.2] px-3 shadow font-semibold"
          >
            All Categories →
          </Link>
        </div>

        {/* Grid */}
        <div 
          className={
            carousel
              ? "grid grid-flow-col gap-2 overflow-x-auto pb-4 no-scrollbar [grid-template-rows:repeat(var(--carousel-rows,1),minmax(0,1fr))] md:[grid-template-rows:repeat(1,minmax(0,1fr))]"
              : CardStyle === 'pills' 
              ? "flex flex-wrap gap-3" 
              : CardStyle === 'detailed'
                ? "grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4"
                : "grid grid-cols-[repeat(auto-fill,minmax(95px,1fr))] gap-3"
          }
          style={
            carousel ? {
              '--carousel-rows': rows,
              gridAutoColumns: CardStyle === 'pills' ? 'max-content' : CardStyle === 'detailed' ? '280px' : '110px'
            } : undefined
          }
        >
          {categories.map((cat) => (
            <CategoryCard key={cat.id} cat={cat} CardStyle={CardStyle} />
          ))}
        </div>
      </div>
    </section>
  );
}
