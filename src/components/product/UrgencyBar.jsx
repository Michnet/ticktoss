'use client';

import { useCountdown } from '@/lib/hooks/useCountdown';

const LEVEL_CONFIG = {
  low:      { color: 'var(--tt-success)', width: '100%', label: 'Plenty of time' },
  medium:   { color: 'var(--tt-gold)',    width: '65%',  label: 'Selling fast' },
  high:     { color: 'var(--tt-flame-2)', width: '35%',  label: 'Almost gone!' },
  critical: { color: 'var(--tt-danger)',  width: '12%',  label: 'Ending soon!' },
  expired:  { color: 'var(--tt-muted)',   width: '0%',   label: 'Ended' },
};

/**
 * UrgencyBar — thin horizontal progress bar showing time urgency.
 * Color shifts green → gold → flame → red.
 */
export default function UrgencyBar({ saleEndDate, showLabel = false }) {
  const { level } = useCountdown(saleEndDate);
  const config = LEVEL_CONFIG[level] ?? LEVEL_CONFIG.low;

  if (level === 'expired') return null;

  return (
    <div>
      {showLabel && (
        <p
          style={{
            fontSize: '0.7rem',
            color: config.color,
            marginBottom: '4px',
            fontWeight: 600,
            transition: 'color 0.5s',
          }}
        >
          {config.label}
        </p>
      )}
      {/* Track */}
      <div
        style={{
          height: '3px',
          background: 'var(--tt-border)',
          borderRadius: '99px',
          overflow: 'hidden',
        }}
      >
        {/* Fill */}
        <div
          data-level={level}
          className="tt-urgency-bar"
          style={{
            height: '100%',
            width: config.width,
            background: config.color,
            borderRadius: '99px',
            transition: 'width 1s linear, background 0.5s',
            boxShadow: level === 'critical' ? `0 0 8px ${config.color}` : 'none',
          }}
        />
      </div>
    </div>
  );
}
