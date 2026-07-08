'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import useAppStore from '@/store/useAppStore';
import ProductCard from '@/components/product/ProductCard';
import { Heart } from 'lucide-react';

export default function SavedItems() {
  const { user, profile } = useAppStore();
  const supabase = getSupabaseBrowserClient();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile) return;

    const fetchSavedItems = async () => {
      try {
        const likedProductIds = profile.product_likes || [];
        
        if (likedProductIds.length === 0) {
          setProducts([]);
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            profiles:user_id(id, display_name, avatar),
            product_categories(id, name, slug, color, icon)
          `)
          .in('id', likedProductIds)
          .eq('status', 'published');

        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching saved items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedItems();
  }, [user, profile, supabase]);

  if (isLoading) {
    return (
      <div className="tt-card" style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
        <p style={{ color: 'var(--tt-muted)' }}>Loading saved items...</p>
      </div>
    );
  }

  return (
    <div className="tt-card tt-glass" style={{ padding: '2rem' }}>
      <h2 className="tt-section-title" style={{ marginBottom: '0.5rem' }}>Saved Items</h2>
      <p style={{ color: 'var(--tt-muted)', marginBottom: '2rem' }}>
        Items you have favorited or saved for later.
      </p>

      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--tt-surface-2)', borderRadius: 'var(--tt-radius-lg)' }}>
          <Heart size={48} color="var(--tt-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>No saved items</h3>
          <p style={{ color: 'var(--tt-muted)' }}>You haven't saved any products yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
