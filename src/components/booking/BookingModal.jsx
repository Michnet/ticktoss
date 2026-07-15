'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreateBooking } from '@/lib/hooks/useBookings';
import { formatUGX } from '@/lib/currency';
import useAppStore from '@/store/useAppStore';
import Image from 'next/image';

export default function BookingModal({ product, selectedVariation, onClose }) {
  const { profile, addToast } = useAppStore();
  const { mutate: createBooking, isPending } = useCreateBooking();

  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState('');

  // For MVP, if they don't have addresses saved, we just take a raw string input
  const savedAddresses = profile?.shopping_addresses ?? [];
  const hasSavedAddresses = savedAddresses.length > 0;

  const [selectedAddressIndex, setSelectedAddressIndex] = useState(hasSavedAddresses ? 0 : -1);

  const isFutureSale = product?.sale_start_date && new Date(product.sale_start_date) > new Date();
  const unitPrice = selectedVariation?.sale_price || selectedVariation?.price || product.sale_price;
  const maxQuantity = selectedVariation?.stock_quantity ?? product.stock;
  const total = unitPrice * quantity;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isFutureSale) {
      addToast({ type: 'error', message: 'This item is not yet available for purchase.' });
      return;
    }

    let finalAddress = null;
    if (selectedAddressIndex >= 0 && hasSavedAddresses) {
      finalAddress = savedAddresses[selectedAddressIndex];
    } else {
      // Wrap raw string in JSON structure expected by backend
      finalAddress = {
        street: address,
        city: '',
        state: '',
        country: 'Uganda',
        raw: address
      };
    }

    createBooking({
      product_id: product.id,
      variation_id: selectedVariation?.id ?? null,
      quantity,
      shipping_address: finalAddress,
    }, {
      onSuccess: () => {
        onClose();
        // The toast is handled in the hook!
      }
    });
  };

  const imageUrl = selectedVariation?.featured_image?.url ?? product.featured_image?.url ?? product.featured_image?.src ?? null;

  return (
    <AnimatePresence>
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
          }}
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="tt-card tt-glass"
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            background: 'var(--tt-surface)',
            borderTop: '4px solid var(--tt-flame)',
          }}
        >
          <button 
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              background: 'none',
              border: 'none',
              color: 'var(--tt-muted)',
              cursor: 'pointer',
              fontSize: '1.5rem',
              lineHeight: 1,
            }}
          >
            ×
          </button>

          <h2 className="tt-section-title" style={{ fontSize: '1.6rem', marginBottom: '1.5rem' }}>
            Confirm <span>Booking</span>
          </h2>

          {/* Product Snapshot */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', padding: '1rem', background: 'var(--tt-surface-2)', borderRadius: 'var(--tt-radius-md)' }}>
            {imageUrl && (
              <div style={{ width: 80, height: 80, position: 'relative', borderRadius: 'var(--tt-radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
                <Image src={imageUrl} alt={product.name} fill style={{ objectFit: 'cover' }} />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--tt-text)', marginBottom: '0.25rem' }}>{product.name}</h4>
              <p style={{ color: 'var(--tt-flame)', fontWeight: 700 }}>{formatUGX(unitPrice)} <span style={{ fontSize: '0.75rem', color: 'var(--tt-muted)', fontWeight: 400 }}>each</span></p>
              {selectedVariation?.attributes && (
                <p style={{ fontSize: '0.78rem', color: 'var(--tt-muted-2)' }}>
                  {Object.values(selectedVariation.attributes).join(', ')}
                </p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Quantity */}
            <div>
              <label className="tt-label">Quantity</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button 
                  type="button"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="tt-btn tt-btn-ghost"
                  style={{ padding: '0.5rem 1rem' }}
                >-</button>
                <span style={{ fontSize: '1.2rem', fontWeight: 700, minWidth: '2ch', textAlign: 'center' }}>{quantity}</span>
                <button 
                  type="button"
                  onClick={() => setQuantity(q => Math.min(maxQuantity, q + 1))}
                  className="tt-btn tt-btn-ghost"
                  style={{ padding: '0.5rem 1rem' }}
                >+</button>

                <span style={{ marginLeft: 'auto', color: 'var(--tt-muted)', fontSize: '0.85rem' }}>
                  Max: {maxQuantity}
                </span>
              </div>
            </div>

            {/* Delivery Address */}
            <div>
              <label className="tt-label">Delivery or Pickup Address</label>
              
              {hasSavedAddresses ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {savedAddresses.map((addr, idx) => (
                    <label key={idx} style={{ display: 'flex', gap: '0.75rem', padding: '1rem', background: 'var(--tt-surface-2)', borderRadius: 'var(--tt-radius-sm)', border: selectedAddressIndex === idx ? '1px solid var(--tt-flame)' : '1px solid var(--tt-border)', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="address" 
                        checked={selectedAddressIndex === idx} 
                        onChange={() => setSelectedAddressIndex(idx)}
                        style={{ accentColor: 'var(--tt-flame)' }}
                      />
                      <div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--tt-text)' }}>{addr.street || addr.raw}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--tt-muted)' }}>{addr.city}{addr.state ? `, ${addr.state}` : ''}</p>
                      </div>
                    </label>
                  ))}
                  <button type="button" onClick={() => setSelectedAddressIndex(-1)} style={{ background: 'none', border: 'none', color: 'var(--tt-flame)', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    + Use a different address
                  </button>
                </div>
              ) : null}

              {(!hasSavedAddresses || selectedAddressIndex === -1) && (
                <textarea
                  className="tt-input"
                  rows={3}
                  required
                  placeholder="e.g. Plot 45, Kampala Road, opposite Central Bank. Call 0772... when you arrive."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              )}
            </div>

            {/* Payment Warning */}
            <div style={{ background: 'rgba(255,184,0,0.1)', borderLeft: '3px solid var(--tt-gold)', padding: '1rem', borderRadius: '0 var(--tt-radius-sm) var(--tt-radius-sm) 0' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--tt-text)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--tt-gold)' }}>Payment:</strong> You will pay the vendor directly (Cash or Mobile Money on delivery/pickup). TickToss does not process payments online.
              </p>
            </div>

            {/* Totals & Submit */}
            <div style={{ borderTop: '1px solid var(--tt-border)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '1.1rem', color: 'var(--tt-muted-2)' }}>Total Due:</span>
                <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.6rem', fontWeight: 800, color: 'var(--tt-flame)' }}>
                  {formatUGX(total)}
                </span>
              </div>
              
              <button 
                type="submit" 
                disabled={isPending}
                className="tt-btn tt-btn-primary tt-shimmer" 
                style={{ width: '100%', padding: '1.125rem', fontSize: '1.1rem', opacity: isPending ? 0.7 : 1 }}
              >
                {isPending ? 'Processing...' : 'Confirm Booking'}
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
