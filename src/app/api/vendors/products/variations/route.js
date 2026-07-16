import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { isAdmin } from '@/lib/roles';

export async function POST(request) {
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

    const { product_id, variations } = await request.json();
    if (!product_id) {
      return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: product, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('user_id')
      .eq('id', product_id)
      .single();

    if (fetchError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.user_id !== user.id && !isAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const incoming = Array.isArray(variations) ? variations : [];
    const keepIds = incoming.filter(v => v.id).map(v => v.id);

    // Remove variations that are no longer present in the submitted set
    let deleteQuery = supabaseAdmin.from('product_variations').delete().eq('product_id', product_id);
    deleteQuery = keepIds.length > 0 ? deleteQuery.not('id', 'in', `(${keepIds.join(',')})`) : deleteQuery;
    const { error: deleteError } = await deleteQuery;

    if (deleteError) {
      console.error('Failed to prune variations:', deleteError);
      return NextResponse.json({ error: 'Failed to update variations' }, { status: 500 });
    }

    if (incoming.length === 0) {
      return NextResponse.json({ success: true, variations: [] });
    }

    const rows = incoming.map(v => ({
      ...(v.id ? { id: v.id } : {}),
      product_id,
      sku: v.sku,
      price: v.price ?? null,
      sale_price: v.sale_price ?? null,
      stock_quantity: v.stock_quantity ?? 0,
      attributes: v.attributes || {},
      unit_cost: v.unit_cost ?? null,
    }));

    const { data: savedVariations, error: upsertError } = await supabaseAdmin
      .from('product_variations')
      .upsert(rows, { onConflict: 'id' })
      .select();

    if (upsertError) {
      console.error('Failed to save variations:', upsertError);
      return NextResponse.json({ error: 'Failed to save variations' }, { status: 500 });
    }

    return NextResponse.json({ success: true, variations: savedVariations });
  } catch (err) {
    console.error('POST /api/vendors/products/variations error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
