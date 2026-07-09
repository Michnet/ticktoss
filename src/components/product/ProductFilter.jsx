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

  // Update local state if URL changes
  useEffect(() => {
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
    setCategorySlug(searchParams.get('categorySlug') || '');
    setIsFeatured(searchParams.get('isFeatured') === 'true');
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

    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleClearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('minPrice');
    params.delete('maxPrice');
    params.delete('categorySlug');
    params.delete('isFeatured');
    
    setMinPrice('');
    setMaxPrice('');
    setCategorySlug('');
    setIsFeatured(false);

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
