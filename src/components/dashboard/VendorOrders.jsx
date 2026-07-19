'use client';

import { useEffect, useState } from 'react';
import useAppStore from '@/store/useAppStore';
import { formatUGX } from '@/lib/currency';
import OrderResolutionModal from './OrderResolutionModal';
import { resizedImage } from '@/helpers/universal';

export default function VendorOrders() {
  const { user, addToast } = useAppStore();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [resolving, setResolving] = useState(null); // { order, mode }

  useEffect(() => {
    if (!user) return;
    fetchOrders();
  }, [user]);

  // Goes through the server (service role) rather than a direct client
  // query — the buyer profile join (phone/display_name) is blocked by
  // RLS for anyone but the buyer themselves when queried from the browser.
  async function fetchOrders() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/vendors?intent=vendor_orders');
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to load bookings');
      setOrders(result.orders || []);
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: 'Failed to load bookings' });
    } finally {
      setIsLoading(false);
    }
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
            const items = Array.isArray(order.items) && order.items.length ? order.items : [];
            const contact = order.shipping_address || order.billing_address || {};
            const buyerName = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Anonymous Buyer';
            const buyerPhone = contact.phone || 'No phone provided';
            const address = contact.address
              ? [contact.address, contact.city, contact.zipCode].filter(Boolean).join(', ')
              : 'No address provided';

            return (
              <div key={order.id} className="tt-card tt-glass" style={{ padding: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', borderLeft: `4px solid ${getStatusColor(order.status)}` }}>

                {/* Product Snapshot — one row per item in the order */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: '1 1 300px' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--tt-muted)' }}>{date}</p>
                  {items.map((item, idx) => {
                    const itemImg = resizedImage(item.image, 'thumbnail');
                    return (
                      <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ width: 60, height: 60, borderRadius: 'var(--tt-radius-sm)', background: 'var(--tt-surface-2)', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                          {itemImg ? (
                            <img src={itemImg} alt={item.name || 'Product'} fill style={{ objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📦</div>
                          )}
                        </div>
                        <div>
                          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--tt-text)' }}>{item.name || 'Unknown Product'}</h3>
                          <p className='opacity-50' style={{fontWeight: 700, fontSize: '0.85rem' }}>
                            {item.quantity} × {formatUGX(item.price)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <p style={{ fontSize: '0.9rem', fontWeight: 800, marginTop: '0.25rem' }}>
                    Total: {formatUGX(order.total_amount)}
                  </p>
                </div>

                {/* Buyer Info */}
                <div style={{ flex: '1 1 250px', background: 'var(--tt-surface-2)', padding: '1rem', borderRadius: 'var(--tt-radius-sm)' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--tt-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Buyer Details</p>
                  <p style={{ fontWeight: 600, color: 'var(--tt-text)', marginBottom: '0.2rem' }}>{buyerName}</p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--tt-text)', marginBottom: '0.5rem' }}>📞 {buyerPhone}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--tt-muted)', lineHeight: 1.4, marginBottom: contact.phone ? '0.75rem' : 0 }}>📍 {address}</p>
                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone}`}
                      className="tt-btn tt-btn-gold"
                      style={{ display: 'inline-block', padding: '0.4rem 0.75rem', fontSize: '0.8rem', textDecoration: 'none' }}
                    >
                      📞 Call Customer
                    </a>
                  )}
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
                      Start Processing
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
