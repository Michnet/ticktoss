import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabaseAdmin
      .from('countries')
      .select('id, name, slug')
      .order('name');

    if (error) {
      console.error('Failed to fetch countries:', error);
      return NextResponse.json({ error: 'Failed to fetch countries' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('GET /api/vendors/products/countries error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
