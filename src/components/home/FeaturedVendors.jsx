'use client';

import Link from 'next/link';

import { useFeaturedVendors } from '@/lib/hooks/useVendors';
import VendorCard from './VendorCard';
import DualColorHeading from '../ui/DualColorHeading';

export default function FeaturedVendors() {
  const { data: vendors, isLoading } = useFeaturedVendors(4);

  if (!isLoading && !vendors?.length) {
    return null;
  }

  return (
    <section className="pb-5">
      <div className="tt-container tt-container-padding">
        <div className="flex items-end justify-between mb-5 gap-4 flex-nowrap">
          <DualColorHeading title='Top' subTitle='Vendors' description='Trending sellers with live deals and fast bookings' />
          <Link
            href="/vendors"
            className="tt-btn-ghost text-[0.75rem] py-[0.45rem] rounded-3xl leading-[1.2] px-3 shadow font-semibold"
          >
            All Vendors →
          </Link>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="tt-shimmer h-[210px] rounded-[var(--tt-radius-lg)] bg-[var(--tt-surface)]" />
              ))
            : vendors.map((v) => <VendorCard key={v.id} vendor={v} />)}
        </div>
      </div>
    </section>
  );
}
