'use client';

import Link from 'next/link';

export default function MidPageCTA() {
  return (
    <section className="pb-12">
      <div className="tt-container">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
          {/* Vendor CTA */}
          <div className="bg-[var(--tt-surface-2)] border border-[rgba(255,77,0,0.25)] rounded-[var(--tt-radius-xl)] p-8 relative overflow-hidden">
            <div className="text-[2.5rem] mb-3">🏪</div>
            <h3 className="font-['Syne',sans-serif] font-extrabold text-[1.2rem] mb-2">
              Sell Faster with a Deadline
            </h3>
            <p className="text-[var(--tt-muted)] text-[0.875rem] leading-[1.6] mb-5">
              Add a countdown clock to your listing. Watch buyers rush to book before time runs out.
              Free to start — no upfront fees.
            </p>
            <div className="flex gap-[0.6rem] flex-wrap">
              <Link href="/apply-vendor" className="tt-btn tt-btn-primary tt-shimmer text-[0.85rem]">
                Start Selling
              </Link>
              <Link href="/vendor" className="tt-btn tt-btn-ghost text-[0.85rem]">
                Vendor Dashboard
              </Link>
            </div>
          </div>

          {/* Near Me CTA */}
          <div className="bg-[var(--tt-surface-2)] border border-[rgba(0,232,122,0.2)] rounded-[var(--tt-radius-xl)] p-8 relative overflow-hidden">
            <div className="text-[2.5rem] mb-3">📍</div>
            <h3 className="font-['Syne',sans-serif] font-extrabold text-[1.2rem] mb-2">
              Deals Near You
            </h3>
            <p className="text-[var(--tt-muted)] text-[0.875rem] leading-[1.6] mb-5">
              Find discounted products within walking distance. Enable location for hyper-local deals,
              or pick your neighbourhood from our dropdown.
            </p>
            <div className="flex gap-[0.6rem] flex-wrap">
              <Link href="/near-me" className="tt-btn tt-btn-gold text-[0.85rem]">
                Find Nearby Deals
              </Link>
              <Link href="/products" className="tt-btn tt-btn-ghost text-[0.85rem]">
                Browse All
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
