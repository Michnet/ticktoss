'use client';

import { useQuery } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

const supabase = getSupabaseBrowserClient();

export function useParentCategories() {
  return useQuery({
    queryKey: ['categories', 'parent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('id, name, slug')
        .is('parent', null)
        .order('name');
        
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
