'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import useAppStore from '@/store/useAppStore';
import { Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import { formatUGX } from '@/lib/currency';
import { resizedImage } from '@/helpers/universal';

export default function MyOrders() {
  const { user } = useAppStore();
  const supabase = getSupabaseBrowserClient();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('product_orders')
          .select(`
            *,
            products:product_id(name, featured_image, slug)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [user, supabase]);

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { color: 'var(--tt-warning)', icon: <Clock size={14} />, label: 'Pending' },
      processing: { color: '#3b82f6', icon: <Package size={14} />, label: 'Processing' },
      completed: { color: 'var(--tt-success)', icon: <CheckCircle size={14} />, label: 'Completed' },
      cancelled: { color: 'var(--tt-danger)', icon: <XCircle size={14} />, label: 'Cancelled' }
    };
    const s = statusMap[status] || statusMap.pending;
    return (
      <span style={{ 
        display: 'inline-flex', alignItems: 'center', gap: '0.25rem', 
        fontSize: '0.8rem', fontWeight: 600, padding: '0.2rem 0.6rem', 
        borderRadius: '99px', background: `color-mix(in srgb, ${s.color} 15%, transparent)`, 
        color: s.color 
      }}>
        {s.icon} {s.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="tt-card" style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
        <p style={{ color: 'var(--tt-muted)' }}>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="tt-card tt-glass" style={{ padding: '2rem' }}>
      <h2 className="tt-section-title" style={{ marginBottom: '0.5rem' }}>My Orders</h2>
      <p style={{ color: 'var(--tt-muted)', marginBottom: '2rem' }}>
        View your booking history and active orders.
      </p>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--tt-surface-2)', borderRadius: 'var(--tt-radius-lg)' }}>
          <Package size={48} color="var(--tt-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>No orders found</h3>
          <p style={{ color: 'var(--tt-muted)' }}>You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map((order) => {
            let orderItems = [];
            try {
              if (order.items) {
                orderItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
              }
            } catch (e) {
              console.error('Failed to parse order items', e);
            }
            
            // Fallback for legacy orders
            if (orderItems.length === 0 && order.products) {
                orderItems = [{
                    name: order.products.name,
                    image: order.products.featured_image?.url || order.products.featured_image?.src,
                    quantity: order.quantity || 1,
                    price: null
                }];
            }

            return (
              <div key={order.id} style={{ 
                border: '1px solid var(--tt-border)', 
                borderRadius: 'var(--tt-radius-lg)', 
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                background: 'var(--tt-surface)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--tt-muted)', marginBottom: '0.2rem' }}>Order #{order.id.split('-')[0].toUpperCase()}</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                <div style={{ height: '1px', background: 'var(--tt-border)' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {orderItems.map((item, idx) => {
                    const productImg = item.image ? (item.image.startsWith('http') ? item.image : resizedImage(item.image, 'thumbnail')) : null;

                    return (
                      <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {productImg ? (
                          <div style={{ width: '60px', height: '60px', borderRadius: 'var(--tt-radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
                            <img src={productImg} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ) : (
                          <div style={{ width: '60px', height: '60px', borderRadius: 'var(--tt-radius-sm)', background: 'var(--tt-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Package size={24} color="var(--tt-muted)" />
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 600, color: 'var(--tt-text)' }}>{item.name || 'Unknown Product'}</p>
                          <p style={{ fontSize: '0.85rem', color: 'var(--tt-muted)' }}>
                            Qty: {item.quantity} {item.price ? `× ${formatUGX(item.price)}` : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ height: '1px', background: 'var(--tt-border)', marginTop: '0.5rem' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--tt-muted)' }}>via {order.payment_method?.replace(/_/g, ' ')}</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--tt-flame)' }}>{formatUGX(order.total_amount)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
