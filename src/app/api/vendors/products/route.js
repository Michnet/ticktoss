import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { isAdmin } from '@/lib/roles';
import { generateSlug } from '@/lib/slug';
import { deriveProductUrgency } from '@/lib/urgency';

export async function DELETE(request) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Use service role for elevated privileges to delete the product
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Verify ownership or admin status before deleting
    const { data: product, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.user_id !== user.id && !isAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Failed to delete product:', deleteError);
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request) {
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

    const body = await request.json();
    const { id, vendor_id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Verify ownership or admin status before updating
    const { data: product, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('user_id, price, sale_price, stock, sale_end_date')
      .eq('id', id)
      .single();

    if (fetchError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.user_id !== user.id && !isAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Admins may reassign a product to a different vendor via vendor_id
    if (vendor_id && vendor_id !== product.user_id) {
      if (!isAdmin(user)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      updates.user_id = vendor_id;
    }

    // Recompute urgency whenever an edit touches one of its inputs, so it
    // never goes stale after a vendor changes price, stock, or the sale window.
    const urgencyInputs = ['price', 'sale_price', 'stock', 'sale_end_date'];
    if (urgencyInputs.some((field) => field in updates)) {
      const { discount_pct, urgency_score } = deriveProductUrgency({
        price: updates.price ?? product.price,
        sale_price: updates.sale_price ?? product.sale_price,
        stock: updates.stock ?? product.stock,
        sale_end_date: updates.sale_end_date ?? product.sale_end_date,
      });
      updates.discount_pct = discount_pct;
      updates.urgency_score = urgency_score;
    }

    const { data: updatedProduct, error: updateError } = await supabaseAdmin
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update product:', updateError);
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (err) {
    console.error('PATCH API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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

    const payload = await request.json();

    // Admins may create a product on behalf of another vendor by passing
    // vendor_id; anyone else must only ever create their own products.
    if (payload.vendor_id && payload.vendor_id !== user.id && !isAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const targetUserId = payload.vendor_id || user.id;
    delete payload.vendor_id;

    let baseSlug = generateSlug(payload.name || 'product');
    let slug = baseSlug;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    let isUnique = false;
    let counter = 1;
    while (!isUnique) {
      const { data: existing } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (existing) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      } else {
        isUnique = true;
      }
    }

    payload.slug = slug;
    payload.user_id = targetUserId;

    // Server is the single source of truth for urgency, computed the same
    // way for both single and bulk creation since they both post here.
    const { discount_pct, urgency_score } = deriveProductUrgency({
      price: payload.price,
      sale_price: payload.sale_price,
      stock: payload.stock,
      sale_end_date: payload.sale_end_date,
    });
    payload.discount_pct = discount_pct;
    payload.urgency_score = urgency_score;

    const { data: insertedProduct, error: insertError } = await supabaseAdmin
      .from('products')
      .insert([payload])
      .select('id, slug')
      .single();

    if (insertError) {
      console.error('Failed to insert product:', insertError);
      return NextResponse.json({ error: 'Failed to insert product' }, { status: 500 });
    }

    return NextResponse.json({ success: true, product: insertedProduct });
  } catch (err) {
    console.error('POST API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
