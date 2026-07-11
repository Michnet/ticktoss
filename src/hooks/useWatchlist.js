'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import useAppStore from '@/store/useAppStore';

/**
 * Hook to manage a user's watch state for a single product.
 *
 * @param {number} productId - The product's database ID
 * @param {string} saleDate  - The product's sale_start_date as 'YYYY-MM-DD'
 * @returns {{ isWatching: boolean, watchers: number, toggleWatch: Function, loading: boolean }}
 */
export function useWatchlist(productId, saleDate) {
  const user = useAppStore((s) => s.user);
  const setAuthModalOpen = useAppStore((s) => s.setAuthModalOpen);

  const [isWatching, setIsWatching]   = useState(false);
  const [watchers,   setWatchers]     = useState(0);
  const [loading,    setLoading]      = useState(true);
  const [fetched,    setFetched]      = useState(false);

  // Fetch initial state once we have a productId
  useEffect(() => {
    if (!productId) { setLoading(false); return; }

    const supabase = getSupabaseBrowserClient();

    async function fetchStatus() {
      setLoading(true);
      // Always fetch watchers count (public); only check watching if logged in
      const { data: product } = await supabase
        .from('products')
        .select('watchers')
        .eq('id', productId)
        .single();

      setWatchers(product?.watchers ?? 0);

      if (user?.id) {
        const res = await fetch(`/api/watchlist?product_id=${productId}`);
        if (res.ok) {
          const json = await res.json();
          setIsWatching(json.watching ?? false);
        }
      }

      setLoading(false);
      setFetched(true);
    }

    fetchStatus();
  }, [productId, user?.id]);

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

    // Optimistic update
    const wasWatching = isWatching;
    setIsWatching(!wasWatching);
    setWatchers((c) => Math.max(0, wasWatching ? c - 1 : c + 1));

    try {
      const method = wasWatching ? 'DELETE' : 'POST';
      const res = await fetch('/api/watchlist', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, sale_date: saleDate }),
      });

      if (!res.ok) throw new Error('Request failed');

      const json = await res.json();
      // Sync with server truth
      setIsWatching(json.watching);
      setWatchers(json.watchers);
    } catch (err) {
      // Revert on failure
      console.error('toggleWatch error:', err);
      setIsWatching(wasWatching);
      setWatchers((c) => Math.max(0, wasWatching ? c + 1 : c - 1));
    }
  }, [user?.id, isWatching, productId, saleDate, setAuthModalOpen]);

  return { isWatching, watchers, toggleWatch, loading };
}
