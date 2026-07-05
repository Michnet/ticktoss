import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function POST(request) {
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
            // Not setting cookies in API route strictly needed here, just passing through
          },
        },
      }
    );

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { product_id, variation_id, quantity = 1, shipping_address } = body;

    if (!product_id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // 1. Fetch product to verify stock and price
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, stock, sale_price, vendor_id')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.stock < quantity) {
      return NextResponse.json({ error: 'Insufficient stock available' }, { status: 400 });
    }

    // 2. Perform atomic stock decrement using RPC or simply by decrementing
    // (In a full prod environment, you'd use a Postgres function to prevent race conditions.
    // For MVP, we update directly via API, though it can suffer from race conditions)
    const newStock = product.stock - quantity;
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', product_id);

    if (updateError) {
      throw updateError;
    }

    // 3. Insert the order/booking
    const total_amount = product.sale_price * quantity;
    const orderData = {
      user_id: user.id,
      vendor_id: product.vendor_id,
      product_id: product.id,
      variation_id: variation_id || null,
      quantity,
      unit_price: product.sale_price,
      total_amount,
      shipping_address,
      status: 'pending',
      payment_method: 'cash_on_delivery',
      payment_status: 'pending'
    };

    const { data: order, error: orderError } = await supabase
      .from('product_orders')
      .insert([orderData])
      .select()
      .single();

    if (orderError) {
      // Rollback stock (best effort)
      await supabase.from('products').update({ stock: product.stock }).eq('id', product_id);
      throw orderError;
    }

    return NextResponse.json({ success: true, booking: order });
  } catch (err) {
    console.error('Booking API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
