'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useParentCategories } from '@/lib/hooks/useParentCategories';

export default function ProductFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: categories, isLoading: isCategoriesLoading } = useParentCategories();

  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [categorySlug, setCategorySlug] = useState(searchParams.get('categorySlug') || '');
  const [isFeatured, setIsFeatured] = useState(searchParams.get('isFeatured') === 'true');
  const [orderBy, setOrderBy] = useState(searchParams.get('orderBy') || '');
  const [selectedClusters, setSelectedClusters] = useState(() => {
    const param = searchParams.get('clusters');
    return param ? param.split(',') : [];
  });

  // Update local state if URL changes
  useEffect(() => {
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
    setCategorySlug(searchParams.get('categorySlug') || '');
    setIsFeatured(searchParams.get('isFeatured') === 'true');
    setOrderBy(searchParams.get('orderBy') || '');
    const param = searchParams.get('clusters');
    setSelectedClusters(param ? param.split(',') : []);
  }, [searchParams]);

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (minPrice) params.set('minPrice', minPrice);
    else params.delete('minPrice');

    if (maxPrice) params.set('maxPrice', maxPrice);
    else params.delete('maxPrice');

    if (categorySlug) params.set('categorySlug', categorySlug);
    else params.delete('categorySlug');

    if (isFeatured) params.set('isFeatured', 'true');
    else params.delete('isFeatured');

    if (orderBy) params.set('orderBy', orderBy);
    else params.delete('orderBy');

    if (selectedClusters.length > 0) params.set('clusters', selectedClusters.join(','));
    else params.delete('clusters');

    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleClearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('minPrice');
    params.delete('maxPrice');
    params.delete('categorySlug');
    params.delete('isFeatured');
    params.delete('orderBy');
    params.delete('clusters');
    
    setMinPrice('');
    setMaxPrice('');
    setCategorySlug('');
    setIsFeatured(false);
    setOrderBy('');
    setSelectedClusters([]);

    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="tt-card tt-glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', height: 'fit-content' }}>
      <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Filters</h3>

      <div>
        <label className="tt-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Category</label>
        <select 
          className="tt-input" 
          value={categorySlug} 
          onChange={(e) => setCategorySlug(e.target.value)}
          disabled={isCategoriesLoading}
        >
          <option value="">All Categories</option>
          {categories?.map(cat => (
            <option key={cat.id} value={cat.slug}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="tt-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Sort By</label>
        <select 
          className="tt-input" 
          value={orderBy} 
          onChange={(e) => setOrderBy(e.target.value)}
        >
          <option value="">Default (Urgency)</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="newest">Newest Arrivals</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      <div>
        <label className="tt-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Price Range</label>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input 
            type="number" 
            placeholder="Min" 
            className="tt-input" 
            value={minPrice} 
            onChange={(e) => setMinPrice(e.target.value)} 
          />
          <span style={{ color: 'var(--tt-muted)' }}>-</span>
          <input 
            type="number" 
            placeholder="Max" 
            className="tt-input" 
            value={maxPrice} 
            onChange={(e) => setMaxPrice(e.target.value)} 
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input 
          type="checkbox" 
          id="isFeatured" 
          checked={isFeatured} 
          onChange={(e) => setIsFeatured(e.target.checked)} 
          style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--tt-primary)' }}
        />
        <label htmlFor="isFeatured" style={{ cursor: 'pointer', userSelect: 'none' }}>Featured Only</label>
      </div>

      <div>
        <label className="tt-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Special Filters</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            { id: 'ending-soon', label: 'Ending Soon' },
            { id: 'dropping-today', label: 'Dropping Today' },
            { id: 'flash-sale', label: 'Flash Sales' },
            { id: 'below-10k', label: 'Under 10k' },
            { id: 'high-demand', label: 'High Demand' },
            { id: 'top-rated', label: 'Top Rated' },
            { id: 'new', label: 'New Arrivals' }
          ].map(cluster => (
            <div key={cluster.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="checkbox" 
                id={`cluster-${cluster.id}`}
                checked={selectedClusters.includes(cluster.id)} 
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedClusters([...selectedClusters, cluster.id]);
                  } else {
                    setSelectedClusters(selectedClusters.filter(c => c !== cluster.id));
                  }
                }} 
                style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--tt-primary)' }}
              />
              <label htmlFor={`cluster-${cluster.id}`} style={{ cursor: 'pointer', userSelect: 'none' }}>{cluster.label}</label>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button className="tt-btn tt-btn-primary" style={{ flex: 1 }} onClick={handleApplyFilters}>
          Apply
        </button>
        <button className="tt-btn" style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid var(--tt-border)' }} onClick={handleClearFilters}>
          Clear
        </button>
      </div>
    </div>
  );
}
