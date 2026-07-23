'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useVendors } from '@/lib/hooks/useVendors';
import VendorCard from '@/components/home/VendorCard';

const SORT_OPTIONS = [
  { value: 'orders', label: 'Most Orders' },
  { value: 'completion', label: 'Completion Rate' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'name', label: 'Name (A-Z)' },
];

function VendorGridSkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="tt-shimmer h-[230px] rounded-[var(--tt-radius-lg)] bg-[var(--tt-surface)]" />
      ))}
    </div>
  );
}

function VendorsContent() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('search') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'orders');

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    if (window.vendorSearchTimeout) clearTimeout(window.vendorSearchTimeout);
    window.vendorSearchTimeout = setTimeout(() => {
      setDebouncedSearch(e.target.value);
    }, 500);
  };

  const { data: vendors, isLoading, error } = useVendors({ search: debouncedSearch, sort });

  return (
    <div style={{ minHeight: '80vh' }}>
      <div className="flex flex-col gap-8">
        {/* Header & Controls */}
        <div className="flex flex-wrap gap-4 items-center justify-between p-4">
          <div>
            <h1 className="tt-section-title">
              Browse <span>Vendors</span>
            </h1>
            <p style={{ color: 'var(--tt-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Trusted sellers, ranked by real order performance.
            </p>
          </div>

          <div className="flex w-full md:w-auto items-center gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="tt-input"
              aria-label="Sort vendors"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <input
              type="search"
              placeholder="Search vendors..."
              value={search}
              onChange={handleSearchChange}
              className="tt-input w-full max-w-[260px]"
            />
          </div>
        </div>

        {/* Vendor Grid */}
        <div className="p-3">
          {isLoading ? (
            <VendorGridSkeleton />
          ) : error ? (
            <div className="tt-card tt-glass" style={{ padding: '2rem', textAlign: 'center', color: 'var(--tt-danger)' }}>
              Error loading vendors: {error.message}
            </div>
          ) : vendors?.length === 0 ? (
            <div className="tt-card tt-glass" style={{ padding: '3rem', textAlign: 'center' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>No vendors found</h3>
              <p style={{ color: 'var(--tt-muted)' }}>Try a different search term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4">
              {vendors.map((v) => (
                <VendorCard key={v.id} vendor={v} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VendorsPage() {
  return (
    <Suspense
      fallback={
        <div className="tt-container tt-container-padding" style={{ padding: '2rem 1.5rem', minHeight: '80vh' }}>
          <div className="tt-skeleton" style={{ height: '60px', marginBottom: '2rem' }} />
          <VendorGridSkeleton />
        </div>
      }
    >
      <VendorsContent />
    </Suspense>
  );
}
