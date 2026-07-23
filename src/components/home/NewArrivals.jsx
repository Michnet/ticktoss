'use client';

import Link from 'next/link';

import { useNewArrivals } from '@/hooks/useHomeData';
import ProductCard from '@/components/product/ProductCard';
import ProductCardGlass from '../product/concepts/ProductCardGlass';
import DualColorHeading from '../ui/DualColorHeading';
import Masonry, { ResponsiveMasonry } from 'custom_modules/react-responsive-masonry';

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
            className="tt-btn-ghost text-[0.75rem] py-[0.45rem] rounded-3xl leading-[1.2] px-3 shadow font-semibold"
          >
            See All New →
          </Link>
        </div>

        {/* Horizontal scroll strip */}
        {/* <div className="grid sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] grid-cols-1 sm:gap-[0.875rem] gap-2">
          {isLoading ? (
             Array.from({ length: 6 }).map((_, i) => (
               <div key={i} className="tt-shimmer h-[260px] rounded-[var(--tt-radius-lg)] bg-[var(--tt-surface)]" />
             ))
          ) : (
            products?.map((p, i) => (
              <ProductCardGlass key={p.id} product={p} index={i} />
            ))
          )}
        </div> */}
        <ResponsiveMasonry columnsCountBreakPoints={{350: 1, 640: 2, 768: 3, 1024:4}}
                gutterBreakPoints={{350: "12px", 750: "16px", 900: "24px"}}>
                  <Masonry>
          {isLoading ? (
             Array.from({ length: 6 }).map((_, i) => (
               <div key={i} className="tt-shimmer h-[260px] rounded-[var(--tt-radius-lg)] bg-[var(--tt-surface)]" />
             ))
          ) : (
            products?.map((p, i) => (
              <ProductCardGlass exClass='flex-grow' key={p.id} product={p} index={i} />
            ))
          )}
          </Masonry>
      </ResponsiveMasonry>
        </div>
    </section>
  );
}else{
  return <></>
}
}
