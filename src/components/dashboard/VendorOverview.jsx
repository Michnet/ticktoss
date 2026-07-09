'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import useAppStore from '@/store/useAppStore';
import { Package, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { formatUGX } from '@/lib/currency';

export default function VendorOverview() {
  const { user } = useAppStore();
  const supabase = getSupabaseBrowserClient();
  
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeOrders: 0,
    totalSales: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        // Fetch products count
        const { count: productsCount, error: productsError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        if (productsError) throw productsError;

        // Fetch vendor orders
        const { data: orders, error: ordersError } = await supabase
          .from('product_orders')
          .select('total_amount, status')
          .eq('vendor_id', user.id);

        if (ordersError) throw ordersError;

        const activeOrdersCount = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
        const salesTotal = orders.filter(o => o.status === 'completed').reduce((sum, order) => sum + Number(order.total_amount), 0);

        setStats({
          totalProducts: productsCount || 0,
          activeOrders: activeOrdersCount,
          totalSales: salesTotal,
        });

      } catch (error) {
        console.error('Error fetching vendor stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user, supabase]);

  if (isLoading) {
    return (
      <div className="tt-card" style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
        <p style={{ color: 'var(--tt-muted)' }}>Loading stats...</p>
      </div>
    );
  }

  return (
    <div className="tt-card tt-glass" style={{ padding: '2rem', border: '1px solid var(--tt-flame)' }}>
      <h2 className="tt-section-title" style={{ color: 'var(--tt-flame)', marginBottom: '0.5rem' }}>Store Overview</h2>
      <p style={{ color: 'var(--tt-muted)', marginBottom: '2rem' }}>Analytics and summary for your TickToss store.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
        
        {/* Total Sales */}
        <div style={{ background: 'var(--tt-surface-2)', padding: '1.5rem', borderRadius: 'var(--tt-radius-lg)', display: 'flex', alignItems: 'center', gap: '1.5rem', border: '1px solid var(--tt-border)' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255, 77, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={24} color="var(--tt-flame)" />
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--tt-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Sales</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--tt-text)' }}>{formatUGX(stats.totalSales)}</p>
          </div>
        </div>

        {/* Active Orders */}
        <div style={{ background: 'var(--tt-surface-2)', padding: '1.5rem', borderRadius: 'var(--tt-radius-lg)', display: 'flex', alignItems: 'center', gap: '1.5rem', border: '1px solid var(--tt-border)' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={24} color="#3b82f6" />
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--tt-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Orders</p>
            <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--tt-text)' }}>{stats.activeOrders}</p>
          </div>
        </div>

        {/* Total Products */}
        <div style={{ background: 'var(--tt-surface-2)', padding: '1.5rem', borderRadius: 'var(--tt-radius-lg)', display: 'flex', alignItems: 'center', gap: '1.5rem', border: '1px solid var(--tt-border)' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={24} color="#22c55e" />
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--tt-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Products</p>
            <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--tt-text)' }}>{stats.totalProducts}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
