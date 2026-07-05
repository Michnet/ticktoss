'use client';

import { useState, useEffect, useRef } from 'react';
import { parseTimeRemaining, getUrgencyLevel } from '@/lib/urgency';

/**
 * Live countdown hook for a product sale end date.
 * Updates every second.
 * 
 * @param {string|Date|null} saleEndDate
 * @returns {{ days, hours, minutes, seconds, expired, level }}
 */
export function useCountdown(saleEndDate) {
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
    intervalRef.current = setInterval(tick, 1000);

    return () => clearInterval(intervalRef.current);
  }, [saleEndDate]);

  if (!state) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true, level: 'expired' };

  return {
    ...state,
    level: saleEndDate ? getUrgencyLevel(saleEndDate) : 'expired',
  };
}
