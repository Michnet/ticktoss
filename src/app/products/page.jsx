'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Filter, X } from 'lucide-react';
import ProductGrid from '@/components/product/ProductGrid';
import ProductFilter from '@/components/product/ProductFilter';
import { useProducts } from '@/lib/hooks/useProducts';

function ProductsContent() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('search') || '');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Use a simple timeout to debounce search
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    // basic debounce
    if (window.searchTimeout) clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      setDebouncedSearch(e.target.value);
    }, 500);
  };

  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const categorySlug = searchParams.get('categorySlug');
  const isFeatured = searchParams.get('isFeatured') === 'true';

  const { data: products, isLoading, error } = useProducts({ 
    search: debouncedSearch,
    minPrice,
    maxPrice,
    categorySlug,
    isFeatured
  });

  return (
    <div style={{minHeight: '80vh' }}>
      <div className="flex flex-col gap-8">
        
        {/* Header & Filter Bar */}
        <div className="flex flex-wrap gap-4 items-center justify-between p-4">
          <div>
            <h1 className="tt-section-title">
              Browse <span>Deals</span>
            </h1>
            <p style={{ color: 'var(--tt-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              The highest urgency deals are listed first.
            </p>
          </div>
          
          <div className="flex w-full md:w-auto items-center gap-2">
            <button 
              className="md:hidden tt-btn bg-[var(--tt-surface)] border border-[var(--tt-border)] p-2 rounded flex items-center justify-center shrink-0" 
              onClick={() => setIsFilterOpen(true)}
              aria-label="Open Filters"
            >
              <Filter size={20} />
            </button>
            <div className="w-full max-w-[300px]">
              <input 
                type="search" 
                placeholder="Search products..." 
                value={search}
                onChange={handleSearchChange}
                className="tt-input w-full"
              />
            </div>
          </div>
        </div>

        {/* Content Layout with Sidebar for Filters */}
        <div className="flex gap-8 items-start relative p-3">
          
          {/* Mobile Overlay */}
          {isFilterOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 md:hidden" 
              onClick={() => setIsFilterOpen(false)}
            />
          )}

          {/* Filter Sidebar / Offcanvas */}
          <div className={`
            fixed inset-y-0 left-0 z-50 w-[250px] bg-[var(--tt-surface)] md:bg-transparent shadow-xl md:shadow-none 
            transform transition-transform duration-300 ease-in-out flex-shrink-0
            md:relative md:translate-x-0 md:z-0
            ${isFilterOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <div className="h-full overflow-y-auto p-4 md:p-0">
              <div className="flex justify-between items-center mb-4 md:hidden">
                <h3 className="font-semibold text-lg m-0">Filters</h3>
                <button onClick={() => setIsFilterOpen(false)} className="text-[var(--tt-muted)] hover:text-[var(--tt-text)] p-2">
                  <X size={20} />
                </button>
              </div>
              <ProductFilter />
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 w-full min-w-0">
            {isLoading ? (
              <div className="tt-grid-products w-full">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="tt-skeleton" style={{ height: '360px' }} />
                ))}
              </div>
            ) : error ? (
              <div className="tt-card tt-glass" style={{ padding: '2rem', textAlign: 'center', color: 'var(--tt-danger)' }}>
                Error loading products: {error.message}
              </div>
            ) : products?.length === 0 ? (
                <div className="tt-card tt-glass" style={{ padding: '3rem', textAlign: 'center' }}>
                  <h3 style={{ marginBottom: '0.5rem' }}>No products found</h3>
                  <p style={{ color: 'var(--tt-muted)' }}>Try adjusting your filters to find what you're looking for.</p>
                </div>
            ) : (
              <ProductGrid products={products} />
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}

export default function BrowseProductsPage() {
  return (
    <Suspense fallback={<div className="tt-container" style={{ padding: '2rem 1.5rem', minHeight: '80vh' }}><div className="tt-skeleton" style={{ height: '60px', marginBottom: '2rem' }}></div><div className="tt-grid-products">{Array.from({ length: 8 }).map((_, i) => (<div key={i} className="tt-skeleton" style={{ height: '360px' }} />))}</div></div>}>
      <ProductsContent />
    </Suspense>
  );
}
