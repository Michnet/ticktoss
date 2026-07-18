'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus } from 'lucide-react';
import useAppStore from '@/store/useAppStore';

// Lets a vendor conclude a `processing` order by splitting each line item
// into completed vs cancelled quantities — a single order can have some
// items ship and others fall through, so this is the one place that
// outcome gets recorded (into product_orders.resolution).
export default function OrderResolutionModal({ order, defaultMode = 'complete', onClose, onResolved }) {
  const { addToast } = useAppStore();
  const items = Array.isArray(order.items) && order.items.length
    ? order.items
    : [{ product_id: order.product_id, variation_id: order.variation_id, quantity: order.quantity || 1, name: order.product?.name || order.products?.name }];

  const [completedQtys, setCompletedQtys] = useState(() => {
    const initial = {};
    items.forEach((item, idx) => {
      initial[idx] = defaultMode === 'complete' ? (item.quantity || 1) : 0;
    });
    return initial;
  });
  const [reasons, setReasons] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const setQty = (idx, qty) => {
    const max = items[idx].quantity || 1;
    setCompletedQtys((prev) => ({ ...prev, [idx]: Math.min(max, Math.max(0, qty)) }));
  };

  const setAll = (completed) => {
    const next = {};
    items.forEach((item, idx) => { next[idx] = completed ? (item.quantity || 1) : 0; });
    setCompletedQtys(next);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const resolutionItems = items.map((item, idx) => {
        const quantity = item.quantity || 1;
        const completed_qty = completedQtys[idx] ?? 0;
        const cancelled_qty = quantity - completed_qty;
        return {
          product_id: item.product_id,
          variation_id: item.variation_id ?? null,
          completed_qty,
          cancelled_qty,
          cancel_reason: cancelled_qty > 0 ? (reasons[idx] || '') : '',
        };
      });

      const res = await fetch('/api/bookings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: order.id, resolution: { items: resolutionItems } }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to resolve order');

      addToast({ type: 'success', message: 'Order resolved' });
      onResolved?.(result.order);
      onClose();
    } catch (err) {
      addToast({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="tt-card tt-glass"
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '2rem',
            background: 'var(--tt-surface)',
            borderTop: '4px solid var(--tt-flame)',
          }}
        >
          <button
            onClick={onClose}
            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--tt-muted)' }}
          >
            <X size={22} />
          </button>

          <h3 className="tt-section-title" style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>Resolve Order</h3>
          <p style={{ color: 'var(--tt-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Record how many of each item were actually fulfilled. Anything not completed is returned to your stock.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <button className="tt-btn" style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', background: 'var(--tt-success)', color: '#000' }} onClick={() => setAll(true)}>
              Complete All
            </button>
            <button className="tt-btn tt-btn-ghost" style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', color: 'var(--tt-danger)', borderColor: 'var(--tt-danger)' }} onClick={() => setAll(false)}>
              Cancel All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {items.map((item, idx) => {
              const quantity = item.quantity || 1;
              const completed = completedQtys[idx] ?? 0;
              const cancelled = quantity - completed;

              return (
                <div key={idx} style={{ background: 'var(--tt-surface-2)', padding: '1rem', borderRadius: 'var(--tt-radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <p style={{ fontWeight: 600, color: 'var(--tt-text)' }}>{item.name || 'Item'}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--tt-muted)' }}>Qty ordered: {quantity}</p>
                  </div>

                  {quantity > 1 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => setQty(idx, completed - 1)}
                        disabled={completed <= 0}
                        style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--tt-border)', background: 'var(--tt-surface)', cursor: completed <= 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{ fontWeight: 700, minWidth: '90px', textAlign: 'center' }}>
                        <span style={{ color: 'var(--tt-success)' }}>{completed} completed</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty(idx, completed + 1)}
                        disabled={completed >= quantity}
                        style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--tt-border)', background: 'var(--tt-surface)', cursor: completed >= quantity ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Plus size={14} />
                      </button>
                      {cancelled > 0 && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--tt-danger)' }}>{cancelled} cancelled</span>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setQty(idx, 1)}
                        className="tt-btn"
                        style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem', background: completed === 1 ? 'var(--tt-success)' : 'var(--tt-surface)', color: completed === 1 ? '#000' : 'var(--tt-text)', border: '1px solid var(--tt-border)' }}
                      >
                        Completed
                      </button>
                      <button
                        type="button"
                        onClick={() => setQty(idx, 0)}
                        className="tt-btn"
                        style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem', background: completed === 0 ? 'var(--tt-danger)' : 'var(--tt-surface)', color: completed === 0 ? '#fff' : 'var(--tt-text)', border: '1px solid var(--tt-border)' }}
                      >
                        Cancelled
                      </button>
                    </div>
                  )}

                  {cancelled > 0 && (
                    <input
                      type="text"
                      placeholder="Reason for cancelling (optional)"
                      value={reasons[idx] || ''}
                      onChange={(e) => setReasons((prev) => ({ ...prev, [idx]: e.target.value }))}
                      className="tt-input"
                      style={{ marginTop: '0.75rem', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="tt-btn tt-btn-primary tt-shimmer"
            style={{ width: '100%', marginTop: '1.5rem', padding: '0.75rem' }}
          >
            {submitting ? 'Submitting…' : 'Submit Resolution'}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
