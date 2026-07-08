'use client';

import Link from 'next/link';

const TAGS = [
  { name: 'Flash Sale', slug: 'flash-sale', count: 384, hot: true },
  { name: 'Weekend Deals', slug: 'weekend-deals', count: 210, hot: true },
  { name: 'Refurbished', slug: 'refurbished', count: 156 },
  { name: 'Imported', slug: 'imported', count: 284 },
  { name: 'Brand New', slug: 'brand-new', count: 620 },
  { name: 'Under UGX 50K', slug: 'under-50k', count: 332, hot: true },
  { name: 'Kampala Only', slug: 'kampala-only', count: 190 },
  { name: 'Same-Day Pickup', slug: 'same-day-pickup', count: 98 },
  { name: 'Bulk Discount', slug: 'bulk-discount', count: 74 },
  { name: 'Clearance', slug: 'clearance', count: 412, hot: true },
  { name: 'Electronics', slug: 'electronics', count: 1240 },
  { name: 'Handmade', slug: 'handmade', count: 62 },
  { name: 'Preorder', slug: 'preorder', count: 48 },
  { name: 'Last 1 in Stock', slug: 'last-stock', count: 33, hot: true },
  { name: 'Expiring Today', slug: 'expiring-today', count: 87, hot: true },
  { name: 'Kampala', slug: 'kampala', count: 1820 },
  { name: 'Wakiso', slug: 'wakiso', count: 540 },
  { name: 'Jinja', slug: 'jinja', count: 210 },
  { name: 'Mbarara', slug: 'mbarara', count: 140 },
  { name: 'Gulu', slug: 'gulu', count: 90 },
  { name: 'Fast Fashion', slug: 'fast-fashion', count: 330 },
  { name: 'Fresh Produce', slug: 'fresh-produce', count: 145 },
  { name: 'School Supplies', slug: 'school-supplies', count: 260 },
  { name: 'Garden Tools', slug: 'garden-tools', count: 48 },
];

// Assign visual weight by count for the "cloud" effect
function sizeClass(count) {
  if (count > 1000) return 'text-[1rem] font-bold';
  if (count > 500) return 'text-[0.9rem] font-semibold';
  if (count > 200) return 'text-[0.82rem] font-semibold';
  if (count > 100) return 'text-[0.78rem] font-medium';
  return 'text-[0.72rem] font-medium';
}

export default function TagCloud() {
  return (
    <section className="pb-5">
      <div className="tt-container">
        <div className="mb-5">
          <h2 className="font-['Syne',sans-serif] font-extrabold text-[clamp(1.3rem,2.5vw,1.85rem)]">
            Explore by{' '}
            <span className="bg-[image:var(--tt-gradient-flame)] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
              Tag
            </span>
          </h2>
          <p className="text-[var(--tt-muted)] text-[0.875rem] mt-1">
            Popular search tags across all listings
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {TAGS.map((tag) => {
            const sz = sizeClass(tag.count);
            return (
              <Link
                key={tag.slug}
                href={`/products?tag=${tag.slug}`}
                className={`inline-flex items-center gap-[0.3rem] rounded-full no-underline transition-all duration-[0.18s] hover:-translate-y-[2px] ${tag.hot ? 'px-[0.7rem] py-[0.3rem] bg-[rgba(255,77,0,0.12)] border border-[rgba(255,77,0,0.3)] text-[var(--tt-flame-2)] hover:bg-[rgba(255,77,0,0.2)] hover:text-white hover:border-[var(--tt-flame)]' : 'px-[0.6rem] py-[0.25rem] bg-[var(--tt-surface-2)] border border-[var(--tt-border)] text-[var(--tt-muted-2)] hover:bg-[var(--tt-surface)] hover:text-[var(--tt-text)] hover:border-[var(--tt-border-2)]'} ${sz}`}
              >
                {tag.hot && <span className="text-[0.7em]">🔥</span>}
                #{tag.name}
                <span className="text-[0.62rem] text-[var(--tt-muted)] ml-[1px]">
                  {tag.count > 999 ? (tag.count / 1000).toFixed(1) + 'k' : tag.count}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
