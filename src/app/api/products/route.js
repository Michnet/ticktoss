import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

async function addView(body) {
  const productId = parseInt(body.product_id);
  if (!productId) {
    return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin().rpc('adjust_column_counter_bigint', {
    p_table:  'products',
    p_pk_col: 'id',
    p_pk_val: productId,
    p_col:    'views',
    p_action: 'increment',
  });

  if (error) {
    console.error('view count increment error:', error);
    return NextResponse.json({ error: 'Failed to increment views' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

async function toggleLike(body) {
  // Identify the caller via their session cookie, but perform the actual
  // profiles write through the service-role client — RLS on `profiles`
  // silently matches zero rows for this kind of write (no error, no update),
  // so the privileged client is used here the same way tags/route.js does.
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const productId = parseInt(body.product_id);
  if (!productId) {
    return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { data: profile, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select('product_likes')
    .eq('user_id', user.id)
    .single();

  if (fetchError) {
    console.error('like fetch profile error:', fetchError);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const likes = profile?.product_likes ?? [];
  const isLiked = likes.includes(productId);
  const newLikes = isLiked ? likes.filter((id) => id !== productId) : [...likes, productId];

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ product_likes: newLikes })
    .eq('user_id', user.id);

  if (profileError) {
    console.error('like update profile error:', profileError);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const { error: counterError } = await supabaseAdmin.rpc('adjust_column_counter_bigint', {
    p_table:  'products',
    p_pk_col: 'id',
    p_pk_val: productId,
    p_col:    'likes',
    p_action: isLiked ? 'decrement' : 'increment',
  });

  if (counterError) {
    console.error('like count adjust error:', counterError);
  }

  return NextResponse.json({ success: true, liked: !isLiked });
}

/**
 * POST /api/products?intent=<add_view|toggle_like>
 * Actions are dispatched by the `intent` query param so related one-off
 * product writes can share this route instead of each getting their own file.
 * add_view is public (service role); toggle_like requires an authenticated user.
 */
export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const intent = searchParams.get('intent');
  const body = await request.json();

  switch (intent) {
    case 'add_view':
      return addView(body);
    case 'toggle_like':
      return toggleLike(body);
    default:
      return NextResponse.json({ error: 'Unknown intent' }, { status: 400 });
  }
}
