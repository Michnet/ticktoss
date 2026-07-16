'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import useAppStore from '@/store/useAppStore';
import { Plus, UploadCloud, Edit, Trash2, Package } from 'lucide-react';
import Link from 'next/link';
import { formatUGX } from '@/lib/currency';
import { resizedImage } from '@/helpers/universal';
import VendorAddSingle from './VendorAddSingle';

export default function VendorProducts() {
  const { user, addToast } = useAppStore();
  const supabase = getSupabaseBrowserClient();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            id, name, slug, price, sale_price, stock, status, featured_image, short_description, sale_end_date, tt_location
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching vendor products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [user, supabase]);

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

  const handleEdit = (product) => {
    setEditingProduct(product);
  };

  const handleEditSuccess = () => {
    setEditingProduct(null);
    // Re-fetch products to get updated data
    setIsLoading(true);
    supabase
      .from('products')
      .select(`
        id, name, slug, price, sale_price, stock, status, featured_image, short_description, sale_end_date, tt_location
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setProducts(data);
        setIsLoading(false);
      });
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
      {editingProduct && (
        <div className='p-2 md:p-4' style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, 
          overflowY: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start'
        }}>
          <div className='max-h-[calc(100vh-2rem)] overflow-y-auto no-scrollbar' style={{ position: 'relative', background: 'var(--tt-surface)', borderRadius: 'var(--tt-radius-lg)', padding: '1rem', width: '100%', maxWidth: '900px' }}>
            <button 
              onClick={() => setEditingProduct(null)} 
              style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10, background: 'var(--tt-surface-2)', border: 'none', color: 'var(--tt-text)', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ✕
            </button>
            <VendorAddSingle initialData={editingProduct} onSuccess={handleEditSuccess} />
          </div>
        </div>
      )}

      <div className='p-3 pb-0' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <h2 className="tt-section-title" style={{ color: 'var(--tt-flame)', marginBottom: '0.5rem' }}>Products</h2>
          <p style={{ color: 'var(--tt-muted)' }}>Manage your listings and inventory.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
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
                        <button onClick={() => handleEdit(product)} className="tt-btn tt-btn-ghost" style={{ padding: '0.5rem', color: 'var(--tt-muted)' }} title="Quick Edit">
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
    </div>
  );
}
