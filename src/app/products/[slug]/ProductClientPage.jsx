'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useProduct } from '@/lib/hooks/useProducts';
import { useCreateBooking } from '@/lib/hooks/useBookings';
import { useCountdown } from '@/lib/hooks/useCountdown';
import { formatUGX } from '@/lib/currency';
import useAppStore from '@/store/useAppStore';

import CountdownClock from '@/components/product/CountdownClock';
import DiscountBadge from '@/components/product/DiscountBadge';
import UrgencyBar from '@/components/product/UrgencyBar';
import BookingModal from '@/components/booking/BookingModal';
import { resizedImage } from '@/helpers/universal';
import Link from 'next/link';

import { ProductProvider, useProductContext } from '@/components/product/ProductProvider';
import ProductCard from '@/components/product/ProductCard';
import { useProducts } from '@/lib/hooks/useProducts';
import ProductActions from '@/components/product/ProductActions';

export default function ProductClientPage({ slug }) {
  const { data: product, isLoading, error } = useProduct(slug);

  if (isLoading) {
    return (
      <div className="tt-container tt-container-padding" style={{ padding: '4rem 1.5rem' }}>
        <div className="tt-skeleton" style={{ height: '60vh', borderRadius: 'var(--tt-radius-xl)' }} />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="tt-container tt-container-padding" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--tt-danger)' }}>Product not found</h2>
        <p style={{ color: 'var(--tt-muted)', marginTop: '1rem' }}>
          {error?.message || 'The listing may have been removed or expired.'}
        </p>
      </div>
    );
  }

  return (
    <ProductProvider product={product}>
      <SingleProductView />
    </ProductProvider>
  );
}

function SingleProductView() {
  const { 
    product, 
    variationAttributes, 
    metaAttributes, 
    selectedOptions, 
    selectedVariation, 
    updateOption 
  } = useProductContext();
  
  const { user } = useAppStore();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Derived state based on selectedVariation if applicable
  const newPrice = selectedVariation?.price || product.sale_price || product.price;
  const oldPrice = selectedVariation ? (selectedVariation.price < product.price ? product.price : null) : (product.sale_price ? product.price : null);
  const currentStock = selectedVariation ? selectedVariation.stock_quantity : product.stock;
  const currentSku = selectedVariation ? selectedVariation.sku : product.sku;

  const { expired } = useCountdown(product?.sale_end_date);
  const isOutOfStock = currentStock !== null && currentStock <= 0;
  const canBook = !expired && !isOutOfStock;

  const imageUrl = product.featured_image?.url ?? product.featured_image?.src ?? null;
  const gallery = product.gallery || (imageUrl ? [{ url: imageUrl }] : []);
  // Use variation image if available, else gallery image
  const activeImageUrl = selectedVariation?.featured_image?.url || gallery[activeImageIndex]?.url || imageUrl;

  return (
    <div className="p-2 sm:p-4">
      
      {/* Back nav & Breadcrumbs */}
      {/* <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <button onClick={() => window.history.back()} className="tt-btn tt-btn-ghost" style={{ padding: '0.4rem 0.8rem' }}>
          ← Back
        </button>
      </div> */}

      <div className='gap-2 sm:gap-4' style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))'}}>
        
        {/* Left: Images */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div 
            style={{ 
              position: 'relative', 
              aspectRatio: '1/1', 
              overflow: 'hidden',
              background: 'var(--tt-surface-2)',
              border: '1px solid var(--tt-border)'
            }}
          >
            {activeImageUrl ? (
              <img 
                src={resizedImage(activeImageUrl, "large")} 
                alt={product.name} 
                fill="true"
                priority="true"
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
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
          
          {/* Thumbnails */}
          {gallery.length > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {gallery.map((img, idx) => (
                <div 
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  style={{ 
                    width: '70px', 
                    height: '70px', 
                    borderRadius: 'var(--tt-radius-sm)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: activeImageIndex === idx ? '2px solid var(--tt-flame)' : '1px solid var(--tt-border)',
                    opacity: activeImageIndex === idx ? 1 : 0.6,
                    flexShrink: 0
                  }}
                >
                  <img 
                    src={resizedImage(img.url, "thumbnail")} 
                    alt="Thumbnail" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Details & Panels */}
        <div className="gap-2 sm:gap-4" style={{ display: 'flex', flexDirection: 'column' }}>
          
          {/* Vendor Panel */}
          {product.profiles && (
            <div className="bg-[var(--tt-theme)] border border-[var(--tt-surface)]" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--tt-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {product.profiles.avatar_url ? (
                    <img src={product.profiles.avatar_url} alt="Vendor" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontWeight: 'bold', color: 'var(--tt-muted)' }}>V</span>
                  )}
                </div>
                <div>
                  <p style={{ fontWeight: 700, margin: 0, color: 'var(--tt-text)' }}>{product.profiles.display_name || 'Verified Vendor'}</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--tt-success)' }}>
                    <span style={{ marginRight: '4px' }}>✓</span>Verified Vendor
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Title & Price Panel */}
          <div className="bg-[var(--tt-theme)] border border-[var(--tt-surface)]" style={{ padding: '1.5rem' }}>
            <h1 className="tt-section-title" style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', marginBottom: '0.5rem', lineHeight: 1.1 }}>
              {product.name}
            </h1>
            <p style={{ color: 'var(--tt-muted-2)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              SKU: {currentSku || 'N/A'}
            </p>
            
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem', fontWeight: 800, color: 'var(--tt-flame)' }}>
                {formatUGX(newPrice)}
              </span>
              {oldPrice && (
                <span style={{ fontSize: '1.2rem', color: 'var(--tt-muted)', textDecoration: 'line-through' }}>
                  {formatUGX(oldPrice)}
                </span>
              )}
            </div>
          </div>

          {/* Variation Selectors */}
          {variationAttributes.length > 0 && (
            <div className="bg-[var(--tt-theme)] border border-[var(--tt-surface)]" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--tt-muted)', marginBottom: '1rem' }}>
                Select Options
              </h3>
              {variationAttributes.map(attr => (
                <div key={attr.slug} style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--tt-text)' }}>
                    {attr.name}: <span style={{ color: 'var(--tt-flame)' }}>{selectedOptions[attr.slug] ? attr.values.find(v => v.slug === selectedOptions[attr.slug])?.name : 'Select...'}</span>
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {attr.values.map(val => {
                      const isSelected = selectedOptions[attr.slug] === val.slug;
                      return (
                        <button
                          key={val.slug}
                          onClick={() => updateOption(attr.slug, val.slug)}
                          style={{
                            padding: '0.4rem 1rem',
                            borderRadius: '99px',
                            border: isSelected ? '2px solid var(--tt-flame)' : '1px solid var(--tt-border)',
                            background: isSelected ? 'rgba(255, 77, 0, 0.1)' : 'var(--tt-surface-2)',
                            color: isSelected ? 'var(--tt-flame)' : 'var(--tt-text)',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {val.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              
              {/* Validation / Selection message */}
              {variationAttributes.length > 0 && !selectedVariation && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--tt-surface-2)', borderRadius: 'var(--tt-radius-sm)', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--tt-muted)' }}>
                    {Object.keys(selectedOptions).length === variationAttributes.length
                      ? "This combination is currently unavailable."
                      : "Please select all options to see availability."}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Meta Attributes Panel */}
          {metaAttributes.length > 0 && (
            <div className="bg-[var(--tt-theme)] border border-[var(--tt-surface)]" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--tt-muted)', marginBottom: '1rem' }}>
                Item Features
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {metaAttributes.map(attr => (
                  <div key={attr.slug} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--tt-border)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--tt-muted-2)' }}>{attr.name}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--tt-text)' }}>
                      {attr.values?.map(v => v.name).join(", ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action & Urgency Panel (Themed) */}
          <div className="tt-card" style={{ 
            padding: '1.5rem', 
            background: 'var(--tt-flame-light)', 
            border: '1px solid rgba(255, 77, 0, 0.2)',
            boxShadow: '0 4px 20px rgba(255, 77, 0, 0.1)'
          }}>
            <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem' }}>⚡</span>
                <p style={{ color: 'var(--tt-flame)', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  Flash Deal Ends In
                </p>
              </div>
              <CountdownClock includeMilliSeconds={true} saleEndDate={product.sale_end_date} size="lg" />
              <div style={{ marginTop: '1.5rem', background: 'rgba(255, 255, 255, 0.5)', padding: '0.75rem', borderRadius: 'var(--tt-radius-sm)' }}>
                <UrgencyBar saleEndDate={product.sale_end_date} showLabel={true} />
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px dashed rgba(255, 77, 0, 0.3)' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'var(--tt-flame)', opacity: 0.9, fontSize: '0.85rem', marginBottom: '0.2rem', fontWeight: 600 }}>Availability</p>
                <p style={{ fontWeight: 800, fontSize: '1.1rem', color: isOutOfStock ? 'var(--tt-danger)' : 'var(--tt-flame)', margin: 0 }}>
                  {isOutOfStock ? 'Sold Out' : `${currentStock} items left`}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (!user) {
                  window.location.href = `/login?redirectTo=/products/${product.slug}`;
                  return;
                }
                
                if (variationAttributes.length > 0 && !selectedVariation) {
                  alert("Please select all options before booking.");
                  return;
                }

                setIsBookingModalOpen(true);
              }}
              disabled={!canBook || (variationAttributes.length > 0 && !selectedVariation)}
              className={`tt-btn tt-btn-primary ${canBook ? 'tt-shimmer' : ''}`}
              style={{ 
                width: '100%', 
                padding: '1.2rem', 
                fontSize: '1.1rem',
                fontWeight: 800,
                opacity: (canBook && (variationAttributes.length === 0 || selectedVariation)) ? 1 : 0.6,
                cursor: (canBook && (variationAttributes.length === 0 || selectedVariation)) ? 'pointer' : 'not-allowed',
                background: isOutOfStock ? 'var(--tt-surface-2)' : 'var(--tt-gradient-flame)',
                color: isOutOfStock ? 'var(--tt-muted)' : '#fff',
                boxShadow: isOutOfStock ? 'none' : '0 8px 16px rgba(255, 77, 0, 0.25)',
                border: 'none',
                borderRadius: 'var(--tt-radius-md)'
              }}
            >
              {isOutOfStock 
                ? 'Sold Out' 
                : expired 
                  ? 'Deal Expired' 
                  : (variationAttributes.length > 0 && !selectedVariation) 
                    ? 'Select Options'
                    : 'Book Now (Pay on Delivery)'}
            </button>

          </div>

          {/* Item Overview Panel */}
          {product.short_description && (
            <div className="bg-[var(--tt-theme)] border border-[var(--tt-surface)]" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--tt-text)' }}>
                Overview
              </h3>
              <div className="breadcrumbs mb-3" style={{ fontSize: '0.85rem', color: 'var(--tt-muted)' }}>
          <Link href="/" style={{ color: 'var(--tt-muted)', textDecoration: 'none' }}>Home</Link>
          <span style={{ margin: '0 0.5rem' }}>/</span>
          <Link href="/products" style={{ color: 'var(--tt-muted)', textDecoration: 'none' }}>Products</Link>
          {product.product_categories?.name && (
             <>
               <span style={{ margin: '0 0.5rem' }}>/</span>
               <Link href={`/products?category=${product.product_categories.slug}`} style={{ color: 'var(--tt-muted)', textDecoration: 'none' }}>
                 {product.product_categories.name}
               </Link>
             </>
          )}
          <span style={{ margin: '0 0.5rem' }}>/</span>
          <span style={{ color: 'var(--tt-text)', fontWeight: 600 }}>{product.name}</span>
        </div>
              <div 
                style={{ color: 'var(--tt-muted-2)', lineHeight: 1.7, fontSize: '0.95rem' }}
                dangerouslySetInnerHTML={{ __html: product.short_description }}
              />
            </div>
          )}

          <div className="bg-[var(--tt-theme)] border border-[var(--tt-surface)]" style={{ padding: '1em 0.5rem' }}>
              <ProductActions leftExtraClass='bg-transparent' iconSize = {30} product={product} selectedVariation={selectedVariation}/>
            </div>

          {/* Item Details Panel */}
          {(product.long_description || product.short_description) && (
            <div className="bg-[var(--tt-theme)] border border-[var(--tt-surface)]" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--tt-text)' }}>
                Item Details
              </h3>
              <div 
                style={{ color: 'var(--tt-muted-2)', lineHeight: 1.7, fontSize: '0.95rem' }}
                dangerouslySetInnerHTML={{ __html: product.long_description || product.short_description || 'No specifications available.' }}
              />
            </div>
          )}

          {/* Found In Panel */}
          {(product.all_categories?.length || product.product_categories || product.tags?.length) && (
            <div className="bg-[var(--tt-theme)] border border-[var(--tt-surface)]" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--tt-muted)', marginBottom: '1rem' }}>
                Found In
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {/* All categories resolved from cat_ids */}
                {product.all_categories?.length
                  ? product.all_categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/products?category=${cat.slug}`}
                        className="tt-badge"
                        style={{ background: 'var(--tt-surface-2)', color: 'var(--tt-text)', textDecoration: 'none', padding: '0.4rem 0.8rem', borderRadius: 'var(--tt-radius-sm)' }}
                      >
                        📁 {cat.name}
                      </Link>
                    ))
                  : product.product_categories && (
                      <Link
                        href={`/products?category=${product.product_categories.slug}`}
                        className="tt-badge"
                        style={{ background: 'var(--tt-surface-2)', color: 'var(--tt-text)', textDecoration: 'none', padding: '0.4rem 0.8rem', borderRadius: 'var(--tt-radius-sm)' }}
                      >
                        📁 {product.product_categories.name}
                      </Link>
                    )}

                {/* Tags resolved from tag_ids — now full objects with id/name/slug */}
                {product.tags?.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/products?tag=${tag.slug}`}
                    className="tt-badge"
                    style={{ background: 'var(--tt-surface-2)', color: 'var(--tt-muted)', textDecoration: 'none', padding: '0.4rem 0.8rem', borderRadius: 'var(--tt-radius-sm)' }}
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
          
        </div>
      </div>

      {/* Related Products Section */}
      <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--tt-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 className="tt-section-title" style={{ margin: 0 }}>Related Products</h2>
          {product.product_categories?.slug && (
            <Link href={`/products?category=${product.product_categories.slug}`} className="tt-btn tt-btn-ghost" style={{ color: 'var(--tt-flame)' }}>
              View all
            </Link>
          )}
        </div>
        <RelatedProducts categorySlug={product.product_categories?.slug} currentSlug={product.slug} />
      </div>

      {isBookingModalOpen && (
        <BookingModal 
          product={product} 
          selectedVariation={selectedVariation}
          onClose={() => setIsBookingModalOpen(false)} 
        />
      )}
    </div>
  );
}

function RelatedProducts({ categorySlug, currentSlug }) {
  const { data: products, isLoading } = useProducts({ categorySlug, limit: 5 });
  
  if (isLoading) {
    return <div className="tt-skeleton" style={{ height: '300px', borderRadius: 'var(--tt-radius-lg)' }} />;
  }
  
  const related = products?.filter(p => p.slug !== currentSlug).slice(0, 4) || [];
  
  if (related.length === 0) {
    return (
      <div style={{ padding: '3rem', background: 'var(--tt-surface-2)', borderRadius: 'var(--tt-radius-lg)', textAlign: 'center', color: 'var(--tt-muted)' }}>
        <p style={{ margin: 0 }}>No related products found.</p>
      </div>
    );
  }

  return (
    <div className='mb-5' style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.5rem' }}>
      {related.map(p => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
