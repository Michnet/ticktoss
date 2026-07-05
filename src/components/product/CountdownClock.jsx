'use client';

import { useCountdown } from '@/lib/hooks/useCountdown';

const LEVEL_COLORS = {
  low:      'var(--tt-success)',
  medium:   'var(--tt-gold)',
  high:     'var(--tt-flame-2)',
  critical: 'var(--tt-danger)',
  expired:  'var(--tt-muted)',
};

function Digit({ value }) {
  const str = String(value).padStart(2, '0');
  return (
    <span
      className="tt-clock"
      style={{
        display: 'inline-block',
        minWidth: '1.6ch',
        textAlign: 'center',
      }}
    >
      {str}
    </span>
  );
}

/**
 * CountdownClock — flip-digit style countdown timer.
 * @param {{ saleEndDate: string|Date, size?: 'sm'|'md'|'lg' }} props
 */
export default function CountdownClock({ saleEndDate, size = 'md' }) {
  const { days, hours, minutes, seconds, expired, level } = useCountdown(saleEndDate);

  const sizes = {
    sm: { fontSize: '0.8rem',  gap: '2px' },
    md: { fontSize: '1rem',    gap: '3px' },
    lg: { fontSize: '1.4rem',  gap: '4px' },
  };

  const { fontSize, gap } = sizes[size] ?? sizes.md;
  const color = LEVEL_COLORS[level] ?? LEVEL_COLORS.low;

  if (expired) {
    return (
      <span
        style={{ fontSize, color: 'var(--tt-muted)', fontFamily: 'Syne, monospace', fontWeight: 700 }}
      >
        ENDED
      </span>
    );
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap,
        color,
        fontSize,
        fontFamily: 'Syne, monospace',
        fontWeight: 700,
        letterSpacing: '0.04em',
        transition: 'color 0.5s',
      }}
    >
      {days > 0 && (
        <>
          <Digit value={days} />
          <span style={{ color: `${color}88`, fontSize: '0.75em' }}>d</span>
        </>
      )}
      <Digit value={hours} />
      <span style={{ color: `${color}88`, fontSize: '0.85em', marginBottom: '2px' }}>:</span>
      <Digit value={minutes} />
      <span style={{ color: `${color}88`, fontSize: '0.85em', marginBottom: '2px' }}>:</span>
      <Digit value={seconds} />
    </div>
  );
}
