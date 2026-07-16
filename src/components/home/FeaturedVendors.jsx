'use client';

import Link from 'next/link';

import { useFeaturedVendors } from '@/lib/hooks/useVendors';
import VendorCard from './VendorCard';

export default function FeaturedVendors() {
  const { data: vendors, isLoading } = useFeaturedVendors(4);

  if (!isLoading && !vendors?.length) {
    return null;
  }

  return (
    <section className="pb-5">
      <div className="tt-container tt-container-padding">
        <div className="flex items-end justify-between mb-5 gap-4 flex-wrap">
          <div>
            <h2 className="font-['Syne',sans-serif] font-extrabold text-[clamp(1.3rem,2.5vw,1.85rem)]">
              Top{' '}
              <span className="bg-[image:var(--tt-gradient-flame)] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
                Vendors
              </span>
            </h2>
            <p className="text-[var(--tt-muted)] text-[0.875rem] mt-1">
              Trusted sellers with live deals and fast bookings
            </p>
          </div>
          <Link
            href="/vendors"
            className="tt-btn tt-btn-ghost text-[0.82rem] px-4 py-[0.45rem]"
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
