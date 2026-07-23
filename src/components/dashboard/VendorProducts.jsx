'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import useAppStore from '@/store/useAppStore';
import { Plus, UploadCloud, Edit, Trash2, Package } from 'lucide-react';
import Link from 'next/link';
import { formatUGX } from '@/lib/currency';
import { resizedImage } from '@/helpers/universal';

const VendorAddSingle = dynamic(() => import('./VendorAddSingle'), {
  loading: () => (
    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--tt-muted)' }}>Loading editor...</div>
  ),
});

const SORT_STORAGE_KEY = 'tt_vendor_products_sort';

const SORT_OPTIONS = [
  { value: 'updated_at_desc', label: 'Recently Updated', column: 'updated_at', ascending: false },
  { value: 'views_desc', label: 'Most Viewed', column: 'views', ascending: false },
  { value: 'stock_asc', label: 'Lowest Stock', column: 'stock', ascending: true },
  { value: 'sale_start_date_desc', label: 'Sale Start Date', column: 'sale_start_date', ascending: false },
];

export default function VendorProducts() {
  const { user, addToast } = useAppStore();
  const supabase = getSupabaseBrowserClient();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProductId, setEditingProductId] = useState(null);
  const [sortBy, setSortBy] = useState(() => {
    if (typeof window === 'undefined') return SORT_OPTIONS[0].value;
    return window.localStorage.getItem(SORT_STORAGE_KEY) || SORT_OPTIONS[0].value;
  });

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    try {
      const sortOption = SORT_OPTIONS.find(o => o.value === sortBy) || SORT_OPTIONS[0];
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, name, slug, price, sale_price, stock, status, featured_image, short_description, sale_end_date, sale_start_date, updated_at, views, tt_location
        `)
        .eq('user_id', user.id)
        .order(sortOption.column, { ascending: sortOption.ascending, nullsFirst: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching vendor products:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSortChange = (e) => {
    const value = e.target.value;
    setSortBy(value);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SORT_STORAGE_KEY, value);
    }
  };

  const handleEditSuccess = () => {
    setEditingProductId(null);
    fetchProducts();
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const res = await fetch(`/api/vendors/products?id=${productId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete product');
      }
      
      setProducts(prev => prev.filter(p => p.id !== productId));
      if (addToast) addToast({ type: 'success', message: 'Product deleted successfully' });
    } catch (error) {
      console.error(error);
      if (addToast) addToast({ type: 'error', message: error.message });
      else alert(error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="tt-card" style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
        <p style={{ color: 'var(--tt-muted)' }}>Loading products...</p>
      </div>
    );
  }

  return (
    <div>
      <div className='p-3 pb-0' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <h2 className="tt-section-title" style={{ color: 'var(--tt-flame)', marginBottom: '0.5rem' }}>Products</h2>
          <p style={{ color: 'var(--tt-muted)' }}>Manage your listings and inventory.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={sortBy}
            onChange={handleSortChange}
            className="tt-input"
            style={{ width: 'auto' }}
            aria-label="Sort products"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>Sort: {opt.label}</option>
            ))}
          </select>
          <Link href="/dashboard?view=add_bulk" className="tt-btn tt-btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UploadCloud size={18} />
            Bulk Add
          </Link>
          <Link href="/dashboard?view=add_single" className="tt-btn tt-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} />
            Add Product
          </Link>
        </div>
      </div>

      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--tt-surface-2)', borderRadius: 'var(--tt-radius-lg)', border: '1px dashed var(--tt-border)' }}>
          <Package size={48} color="var(--tt-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>No products found</h3>
          <p style={{ color: 'var(--tt-muted)', marginBottom: '1.5rem' }}>Start building your catalog to get sales.</p>
          <Link href="/dashboard?view=add_single" className="tt-btn tt-btn-primary">
            Add Your First Product
          </Link>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--tt-border)' }}>
                <th style={{ padding: '1rem 0.5rem', color: 'var(--tt-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Product</th>
                <th style={{ padding: '1rem 0.5rem', color: 'var(--tt-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Price</th>
                <th style={{ padding: '1rem 0.5rem', color: 'var(--tt-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Stock</th>
                <th style={{ padding: '1rem 0.5rem', color: 'var(--tt-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '1rem 0.5rem', color: 'var(--tt-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const img = product.featured_image?.url || product.featured_image?.src;
                const isOutOfStock = product.stock !== null && product.stock <= 0;
                
                return (
                  <tr key={product.id} style={{ borderBottom: '1px solid var(--tt-border)' }}>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {img ? (
                          <div style={{ width: '40px', height: '40px', borderRadius: 'var(--tt-radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
                            <img src={resizedImage(img, 'thumbnail')} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ) : (
                          <div style={{ width: '40px', height: '40px', borderRadius: 'var(--tt-radius-sm)', background: 'var(--tt-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Package size={16} color="var(--tt-muted)" />
                          </div>
                        )}
                        <span className='line-clamp-3 text-[14px]' style={{ fontWeight: 600, color: 'var(--tt-text)' }}>{product.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>
                      {formatUGX(product.sale_price || product.price)}
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <span style={{ color: isOutOfStock ? 'var(--tt-danger)' : 'var(--tt-text)', fontWeight: isOutOfStock ? 700 : 500 }}>
                        {product.stock !== null ? product.stock : '∞'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <span className="tt-badge" style={{ 
                        background: product.status === 'published' ? 'rgba(34, 197, 94, 0.1)' : 'var(--tt-surface-2)', 
                        color: product.status === 'published' ? '#22c55e' : 'var(--tt-muted)',
                        padding: '0.2rem 0.6rem',
                        fontSize: '0.75rem'
                      }}>
                        {product.status || 'Draft'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => setEditingProductId(product.id)} className="tt-btn tt-btn-ghost" style={{ padding: '0.5rem', color: 'var(--tt-muted)' }} title="Edit">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="tt-btn tt-btn-ghost" style={{ padding: '0.5rem', color: 'var(--tt-danger)' }} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editingProductId && (
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
          <div
            onClick={() => setEditingProductId(null)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(8px)',
            }}
          />

          <div
            className="tt-card tt-glass"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '900px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              background: 'var(--tt-surface)',
              borderTop: '4px solid var(--tt-flame)',
            }}
          >
            <button
              onClick={() => setEditingProductId(null)}
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
                zIndex: 1,
              }}
            >
              &times;
            </button>

            <VendorAddSingle initialData={{ id: editingProductId }} onSuccess={handleEditSuccess} />
          </div>
        </div>
      )}
    </div>
  );
}
