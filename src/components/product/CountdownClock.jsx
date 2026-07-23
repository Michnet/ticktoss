'use client';

import { useEffect, useRef, useState } from 'react';
import { useCountdown } from '@/lib/hooks/useCountdown';

const LEVEL_COLORS = {
  low:      'var(--tt-success)',
  medium:   'var(--tt-gold)',
  high:     'var(--tt-flame-2)',
  critical: 'var(--tt-danger)',
  expired:  'var(--tt-muted)',
};

function Digit({ value, pad = 2 }) {
  const str = String(value).padStart(pad, '0');
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
 * @param {{ saleEndDate: string|Date, size?: 'sm'|'md'|'lg', showAllUnits?: boolean }} props
 */
export default function CountdownClock({counterLabel=null, digitalClass='', includeMilliSeconds = false, saleEndDate, showAllUnits = false, labelClass='', size = 'md',  startDate = false, saleStartDate }) {
  const containerRef = useRef(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsActive(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsActive(entry.isIntersecting),
      { rootMargin: '200px' },
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  const { days, hours, minutes, seconds, cs, expired, level } = useCountdown(
    startDate ? saleStartDate : saleEndDate,
    { includeMs: includeMilliSeconds, active: isActive },
  );

  const sizes = {
    sm: { fontSize: '0.8rem',  gap: '2px' },
    md: { fontSize: '1rem',    gap: '3px' },
    lg: { fontSize: '1.4rem',  gap: '4px' },
  };

  const { fontSize, gap } = sizes[size] ?? sizes.md;
  const color = LEVEL_COLORS[level] ?? LEVEL_COLORS.low;

  // Largest-first pool of units this clock can render.
  const unitPool = includeMilliSeconds
    ? ['days', 'hours', 'minutes', 'seconds', 'cs']
    : ['days', 'hours', 'minutes', 'seconds'];

  let visibleUnits;
  if (showAllUnits) {
    visibleUnits = unitPool;
  } else {
    // Cap at 3 units, starting from the largest non-zero unit and cascading down.
    const startIndex = days > 0 ? 0 : hours > 0 ? 1 : 2;
    visibleUnits = unitPool.slice(startIndex, startIndex + 3);
  }

  const unitValues = { days, hours, minutes, seconds, cs };

  if (expired) {
    return (
      <span
        ref={containerRef}
        style={{ fontSize, color: 'var(--tt-muted)', fontFamily: 'Syne, monospace', fontWeight: 700 }}
      >
        ENDED
      </span>
    );
  }

  return (
    <div
      ref={containerRef}
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
      {counterLabel && <span className={`leading-tight text-[var(--tt-text)] ${labelClass}`}>{counterLabel}</span>}
      {visibleUnits.map((unit, i) => {
        const prevUnit = visibleUnits[i - 1];
        const needsSeparator = i > 0 && prevUnit !== 'days';

        return (
          <span key={unit} className={digitalClass} style={{ display: 'inline-flex', alignItems: 'center', gap }}>
            {needsSeparator && (
              <span style={{ color: `${color}88`, fontSize: '0.85em', marginBottom: '2px' }}>
                {unit === 'cs' ? '.' : ':'}
              </span>
            )}
            <Digit value={unitValues[unit]} />
            {unit === 'days' && (
              <span style={{ color: `${color}88`, fontSize: '0.75em' }}>d</span>
            )}
          </span>
        );
      })}
    </div>
  );
}
