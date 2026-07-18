'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import useAppStore from '@/store/useAppStore';
import { formatUGX } from '@/lib/currency';
import Image from 'next/image';
import OrderResolutionModal from './OrderResolutionModal';

export default function VendorOrders() {
  const { user, addToast } = useAppStore();
  const supabase = getSupabaseBrowserClient();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [resolving, setResolving] = useState(null); // { order, mode }

  useEffect(() => {
    if (!user) return;
    fetchOrders();
  }, [user]);

  async function fetchOrders() {
    setIsLoading(true);
    // Fetch orders with nested product and buyer profile info
    const { data, error } = await supabase
      .from('product_orders')
      .select(`
        *,
        product:products (name, featured_image),
        buyer:profiles!product_orders_user_id_fkey (display_name, phone, avatar)
      `)
      .eq('vendor_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      addToast({ type: 'error', message: 'Failed to load bookings' });
    } else {
      setOrders(data || []);
    }
    setIsLoading(false);
  }

  // Handles the two simple whole-order transitions: accepting a pending
  // booking, or cancelling one outright before it's ever been accepted.
  // Concluding a `processing` order (complete or cancel) goes through the
  // per-item resolution modal instead, since outcomes can be mixed.
  const handleStatusChange = async (orderId, newStatus) => {
    let cancel_reason = '';
    if (newStatus === 'cancelled') {
      const confirmCancel = window.confirm('Are you sure you want to cancel this booking? This will return the items to your stock.');
      if (!confirmCancel) return;
      cancel_reason = window.prompt('Optional: Reason for cancellation? (e.g. Out of stock)') || '';
    }

    setUpdatingId(orderId);
    try {
      const res = await fetch('/api/bookings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, new_status: newStatus, cancel_reason }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      // Optimistically update UI
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      addToast({ type: 'success', message: `Booking marked as ${newStatus}` });
    } catch (err) {
      addToast({ type: 'error', message: err.message });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleResolved = (updatedOrder) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'var(--tt-success)';
      case 'processing': return 'var(--tt-gold)';
      case 'cancelled': return 'var(--tt-danger)';
      default: return 'var(--tt-flame)'; // pending
    }
  };

  if (isLoading) {
    return <div className="tt-skeleton" style={{ height: '400px' }} />;
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="tt-section-title" style={{ fontSize: '2rem' }}>Orders & <span>Bookings</span></h1>
        <p style={{ color: 'var(--tt-muted)' }}>Manage incoming deals and coordinate pickups/deliveries.</p>
      </div>

      {orders.length === 0 ? (
        <div className="tt-card tt-glass" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📥</div>
          <h3 style={{ fontFamily: 'Syne', fontSize: '1.2rem', marginBottom: '0.5rem' }}>No bookings yet</h3>
          <p style={{ color: 'var(--tt-muted)' }}>When buyers book your deals, they will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map((order) => {
            const date = new Date(order.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
            const imageUrl = order.product?.featured_image?.url || order.product?.featured_image?.src;
            const buyerName = order.buyer?.display_name || 'Anonymous Buyer';
            const buyerPhone = order.buyer?.phone || 'No phone provided';
            const address = order.shipping_address?.raw || order.shipping_address?.street || 'No address provided';

            return (
              <div key={order.id} className="tt-card tt-glass" style={{ padding: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', borderLeft: `4px solid ${getStatusColor(order.status)}` }}>
                
                {/* Product Snapshot */}
                <div style={{ display: 'flex', gap: '1rem', flex: '1 1 300px' }}>
                  <div style={{ width: 80, height: 80, borderRadius: 'var(--tt-radius-sm)', background: 'var(--tt-surface-2)', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                    {imageUrl ? (
                      <Image src={imageUrl} alt="Product" fill style={{ objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>📦</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--tt-muted)', marginBottom: '0.2rem' }}>{date}</p>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--tt-text)' }}>{order.product?.name || 'Unknown Product'}</h3>
                    <p style={{ color: 'var(--tt-gold)', fontWeight: 700, marginTop: '0.25rem' }}>
                      {order.quantity} × {formatUGX(order.unit_price)} <span style={{ color: 'var(--tt-muted)', fontSize: '0.8rem', fontWeight: 400 }}>({formatUGX(order.total_amount)} total)</span>
                    </p>
                  </div>
                </div>

                {/* Buyer Info */}
                <div style={{ flex: '1 1 250px', background: 'var(--tt-surface-2)', padding: '1rem', borderRadius: 'var(--tt-radius-sm)' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--tt-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Buyer Details</p>
                  <p style={{ fontWeight: 600, color: 'var(--tt-text)', marginBottom: '0.2rem' }}>{buyerName}</p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--tt-text)', marginBottom: '0.5rem' }}>📞 {buyerPhone}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--tt-muted)', lineHeight: 1.4 }}>📍 {address}</p>
                </div>

                {/* Actions */}
                <div style={{ flex: '0 0 160px', display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center' }}>
                  
                  <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                    <span className="tt-badge" style={{ background: `color-mix(in srgb, ${getStatusColor(order.status)} 15%, transparent)`, color: getStatusColor(order.status), border: `1px solid color-mix(in srgb, ${getStatusColor(order.status)} 30%, transparent)` }}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>

                  {order.status === 'pending' && (
                    <button 
                      disabled={updatingId === order.id}
                      onClick={() => handleStatusChange(order.id, 'processing')}
                      className="tt-btn tt-btn-gold tt-shimmer"
                      style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                    >
                      Accept Booking
                    </button>
                  )}
                  
                  {order.status === 'processing' && (
                    <button
                      disabled={updatingId === order.id}
                      onClick={() => setResolving({ order, mode: 'complete' })}
                      className="tt-btn"
                      style={{ padding: '0.5rem', fontSize: '0.85rem', background: 'var(--tt-success)', color: '#000' }}
                    >
                      Mark Completed
                    </button>
                  )}

                  {order.status === 'pending' && (
                    <button
                      disabled={updatingId === order.id}
                      onClick={() => handleStatusChange(order.id, 'cancelled')}
                      className="tt-btn tt-btn-ghost"
                      style={{ padding: '0.5rem', fontSize: '0.85rem', color: 'var(--tt-danger)', borderColor: 'var(--tt-danger)' }}
                    >
                      Cancel Booking
                    </button>
                  )}

                  {order.status === 'processing' && (
                    <button
                      disabled={updatingId === order.id}
                      onClick={() => setResolving({ order, mode: 'cancel' })}
                      className="tt-btn tt-btn-ghost"
                      style={{ padding: '0.5rem', fontSize: '0.85rem', color: 'var(--tt-danger)', borderColor: 'var(--tt-danger)' }}
                    >
                      Cancel Booking
                    </button>
                  )}

                  {order.status === 'cancelled' && !order.resolution && order.cancel_reason && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--tt-danger)', textAlign: 'center', lineHeight: 1.3 }}>
                      Reason: {order.cancel_reason}
                    </p>
                  )}

                  {order.resolution?.items?.length > 0 && (
                    <div style={{ fontSize: '0.75rem', textAlign: 'center', lineHeight: 1.4 }}>
                      {order.resolution.items.map((ri, i) => (
                        <p key={i} style={{ margin: 0, color: ri.cancelled_qty > 0 ? 'var(--tt-danger)' : 'var(--tt-success)' }}>
                          {ri.completed_qty}/{ri.quantity} completed{ri.cancelled_qty > 0 && ri.cancel_reason ? ` — ${ri.cancel_reason}` : ''}
                        </p>
                      ))}
                    </div>
                  )}

                </div>

              </div>
            );
          })}
        </div>
      )}

      {resolving && (
        <OrderResolutionModal
          order={resolving.order}
          defaultMode={resolving.mode}
          onClose={() => setResolving(null)}
          onResolved={handleResolved}
        />
      )}
    </div>
  );
}
