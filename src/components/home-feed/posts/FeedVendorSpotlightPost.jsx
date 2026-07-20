'use client';

import Link from 'next/link';
import { useFeaturedVendors } from '@/lib/hooks/useVendors';
import { resizedImage } from '@/helpers/universal';
import FeedPostCard from '../FeedPostCard';

export default function FeedVendorSpotlightPost() {
  const { data: vendors, isLoading } = useFeaturedVendors(2);

  if (!isLoading && !vendors?.length) return null;

  return (
    <FeedPostCard avatar="🏪" title="Trusted Sellers" meta="Vendors with live deals right now" tag="Spotlight" tagVariant="success">
      <div className="grid grid-cols-2 gap-2.5">
        {isLoading
          ? Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="tt-shimmer h-[150px] rounded-[var(--tt-radius-lg)] bg-[var(--tt-surface)]" />
            ))
          : vendors.map((v) => (
              <Link
                key={v.id}
                href={`/products?vendor_id=${v.id}`}
                className="relative rounded-[var(--tt-radius-lg)] overflow-hidden border border-[var(--tt-border)] h-[150px] flex flex-col justify-end p-3 bg-cover bg-center"
                style={{ backgroundColor: v.bg, backgroundImage: v.image ? `url(${resizedImage(v.image, 'medium')})` : undefined }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="relative">
                  <div className="text-[0.62rem] font-bold px-[6px] py-[2px] rounded-full inline-block mb-1" style={{ background: `${v.badgeColor}33`, color: v.badgeColor }}>
                    {v.badge}
                  </div>
                  <div className="text-white font-['Syne',sans-serif] font-bold text-[0.85rem] truncate">{v.name}</div>
                  <div className="text-white/70 text-[0.65rem]">{v.activeDeals ?? 0} active deals</div>
                </div>
              </Link>
            ))}
      </div>
      <Link href="/vendors" className="block text-center text-[0.78rem] font-semibold text-[var(--tt-flame-2)] mt-3">
        Explore all vendors →
      </Link>
    </FeedPostCard>
  );
}
