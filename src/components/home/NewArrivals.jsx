'use client';

import Link from 'next/link';

import { useNewArrivals } from '@/hooks/useHomeData';
import ProductCard from '@/components/product/ProductCard';

export default function NewArrivals() {
  const { data: products, isLoading } = useNewArrivals();
  if(products?.length > 0){
  return (
    <section className="pb-5">
      <div className="tt-container tt-container-padding">
        <div className="flex items-end justify-between mb-5 gap-4 flex-wrap">
          <div>
            <h2 className="font-['Syne',sans-serif] font-extrabold text-[clamp(1.3rem,2.5vw,1.85rem)]">
              🆕 Just{' '}
              <span className="text-[#4c8bff]">
                Listed
              </span>
            </h2>
            <p className="text-[var(--tt-muted)] text-[0.875rem] mt-1">
              Fresh deals — be the first to book
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
        <div className="grid sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] grid-cols-2 sm:gap-[0.875rem] gap-2">
          {isLoading ? (
             Array.from({ length: 6 }).map((_, i) => (
               <div key={i} className="tt-shimmer h-[260px] rounded-[var(--tt-radius-lg)] bg-[var(--tt-surface)]" />
             ))
          ) : (
            products?.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))
          )}
        </div>
      </div>
    </section>
  );
}else{
  return <></>
}
}
