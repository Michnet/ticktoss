'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import useAppStore from '@/store/useAppStore';
import { formatUGX } from '@/lib/currency';
import Link from 'next/link';

export default function VendorDashboardPage() {
  const { user } = useAppStore();
  const supabase = getSupabaseBrowserClient();
  const [stats, setStats] = useState({ activeListings: 0, totalOrders: 0, revenue: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchStats() {
      // Products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', user.id);

      // Orders revenue
      const { data: orders } = await supabase
        .from('product_orders')
        .select('total_amount')
        .eq('vendor_id', user.id)
        .neq('status', 'cancelled');

      const revenue = orders?.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0) || 0;

      setStats({
        activeListings: productsCount || 0,
        totalOrders: orders?.length || 0,
        revenue,
      });
      setIsLoading(false);
    }

    fetchStats();
  }, [user, supabase]);

  if (isLoading) {
    return <div className="tt-skeleton" style={{ height: '400px', width: '100%' }} />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h1 className="tt-section-title" style={{ fontSize: '2rem' }}>Overview</h1>
          <p style={{ color: 'var(--tt-muted)' }}>Here is what's happening with your deals.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/vendor/products/bulk" className="tt-btn tt-btn-ghost">
            Bulk Add (AI)
          </Link>
          <Link href="/vendor/products/new" className="tt-btn tt-btn-primary tt-shimmer">
            + Post a Deal
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        
        {/* Metric Cards */}
        <div className="tt-card tt-glass" style={{ padding: '2rem' }}>
          <p style={{ color: 'var(--tt-muted-2)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Active Deals</p>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'Syne', color: 'var(--tt-text)' }}>{stats.activeListings}</p>
        </div>

        <div className="tt-card tt-glass" style={{ padding: '2rem' }}>
          <p style={{ color: 'var(--tt-muted-2)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Bookings</p>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'Syne', color: 'var(--tt-gold)' }}>{stats.totalOrders}</p>
        </div>

        <div className="tt-card tt-glass" style={{ padding: '2rem', borderTop: '4px solid var(--tt-success)' }}>
          <p style={{ color: 'var(--tt-muted-2)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Est. Revenue</p>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'Syne', color: 'var(--tt-success)' }}>
            {formatUGX(stats.revenue)}
          </p>
        </div>
      </div>

      <div className="tt-card tt-glass" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontFamily: 'Syne', marginBottom: '1.5rem' }}>Recent Bookings</h2>
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--tt-muted)' }}>
          <p>No recent bookings yet. Start by posting an urgent deal!</p>
        </div>
      </div>

    </div>
  );
}
