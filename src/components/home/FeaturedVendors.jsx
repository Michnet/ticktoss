'use client';

import Link from 'next/link';

const VENDORS = [
  {
    id: 'v1',
    slug: 'techstar-ug',
    name: 'TechStar UG',
    emoji: '💻',
    city: 'Kampala',
    rating: 4.9,
    reviews: 312,
    activeDeals: 24,
    verified: true,
    badge: 'Top Vendor',
    badgeColor: '#FFB800',
    accent: '#4C8BFF',
    bg: 'linear-gradient(135deg, #0D1040 0%, #0D0D20 100%)',
  },
  {
    id: 'v2',
    slug: 'fashion-hub-ug',
    name: 'Fashion Hub UG',
    emoji: '👗',
    city: 'Ntinda',
    rating: 4.7,
    reviews: 198,
    activeDeals: 18,
    verified: true,
    badge: 'Flash Seller',
    badgeColor: '#FF6B9D',
    accent: '#FF6B9D',
    bg: 'linear-gradient(135deg, #300D1E 0%, #1E0D14 100%)',
  },
  {
    id: 'v3',
    slug: 'mama-fresh',
    name: 'Mama Fresh',
    emoji: '🥬',
    city: 'Jinja',
    rating: 4.8,
    reviews: 87,
    activeDeals: 9,
    verified: false,
    badge: 'Daily Deals',
    badgeColor: '#00E87A',
    accent: '#00E87A',
    bg: 'linear-gradient(135deg, #0D2510 0%, #0D1A0D 100%)',
  },
  {
    id: 'v4',
    slug: 'home-essentials-ug',
    name: 'Home Essentials',
    emoji: '🛋️',
    city: 'Wakiso',
    rating: 4.6,
    reviews: 145,
    activeDeals: 15,
    verified: true,
    badge: 'Trusted',
    badgeColor: '#9B6BFF',
    accent: '#9B6BFF',
    bg: 'linear-gradient(135deg, #1A0D30 0%, #130D1E 100%)',
  },
];

function StarRating({ value }) {
  return (
    <span className="inline-flex gap-[1px] items-center">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className="text-[0.6rem]"
          style={{
            color: s <= Math.round(value) ? '#FFB800' : 'var(--tt-border-2)',
          }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export default function FeaturedVendors({ vendors = VENDORS }) {
  return (
    <section className="pb-12">
      <div className="tt-container">
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
          {vendors.map((v) => (
            <Link
              key={v.id}
              href={`/vendors/${v.slug}`}
              className="no-underline block h-full"
            >
              <div
                className="rounded-[var(--tt-radius-lg)] p-5 transition-all duration-200 relative overflow-hidden cursor-pointer hover:-translate-y-[3px] bg-[var(--tt-surface)] border border-[var(--tt-border)]"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = v.accent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--tt-border)';
                }}
              >
                {/* Avatar + badge */}
                <div className="flex items-start justify-between mb-[0.875rem]">
                  <div
                    className="w-[48px] h-[48px] rounded-[var(--tt-radius-md)] flex items-center justify-center text-[1.6rem] border"
                    style={{
                      background: `${v.accent}22`,
                      borderColor: `${v.accent}40`,
                    }}
                  >
                    {v.emoji}
                  </div>
                  <span
                    className="text-[0.62rem] font-bold px-2 py-[2px] rounded-full border"
                    style={{
                      background: `${v.badgeColor}22`,
                      color: v.badgeColor,
                      borderColor: `${v.badgeColor}40`,
                    }}
                  >
                    {v.badge}
                  </span>
                </div>

                {/* Name + verified */}
                <div className="flex items-center gap-[0.3rem] mb-[0.2rem]">
                  <span className="font-['Syne',sans-serif] font-bold text-[0.95rem] text-white">
                    {v.name}
                  </span>
                  {v.verified && (
                    <span className="text-[0.75rem] text-[var(--tt-success)]" title="Verified">
                      ✓
                    </span>
                  )}
                </div>

                <div className="text-[0.72rem] text-white/70 mb-[0.75rem]">
                  📍 {v.city}
                </div>

                {/* Stats */}
                <div className="flex gap-4">
                  <div>
                    <div className="flex items-center gap-[0.3rem]">
                      <StarRating value={v.rating} />
                      <span className="text-[0.72rem] font-semibold" style={{ color: v.accent }}>
                        {v.rating}
                      </span>
                    </div>
                    <div className="text-[0.62rem] text-[var(--tt-muted)]">
                      {v.reviews} reviews
                    </div>
                  </div>
                  <div>
                    <div className="font-['Syne',sans-serif] font-bold text-[0.9rem] text-[var(--tt-flame)]">
                      {v.activeDeals}
                    </div>
                    <div className="text-[0.62rem] text-[var(--tt-muted)]">active deals</div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
