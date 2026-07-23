'use client';

import Link from 'next/link';

import { useFeaturedProducts, useNewArrivals, useUpcomingDeals } from '@/hooks/useHomeData';
import ProductCard from '@/components/product/ProductCard';
import Carousel from '../ui/Carousel';
import DualColorHeading from '../ui/DualColorHeading';
import { useProducts } from '@/lib/hooks/useProducts';

//Dynamically import cards based on cardType
import ProductCard1 from '../product/cards/ProductCard1';


export default function ProductsView({headingSize= 20, cardType = 0, itemExClass='', cardWidth = 'auto', source = 'upcoming',ui = 'carousel', title = 'Upcoming', customFilters = {}, subTitle = 'Deals',description = null, filters=[]}) {
  

  let callerHook = null, ctaLink = null, Card = null;

  switch (cardType) {
    case 0:
      Card = ProductCard;
      break;
    case 1:
      Card = ProductCard1;
      break;
    default:
      Card = ProductCard;
      break;
  }

  if(filters?.length >  0){
    customFilters.clusters = filters
  }


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
    case 'custom':
      const hasClusters = Array.isArray(filters) && filters.length > 0;
      ctaLink = hasClusters ? `/products?clusters=${filters.join(',')}` : '/products';
      callerHook = () => useProducts(customFilters);
      break;
    default:
      ctaLink = `/products`;
      callerHook = useProducts;
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
      <Card counterLabel={source==='upcoming' ? 'Starts: ' : null} startDate={source==='upcoming'} key={p.id} product={p} index={i} cardWidth={cardWidth}/>
    ));
  };

  if(products?.length > 0){
  return (
      <div>
        <div className="flex items-center justify-between mb-5 gap-4 flex-nowrap">
          <DualColorHeading size={headingSize} title={title} subTitle={subTitle} description={description} />
          {ctaLink && <Link
            href={ctaLink}
            className={`tt-btn tt-btn-ghost text-[${(headingSize*0.7).toFixed(0)}px] px-4 py-[0.45rem]`}
          >
            View All →
          </Link>}
        </div>

        {/* Product items container */}
        {ui === 'carousel' ? (
          <Carousel itemWidth={cardWidth} autoWidth={true} trackClassName="gap-2" itemClassName={`${itemExClass}`}>
            {renderItems()}
          </Carousel>
        ) : (
          <div className="grid sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] grid-cols-2 gap-2 sm:gap-[0.875rem]">
            {renderItems()}
          </div>
        )}
      </div>
  );
}else{
  return <></>
}
}
