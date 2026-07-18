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
  const [orderStats, setOrderStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchStats() {
      // Products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

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

    async function fetchOrderStats() {
      try {
        const res = await fetch('/api/orders?intent=seller_stats');
        if (!res.ok) return;
        const data = await res.json();
        setOrderStats(data.order_stats || {});
      } catch (err) {
        console.error('Failed to load seller performance stats:', err);
      }
    }

    fetchStats();
    fetchOrderStats();
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
          <Link href="/dashboard?view=add_bulk" className="tt-btn tt-btn-ghost">
            Bulk Add (AI)
          </Link>
          <Link href="/dashboard?view=add_single" className="tt-btn tt-btn-primary tt-shimmer">
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

      {orderStats?.orders_qty > 0 && (
        <div className="tt-card tt-glass" style={{ padding: '2rem', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontFamily: 'Syne', marginBottom: '0.25rem' }}>Seller Performance</h2>
          <p style={{ color: 'var(--tt-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Buyers see your completion rate on every product page — accept orders promptly and follow through to keep it high.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
            <div>
              <p style={{ color: 'var(--tt-muted-2)', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Completion Rate</p>
              <p style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'Syne', color: 'var(--tt-success)' }}>
                {Math.round((orderStats.completion_rate || 0) * 100)}%
              </p>
            </div>
            <div>
              <p style={{ color: 'var(--tt-muted-2)', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Cancellation Rate</p>
              <p style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'Syne', color: 'var(--tt-danger)' }}>
                {Math.round((orderStats.vendor_cancellation_rate || 0) * 100)}%
              </p>
            </div>
            <div>
              <p style={{ color: 'var(--tt-muted-2)', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Units Ordered</p>
              <p style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'Syne', color: 'var(--tt-text)' }}>
                {orderStats.orders_qty}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="tt-card tt-glass" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontFamily: 'Syne', marginBottom: '1.5rem' }}>Recent Bookings</h2>
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--tt-muted)' }}>
          <p>No recent bookings yet. Start by posting an urgent deal!</p>
        </div>
      </div>

    </div>
  );
}
