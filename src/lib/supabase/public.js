import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Anonymous, cookie-free Supabase client for public data reads at build time
 * (generateStaticParams) and during ISR revalidation. Unlike server.js, this
 * never calls cookies() from next/headers, so using it doesn't force a route
 * into dynamic rendering.
 */
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
