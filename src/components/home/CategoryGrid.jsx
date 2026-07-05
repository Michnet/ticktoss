'use client';

import Link from 'next/link';
import { useTopCategories } from '@/hooks/useHomeData';
import { getCategoryColor, getGlowColor } from '@/lib/colors';

// Map database slugs to our aesthetic design system
const CATEGORY_STYLES = {
  electronics: {
    icon: '📱',
    gradient: 'var(--tt-surface-2)',
    accent: '#4C8BFF',
    glow: 'rgba(76,139,255,0.25)',
  },
  fashion: {
    icon: '👗',
    gradient: 'var(--tt-surface-2)',
    accent: '#FF6B9D',
    glow: 'rgba(255,107,157,0.25)',
  },
  'home-living': {
    icon: '🛋️',
    gradient: 'var(--tt-surface-2)',
    accent: '#00E87A',
    glow: 'rgba(0,232,122,0.2)',
  },
  vehicles: {
    icon: '🚗',
    gradient: 'var(--tt-surface-2)',
    accent: '#FFB800',
    glow: 'rgba(255,184,0,0.25)',
  },
  sports: {
    icon: '⚽',
    gradient: 'var(--tt-surface-2)',
    accent: '#9B6BFF',
    glow: 'rgba(155,107,255,0.2)',
  },
  'food-drinks': {
    icon: '🍱',
    gradient: 'var(--tt-surface-2)',
    accent: '#FF4D00',
    glow: 'rgba(255,77,0,0.2)',
  },
  'health-beauty': {
    icon: '💊',
    gradient: 'var(--tt-surface-2)',
    accent: '#00D4C8',
    glow: 'rgba(0,212,200,0.2)',
  },
  agriculture: {
    icon: '🌿',
    gradient: 'var(--tt-surface-2)',
    accent: '#7BC400',
    glow: 'rgba(123,196,0,0.2)',
  },
  // Default fallback for any unmapped category
  default: {
    icon: '🏷️',
    gradient: 'var(--tt-surface-2)',
    accent: 'var(--tt-gold)',
    glow: 'rgba(255,184,0,0.2)',
  }
};

export default function CategoryGrid() {
  const { data: categories, isLoading, error } = useTopCategories();

  // Show a simple skeleton loader if loading
  if (isLoading) {
    return (
      <section className="pb-12">
        <div className="tt-container">
          <div className="tt-shimmer h-[30px] w-[200px] bg-[var(--tt-surface)] rounded-[4px] mb-5" />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(145px,1fr))] gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="tt-shimmer h-[140px] bg-[var(--tt-surface)] rounded-[var(--tt-radius-lg)]" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !categories) return null;

  return (
    <section className="pb-12">
      <div className="tt-container">
        {/* Header */}
        <div className="flex items-end justify-between mb-5 gap-4 flex-wrap">
          <div>
            <h2 className="font-['Syne',sans-serif] font-extrabold text-[clamp(1.3rem,2.5vw,1.85rem)]">
              Browse by{' '}
              <span className="bg-[image:var(--tt-gradient-flame)] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
                Category
              </span>
            </h2>
            <p className="text-[var(--tt-muted)] text-[0.875rem] mt-1">
              Every category has live countdown deals
            </p>
          </div>
          <Link
            href="/categories"
            className="tt-btn tt-btn-ghost text-[0.82rem] px-4 py-[0.45rem]"
          >
            All Categories →
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(105px,1fr))] gap-3">
          {categories.map((cat) => {
            const style = CATEGORY_STYLES[cat.slug] || CATEGORY_STYLES.default;
            const accentColor = getCategoryColor(cat.name, cat.color);
            const glowColor = getGlowColor(accentColor, 0.25);
            
            return (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="rounded-[var(--tt-radius-lg)] p-2 no-underline flex flex-col items-center gap-2 text-center transition-all duration-200 relative overflow-hidden"
                style={{
                  background: style.gradient,
                  borderColor: 'var(--tt-border)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                  e.currentTarget.style.boxShadow = `0 12px 32px ${glowColor}`;
                  e.currentTarget.style.borderColor = glowColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'var(--tt-border)';
                }}
              >
                {/* icon */}
                <span className="text-[2rem]">{cat.icon || style.icon}</span>
                <div>
                  <div
                    className="font-bold mb-[0.15rem] leading-tight line-clamp-2 font-['Syne',sans-serif] text-sm"
                    style={{ color: accentColor }}
                  >
                    {cat.name}
                  </div>
                  <div className="text-[0.68rem] text-white/45">
                    {cat.count}+ deals
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
