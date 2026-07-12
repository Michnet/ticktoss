'use client';

import { useState, useEffect, useCallback } from 'react';
import useAppStore from '@/store/useAppStore';

/**
 * Hook to manage a user's watch state for a single product.
 *
 * @param {number} productId - The product's database ID
 * @param {string} saleDate  - The product's sale_start_date as 'YYYY-MM-DD'
 * @returns {{ isWatching: boolean, watchers: number, toggleWatch: Function, loading: boolean }}
 */
export function useWatchlist(productId, saleDate, initialWatchers = 0) {
  const user = useAppStore((s) => s.user);
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);
  const setAuthModalOpen = useAppStore((s) => s.setAuthModalOpen);

  const isWatching = profile?.watched_products?.includes(productId) ?? false;
  const [watchers, setWatchers] = useState(initialWatchers);
  const [loading, setLoading] = useState(false);

  // Sync state if initialWatchers changes
  useEffect(() => {
    setWatchers(initialWatchers);
  }, [initialWatchers]);

  const toggleWatch = useCallback(async () => {
    // Guest: open login modal
    if (!user?.id) {
      setAuthModalOpen(true);
      return;
    }

    if (!saleDate) {
      console.warn('useWatchlist: saleDate is required to watch a product');
      return;
    }

    const wasWatching = profile?.watched_products?.includes(productId) ?? false;
    const currentWatched = profile?.watched_products ?? [];
    
    // Optimistic update
    const newWatched = wasWatching
      ? currentWatched.filter(id => id !== productId)
      : [...currentWatched, productId];
      
    if (profile) {
      setProfile({ ...profile, watched_products: newWatched });
    }
    setWatchers((c) => Math.max(0, wasWatching ? c - 1 : c + 1));
    setLoading(true);

    try {
      const method = wasWatching ? 'DELETE' : 'POST';
      const res = await fetch('/api/watchlist', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, sale_date: saleDate }),
      });

      if (!res.ok) throw new Error('Request failed');

      const json = await res.json();
      // Sync with server truth for watchers count
      if (json.watchers !== undefined) {
        setWatchers(json.watchers);
      }
    } catch (err) {
      // Revert on failure
      console.error('toggleWatch error:', err);
      if (profile) {
        setProfile({ ...profile, watched_products: currentWatched });
      }
      setWatchers((c) => Math.max(0, wasWatching ? c + 1 : c - 1));
    } finally {
      setLoading(false);
    }
  }, [user?.id, profile, productId, saleDate, setAuthModalOpen, setProfile]);

  return { isWatching, watchers, toggleWatch, loading };
}
