import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

export async function PATCH(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            // Read-only in API
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { index, store } = body;

    if (!Number.isInteger(index) || index < 0) {
      return NextResponse.json({ error: 'Invalid store index' }, { status: 400 });
    }
    if (!store?.name || !Array.isArray(store?.calls) || store.calls.length === 0 || !store?.location) {
      return NextResponse.json(
        { error: 'Please provide all required business details (name, at least one call number, and location)' },
        { status: 400 }
      );
    }

    // Service role — updating profiles.tt_stores isn't covered by a
    // self-service RLS policy, so use elevated privileges the same way the
    // admin approval route does, but scoped strictly to this user's own row.
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('tt_stores')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile for store update:', profileError);
      return NextResponse.json({ error: 'Failed to load your stores' }, { status: 500 });
    }

    const currentStores = profile?.tt_stores || [];
    if (index >= currentStores.length) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const updatedStores = currentStores.map((s, i) => (i === index ? store : s));

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ tt_stores: updatedStores })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating store:', updateError);
      return NextResponse.json({ error: 'Failed to update store' }, { status: 500 });
    }

    return NextResponse.json({ success: true, tt_stores: updatedStores });
  } catch (err) {
    console.error('Vendor store update API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
