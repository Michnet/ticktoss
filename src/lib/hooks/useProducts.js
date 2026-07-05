'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { sortByUrgency } from '@/lib/urgency';

const supabase = getSupabaseBrowserClient();

// ── Query key factory ──
export const productKeys = {
  all:    ['products'],
  lists:  (filters) => ['products', 'list', filters],
  detail: (slug)    => ['products', 'detail', slug],
};

/**
 * Fetch products with optional filters.
 */
async function fetchProducts({ categorySlug, locationId, search, limit = 40, offset = 0 } = {}) {
  let query = supabase
    .from('products')
    .select(`
      id, name, slug, short_description,
      price, sale_price, sale_end_date, sale_start_date,
      featured_image, stock, stock_alert_level,
      is_featured, is_flash_sale, status,
      discount_pct, urgency_score,
      location_id, pickup_lat, pickup_lng, pickup_address,
      vendor_id,
      product_categories!inner(id, name, slug, color)
    `)
    .eq('status', 'published')
    //.not('sale_end_date', 'is', null)
    //.gt('sale_end_date', new Date().toISOString())
    .range(offset, offset + limit - 1);

  if (categorySlug) {
    query = query.eq('product_categories.slug', categorySlug);
  }
  if (locationId) {
    query = query.eq('location_id', locationId);
  }
  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return sortByUrgency(data ?? []);
}

/**
 * Fetch a single product by slug.
 */
async function fetchProductBySlug(slug) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_categories(id, name, slug, color, icon),
      product_variations(id, sku, price, sale_price, stock_quantity, attributes, featured_image, status),
      reviews(id, user_id, content, scores, overall_score, approved)
    `)
    .eq('slug', slug)
    .single();

  if (error) throw error;
  return data;
}

// ── Hooks ──

export function useProducts(filters = {}) {
  return useQuery({
    queryKey: productKeys.lists(filters),
    queryFn: () => fetchProducts(filters),
    staleTime: 30 * 1000, // 30s — re-sort interval
  });
}

export function useProduct(slug) {
  return useQuery({
    queryKey: productKeys.detail(slug),
    queryFn: () => fetchProductBySlug(slug),
    enabled: !!slug,
    staleTime: 60 * 1000,
  });
}

export function useVendorProducts(vendorId) {
  return useQuery({
    queryKey: ['products', 'vendor', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, price, sale_price, sale_end_date, stock, status, discount_pct, urgency_score, featured_image')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!vendorId,
  });
}

export function useProductLike(productId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId }) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('product_likes')
        .eq('user_id', userId)
        .single();

      const likes = profile?.product_likes ?? [];
      const isLiked = likes.includes(productId);
      const newLikes = isLiked ? likes.filter((id) => id !== productId) : [...likes, productId];

      const { error } = await supabase
        .from('profiles')
        .update({ product_likes: newLikes })
        .eq('user_id', userId);

      if (error) throw error;
      return { liked: !isLiked };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}
