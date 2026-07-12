'use client';

import { useCountdown } from '@/lib/hooks/useCountdown';

const LEVEL_CONFIG = {
  low:      { color: 'var(--tt-success)', percent: 100, label: 'Plenty of time' },
  medium:   { color: 'var(--tt-gold)',    percent: 65,  label: 'Selling fast' },
  high:     { color: 'var(--tt-flame-2)', percent: 35,  label: 'Almost gone!' },
  critical: { color: 'var(--tt-danger)',  percent: 12,  label: 'Ending soon!' },
  expired:  { color: 'var(--tt-muted)',   percent: 0,   label: 'Ended' },
};

/**
 * UrgencyCircle — circular progress indicator showing time urgency.
 * Color shifts green → gold → flame → red.
 */
export default function UrgencyCircle({ saleEndDate, showLabel = false, size = 24 }) {
  const { level } = useCountdown(saleEndDate);
  const config = LEVEL_CONFIG[level] ?? LEVEL_CONFIG.low;

  if (level === 'expired' || level === 'low') return null;

  const strokeWidth = Math.max(2, size * 0.1);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference - (config.percent / 100) * circumference;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--tt-border)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={config.color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          style={{
            transition: 'stroke-dashoffset 1s linear, stroke 0.5s',
            filter: level === 'critical' ? `drop-shadow(0 0 4px ${config.color})` : 'none',
          }}
        />
      </svg>
      {showLabel && (
        <span
          style={{
            fontSize: '0.75rem',
            color: config.color,
            fontWeight: 600,
            transition: 'color 0.5s',
          }}
        >
          {config.label}
        </span>
      )}
    </div>
  );
}
