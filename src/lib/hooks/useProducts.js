'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { sortByUrgency } from '@/lib/urgency';
import { mapProductData } from '@/lib/productHelpers';

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
async function fetchProducts({ search, categorySlug, category_id, locationId, tag_ids,loc_ids,catIds,excludeId, minPrice, maxPrice, isFeatured, clusters, orderBy, limit = 40, offset = 0 } = {}) {
  let query = supabase
    .from('products')
    .select(`
      id, name, slug, short_description,
      price, sale_price, sale_end_date, sale_start_date,
      featured_image, gallery, stock, stock_alert_level,
      is_featured, is_flash_sale, status,
      discount_pct, urgency_score,
      location, pickup_lat, pickup_lng, pickup_address,
      user_id,views,watchers,likes,
      category:product_categories!inner(id, name, slug, color)
    `)
    .eq('status', 'published')
    .range(offset, offset + limit - 1);

  if (category_id) {
    query = query.eq('category', category_id);
  }
  if (tag_ids) {
    query = query.overlaps('tag_ids', [tag_ids]);
  }
  if (catIds) {
    query = query.overlaps('cat_ids', [catIds]);
  }
  if (loc_ids) {
    query = query.overlaps('loc_ids', [loc_ids]);
  }
  if (categorySlug) {
    query = query.eq('product_categories.slug', categorySlug);
  }
  if (locationId) {
    query = query.eq('location', locationId);
  }
  if (search) {
    query = query.ilike('name', `%${search}%`);
  }
  if (minPrice) {
    query = query.gte('sale_price', minPrice);
  }
  if (maxPrice) {
    query = query.lte('sale_price', maxPrice);
  }
  if (isFeatured) {
    query = query.eq('is_featured', true);
  }
  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  if (clusters && clusters.length > 0) {
    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const next72h = new Date(now.getTime() + 72 * 60 * 60 * 1000);
    const _14daysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    clusters.forEach(cluster => {
      switch(cluster) {
        case 'dropping-today':
          query = query.gt('sale_start_date', now.toISOString()).lte('sale_start_date', next24h.toISOString());
          break;
        case 'coming-soon':
          query = query.gt('sale_start_date', next24h.toISOString());
          break;
        case 'ending-today':
          query = query.gt('sale_end_date', now.toISOString()).lte('sale_end_date', next24h.toISOString());
          break;
        case 'ending-soon':
          query = query.gt('sale_end_date', now.toISOString()).lte('sale_end_date', next72h.toISOString());
          break;
        case 'below-10k':
          query = query.lt('sale_price', 10000);
          break;
        case 'top-rated':
          query = query.gte('rating', 4).gte('reviews', 3);
          break;
        case 'high-demand':
          query = query.gte('urgency_score', 50);
          break;
        case 'flash-sale':
          query = query.eq('is_flash_sale', true);
          break;
        case 'new':
          query = query.gte('created_at', _14daysAgo.toISOString());
          break;
        default:
          break;
      }
    });
  }

  if (orderBy) {
    switch (orderBy) {
      case 'price_asc':
        query = query.order('sale_price', { ascending: true, nullsFirst: false });
        break;
      case 'price_desc':
        query = query.order('sale_price', { ascending: false, nullsFirst: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'rating':
        query = query.order('rating', { ascending: false, nullsFirst: false });
        break;
      case 'urgency':
        query = query.order('urgency_score', { ascending: false });
        break;
      default:
        break;
    }
  }

  const { data, error } = await query;
  if (error) throw error;
  
  if (orderBy && orderBy !== 'urgency') {
    return data ?? [];
  }
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
      profiles:user_id(id, display_name, avatar),
      product_categories(id, name, slug, color, icon),
      product_variations(id, sku, price, sale_price, stock_quantity, attributes, featured_image, status),
      reviews(id, user_id, content, scores, overall_score, approved)
    `)
    .eq('slug', slug)
    .single();

  if (error) throw error;

  // Resolve tag objects from tag_ids array
  let resolvedTags = [];
  if (data.tag_ids?.length) {
    const { data: tagsData } = await supabase
      .from('tags')
      .select('id, name, slug, count')
      .in('id', data.tag_ids);
    resolvedTags = tagsData ?? [];
  }

  // Resolve all category objects from cat_ids array (full set, not just primary)
  let resolvedCategories = [];
  if (data.cat_ids?.length) {
    const { data: catsData } = await supabase
      .from('product_categories')
      .select('id, name, slug, color, icon, image_icon, description')
      .in('id', data.cat_ids);
    resolvedCategories = catsData ?? [];
  }

  return mapProductData({ ...data, tags: resolvedTags, all_categories: resolvedCategories });
}

// ── Hooks ──

export function useProducts(filters = {}) {
  return useQuery({
    queryKey: productKeys.lists(filters),
    queryFn: () => fetchProducts(filters),
    staleTime: 30 * 1000, // 30s — re-sort interval
  });
}

export function useProduct(slug, initialData) {
  return useQuery({
    queryKey: productKeys.detail(slug),
    queryFn: () => fetchProductBySlug(slug),
    enabled: !!slug,
    staleTime: 60 * 1000,
    ...(initialData ? { initialData } : {}),
  });
}

export function useVendorProducts(vendorId) {
  return useQuery({
    queryKey: ['products', 'vendor', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, price, sale_price, sale_end_date, stock, status, discount_pct, urgency_score, featured_image')
        .eq('user_id', vendorId)
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
    mutationFn: async () => {
      const res = await fetch('/api/products?intent=toggle_like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle like');
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}
