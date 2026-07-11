'use client';

import Link from 'next/link';

import { useFeaturedProducts, useNewArrivals, useUpcomingDeals } from '@/hooks/useHomeData';
import ProductCard from '@/components/product/ProductCard';
import Carousel from '../ui/Carousel';
//Dynamically import hooks based on source


export default function ProductsView({ cardWidth = 'auto', source = 'upcoming',ui = 'carousel', title = 'Upcoming',subTitle = 'Deals',description = null}) {
  

  let callerHook = null, ctaLink = null;

  switch (source) {
    case 'upcoming':
      callerHook = useUpcomingDeals;
      ctaLink = '/products?sort=upcoming';
      break;
    case 'featured':
      ctaLink = '/products?sort=featured';
      callerHook = useFeaturedProducts;
      break;
    case 'new':
      ctaLink = '/products?sort=new';
      callerHook = useNewArrivals;
      break;
    default:
      ctaLink = '/products?sort=upcoming';
      callerHook = useUpcomingDeals;
      break;
  }

  const { data: products, isLoading } = callerHook();

  const renderItems = () => {
    if (isLoading) {
      return Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={`tt-shimmer h-[260px] rounded-[var(--tt-radius-lg)] bg-[var(--tt-surface)] ${ui === 'carousel' ? 'w-[180px] sm:w-[220px]' : ''}`} />
      ));
    }
    return products?.map((p, i) => (
      <ProductCard key={p.id} product={p} index={i} />
    ));
  };

  if(products?.length > 0){
  return (
    <section className="pb-5">
      <div className="tt-container">
        <div className="flex items-center justify-between mb-5 gap-4 flex-nowrap">
          <div>
            <h2 className="font-['Syne',sans-serif] font-extrabold text-[clamp(1.3rem,2.5vw,1.85rem)]">
              {title}{' '}
              {subTitle && <span className="bg-[image:var(--tt-gradient-flame)] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
                {subTitle}
              </span>}
            </h2>
            {description && <p className="text-[var(--tt-muted)] text-[0.875rem] mt-1">
              {description}
            </p>}
          </div>
          {ctaLink && <Link
            href={ctaLink}
            className="tt-btn tt-btn-ghost text-[0.82rem] px-4 py-[0.45rem]"
          >
            See All New →
          </Link>}
        </div>

        {/* Product items container */}
        {ui === 'carousel' ? (
          <Carousel itemWidth={cardWidth} autoWidth trackClassName="gap-2" itemClassName="w-[150px] sm:w-[180px]">
            {renderItems()}
          </Carousel>
        ) : (
          <div className="grid sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] grid-cols-2 gap-[0.875rem]">
            {renderItems()}
          </div>
        )}
      </div>
    </section>
  );
}else{
  return <></>
}
}
