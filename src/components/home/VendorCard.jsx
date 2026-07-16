'use client';

import { resizedImage } from '@/helpers/universal';
import Link from 'next/link';

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

export default function VendorCard({ vendor: v }) {
  const {image, color} = v ?? {};

  return (
    <Link href={`/products?vendor_id=${v.id}`} className="no-underline block h-full">
      <div style={{backgroundColor: color, backgroundImage: image ? `url(${resizedImage(image, 'medium')})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center'}}
        className="rounded-[var(--tt-radius-lg)] transition-all duration-200 relative overflow-hidden cursor-pointer hover:-translate-y-[3px] bg-[var(--tt-surface)] border border-[var(--tt-border)]"
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = v.accent;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--tt-border)';
        }}
      > 
      <div className='overlay p-5 bg-gradient-to-t from-black/80 via-black/20 to-transparent'>
        {/* Avatar + badge */}
        <div className="flex items-start justify-between mb-[0.875rem]">
          <div
            className="w-[48px] h-[48px] rounded-[var(--tt-radius-md)] flex items-center justify-center text-[1.1rem] font-bold border overflow-hidden"
            style={{
              background: `${v.accent}22`,
              borderColor: `${v.accent}40`,
              color: v.accent,
            }}
          >
            {v.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={v.avatar} alt={v.name} className="w-full h-full object-cover" />
            ) : (
              v.name?.[0]?.toUpperCase() ?? '🏪'
            )}
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

        {v.city && (
          <div className="text-[0.72rem] text-white/70 mb-[0.75rem]">
            📍 {v.city}
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-4">
          <div>
            <div className="flex items-center gap-[0.3rem]">
              <StarRating value={v.rating ?? 0} />
              <span className="text-[0.72rem] font-semibold" style={{ color: v.accent }}>
                {v.rating ?? 'New'}
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
      </div>
    </Link>
  );
}
