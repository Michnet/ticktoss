'use client';

import Link from 'next/link';

/**
 * Section header used across home page sections.
 * @param {{ title: string, highlight?: string, subtitle?: string, cta?: { label: string, href: string }, accent?: string }} props
 */
export default function HomeSectionHeader({ title, highlight, subtitle, cta, accent = 'flame' }) {
  const accentClass =
    accent === 'gold'
      ? 'bg-[linear-gradient(135deg,#FFB800,#FF8C00)] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]'
      : 'bg-[image:var(--tt-gradient-flame)] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]';

  return (
    <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
      <div>
        <h2
          className={`font-['Syne',sans-serif] font-extrabold text-[clamp(1.3rem,2.5vw,1.85rem)] leading-[1.15] ${subtitle ? 'mb-[0.35rem]' : 'mb-0'}`}
        >
          {title}{' '}
          {highlight && <span className={accentClass}>{highlight}</span>}
        </h2>
        {subtitle && (
          <p className="text-[var(--tt-muted)] text-[0.875rem]">{subtitle}</p>
        )}
      </div>

      {cta && (
        <Link
          href={cta.href}
          className="tt-btn tt-btn-ghost text-[0.82rem] px-4 py-[0.45rem] shrink-0"
        >
          {cta.label} →
        </Link>
      )}
    </div>
  );
}
