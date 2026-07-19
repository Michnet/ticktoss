'use client';

import Link from 'next/link';

import { useNewArrivals } from '@/hooks/useHomeData';
import ProductCard from '@/components/product/ProductCard';
import ProductCardGlass from '../product/concepts/ProductCardGlass';
import DualColorHeading from '../ui/DualColorHeading';

export default function NewArrivals() {
  const { data: products, isLoading } = useNewArrivals();
  if(products?.length > 0){
  return (
    <section className="pb-5">
      <div className="tt-container tt-container-padding">
        <div className="flex items-end justify-between mb-5 gap-4 flex-wrap">
          <DualColorHeading size={28} title="Just" subTitle="Listed" emoji="🆕" description="Fresh deals — be the first to book"/>
          <Link
            href="/products?sort=new"
            className="tt-btn tt-btn-ghost text-[0.82rem] px-4 py-[0.45rem]"
          >
            See All New →
          </Link>
        </div>

        {/* Horizontal scroll strip */}
        <div className="grid sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] grid-cols-1 sm:gap-[0.875rem] gap-2">
          {isLoading ? (
             Array.from({ length: 6 }).map((_, i) => (
               <div key={i} className="tt-shimmer h-[260px] rounded-[var(--tt-radius-lg)] bg-[var(--tt-surface)]" />
             ))
          ) : (
            products?.map((p, i) => (
              <ProductCardGlass key={p.id} product={p} index={i} />
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
