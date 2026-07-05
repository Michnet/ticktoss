'use client';

import { useCountdown } from '@/lib/hooks/useCountdown';
import { formatDiscountPct } from '@/lib/currency';

/**
 * DiscountBadge — gold pulsing badge showing % off.
 * Pulses when < 2 hours remain.
 */
export default function DiscountBadge({ discountPct, saleEndDate, size = 'md' }) {
  const { level } = useCountdown(saleEndDate);
  const shouldPulse = level === 'critical' || level === 'high';

  if (!discountPct || discountPct <= 0) return null;

  const sizes = {
    sm: { fontSize: '0.65rem', padding: '0.15rem 0.45rem' },
    md: { fontSize: '0.75rem', padding: '0.2rem 0.6rem' },
    lg: { fontSize: '0.875rem', padding: '0.25rem 0.75rem' },
  };
  const { fontSize, padding } = sizes[size] ?? sizes.md;

  return (
    <span
      className={shouldPulse ? 'tt-pulse' : ''}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize,
        fontWeight: 700,
        padding,
        borderRadius: '99px',
        background: 'rgba(255, 184, 0, 0.18)',
        color: 'var(--tt-gold)',
        border: '1px solid rgba(255, 184, 0, 0.35)',
        letterSpacing: '0.02em',
        lineHeight: 1,
        boxShadow: shouldPulse ? 'var(--tt-glow-gold)' : 'none',
        transition: 'box-shadow 0.3s',
      }}
    >
      ⚡ {formatDiscountPct(discountPct)}
    </span>
  );
}
