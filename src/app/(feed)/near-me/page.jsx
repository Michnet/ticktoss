'use client';

import { useState, useMemo } from 'react';
import { useGeoLocation, haversineDistance } from '@/lib/hooks/useGeoLocation';
import { useProducts } from '@/lib/hooks/useProducts';
import ProductGrid from '@/components/product/ProductGrid';

export default function NearMePage() {
  const { location, loading: geoLoading, error: geoError, permission, requestLocation } = useGeoLocation();
  const [radius, setRadius] = useState(10); // Default 10km radius
  
  // Fetch active products (we fetch all active and filter client-side for MVP)
  // In a large production environment, this would hit a Postgres RPC function.
  const { data: allProducts, isLoading: productsLoading } = useProducts();

  const filteredProducts = useMemo(() => {
    if (!location || !allProducts) return [];

    return allProducts
      .filter(p => p.pickup_lat && p.pickup_lng)
      .map(p => {
        const dist = haversineDistance(
          { lat: location.lat, lng: location.lng },
          { lat: p.pickup_lat, lng: p.pickup_lng }
        );
        return { ...p, distance: dist };
      })
      .filter(p => p.distance <= radius)
      // Sort by urgency first, then by distance
      .sort((a, b) => {
        if (b.urgency_score !== a.urgency_score) {
          return b.urgency_score - a.urgency_score;
        }
        return a.distance - b.distance;
      });
  }, [allProducts, location, radius]);

  return (
    <div className="tt-container" style={{ padding: '2rem 1.5rem', minHeight: '80vh' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 className="tt-section-title">
          Deals <span>Near Me</span>
        </h1>
        <p style={{ color: 'var(--tt-muted)', marginTop: '0.5rem', maxWidth: '600px', margin: '0.5rem auto 0' }}>
          Discover highly-discounted, urgent deals within walking or short driving distance.
        </p>
      </div>

      {!location ? (
        <div className="tt-card tt-glass" style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📍</div>
          <h2 style={{ fontFamily: 'Syne', fontSize: '1.4rem', marginBottom: '1rem' }}>We need your location</h2>
          <p style={{ color: 'var(--tt-muted-2)', marginBottom: '2rem' }}>
            To show you the best deals nearby, please allow TickToss to access your device's location.
          </p>
          
          {geoError && (
            <p style={{ color: 'var(--tt-danger)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {geoError}
            </p>
          )}

          {permission === 'denied' ? (
            <div style={{ background: 'rgba(255,184,0,0.1)', color: 'var(--tt-gold)', padding: '1rem', borderRadius: 'var(--tt-radius-sm)', fontSize: '0.9rem' }}>
              You have blocked location access. Please enable it in your browser settings and refresh the page.
            </div>
          ) : (
            <button 
              onClick={requestLocation} 
              disabled={geoLoading}
              className="tt-btn tt-btn-primary tt-shimmer"
            >
              {geoLoading ? 'Locating...' : 'Allow Location Access'}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Controls Bar */}
          <div className="tt-card" style={{ padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', background: 'var(--tt-surface-2)' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label className="tt-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Search Radius</span>
                <span style={{ color: 'var(--tt-flame)', fontWeight: 600 }}>{radius} km</span>
              </label>
              <input 
                type="range" 
                min="1" 
                max="50" 
                step="1"
                value={radius} 
                onChange={(e) => setRadius(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--tt-flame)' }}
              />
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--tt-muted)' }}>
              Found <strong style={{ color: 'var(--tt-text)' }}>{filteredProducts.length}</strong> deals nearby
            </div>
          </div>

          {/* Results Grid */}
          {productsLoading ? (
            <div className="tt-grid-products">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="tt-skeleton" style={{ height: '360px' }} />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <ProductGrid products={filteredProducts} />
          ) : (
            <div className="tt-card tt-glass" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>🏜️</div>
              <h3 style={{ fontFamily: 'Syne', fontSize: '1.2rem', marginBottom: '0.5rem' }}>No deals found nearby</h3>
              <p style={{ color: 'var(--tt-muted)' }}>Try expanding your search radius to find more urgent deals.</p>
            </div>
          )}
        </>
      )}

    </div>
  );
}
