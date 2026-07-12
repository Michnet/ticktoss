import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/watchlist?product_id=123
 * Check if the authenticated user is watching a product.
 */
export async function GET(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ watching: false });
  }

  const { searchParams } = new URL(request.url);
  const productId = parseInt(searchParams.get('product_id'));

  if (!productId) {
    return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('watched_products')
    .eq('user_id', user.id)
    .single();

  const watching = profile?.watched_products?.includes(productId) ?? false;

  return NextResponse.json({ watching });
}

/**
 * POST /api/watchlist
 * Watch a product. Requires authentication.
 * Body: { product_id: number, sale_date: string (YYYY-MM-DD) }
 */
export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { product_id, sale_date } = await request.json();

  if (!product_id || !sale_date) {
    return NextResponse.json({ error: 'product_id and sale_date are required' }, { status: 400 });
  }

  const productId = parseInt(product_id);

  // 1. Fetch current watched_products array
  const { data: profile } = await supabase
    .from('profiles')
    .select('watched_products')
    .eq('user_id', user.id)
    .single();

  const currentWatchlist = profile?.watched_products ?? [];

  // Idempotent — already watching
  if (currentWatchlist.includes(productId)) {
    const { data: product } = await supabase
      .from('products').select('watchers').eq('id', productId).single();
    return NextResponse.json({ success: true, watching: true, watchers: product?.watchers ?? 0 });
  }

  // 2. Append product_id to watched_products
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ watched_products: [...currentWatchlist, productId] })
    .eq('user_id', user.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // 3. Increment products.watchers via shared DB function
  const { error: counterError } = await supabase.rpc('adjust_column_counter_bigint', {
    p_table:  'products',
    p_pk_col: 'id',
    p_pk_val: productId,
    p_col:    'watchers',
    p_action: 'increment',
  });

  if (counterError) {
    console.error('watcher count increment error:', counterError);
  }

  // 4. Insert schedule row — ON CONFLICT DO NOTHING (dedup by user+date)
  const { error: scheduleError } = await supabase
    .from('product_watch_schedule')
    .insert({ user_id: user.id, sale_date })
    .select()
    // Supabase JS v2: handle conflict at DB level via upsert with ignoreDuplicates
    // The unique constraint (user_id, sale_date) handles dedup
    .throwOnError();

  if (scheduleError && scheduleError.code !== '23505') {
    // 23505 = unique_violation, which is expected — we ignore it
    console.error('schedule insert error:', scheduleError);
  }

  // 5. Return updated watchers count
  const { data: updatedProduct } = await supabase
    .from('products').select('watchers').eq('id', productId).single();

  return NextResponse.json({ success: true, watching: true, watchers: updatedProduct?.watchers ?? 0 });
}

/**
 * DELETE /api/watchlist
 * Unwatch a product. Requires authentication.
 * Body: { product_id: number, sale_date: string (YYYY-MM-DD) }
 */
export async function DELETE(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { product_id, sale_date } = await request.json();

  if (!product_id) {
    return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
  }

  const productId = parseInt(product_id);

  // 1. Fetch current watched_products
  const { data: profile } = await supabase
    .from('profiles')
    .select('watched_products')
    .eq('user_id', user.id)
    .single();

  const currentWatchlist = profile?.watched_products ?? [];

  if (!currentWatchlist.includes(productId)) {
    // Not watching — idempotent
    const { data: product } = await supabase
      .from('products').select('watchers').eq('id', productId).single();
    return NextResponse.json({ success: true, watching: false, watchers: product?.watchers ?? 0 });
  }

  // 2. Remove product_id from watched_products
  const updated = currentWatchlist.filter((id) => id !== productId);
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ watched_products: updated })
    .eq('user_id', user.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // 3. Decrement products.watchers
  await supabase.rpc('adjust_column_counter_bigint', {
    p_table:  'products',
    p_pk_col: 'id',
    p_pk_val: productId,
    p_col:    'watchers',
    p_action: 'decrement',
  });

  // 4. Check if user still has any watched products for this sale_date
  //    If none remain → delete the schedule row for that date
  if (sale_date) {
    const remainingForDate = await supabase
      .from('products')
      .select('id')
      .in('id', updated.length > 0 ? updated : [-1])
      .eq('sale_start_date::date', sale_date); // cast comparison

    // Simpler: fetch the product_ids in updated watchlist and check if any match sale_date
    const { data: stillWatching } = await supabase
      .from('products')
      .select('id, sale_start_date')
      .in('id', updated.length > 0 ? updated : [-1]);

    const hasOtherProductsOnSameDate = stillWatching?.some(
      (p) => p.sale_start_date && new Date(p.sale_start_date).toISOString().split('T')[0] === sale_date
    );

    if (!hasOtherProductsOnSameDate) {
      await supabase
        .from('product_watch_schedule')
        .delete()
        .match({ user_id: user.id, sale_date });
    }
  }

  // 5. Return updated count
  const { data: updatedProduct } = await supabase
    .from('products').select('watchers').eq('id', productId).single();

  return NextResponse.json({ success: true, watching: false, watchers: updatedProduct?.watchers ?? 0 });
}
