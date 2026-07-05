'use client';

import { useState, use } from 'react';
import Image from 'next/image';
import { useProduct } from '@/lib/hooks/useProducts';
import { useCreateBooking } from '@/lib/hooks/useBookings';
import { useCountdown } from '@/lib/hooks/useCountdown';
import { formatUGX } from '@/lib/currency';
import useAppStore from '@/store/useAppStore';

import CountdownClock from '@/components/product/CountdownClock';
import DiscountBadge from '@/components/product/DiscountBadge';
import UrgencyBar from '@/components/product/UrgencyBar';
import BookingModal from '@/components/booking/BookingModal'; // We will create this next
import { resizedImage } from '@/helpers/universal';

export default function ProductDetailPage({ params }) {
  const { slug } = use(params);
  const { data: product, isLoading, error } = useProduct(slug);
  console.log({product, isLoading, error})
  const { user } = useAppStore();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Derived state
  const { expired } = useCountdown(product?.sale_end_date);
  const isOutOfStock = product?.stock !== null && product?.stock <= 0;
  const canBook = !expired && !isOutOfStock;

  if (isLoading) {
    return (
      <div className="tt-container" style={{ padding: '4rem 1.5rem' }}>
        <div className="tt-skeleton" style={{ height: '60vh', borderRadius: 'var(--tt-radius-xl)' }} />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="tt-container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--tt-danger)' }}>Product not found</h2>
        <p style={{ color: 'var(--tt-muted)', marginTop: '1rem' }}>
          {error?.message || 'The listing may have been removed or expired.'}
        </p>
      </div>
    );
  }

  const imageUrl = product.featured_image?.url ?? product.featured_image?.src ?? null;

  return (
    <div className="tt-container" style={{ padding: '2rem 1.5rem 6rem' }}>
      
      {/* Back nav */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button onClick={() => window.history.back()} className="tt-btn tt-btn-ghost" style={{ padding: '0.4rem 0.8rem' }}>
          ← Back
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem' }}>
        
        {/* Left: Images */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div 
            style={{ 
              position: 'relative', 
              aspectRatio: '1/1', 
              borderRadius: 'var(--tt-radius-xl)', 
              overflow: 'hidden',
              background: 'var(--tt-surface-2)',
              border: '1px solid var(--tt-border)'
            }}
          >
            {imageUrl ? (
              <img 
                src={resizedImage(imageUrl, "large")} 
                alt={product.name} 
                fill 
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: 'cover' }} 
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>
                📦
              </div>
            )}
            
            {/* Badges overlay */}
            <div style={{ position: 'absolute', top: '1rem', left: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <DiscountBadge discountPct={product.discount_pct} saleEndDate={product.sale_end_date} size="lg" />
              {product.product_categories?.name && (
                <span className="tt-badge tt-badge-success" style={{ background: 'rgba(13,13,20,0.8)', backdropFilter: 'blur(8px)' }}>
                  {product.product_categories.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Details & Booking */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div>
            <h1 className="tt-section-title" style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', marginBottom: '1rem', lineHeight: 1.1 }}>
              {product.name}
            </h1>
            
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '2.4rem', fontWeight: 800, color: 'var(--tt-flame)' }}>
                {formatUGX(product.sale_price)}
              </span>
              {product.price > product.sale_price && (
                <span style={{ fontSize: '1.2rem', color: 'var(--tt-muted)', textDecoration: 'line-through' }}>
                  {formatUGX(product.price)}
                </span>
              )}
            </div>
          </div>

          {/* Action Box */}
          <div className="tt-card tt-glass" style={{ padding: '2rem', borderTop: '4px solid var(--tt-flame)' }}>
            <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--tt-muted-2)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Deal Ends In
              </p>
              <CountdownClock saleEndDate={product.sale_end_date} size="lg" />
              <div style={{ marginTop: '1.5rem' }}>
                <UrgencyBar saleEndDate={product.sale_end_date} showLabel={true} />
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--tt-border)' }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <p style={{ color: 'var(--tt-muted)', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Availability</p>
                <p style={{ fontWeight: 700, color: isOutOfStock ? 'var(--tt-danger)' : 'var(--tt-text)' }}>
                  {isOutOfStock ? 'Sold Out' : `${product.stock} in stock`}
                </p>
              </div>
              <div style={{ width: '1px', background: 'var(--tt-border)' }} />
              <div style={{ textAlign: 'center', flex: 1 }}>
                <p style={{ color: 'var(--tt-muted)', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Vendor</p>
                <p style={{ fontWeight: 600, color: 'var(--tt-text)' }}>
                  {product.profiles?.display_name || 'Verified Vendor'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (!user) {
                  window.location.href = `/login?redirectTo=/products/${slug}`;
                  return;
                }
                setIsBookingModalOpen(true);
              }}
              disabled={!canBook}
              className={`tt-btn tt-btn-primary ${canBook ? 'tt-shimmer' : ''}`}
              style={{ 
                width: '100%', 
                padding: '1rem', 
                fontSize: '1.1rem',
                opacity: canBook ? 1 : 0.5,
                cursor: canBook ? 'pointer' : 'not-allowed',
                background: isOutOfStock ? 'var(--tt-surface-2)' : undefined,
                boxShadow: isOutOfStock ? 'none' : undefined,
                color: isOutOfStock ? 'var(--tt-muted)' : undefined,
              }}
            >
              {isOutOfStock ? 'Sold Out' : expired ? 'Deal Expired' : 'Book Now (Pay on Delivery)'}
            </button>
          </div>

          {/* Description */}
          <div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--tt-text)' }}>
              Product Details
            </h3>
            <div 
              style={{ color: 'var(--tt-muted-2)', lineHeight: 1.7, fontSize: '0.95rem' }}
              dangerouslySetInnerHTML={{ __html: product.short_description || product.long_description || 'No description provided.' }}
            />
          </div>
          
        </div>
      </div>

      {isBookingModalOpen && (
        <BookingModal 
          product={product} 
          onClose={() => setIsBookingModalOpen(false)} 
        />
      )}
    </div>
  );
}
