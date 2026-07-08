import { useQuery } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export function useTopCategories() {
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ['categories', 'top'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        //.gt('count', 0)
        .order('name', { ascending: false })
        .limit(8);

        console.log({catData:data, d:error})

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Reusable product query helper
const PRODUCT_SELECT = `
  id,
  name,
  slug,
  price,
  sale_price,
  sale_end_date,
  stock,
  stock_alert_level,
  urgency_score,
  featured_image,
  is_featured,
  created_at,
  user_id,
  product_categories(name)
`;

export function useHeroProducts() {
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ['products', 'hero'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .eq('status', 'published')
        //.gt('sale_end_date', new Date().toISOString())
        // For hero, we want highly urgent but high stock, or just top urgency
        .order('urgency_score', { ascending: false })
        .limit(3);

      if (error) throw error;
      console.log({data, error})
      return data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useLiveUrgencyProducts() {
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ['products', 'live_urgency'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .eq('status', 'published')
        //.gt('sale_end_date', new Date().toISOString())
        .order('urgency_score', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    // We fetch less often, calculating client side to save DB hits
    staleTime: 2 * 60 * 1000, 
  });
}

export function useFeaturedProducts() {
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .eq('status', 'published')
        .eq('is_featured', true)
        .order('updated_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useNewArrivals() {
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ['products', 'new_arrivals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
