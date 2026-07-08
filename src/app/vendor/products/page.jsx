'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import useAppStore from '@/store/useAppStore';
import { formatUGX } from '@/lib/currency';

export default function VendorProductsPage() {
  const { user, addToast } = useAppStore();
  const supabase = getSupabaseBrowserClient();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!user) return;
    fetchProducts();
  }, [user]);

  async function fetchProducts() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'archived') // Don't show archived/deleted products
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      addToast({ type: 'error', message: 'Failed to load products' });
    } else {
      setProducts(data || []);
    }
    setIsLoading(false);
  }

  const handleArchive = async (productId) => {
    const confirmArchive = window.confirm('Are you sure you want to remove this deal? It will no longer be visible to buyers.');
    if (!confirmArchive) return;

    setDeletingId(productId);
    try {
      // Soft delete by setting status to 'archived'
      const { error } = await supabase
        .from('products')
        .update({ status: 'archived' })
        .eq('id', productId)
        .eq('user_id', user.id); // Ensure ownership

      if (error) throw error;

      setProducts(prev => prev.filter(p => p.id !== productId));
      addToast({ type: 'success', message: 'Deal removed successfully.' });
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Failed to remove deal' });
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return <div className="tt-skeleton" style={{ height: '400px' }} />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="tt-section-title" style={{ fontSize: '2rem' }}>My <span>Deals</span></h1>
          <p style={{ color: 'var(--tt-muted)' }}>Manage your active listings and monitor stock levels.</p>
        </div>
        <Link href="/vendor/products/new" className="tt-btn tt-btn-primary tt-shimmer">
          + Post New Deal
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="tt-card tt-glass" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>🏷️</div>
          <h3 style={{ fontFamily: 'Syne', fontSize: '1.2rem', marginBottom: '0.5rem' }}>No active deals</h3>
          <p style={{ color: 'var(--tt-muted)', marginBottom: '1.5rem' }}>You haven't posted any products yet.</p>
          <Link href="/vendor/products/new" className="tt-btn tt-btn-primary">
            Post Your First Deal
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {products.map((product) => {
            const imageUrl = product.featured_image?.url || product.featured_image?.src;
            const isExpired = new Date(product.sale_end_date) < new Date();
            const isOutOfStock = product.stock <= 0;
            
            let statusBadge = null;
            if (isOutOfStock) {
              statusBadge = <span className="tt-badge" style={{ background: 'rgba(255,45,85,0.1)', color: 'var(--tt-danger)' }}>Out of Stock</span>;
            } else if (isExpired) {
              statusBadge = <span className="tt-badge" style={{ background: 'rgba(122,122,154,0.1)', color: 'var(--tt-muted)' }}>Expired</span>;
            } else {
              statusBadge = <span className="tt-badge" style={{ background: 'rgba(0,232,122,0.1)', color: 'var(--tt-success)' }}>Active</span>;
            }

            return (
              <div key={product.id} className="tt-card tt-glass" style={{ padding: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', opacity: (isExpired || isOutOfStock) ? 0.7 : 1 }}>
                
                {/* Image */}
                <div style={{ width: 100, height: 100, borderRadius: 'var(--tt-radius-sm)', background: 'var(--tt-surface-2)', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                  {imageUrl ? (
                    <Image src={imageUrl} alt={product.name} fill style={{ objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>📦</div>
                  )}
                </div>

                {/* Details */}
                <div style={{ flex: '1 1 250px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--tt-text)' }}>{product.name}</h3>
                    {statusBadge}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', color: 'var(--tt-muted)', fontSize: '0.85rem' }}>
                    <span>Original: <span style={{ textDecoration: 'line-through' }}>{formatUGX(product.price)}</span></span>
                    <span style={{ color: 'var(--tt-gold)', fontWeight: 600 }}>Sale: {formatUGX(product.sale_price)}</span>
                    <span style={{ color: 'var(--tt-success)' }}>(-{product.discount_pct?.toFixed(0)}%)</span>
                  </div>

                  <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: 'var(--tt-muted)' }}>Stock: </span>
                      <strong style={{ color: isOutOfStock ? 'var(--tt-danger)' : 'var(--tt-text)' }}>{product.stock}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--tt-muted)' }}>Urgency Score: </span>
                      <strong style={{ color: 'var(--tt-flame)' }}>{product.urgency_score?.toFixed(0)}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--tt-muted)' }}>Ends: </span>
                      <strong>{new Date(product.sale_end_date).toLocaleDateString()}</strong>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ flex: '0 0 140px', display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
                  <Link 
                    href={`/products/${product.id}`}
                    className="tt-btn tt-btn-ghost"
                    style={{ padding: '0.5rem', fontSize: '0.85rem', textAlign: 'center' }}
                  >
                    View Listing
                  </Link>
                  <button 
                    disabled={deletingId === product.id}
                    onClick={() => handleArchive(product.id)}
                    className="tt-btn"
                    style={{ padding: '0.5rem', fontSize: '0.85rem', background: 'transparent', color: 'var(--tt-danger)', border: '1px solid var(--tt-danger)' }}
                  >
                    {deletingId === product.id ? 'Removing...' : 'Remove Deal'}
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
