'use client';

import Link from 'next/link';
import { useFeaturedVendors } from '@/lib/hooks/useVendors';
import { resizedImage } from '@/helpers/universal';

export default function WidgetSuggestedVendors() {
  const { data: vendors, isLoading } = useFeaturedVendors(4);

  if (!isLoading && !vendors?.length) return null;

  return (
    <div className="bg-[var(--tt-surface)] border border-[var(--tt-border)] rounded-[var(--tt-radius-lg)] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-['Syne',sans-serif] font-extrabold text-[0.9rem]">🏪 Suggested Vendors</h3>
        <Link href="/vendors" className="text-[0.7rem] text-[var(--tt-flame-2)] font-semibold">See all</Link>
      </div>
      <div className="flex flex-col gap-2">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="tt-shimmer h-[44px] rounded-[var(--tt-radius-md)] bg-[var(--tt-surface-2)]" />
            ))
          : vendors.map((v) => (
              <Link
                key={v.id}
                href={`/products?vendor_id=${v.id}`}
                className="flex items-center gap-2.5 p-1.5 rounded-[var(--tt-radius-md)] hover:bg-[var(--tt-surface-2)] transition-colors"
              >
                <div
                  className="w-9 h-9 rounded-[var(--tt-radius-sm)] flex items-center justify-center text-[0.8rem] font-bold shrink-0 overflow-hidden border"
                  style={{ background: `${v.accent}22`, borderColor: `${v.accent}40`, color: v.accent }}
                >
                  {v.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={resizedImage(v.image, 'thumbnail')} alt={v.name} className="w-full h-full object-cover" />
                  ) : (
                    v.name?.[0]?.toUpperCase() ?? '🏪'
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[0.8rem] font-semibold truncate flex items-center gap-1">
                    {v.name}
                    {v.verified && <span className="text-[var(--tt-success)] text-[0.65rem]">✓</span>}
                  </div>
                  <div className="text-[0.65rem] text-[var(--tt-muted)]">{v.activeDeals ?? 0} active deals</div>
                </div>
                <span className="text-[0.6rem] font-bold px-[6px] py-[2px] rounded-full shrink-0" style={{ background: `${v.badgeColor}22`, color: v.badgeColor }}>
                  {v.badge}
                </span>
              </Link>
            ))}
      </div>
    </div>
  );
}
