'use client';

import Link from 'next/link';
import { getCategoryColor, getGlowColor } from '@/lib/colors';
import { resizedImage } from '@/helpers/universal';
import { useMemo } from 'react';

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

export default function CategoryCard({ cat, CardStyle = 'default' }) {
  const style = CATEGORY_STYLES[cat.slug] || CATEGORY_STYLES.default;
  const accentColor = getCategoryColor(cat.name, cat.color);
  const glowColor = getGlowColor(accentColor, 0.25);
  const { image_icon, id, slug } = cat ?? {};
  const linkHref = useMemo(() => id ? `products?category_id=${id}` : `/categories/${slug}`)
  
  if (CardStyle === 'pills') {
    return (
      <Link
        href={linkHref}
        className="rounded-full px-4 py-2 flex items-center gap-2 text-sm font-semibold transition-all duration-200 bg-[var(--tt-surface)] border hover:bg-[var(--tt-surface-2)]"
        style={{
          borderColor: 'var(--tt-border)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = accentColor;
          e.currentTarget.style.boxShadow = `0 4px 12px ${glowColor}`;
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--tt-border)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'none';
        }}
      >
        <span className="text-lg">{cat.icon || style.icon}</span>
        <span style={{ color: accentColor }}>{cat.name}</span>
        <span className="ml-1 text-[0.65rem] text-[var(--tt-muted)] bg-[var(--tt-surface-2)] px-2 py-0.5 rounded-full">
          {cat.count}
        </span>
      </Link>
    );
  }

  if (CardStyle === 'detailed') {
    return (
      <Link
        href={linkHref}
        className="rounded-[var(--tt-radius-lg)] p-4 flex gap-4 items-start text-left transition-all duration-200 bg-[var(--tt-surface)] border border-[var(--tt-border)] group"
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = `0 12px 24px ${glowColor}`;
          e.currentTarget.style.borderColor = accentColor;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = 'var(--tt-border)';
        }}
      >
        <div 
          className="text-4xl p-2 rounded-2xl flex items-center justify-center min-w-[70px] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
          /* style={{ background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}05)` }} */
        >
          {image_icon ? <img className='w-[50px]' src={resizedImage(image_icon)} alt={cat.name}/> : style.icon}
        </div>
        <div className="flex-1 flex flex-col h-full justify-center">
          <div className="font-bold text-md mb-1 leading-tight" /* style={{ color: accentColor }} */>
            {cat.name}
          </div>
          {cat.description ? (
            <div className="text-xs text-[var(--tt-muted)] line-clamp-2 mb-3 leading-relaxed">
              {cat.description}
            </div>
          ) : (
            <div className="text-xs text-[var(--tt-muted)] mb-3">
              Explore {cat.count}+ deals in this category.
            </div>
          )}
          <div className="mt-auto">
            <span className="text-[0.7rem] font-bold text-[var(--tt-text)] bg-[var(--tt-surface-2)] px-[8px] py-[3px] rounded-full">
              {cat.count} active deals
            </span>
          </div>
        </div>
      </Link>
    );
  }
  
  return (
    <Link
      href={linkHref}
      className="rounded-[var(--tt-radius-lg)] p-1 no-underline flex flex-col items-center gap-2 text-center transition-all duration-200 relative overflow-hidden"
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
      <span className="text-[2rem]">{image_icon ? <img className='h-[35px] object-contain' src={resizedImage(image_icon)} alt={cat.name}/> : style.icon}</span>
      <div>
        <div
          className="font-bold mb-1 leading-tight line-clamp-2 font-['Syne',sans-serif] text-xs"
          /* style={{ color: accentColor }} */
        >
          {cat.name}
        </div>
        <div className="text-[0.68rem]">
          {cat.count}+ deals
        </div>
      </div>
    </Link>
  );
}
