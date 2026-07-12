'use client';

import { MapPin, Store } from 'lucide-react';
import Link from 'next/link';

export default function MidPageCTA() {
  return (
    <section className="pb-5">
      <div className="tt-container tt-container-padding">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
          {/* Vendor CTA */}
          <div className="bg-[var(--tt-surface-2)] border border-[var(--tt-border)] rounded-[var(--tt-radius-xl)] p-6 relative overflow-hidden">
            <div className="text-[4.5rem] mb-3 absolute -left-5 -top-5 z-0 opacity-20 -rotate-20">
              <Store className='lucide-dark:invert' strokeWidth={1} size={150} />
            </div>
            <div className="z-[1] relative">
            <h3 className="font-extrabold text-[1.2rem] mb-2">
              Sell Faster with a Deadline
            </h3>
            <p className="opacity-70 text-xs leading-[1.6] mb-5">
              Add a countdown clock to your listing. Watch buyers rush to book before time runs out.
              Free to start — no upfront fees.
            </p>
            <div className="flex gap-[0.6rem] flex-wrap">
              <Link href="/apply-vendor" className="tt-btn tt-btn-gold text-[0.85rem]">
                Start Selling
              </Link>
              {/* <Link href="/vendor" className="tt-btn tt-btn-ghost text-[0.85rem]">
                Vendor Dashboard
              </Link> */}
            </div>
            </div>
          </div>

          {/* Near Me CTA */}
          <div className="relative theme-set no-border rounded-[var(--tt-radius-xl)] p-6 overflow-hidden">
            <div className="text-[4.5rem] mb-3 absolute -left-5 -top-5 z-0 opacity-20 -rotate-20">
              <MapPin className='lucide-dark:invert' strokeWidth={1}  size={150} />
            </div>
            <div className="z-[1] relative">
            <h3 className="font-extrabold text-[1.2rem] mb-2">
              Deals Near You
            </h3>
            <p className="opacity-70 text-xs leading-[1.6] mb-5">
              Find discounted products within walking distance. Enable location for hyper-local deals,
              or pick your neighbourhood from our dropdown.
            </p>
            <div className="flex gap-[0.6rem] flex-wrap">
              <Link href="/near-me" className="tt-btn tt-btn-primary tt-shimmer text-[0.85rem]">
                Find Nearby Deals
              </Link>
              {/* <Link href="/products" className="tt-btn tt-btn-ghost text-[0.85rem]">
                Browse All
              </Link> */}
            </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
