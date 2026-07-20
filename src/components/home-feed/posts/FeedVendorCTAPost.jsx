'use client';

import Link from 'next/link';
import useAppStore from '@/store/useAppStore';

export default function FeedVendorCTAPost() {
  const isVendor = useAppStore((s) => s.isVendor);
  if (isVendor()) return null;

  return (
    <div className="rounded-[var(--tt-radius-lg)] p-5 text-center bg-[var(--tt-surface)] border border-[var(--tt-border)]">
      <span className="tt-badge tt-badge-flame mb-3 inline-flex">⚡ Join the market</span>
      <h3 className="font-['Syne',sans-serif] font-extrabold text-[1.15rem] mb-2">
        Ready to{' '}
        <span className="bg-[image:var(--tt-gradient-flame)] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
          Sell Fast?
        </span>
      </h3>
      <p className="text-[var(--tt-muted-2)] text-[0.85rem] max-w-[380px] mx-auto mb-4 leading-[1.6]">
        List your products with a discount and a deadline. Watch them sell faster than ever.
      </p>
      <div className="flex gap-2.5 justify-center flex-wrap">
        <Link href="/apply-vendor" className="tt-btn tt-btn-primary tt-shimmer px-5 py-[0.7rem] text-[0.85rem]">
          Become a Vendor
        </Link>
        <Link href="/products" className="tt-btn tt-btn-ghost px-5 py-[0.7rem] text-[0.85rem]">
          Browse Deals First
        </Link>
      </div>
    </div>
  );
}
