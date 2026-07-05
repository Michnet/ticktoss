'use client';

import { useState } from 'react';
import ProductGrid from '@/components/product/ProductGrid';
import { useProducts } from '@/lib/hooks/useProducts';

export default function BrowseProductsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Use a simple timeout to debounce search
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    // basic debounce
    if (window.searchTimeout) clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      setDebouncedSearch(e.target.value);
    }, 500);
  };

  const { data: products, isLoading, error } = useProducts({ search: debouncedSearch });

  return (
    <div className="tt-container" style={{ padding: '2rem 1.5rem', minHeight: '80vh' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Header & Filter Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="tt-section-title">
              Browse <span>Deals</span>
            </h1>
            <p style={{ color: 'var(--tt-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              The highest urgency deals are listed first.
            </p>
          </div>
          
          <div style={{ width: '100%', maxWidth: '300px' }}>
            <input 
              type="search" 
              placeholder="Search products..." 
              value={search}
              onChange={handleSearchChange}
              className="tt-input"
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="tt-grid-products">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="tt-skeleton" style={{ height: '360px' }} />
            ))}
          </div>
        ) : error ? (
          <div className="tt-card tt-glass" style={{ padding: '2rem', textAlign: 'center', color: 'var(--tt-danger)' }}>
            Error loading products: {error.message}
          </div>
        ) : (
          <ProductGrid products={products} />
        )}
        
      </div>
    </div>
  );
}
