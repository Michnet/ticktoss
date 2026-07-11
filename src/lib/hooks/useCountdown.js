'use client';

import { useState, useEffect, useRef } from 'react';
import { parseTimeRemaining, getUrgencyLevel } from '@/lib/urgency';

/**
 * Live countdown hook for a product sale end date.
 * @param {string|Date|null} saleEndDate
 * @param {{ includeMs?: boolean }} options
 * @returns {{ days, hours, minutes, seconds, cs, expired, level }}
 */
export function useCountdown(saleEndDate, { includeMs = false } = {}) {
  const [state, setState] = useState(() =>
    saleEndDate ? parseTimeRemaining(saleEndDate) : null
  );
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!saleEndDate) return;

    const tick = () => {
      setState(parseTimeRemaining(saleEndDate));
    };

    tick(); // immediate first tick
    intervalRef.current = setInterval(tick, includeMs ? 50 : 1000);

    return () => clearInterval(intervalRef.current);
  }, [saleEndDate, includeMs]);

  if (!state) return { days: 0, hours: 0, minutes: 0, seconds: 0, cs: 0, expired: true, level: 'expired' };

  return {
    ...state,
    level: saleEndDate ? getUrgencyLevel(saleEndDate) : 'expired',
  };
}
