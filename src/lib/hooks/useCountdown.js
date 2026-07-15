'use client';

import { useState, useEffect, useRef } from 'react';
import { parseTimeRemaining, getUrgencyLevel } from '@/lib/urgency';

/**
 * Live countdown hook for a product sale end date.
 * @param {string|Date|null} saleEndDate
 * @param {{ includeMs?: boolean, active?: boolean }} options - `active` gates the ticking
 *   interval (e.g. pause it while the clock is scrolled off-screen) without discarding state.
 * @returns {{ days, hours, minutes, seconds, cs, expired, level }}
 */
export function useCountdown(saleEndDate, { includeMs = false, active = true } = {}) {
  const [state, setState] = useState(() =>
    saleEndDate ? parseTimeRemaining(saleEndDate) : null
  );
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!saleEndDate || !active) return;

    const computeAndSet = () => {
      const next = parseTimeRemaining(saleEndDate);
      setState(next);
      return next;
    };

    const first = computeAndSet(); // immediate first tick
    // don't even start an interval if it's already expired (e.g. a stale listing on mount)
    if (!first.expired) {
      intervalRef.current = setInterval(() => {
        // once expired it stays expired for this saleEndDate — stop ticking for good
        if (computeAndSet().expired) clearInterval(intervalRef.current);
      }, includeMs ? 50 : 1000);
    }

    return () => clearInterval(intervalRef.current);
  }, [saleEndDate, includeMs, active]);

  if (!state) return { days: 0, hours: 0, minutes: 0, seconds: 0, cs: 0, expired: true, level: 'expired' };

  return {
    ...state,
    level: saleEndDate ? getUrgencyLevel(saleEndDate) : 'expired',
  };
}
